#!/usr/bin/env python3
"""
Migrate Gemini analysis from one test file to another
Useful for copying explanations from test2 to other test files
"""

import json
from pathlib import Path
from typing import Dict, Any, Optional

def get_question_key(question: Dict[str, Any], test_key: str = "test2") -> str:
    """Get unique identifier for a question"""
    if "uniqueId" in question:
        return str(question["uniqueId"])
    elif "id" in question:
        return f"{test_key}-q{question['id']}"
    else:
        return str(hash(question.get("text", "")) % (10**10))

def find_matching_question(source_question: Dict[str, Any], target_questions: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Find matching question in target list by comparing text"""
    source_text = source_question.get("text", "").strip().lower()
    
    for target_q in target_questions:
        target_text = target_q.get("text", "").strip().lower()
        # Check for exact match or high similarity
        if source_text == target_text:
            return target_q
        # Check if texts are very similar (90%+ match)
        if len(source_text) > 50 and len(target_text) > 50:
            # Simple similarity check - if first 100 chars match
            if source_text[:100] == target_text[:100]:
                return target_q
    
    return None

def convert_gemini_analysis_to_explanation(gemini_analysis: Dict[str, Any], question: Dict[str, Any]) -> str:
    """Convert Gemini analysis format to website explanation format"""
    parts = []
    
    correct_answers = question.get("correctAnswers", [])
    options = question.get("options", [])
    
    # Add correct answer explanations
    for correct_id in correct_answers:
        correct_explanation = gemini_analysis.get("correct_explanation", "")
        if not correct_explanation:
            correct_explanation = gemini_analysis.get("analysis", "This is the correct answer.")
        
        parts.append(f"**Why option {correct_id} is correct:**\n{correct_explanation}")
    
    # Add incorrect answer explanations
    incorrect_explanations = gemini_analysis.get("incorrect_explanations", {})
    for opt in options:
        if opt["id"] not in correct_answers:
            opt_id = str(opt["id"])
            explanation = incorrect_explanations.get(opt_id, "")
            if not explanation:
                explanation = "This option is incorrect because it does not meet the specific requirements outlined in the scenario."
            
            parts.append(f"**Why option {opt['id']} is incorrect:**\n{explanation}")
    
    return "\n\n".join(parts)

def migrate_analysis(source_file: str, target_file: str, analysis_file: str):
    """Migrate Gemini analysis from source test to target test"""
    
    print(f"📂 Loading source questions from {source_file}...")
    with open(source_file, 'r', encoding='utf-8') as f:
        source_questions = json.load(f)
    print(f"✓ Loaded {len(source_questions)} source questions\n")
    
    print(f"📂 Loading target questions from {target_file}...")
    with open(target_file, 'r', encoding='utf-8') as f:
        target_questions = json.load(f)
    print(f"✓ Loaded {len(target_questions)} target questions\n")
    
    print(f"📂 Loading analysis from {analysis_file}...")
    with open(analysis_file, 'r', encoding='utf-8') as f:
        analysis_data = json.load(f)
    print(f"✓ Loaded {len(analysis_data)} analyses\n")
    
    # Create backup
    backup_file = target_file + ".backup"
    print(f"💾 Creating backup: {backup_file}...")
    with open(backup_file, 'w', encoding='utf-8') as f:
        json.dump(target_questions, f, indent=2, ensure_ascii=False)
    print("✓ Backup created\n")
    
    # Extract test key from target filename
    target_test_key = Path(target_file).stem.replace("test", "test")
    source_test_key = Path(source_file).stem.replace("test", "test")
    
    # Migrate explanations
    migrated_count = 0
    matched_count = 0
    
    for source_q in source_questions:
        # Get analysis for source question
        source_q_id = get_question_key(source_q, source_test_key)
        analysis_entry = analysis_data.get(source_q_id)
        
        if not analysis_entry:
            # Try alternative keys
            alt_keys = [str(source_q.get("id")), f"{source_test_key}-q{source_q.get('id')}"]
            for alt_key in alt_keys:
                if alt_key in analysis_data:
                    analysis_entry = analysis_data[alt_key]
                    break
        
        if analysis_entry and "analysis" in analysis_entry:
            # Find matching question in target
            target_q = find_matching_question(source_q, target_questions)
            
            if target_q:
                matched_count += 1
                # Check if target already has explanation
                if not target_q.get("explanation") or "This is the correct answer" in target_q.get("explanation", ""):
                    # Convert and apply explanation
                    explanation = convert_gemini_analysis_to_explanation(
                        analysis_entry["analysis"],
                        target_q
                    )
                    target_q["explanation"] = explanation
                    migrated_count += 1
                    print(f"  ✓ Migrated explanation for question {target_q.get('id')} (matched with source Q{source_q.get('id')})")
    
    # Save updated target questions
    print(f"\n💾 Saving updated questions to {target_file}...")
    with open(target_file, 'w', encoding='utf-8') as f:
        json.dump(target_questions, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Migration complete!")
    print(f"   - Matched {matched_count} questions between source and target")
    print(f"   - Migrated {migrated_count} explanations")
    print(f"   - Backup saved to {backup_file}")

if __name__ == '__main__':
    import sys
    
    if len(sys.argv) < 3:
        print("Usage: python3 migrate_gemini_analysis.py <source_test_file> <target_test_file> [analysis_file]")
        print("Example: python3 migrate_gemini_analysis.py questions/test2.json questions/test3.json analysis_output.json")
        sys.exit(1)
    
    source_file = sys.argv[1]
    target_file = sys.argv[2]
    analysis_file = sys.argv[3] if len(sys.argv) > 3 else "analysis_output.json"
    
    migrate_analysis(source_file, target_file, analysis_file)
