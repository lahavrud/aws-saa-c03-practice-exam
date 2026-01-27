#!/usr/bin/env python3
"""
Remove duplicate questions from test files and delete tests with >10 duplicates
"""

import json
import os
from collections import defaultdict


def normalize_text(text):
    """Normalize text for comparison"""
    return " ".join(text.lower().split())


def remove_duplicates_from_tests():
    """Remove duplicates from test files"""
    project_root = os.path.dirname(os.path.dirname(__file__))
    questions_dir = os.path.join(project_root, "questions")

    # First, build a map of all question texts across all tests
    all_question_texts = defaultdict(list)
    
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

    # Step 1: Identify tests to delete (>10 duplicates)
    tests_to_delete = []
    test_duplicate_count = defaultdict(int)
    
    # Build map of all questions
    for test_file in test_files:
        file_path = os.path.join(questions_dir, test_file)
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                questions = json.load(f)
            if not isinstance(questions, list):
                continue
            for q in questions:
                if not isinstance(q, dict):
                    continue
                normalized = normalize_text(q.get("text", q.get("question", "")))
                if normalized:
                    all_question_texts[normalized].append(test_file)
        except Exception as e:
            print(f"Error loading {test_file}: {e}")

    # Count duplicates per test
    exact_duplicates = {k: v for k, v in all_question_texts.items() if len(v) > 1}
    for text, test_list in exact_duplicates.items():
        for test_file in test_list:
            test_duplicate_count[test_file] += 1

    # Identify tests to delete
    for test_file, count in test_duplicate_count.items():
        if count > 10:
            tests_to_delete.append(test_file)

    print(f"Tests to delete (>10 duplicates): {tests_to_delete}")
    
    # Step 2: Delete tests with >10 duplicates
    for test_file in tests_to_delete:
        file_path = os.path.join(questions_dir, test_file)
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"Deleted: {test_file}")
    
    # Step 3: Remove duplicates from remaining tests
    # Rebuild the map excluding deleted tests
    all_question_texts = defaultdict(list)
    remaining_tests = [f for f in test_files if f not in tests_to_delete]
    
    for test_file in remaining_tests:
        file_path = os.path.join(questions_dir, test_file)
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                questions = json.load(f)
            if not isinstance(questions, list):
                continue
            for q in questions:
                if not isinstance(q, dict):
                    continue
                normalized = normalize_text(q.get("text", q.get("question", "")))
                if normalized:
                    all_question_texts[normalized].append((test_file, q))
        except Exception as e:
            print(f"Error loading {test_file}: {e}")

    # Process each remaining test file
    for test_file in remaining_tests:
        file_path = os.path.join(questions_dir, test_file)
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                questions = json.load(f)
            
            if not isinstance(questions, list):
                continue

            seen_texts = set()
            unique_questions = []
            removed_count = 0

            for q in questions:
                if not isinstance(q, dict):
                    unique_questions.append(q)
                    continue
                
                normalized = normalize_text(q.get("text", q.get("question", "")))
                
                # Check if this text appears in other questions (duplicate)
                if normalized in all_question_texts:
                    occurrences = all_question_texts[normalized]
                    # Check if this question appears in other tests or is a duplicate in same test
                    is_duplicate = False
                    for other_test, other_q in occurrences:
                        if other_test != test_file:
                            is_duplicate = True
                            break
                        elif other_test == test_file and other_q != q:
                            # Same test, different question object - check if we've seen this text
                            if normalized in seen_texts:
                                is_duplicate = True
                                break
                    
                    if is_duplicate and normalized in seen_texts:
                        removed_count += 1
                        continue
                
                seen_texts.add(normalized)
                unique_questions.append(q)

            # Write back the cleaned questions
            if len(unique_questions) != len(questions):
                with open(file_path, "w", encoding="utf-8") as f:
                    json.dump(unique_questions, f, indent=2, ensure_ascii=False)
                print(f"Cleaned {test_file}: removed {removed_count} duplicate(s), kept {len(unique_questions)} questions")

        except Exception as e:
            print(f"Error processing {test_file}: {e}")

    # Step 4: Update all_tests.json if it exists
    all_tests_path = os.path.join(questions_dir, "all_tests.json")
    if os.path.exists(all_tests_path):
        print(f"\nUpdating {all_tests_path}...")
        all_tests_data = {}
        for test_file in remaining_tests:
            file_path = os.path.join(questions_dir, test_file)
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
    print(f"Summary:")
    print(f"  Deleted tests: {len(tests_to_delete)}")
    print(f"  Remaining tests: {len(remaining_tests)}")
    print(f"{'='*80}")


if __name__ == "__main__":
    remove_duplicates_from_tests()
