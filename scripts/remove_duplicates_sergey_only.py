#!/usr/bin/env python3
"""
Remove duplicate questions from Sergey's tests only (test9+)
Delete Sergey tests with >10 duplicates
"""

import json
import os
from collections import defaultdict, Counter


def normalize_text(text):
    """Normalize text for comparison"""
    return " ".join(text.lower().split())


def is_sergey_test(test_file):
    """Check if test belongs to Sergey (test9+)"""
    try:
        test_num = int(test_file.replace("test", "").replace(".json", ""))
        return test_num >= 9
    except:
        return False


def remove_duplicates_sergey_only():
    """Remove duplicates from Sergey tests only"""
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

    # Separate Sergey tests from others
    sergey_tests = [f for f in test_files if is_sergey_test(f)]
    other_tests = [f for f in test_files if not is_sergey_test(f)]

    print(f"Sergey tests: {len(sergey_tests)}")
    print(f"Other tests (Stephane/Dojo): {len(other_tests)}")

    # Step 1: Build map of all question texts (only for Sergey tests)
    text_to_questions = defaultdict(list)
    all_sergey_questions = {}
    
    for test_file in sergey_tests:
        file_path = os.path.join(questions_dir, test_file)
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                questions = json.load(f)
            if not isinstance(questions, list):
                continue
            all_sergey_questions[test_file] = questions
            for idx, q in enumerate(questions):
                if not isinstance(q, dict):
                    continue
                normalized = normalize_text(q.get("text", q.get("question", "")))
                if normalized:
                    text_to_questions[normalized].append((test_file, q, idx))
        except Exception as e:
            print(f"Error loading {test_file}: {e}")

    # Step 2: Count duplicates per Sergey test
    exact_duplicates = {k: v for k, v in text_to_questions.items() if len(v) > 1}
    test_duplicate_count = Counter()
    
    for text, occurrences in exact_duplicates.items():
        for test_file, q, idx in occurrences:
            test_duplicate_count[test_file] += 1

    print(f"\n{'='*80}")
    print(f"DUPLICATE COUNT BY SERGEY TEST FILE")
    print(f"{'='*80}\n")
    
    sorted_sergey_tests = sorted(test_duplicate_count.items(), key=lambda x: x[1], reverse=True)
    
    for test_file, count in sorted_sergey_tests:
        print(f"  {test_file}: {count} duplicate questions")

    # Step 3: Identify Sergey tests to delete (>10 duplicates)
    sergey_tests_to_delete = []
    for test_file, count in sorted_sergey_tests:
        if count > 10:
            sergey_tests_to_delete.append(test_file)
            print(f"\n  {test_file}: {count} duplicates - MARKED FOR DELETION")

    print(f"\n{'='*80}")
    print(f"Sergey tests to delete: {len(sergey_tests_to_delete)}")
    print(f"{'='*80}\n")

    # Step 4: Delete Sergey tests with >10 duplicates
    for test_file in sergey_tests_to_delete:
        file_path = os.path.join(questions_dir, test_file)
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"Deleted: {test_file}")
            # Remove from our tracking
            if test_file in all_sergey_questions:
                del all_sergey_questions[test_file]
            sergey_tests.remove(test_file)

    # Step 5: Remove duplicates from remaining Sergey tests
    # Rebuild the map excluding deleted tests
    text_to_questions = defaultdict(list)
    
    for test_file in sergey_tests:
        if test_file not in all_sergey_questions:
            file_path = os.path.join(questions_dir, test_file)
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    questions = json.load(f)
                all_sergey_questions[test_file] = questions
            except Exception as e:
                print(f"Error loading {test_file}: {e}")
                continue
        
        questions = all_sergey_questions[test_file]
        for idx, q in enumerate(questions):
            if not isinstance(q, dict):
                continue
            normalized = normalize_text(q.get("text", q.get("question", "")))
            if normalized:
                text_to_questions[normalized].append((test_file, q, idx))

    # Find duplicates again (after deletions)
    duplicates = {k: v for k, v in text_to_questions.items() if len(v) > 1}
    
    print(f"\nFound {len(duplicates)} duplicate question texts in remaining Sergey tests")
    
    # For each duplicate text, decide which test to keep it in
    # Strategy: Keep in the test with the lowest number, remove from others
    questions_to_remove = defaultdict(set)
    
    for text, occurrences in duplicates.items():
        # Sort by test number (lower test number = keep)
        occurrences_sorted = sorted(occurrences, key=lambda x: int(x[0].replace("test", "").replace(".json", "")))
        
        # Keep in first test, remove from others
        keep_test, keep_q, keep_idx = occurrences_sorted[0]
        
        for test_file, q, idx in occurrences_sorted[1:]:
            questions_to_remove[test_file].add(idx)

    # Remove duplicates from each remaining Sergey test file
    cleaned_count = 0
    for test_file in sergey_tests:
        if test_file not in all_sergey_questions:
            continue
            
        if test_file not in questions_to_remove:
            continue
            
        questions = all_sergey_questions[test_file]
        indices_to_remove = questions_to_remove[test_file]
        
        # Remove questions at specified indices
        unique_questions = [q for idx, q in enumerate(questions) if idx not in indices_to_remove]
        
        if len(unique_questions) != len(questions):
            file_path = os.path.join(questions_dir, test_file)
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(unique_questions, f, indent=2, ensure_ascii=False)
            print(f"Cleaned {test_file}: removed {len(indices_to_remove)} duplicate(s), kept {len(unique_questions)} questions")
            cleaned_count += 1

    # Step 6: Update all_tests.json
    all_tests_path = os.path.join(questions_dir, "all_tests.json")
    if os.path.exists(all_tests_path):
        print(f"\nUpdating {all_tests_path}...")
        all_tests_data = {}
        # Include all tests (Stephane, Dojo, and cleaned Sergey)
        all_test_files = other_tests + sergey_tests
        for test_file in sorted(all_test_files, key=lambda x: int(x.replace("test", "").replace(".json", ""))):
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
    print(f"Summary:")
    print(f"  Deleted Sergey tests: {len(sergey_tests_to_delete)}")
    print(f"  Cleaned Sergey tests: {cleaned_count}")
    print(f"  Remaining Sergey tests: {len(sergey_tests)}")
    print(f"{'='*80}")


if __name__ == "__main__":
    remove_duplicates_sergey_only()
