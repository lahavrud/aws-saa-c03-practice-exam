#!/usr/bin/env python3
"""
Verify that all questions with Gemini analysis have detailed explanations
and not generic placeholder text
"""

import json
import os
from pathlib import Path
from typing import Dict, Any, List, Tuple

ANALYSIS_FILE = "analysis_output.json"
QUESTIONS_DIR = "questions"

# Generic explanation patterns to detect (exact matches)
GENERIC_PATTERNS = [
    "This is the correct answer because it best addresses all the requirements described in the scenario",
    "This option is incorrect because it does not meet the specific requirements outlined in the scenario",
    "This solution maintains security best practices, proper access controls, and data protection while addressing the functional requirements",
    "This option does not fully address the requirements, introduces unnecessary complexity, or is not the most appropriate solution for this scenario",
]


def is_generic_explanation(explanation: str) -> bool:
    """Check if explanation is generic/placeholder"""
    if not explanation or len(explanation) < 100:
        return True
    
    # Must have the proper format
    if "**Why option" not in explanation:
        return True
    
    explanation_lower = explanation.lower()
    
    # If it's long and has AWS-specific terms, it's detailed (not generic)
    if len(explanation) > 300 and ('amazon' in explanation_lower or 'aws' in explanation_lower):
        # Check for specific AWS service names (detailed explanations mention services)
        aws_services = ['s3', 'ec2', 'lambda', 'dynamodb', 'rds', 'vpc', 'cloudfront', 'route 53', 
                       'iam', 'kms', 'guardduty', 'inspector', 'cloudwatch', 'sns', 'sqs']
        has_service = any(service in explanation_lower for service in aws_services)
        if has_service:
            return False  # It's detailed
    
    # Check for exact generic patterns (these are the REAL generic ones)
    for pattern in GENERIC_PATTERNS:
        # Only flag if the pattern appears AND it's a short explanation
        if pattern.lower() in explanation_lower and len(explanation) < 400:
            # Double check - if it has AWS terms, it might still be detailed
            if 'amazon' not in explanation_lower and 'aws' not in explanation_lower:
                return True
    
    # Very short explanations without AWS context are generic
    if len(explanation) < 150:
        return True
    
    return False


def get_question_key(question: Dict[str, Any], test_key: str) -> str:
    """Get question key matching analysis format"""
    if "id" in question:
        return f"{test_key}-q{question['id']}"
    return ""


def verify_test_file(analysis_data: Dict[str, Any], test_file: str) -> Tuple[List[str], List[str], List[str]]:
    """Verify a single test file"""
    test_path = Path(test_file)
    test_key = test_path.stem if test_path.stem.startswith("test") else None
    
    if not test_key:
        return [], [], []
    
    # Load questions
    with open(test_file, 'r', encoding='utf-8') as f:
        questions = json.load(f)
    
    verified = []  # Questions with proper Gemini explanations
    generic = []  # Questions with generic explanations
    missing = []  # Questions with Gemini analysis but no explanation or wrong format
    
    for question in questions:
        q_id = question.get('id')
        q_key = get_question_key(question, test_key)
        
        # Check if there's Gemini analysis for this question
        has_analysis = q_key in analysis_data
        if not has_analysis:
            # Try old format
            has_analysis = str(q_id) in analysis_data
        
        explanation = question.get('explanation', '')
        
        if has_analysis:
            if not explanation:
                missing.append(f"Q{q_id} (no explanation)")
            elif is_generic_explanation(explanation):
                generic.append(f"Q{q_id} (generic: {explanation[:80]}...)")
            else:
                verified.append(f"Q{q_id}")
    
    return verified, generic, missing


def main():
    """Main verification function"""
    
    # Load analysis data
    print(f"📂 Loading analysis from {ANALYSIS_FILE}...")
    with open(ANALYSIS_FILE, 'r', encoding='utf-8') as f:
        analysis_data = json.load(f)
    print(f"✓ Loaded {len(analysis_data)} analysis entries\n")
    
    # Find all test files
    questions_path = Path(QUESTIONS_DIR)
    test_files = sorted(
        questions_path.glob("test*.json"),
        key=lambda x: int(x.stem.replace("test", "")) if x.stem.replace("test", "").isdigit() else 999
    )
    
    print(f"📋 Found {len(test_files)} test files to verify\n")
    
    total_verified = 0
    total_generic = 0
    total_missing = 0
    total_with_analysis = 0
    
    issues_found = []
    
    for test_file in test_files:
        test_path = Path(test_file)
        test_key = test_path.stem
        
        verified, generic, missing = verify_test_file(analysis_data, str(test_file))
        
        # Count questions with analysis for this test
        test_analysis_count = sum(
            1 for k in analysis_data.keys() 
            if k.startswith(f"{test_key}-q") or (k.isdigit() and test_key == "test2")
        )
        
        total_with_analysis += test_analysis_count
        total_verified += len(verified)
        total_generic += len(generic)
        total_missing += len(missing)
        
        if generic or missing:
            issues_found.append({
                'test': test_key,
                'generic': generic,
                'missing': missing,
                'analysis_count': test_analysis_count
            })
        
        status = "✅" if not generic and not missing else "⚠️"
        print(f"{status} {test_key}: {len(verified)} verified, {len(generic)} generic, {len(missing)} missing (analysis: {test_analysis_count})")
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Verification Summary:")
    print("=" * 60)
    print(f"   Total questions with Gemini analysis: {total_with_analysis}")
    print(f"   ✅ Verified (detailed explanations): {total_verified}")
    print(f"   ⚠️  Generic explanations: {total_generic}")
    print(f"   ❌ Missing/wrong format: {total_missing}")
    print("=" * 60)
    
    if issues_found:
        print("\n⚠️  Issues Found:\n")
        for issue in issues_found:
            print(f"📋 {issue['test']} ({issue['analysis_count']} analysis entries):")
            if issue['generic']:
                print(f"   Generic explanations ({len(issue['generic'])}):")
                for item in issue['generic'][:5]:
                    print(f"     - {item}")
                if len(issue['generic']) > 5:
                    print(f"     ... and {len(issue['generic']) - 5} more")
            if issue['missing']:
                print(f"   Missing explanations ({len(issue['missing'])}):")
                for item in issue['missing'][:5]:
                    print(f"     - {item}")
                if len(issue['missing']) > 5:
                    print(f"     ... and {len(issue['missing']) - 5} more")
            print()
        
        print("💡 Recommendation: Re-run merge_gemini_analysis.py to fix these issues")
        return 1
    else:
        print("\n✅ All questions with Gemini analysis have detailed explanations!")
        return 0


if __name__ == "__main__":
    exit(main())
