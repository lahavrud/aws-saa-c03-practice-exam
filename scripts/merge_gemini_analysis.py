#!/usr/bin/env python3
"""
Merge Gemini analysis results into question JSON files
Converts Gemini analysis format to the website's expected explanation format
Processes all test files automatically
"""

import json
import os
from pathlib import Path
from typing import Dict, Any, Optional, List

ANALYSIS_FILE = "analysis_output.json"
QUESTIONS_DIR = "questions"
BACKUP_SUFFIX = ".backup"

def find_all_test_files(questions_dir: str = QUESTIONS_DIR) -> List[str]:
    """Find all test*.json files in the questions directory"""
    questions_path = Path(questions_dir)
    if not questions_path.exists():
        return []
    
    test_files = []
    # Find all test*.json files and sort them numerically
    for test_file in sorted(
        questions_path.glob("test*.json"),
        key=lambda x: int(x.stem.replace("test", ""))
        if x.stem.replace("test", "").isdigit()
        else 999,
    ):
        test_files.append(str(test_file))
    
    return test_files

def get_question_key(question: Dict[str, Any], test_key: Optional[str] = None) -> str:
    """Get unique identifier for a question (matches analyze_questions_gemini.py)"""
    if "uniqueId" in question:
        unique_id = str(question["uniqueId"])
        # If uniqueId is already in testX-qY format, use it
        if "-q" in unique_id:
            return unique_id
        # Otherwise, convert it using test_key
        if test_key and "id" in question:
            return f"{test_key}-q{question['id']}"
        return unique_id
    elif "id" in question:
        question_test_key = question.get("testKey") or test_key
        if question_test_key:
            return f"{question_test_key}-q{question['id']}"
        return str(question["id"])
    else:
        return str(hash(question.get("text", "")) % (10**10))

def remove_option_intro(text: str) -> str:
    """Remove 'Option X' or 'Options X and Y' intros from explanation text"""
    if not text:
        return text
    
    import re
    
    # Pattern 1: "Option X is correct because" -> "This is correct because"
    text = re.sub(r'^Option\s+\d+\s+is\s+correct\s+because\s+', 'This is correct because ', text, flags=re.IGNORECASE)
    
    # Pattern 2: "Options X and Y are correct because" -> "These are correct because"
    text = re.sub(r'^Options\s+[\d\s,and]+\s+are\s+correct\s+because\s+', 'These are correct because ', text, flags=re.IGNORECASE)
    
    # Pattern 3: "Option X, '...', is the correct answer because" -> "This is the correct answer because"
    text = re.sub(r'^Option\s+\d+[^.]*?is\s+the\s+correct\s+answer\s+because\s+', 'This is the correct answer because ', text, flags=re.IGNORECASE)
    
    # Pattern 4: "Option X is the best solution because" -> "This is the best solution because"
    text = re.sub(r'^Option\s+\d+[^.]*?is\s+the\s+best\s+(?:solution|choice)\s+because\s+', 'This is the best solution because ', text, flags=re.IGNORECASE)
    
    # Pattern 5: "Option X states that..." -> "This states that..." (must come before pattern 6)
    text = re.sub(r'^Option\s+\d+\s+states?\s+that\s+', 'This states that ', text, flags=re.IGNORECASE)
    
    # Pattern 6: "Option X, using..." or "Option X (using...)" -> "Using..." (remove option reference at start)
    # This must come after pattern 5 to avoid matching "Option X states"
    text = re.sub(r'^Option\s+\d+[,\s(]+', '', text, flags=re.IGNORECASE)
    
    return text.strip()


def convert_gemini_analysis_to_explanation(gemini_analysis: Dict[str, Any], question: Dict[str, Any]) -> str:
    """Convert Gemini analysis format to website explanation format"""
    parts = []
    
    correct_answers = question.get("correctAnswers", [])
    options = question.get("options", [])
    
    # Handle correct answers - check for per-option explanations first
    correct_explanations_dict = gemini_analysis.get("correct_explanations", {})
    legacy_correct_explanation = gemini_analysis.get("correct_explanation", "")  # Backward compatibility
    
    for correct_id in correct_answers:
        # Try to get per-option explanation first
        opt_id_str = str(correct_id)
        if opt_id_str in correct_explanations_dict:
            explanation = correct_explanations_dict[opt_id_str]
        elif legacy_correct_explanation:
            # Fallback to legacy single explanation
            explanation = legacy_correct_explanation
        else:
            # Final fallback to general analysis
            explanation = gemini_analysis.get("analysis", "This is the correct answer.")
        
        # Remove option intro from explanation
        clean_explanation = remove_option_intro(explanation)
        parts.append(f"**Why option {correct_id} is correct:**\n{clean_explanation}")
    
    # Add incorrect answer explanations
    incorrect_explanations = gemini_analysis.get("incorrect_explanations", {})
    for opt in options:
        if opt["id"] not in correct_answers:
            opt_id = str(opt["id"])
            explanation = incorrect_explanations.get(opt_id, "")
            if not explanation:
                explanation = "This option is incorrect because it does not meet the specific requirements outlined in the scenario."
            else:
                # Remove option intro from incorrect explanations too
                explanation = remove_option_intro(explanation)
            
            parts.append(f"**Why option {opt['id']} is incorrect:**\n{explanation}")
    
    return "\n\n".join(parts)

