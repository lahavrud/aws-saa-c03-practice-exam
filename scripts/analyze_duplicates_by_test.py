#!/usr/bin/env python3
"""
Analyze which test files have the most duplicate questions
"""

import json
import os
from collections import defaultdict, Counter


def normalize_text(text):
    """Normalize text for comparison"""
    return " ".join(text.lower().split())


def analyze_duplicates_by_test():
    """Analyze duplicates per test file"""
    project_root = os.path.dirname(os.path.dirname(__file__))
    questions_dir = os.path.join(project_root, "questions")

    question_by_text = defaultdict(list)
    test_duplicate_count = Counter()

    # Load all questions
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

    for test_file in test_files:
        test_num = test_file.replace("test", "").replace(".json", "")
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
                    question_by_text[normalized].append({
                        "test_file": test_file,
                        "test_num": test_num,
                        "id": q.get("id"),
                    })

        except Exception as e:
            print(f"Error loading {test_file}: {e}")

    # Count duplicates per test file
    exact_duplicates = {k: v for k, v in question_by_text.items() if len(v) > 1}
    
    for text, questions in exact_duplicates.items():
        for q in questions:
            test_duplicate_count[q["test_file"]] += 1

    print(f"\n{'='*80}")
    print(f"DUPLICATE COUNT BY TEST FILE")
    print(f"{'='*80}\n")
    
    # Sort by duplicate count
    sorted_tests = sorted(test_duplicate_count.items(), key=lambda x: x[1], reverse=True)
    
    for test_file, count in sorted_tests:
        test_num = test_file.replace("test", "").replace(".json", "")
        print(f"  {test_file}: {count} duplicate questions")
    
    print(f"\n{'='*80}")
    print(f"Tests with >10 duplicates:")
    print(f"{'='*80}\n")
    
    tests_to_delete = []
    for test_file, count in sorted_tests:
        if count > 10:
            tests_to_delete.append(test_file)
            print(f"  {test_file}: {count} duplicates - MARKED FOR DELETION")
    
    print(f"\nTotal tests to delete: {len(tests_to_delete)}")
    return tests_to_delete


if __name__ == "__main__":
    analyze_duplicates_by_test()
