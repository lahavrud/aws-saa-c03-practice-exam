#!/usr/bin/env python3
"""
Find exact duplicate questions (same text) across all test files
"""

import json
import os
from collections import defaultdict


def normalize_text(text):
    """Normalize text for comparison"""
    return " ".join(text.lower().split())


def find_exact_duplicates():
    """Find exact duplicate questions"""
    project_root = os.path.dirname(os.path.dirname(__file__))
    questions_dir = os.path.join(project_root, "questions")

    question_by_text = defaultdict(list)

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
                        "domain": q.get("domain", "N/A"),
                        "text": q.get("text", q.get("question", ""))[:100] + "..."
                    })

        except Exception as e:
            print(f"Error loading {test_file}: {e}")

    # Find exact duplicates
    exact_duplicates = {k: v for k, v in question_by_text.items() if len(v) > 1}

    print(f"\n{'='*80}")
    print(f"EXACT DUPLICATE QUESTIONS REPORT")
    print(f"{'='*80}\n")
    print(f"Total unique question texts: {len(question_by_text)}")
    print(f"Questions with duplicates: {len(exact_duplicates)}\n")

    if exact_duplicates:
        print(f"{'='*80}")
        print(f"DETAILED DUPLICATE LIST:")
        print(f"{'='*80}\n")
        
        for idx, (text, questions) in enumerate(sorted(exact_duplicates.items(), 
                                                       key=lambda x: len(x[1]), 
                                                       reverse=True), 1):
            print(f"{idx}. Found {len(questions)} duplicate(s):")
            print(f"   Text preview: {questions[0]['text']}")
            print(f"   Locations:")
            for q in questions:
                print(f"     - {q['test_file']} (ID: {q['id']}, Domain: {q['domain']})")
            print()
    else:
        print("✓ No exact duplicate questions found!")

    print(f"{'='*80}")
    print(f"SUMMARY: {len(exact_duplicates)} questions have exact duplicates")
    print(f"{'='*80}\n")


if __name__ == "__main__":
    find_exact_duplicates()
