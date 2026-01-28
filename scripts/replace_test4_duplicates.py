#!/usr/bin/env python3
"""
Remove test1.json and replace duplicate questions in test4.json 
with non-duplicate questions from test1.json
"""

import sys
from pathlib import Path
from collections import defaultdict

# Import shared utilities
sys.path.insert(0, str(Path(__file__).parent))
from utils.question_utils import (
    normalize_text,
    normalize_question_text,
    find_test_files,
    load_questions_file,
    save_questions_file,
    get_questions_dir,
)


def replace_test4_duplicates():
    """Replace duplicates in test4 with unique questions from test1"""
    questions_dir = get_questions_dir()

    # Load all test files to identify duplicates
    all_questions = {}
    text_to_questions = defaultdict(list)
    
    test_files = find_test_files(questions_dir)

    # Load all questions and build duplicate map
    for test_file in test_files:
        questions = load_questions_file(test_file)
        if questions is None:
            continue
        all_questions[test_file.name] = questions
        for q in questions:
            if not isinstance(q, dict):
                continue
            normalized = normalize_question_text(q)
            if normalized:
                text_to_questions[normalized].append(test_file.name)

    # Find duplicates
    duplicates = {k: v for k, v in text_to_questions.items() if len(v) > 1}
    
    # Step 1: Find unique questions in test1 (not duplicates)
    test1_file = questions_dir / "test1.json"
    if not test1_file.exists():
        print("Error: test1.json not found!")
        return
    
    test1_questions = load_questions_file(test1_file)
    if test1_questions is None:
        print("Error: Could not load test1.json!")
        return
    
    test1_unique = []
    
    for q in test1_questions:
        if not isinstance(q, dict):
            continue
        normalized = normalize_question_text(q)
        # Check if this question is unique (not a duplicate)
        if normalized not in duplicates:
            test1_unique.append(q)
    
    print(f"Found {len(test1_unique)} unique questions in test1.json")
    print(f"Found {len(duplicates)} duplicate question texts across all tests")
    
    # Step 2: Find duplicate questions in test4
    test4_file = questions_dir / "test4.json"
    if not test4_file.exists():
        print("Error: test4.json not found!")
        return
    
    test4_questions = load_questions_file(test4_file)
    if test4_questions is None:
        print("Error: Could not load test4.json!")
        return
    
    test4_duplicate_indices = []
    test4_duplicate_texts = set()
    
    for idx, q in enumerate(test4_questions):
        if not isinstance(q, dict):
            continue
        normalized = normalize_question_text(q)
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
    if save_questions_file(test4_file, new_test4_questions, create_backup=True):
        print(f"\n✓ Updated test4.json: replaced {replacement_count} duplicate questions")
        print(f"  test4.json now has {len(new_test4_questions)} questions")
    
    # Step 5: Delete test1.json
    if test1_file.exists():
        test1_file.unlink()
        print(f"✓ Deleted test1.json")
    
    # Step 6: Update all_tests.json
    all_tests_path = questions_dir / "all_tests.json"
    if all_tests_path.exists():
        print(f"\nUpdating all_tests.json...")
        all_tests_data = {}
        remaining_tests = [f for f in test_files if f.name != "test1.json"]
        for test_file in remaining_tests:
            questions = load_questions_file(test_file)
            if questions is not None:
                test_key = test_file.stem
                all_tests_data[test_key] = questions
        
        if save_questions_file(all_tests_path, all_tests_data, create_backup=False):
            print(f"✓ Updated all_tests.json with {len(all_tests_data)} tests")
    
    print(f"\n{'='*80}")
    print(f"Summary:")
    print(f"  Deleted: test1.json")
    print(f"  Replaced {replacement_count} duplicate questions in test4.json")
    print(f"  Used {test1_unique_idx} unique questions from test1")
    print(f"{'='*80}")


if __name__ == "__main__":
    replace_test4_duplicates()
