#!/usr/bin/env python3
"""
Remove duplicate questions from test files - improved version
"""

import json
import os
from collections import defaultdict


def normalize_text(text):
    """Normalize text for comparison"""
    return " ".join(text.lower().split())


def remove_duplicates_improved():
    """Remove duplicates from remaining test files"""
    project_root = os.path.dirname(os.path.dirname(__file__))
    questions_dir = os.path.join(project_root, "questions")

    test_files = []
    for f in os.listdir(questions_dir):
        if f.startswith("test") and f.endswith(".json"):
            try:
                test_num_str = f.replace("test", "").replace(".json", "")
                if test_num_str.isdigit():
                    test_files.append((int(test_num_str), f))
            except (ValueError, AttributeError):
                continue

    test_files = sorted(test_files, key=lambda x: x[0])
    test_files = [f[1] for f in test_files]

    # Build a map: text -> list of (test_file, question, question_index)
    text_to_questions = defaultdict(list)
    
    # Load all questions
    all_questions = {}
    for test_file in test_files:
        file_path = os.path.join(questions_dir, test_file)
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                questions = json.load(f)
            if not isinstance(questions, list):
                continue
            all_questions[test_file] = questions
            for idx, q in enumerate(questions):
                if not isinstance(q, dict):
                    continue
                normalized = normalize_text(q.get("text", q.get("question", "")))
                if normalized:
                    text_to_questions[normalized].append((test_file, q, idx))
        except Exception as e:
            print(f"Error loading {test_file}: {e}")

    # Find duplicates
    duplicates = {k: v for k, v in text_to_questions.items() if len(v) > 1}
    
    print(f"Found {len(duplicates)} duplicate question texts")
    
    # For each duplicate text, decide which test to keep it in
    # Strategy: Keep in the test with the lowest number, remove from others
    questions_to_remove = defaultdict(set)  # test_file -> set of indices to remove
    
    for text, occurrences in duplicates.items():
        # Sort by test number (lower test number = keep)
        occurrences_sorted = sorted(occurrences, key=lambda x: int(x[0].replace("test", "").replace(".json", "")))
        
        # Keep in first test, remove from others
        keep_test, keep_q, keep_idx = occurrences_sorted[0]
        
        for test_file, q, idx in occurrences_sorted[1:]:
            questions_to_remove[test_file].add(idx)
            print(f"  Will remove duplicate from {test_file} (ID: {q.get('id', 'N/A')}): {text[:60]}...")

    # Remove duplicates from each test file
    for test_file in test_files:
        if test_file not in all_questions:
            continue
            
        if test_file not in questions_to_remove:
            continue
            
        questions = all_questions[test_file]
        indices_to_remove = questions_to_remove[test_file]
        
        # Remove questions at specified indices (in reverse order to maintain indices)
        unique_questions = [q for idx, q in enumerate(questions) if idx not in indices_to_remove]
        
        if len(unique_questions) != len(questions):
            file_path = os.path.join(questions_dir, test_file)
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(unique_questions, f, indent=2, ensure_ascii=False)
            print(f"Cleaned {test_file}: removed {len(indices_to_remove)} duplicate(s), kept {len(unique_questions)} questions")

    # Update all_tests.json
    all_tests_path = os.path.join(questions_dir, "all_tests.json")
    if os.path.exists(all_tests_path):
        print(f"\nUpdating {all_tests_path}...")
        all_tests_data = {}
        for test_file in test_files:
            file_path = os.path.join(questions_dir, test_file)
            if not os.path.exists(file_path):
                continue
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    questions = json.load(f)
                test_key = test_file.replace(".json", "")
                all_tests_data[test_key] = questions
            except Exception as e:
                print(f"Error loading {test_file} for all_tests.json: {e}")
        
        with open(all_tests_path, "w", encoding="utf-8") as f:
            json.dump(all_tests_data, f, indent=2, ensure_ascii=False)
        print(f"Updated all_tests.json with {len(all_tests_data)} tests")

    print(f"\n{'='*80}")
    print(f"Duplicate removal complete!")
    print(f"{'='*80}")


if __name__ == "__main__":
    remove_duplicates_improved()
