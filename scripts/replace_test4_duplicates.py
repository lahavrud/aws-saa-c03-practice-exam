#!/usr/bin/env python3
"""
Remove test1.json and replace duplicate questions in test4.json 
with non-duplicate questions from test1.json
"""

import json
import os
from collections import defaultdict


def normalize_text(text):
    """Normalize text for comparison"""
    return " ".join(text.lower().split())


def replace_test4_duplicates():
    """Replace duplicates in test4 with unique questions from test1"""
    project_root = os.path.dirname(os.path.dirname(__file__))
    questions_dir = os.path.join(project_root, "questions")

    # Load all test files to identify duplicates
    all_questions = {}
    text_to_questions = defaultdict(list)
    
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

    # Load all questions and build duplicate map
    for test_file in test_files:
        file_path = os.path.join(questions_dir, test_file)
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                questions = json.load(f)
            if not isinstance(questions, list):
                continue
            all_questions[test_file] = questions
            for q in questions:
                if not isinstance(q, dict):
                    continue
                normalized = normalize_text(q.get("text", q.get("question", "")))
                if normalized:
                    text_to_questions[normalized].append(test_file)
        except Exception as e:
            print(f"Error loading {test_file}: {e}")

    # Find duplicates
    duplicates = {k: v for k, v in text_to_questions.items() if len(v) > 1}
    
    # Step 1: Find unique questions in test1 (not duplicates)
    if "test1.json" not in all_questions:
        print("Error: test1.json not found!")
        return
    
    test1_questions = all_questions["test1.json"]
    test1_unique = []
    
    for q in test1_questions:
        if not isinstance(q, dict):
            continue
        normalized = normalize_text(q.get("text", q.get("question", "")))
        # Check if this question is unique (not a duplicate)
        if normalized not in duplicates:
            test1_unique.append(q)
    
    print(f"Found {len(test1_unique)} unique questions in test1.json")
    print(f"Found {len(duplicates)} duplicate question texts across all tests")
    
    # Step 2: Find duplicate questions in test4
    if "test4.json" not in all_questions:
        print("Error: test4.json not found!")
        return
    
    test4_questions = all_questions["test4.json"]
    test4_duplicate_indices = []
    test4_duplicate_texts = set()
    
    for idx, q in enumerate(test4_questions):
        if not isinstance(q, dict):
            continue
        normalized = normalize_text(q.get("text", q.get("question", "")))
        # Check if this question is a duplicate (appears in other tests)
        if normalized in duplicates:
            occurrences = duplicates[normalized]
            # Check if it appears in other tests (not just test4)
            other_tests = [t for t in occurrences if t != "test4.json"]
            if other_tests:
                test4_duplicate_indices.append(idx)
                test4_duplicate_texts.add(normalized)
    
    print(f"Found {len(test4_duplicate_indices)} duplicate questions in test4.json")
    
    # Step 3: Replace duplicates in test4 with unique questions from test1
    if len(test1_unique) < len(test4_duplicate_indices):
        print(f"Warning: Only {len(test1_unique)} unique questions in test1, but {len(test4_duplicate_indices)} duplicates in test4")
        print(f"Will replace {min(len(test1_unique), len(test4_duplicate_indices))} duplicates")
    
    # Create new test4 questions list
    new_test4_questions = []
    replacement_count = 0
    test1_unique_idx = 0
    
    for idx, q in enumerate(test4_questions):
        if idx in test4_duplicate_indices:
            # Replace with unique question from test1
            if test1_unique_idx < len(test1_unique):
                replacement_q = test1_unique[test1_unique_idx].copy()
                # Keep the original ID from test4
                replacement_q["id"] = q.get("id", idx)
                new_test4_questions.append(replacement_q)
                replacement_count += 1
                test1_unique_idx += 1
                print(f"  Replaced test4 question ID {q.get('id')} with test1 question ID {replacement_q.get('id', 'N/A')}")
            else:
                # No more unique questions, keep original
                new_test4_questions.append(q)
        else:
            # Keep non-duplicate question
            new_test4_questions.append(q)
    
    # Step 4: Save updated test4.json
    test4_path = os.path.join(questions_dir, "test4.json")
    with open(test4_path, "w", encoding="utf-8") as f:
        json.dump(new_test4_questions, f, indent=2, ensure_ascii=False)
    print(f"\n✓ Updated test4.json: replaced {replacement_count} duplicate questions")
    print(f"  test4.json now has {len(new_test4_questions)} questions")
    
    # Step 5: Delete test1.json
    test1_path = os.path.join(questions_dir, "test1.json")
    if os.path.exists(test1_path):
        os.remove(test1_path)
        print(f"✓ Deleted test1.json")
    
    # Step 6: Update all_tests.json
    all_tests_path = os.path.join(questions_dir, "all_tests.json")
    if os.path.exists(all_tests_path):
        print(f"\nUpdating all_tests.json...")
        all_tests_data = {}
        remaining_tests = [f for f in test_files if f != "test1.json"]
        for test_file in remaining_tests:
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
        print(f"✓ Updated all_tests.json with {len(all_tests_data)} tests")
    
    print(f"\n{'='*80}")
    print(f"Summary:")
    print(f"  Deleted: test1.json")
    print(f"  Replaced {replacement_count} duplicate questions in test4.json")
    print(f"  Used {test1_unique_idx} unique questions from test1")
    print(f"{'='*80}")


if __name__ == "__main__":
    replace_test4_duplicates()