def merge_analysis_into_questions(analysis_data: Dict[str, Any], questions_file: str, test_key: Optional[str] = None):
    """Merge Gemini analysis into questions JSON file"""
    
    # Load questions
    print(f"📂 Loading questions from {questions_file}...")
    with open(questions_file, 'r', encoding='utf-8') as f:
        questions = json.load(f)
    print(f"✓ Loaded {len(questions)} questions\n")
    
    # Create backup
    backup_file = questions_file + BACKUP_SUFFIX
    print(f"💾 Creating backup: {backup_file}...")
    with open(backup_file, 'w', encoding='utf-8') as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)
    print("✓ Backup created\n")
    
    # Merge analysis into questions
    updated_count = 0
    for question in questions:
        q_id = get_question_key(question, test_key)
        
        # Find matching analysis
        analysis_entry = analysis_data.get(q_id)
        if not analysis_entry:
            # Try alternative keys for backward compatibility
            question_id = question.get("id")
            if question_id is not None:
                alt_keys = [
                    str(question_id),  # Old numeric format
                    f"test2-q{question_id}",  # Old test2 format
                ]
                if test_key:
                    alt_keys.append(f"{test_key}-q{question_id}")
                for alt_key in alt_keys:
                    if alt_key in analysis_data:
                        analysis_entry = analysis_data[alt_key]
                        break
        
        if analysis_entry and "analysis" in analysis_entry:
            # Convert Gemini analysis to explanation format
            explanation = convert_gemini_analysis_to_explanation(
                analysis_entry["analysis"],
                question
            )
            question["explanation"] = explanation
            updated_count += 1
            print(f"  ✓ Updated question {question.get('id')}")
    
    # Save updated questions
    print(f"\n💾 Saving updated questions to {questions_file}...")
    with open(questions_file, 'w', encoding='utf-8') as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)
    
    return updated_count, len(questions)

def main():
    """Main function to process all test files"""
    
    # Load analysis data once
    print(f"📂 Loading analysis from {ANALYSIS_FILE}...")
    with open(ANALYSIS_FILE, 'r', encoding='utf-8') as f:
        analysis_data = json.load(f)
    print(f"✓ Loaded {len(analysis_data)} analyses\n")
    
    # Find all test files
    test_files = find_all_test_files()
    if not test_files:
        print("❌ No test*.json files found in questions directory")
        return 1
    
    print(f"📋 Found {len(test_files)} test files to process\n")
    
    # Process each test file
    total_updated = 0
    total_questions = 0
    
    for test_file in test_files:
        test_path = Path(test_file)
        test_key = test_path.stem if test_path.stem.startswith("test") else None
        
        print("=" * 60)
        print(f"📋 Processing: {test_path.name}")
        if test_key:
            print(f"   Test key: {test_key}")
        print("=" * 60 + "\n")
        
        try:
            updated, total = merge_analysis_into_questions(analysis_data, test_file, test_key)
            total_updated += updated
            total_questions += total
            print(f"\n✅ Completed {test_path.name}: {updated}/{total} questions updated\n")
        except Exception as e:
            print(f"❌ Error processing {test_path.name}: {e}\n")
            import traceback
            traceback.print_exc()
            continue
    
    # Final summary
    print("=" * 60)
    print("✅ Merge complete for all test files!")
    print(f"📊 Summary:")
    print(f"   - Total questions processed: {total_questions}")
    print(f"   - Total questions updated: {total_updated}")
    print(f"   - Test files processed: {len(test_files)}")
    print("=" * 60)
    
    return 0

if __name__ == '__main__':
    exit(main())
