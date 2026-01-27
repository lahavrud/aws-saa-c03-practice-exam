#!/usr/bin/env python3
"""
Check for duplicate questions across all test files
"""

import json
import os
from collections import defaultdict
from difflib import SequenceMatcher


def similarity(a, b):
    """Calculate similarity ratio between two strings"""
    return SequenceMatcher(None, a, b).ratio()


def normalize_text(text):
    """Normalize text for comparison"""
    return " ".join(text.lower().split())


def check_duplicates():
    """Check for duplicate questions"""
    project_root = os.path.dirname(os.path.dirname(__file__))
    questions_dir = os.path.join(project_root, "questions")

    all_questions = []
    question_by_id = defaultdict(list)
    question_by_text = defaultdict(list)

    # Load all questions
    test_files = []
    for f in os.listdir(questions_dir):
        if f.startswith("test") and f.endswith(".json"):
            try:
                # Extract test number safely
                test_num_str = f.replace("test", "").replace(".json", "")
                if test_num_str.isdigit():
                    test_files.append((int(test_num_str), f))
            except (ValueError, AttributeError):
                print(f"Warning: Skipping file with invalid name format: {f}")

    # Sort by test number
    test_files = sorted(test_files, key=lambda x: x[0])
    test_files = [f[1] for f in test_files]  # Extract just filenames

    print(f"Checking {len(test_files)} test files...\n")

    for test_file in test_files:
        test_num = test_file.replace("test", "").replace(".json", "")
        file_path = os.path.join(questions_dir, test_file)

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                questions = json.load(f)

            if not isinstance(questions, list):
                print(
                    f"Warning: {test_file} does not contain a list of questions, skipping"
                )
                continue

            for q in questions:
                if not isinstance(q, dict):
                    print(f"Warning: Skipping invalid question in {test_file}")
                    continue

                q["test_file"] = test_file
                q["test_num"] = test_num
                all_questions.append(q)

                # Group by ID (handle missing ID gracefully)
                question_id = q.get("id")
                if question_id is not None:
                    question_by_id[question_id].append(q)
                else:
                    print(f"Warning: Question in {test_file} missing 'id' field")

                # Group by normalized text
                normalized = normalize_text(q.get("text", q.get("question", "")))
                question_by_text[normalized].append(q)

        except json.JSONDecodeError as e:
            print(f"Error parsing JSON in {test_file}: {e}")
        except Exception as e:
            print(f"Error loading {test_file}: {e}")

    print(f"Total questions loaded: {len(all_questions)}\n")
    print("=" * 80)

    # Check for duplicate IDs
    print("\n1. DUPLICATE QUESTION IDs (same ID in different tests):")
    print("-" * 80)
    duplicate_ids = {k: v for k, v in question_by_id.items() if len(v) > 1}

    if duplicate_ids:
        print(f"Found {len(duplicate_ids)} IDs that appear in multiple tests:\n")
        for qid, questions in sorted(duplicate_ids.items()):
            print(f"  ID {qid} appears in {len(questions)} tests:")
            for q in questions:
                text_preview = (
                    q.get("text", q.get("question", ""))[:60] + "..."
                    if len(q.get("text", q.get("question", ""))) > 60
                    else q.get("text", q.get("question", ""))
                )
                print(f"    - {q['test_file']}: {text_preview}")
            print()
    else:
        print("  ✓ No duplicate IDs found (each ID is unique within its test)")

    # Check for exact duplicate text
    print("\n2. EXACT DUPLICATE QUESTION TEXT:")
    print("-" * 80)
    exact_duplicates = {k: v for k, v in question_by_text.items() if len(v) > 1}

    if exact_duplicates:
        print(f"Found {len(exact_duplicates)} questions with identical text:\n")
        for text, questions in list(exact_duplicates.items())[:10]:  # Show first 10
            print(f"  Text: {text[:80]}...")
            print(f"  Appears in {len(questions)} locations:")
            for q in questions:
                question_id = q.get("id", "N/A")
                print(
                    f"    - {q['test_file']} (ID: {question_id}, Domain: {q.get('domain', 'N/A')})"
                )
            print()

        if len(exact_duplicates) > 10:
            print(f"  ... and {len(exact_duplicates) - 10} more exact duplicates\n")
    else:
        print("  ✓ No exact duplicate question text found")

    # Check for similar questions (high similarity)
    print("\n3. SIMILAR QUESTIONS (similarity > 0.9):")
    print("-" * 80)
    similar_pairs = []

    for i, q1 in enumerate(all_questions):
        text1 = normalize_text(q1.get("text", q1.get("question", "")))
        for j, q2 in enumerate(all_questions[i + 1 :], i + 1):
            text2 = normalize_text(q2.get("text", q2.get("question", "")))
            sim = similarity(text1, text2)
            if sim > 0.9 and sim < 1.0:  # Similar but not identical
                similar_pairs.append((sim, q1, q2))

    if similar_pairs:
        similar_pairs.sort(key=lambda x: x[0], reverse=True)
        print(f"Found {len(similar_pairs)} pairs of similar questions:\n")
        for sim, q1, q2 in similar_pairs[:10]:  # Show top 10
            print(f"  Similarity: {sim:.2%}")
            q1_id = q1.get("id", "N/A")
            q2_id = q2.get("id", "N/A")
            print(
                f"    {q1['test_file']} (ID: {q1_id}): {q1.get('text', q1.get('question', ''))[:60]}..."
            )
            print(
                f"    {q2['test_file']} (ID: {q2_id}): {q2.get('text', q2.get('question', ''))[:60]}..."
            )
            print()

        if len(similar_pairs) > 10:
            print(f"  ... and {len(similar_pairs) - 10} more similar pairs\n")
    else:
        print("  ✓ No highly similar questions found")

    # Summary
    print("\n" + "=" * 80)
    print("SUMMARY:")
    print(f"  Total questions: {len(all_questions)}")
    print(f"  Unique IDs: {len(question_by_id)}")
    print(f"  Unique question texts: {len(question_by_text)}")
    print(f"  Duplicate IDs: {len(duplicate_ids)}")
    print(f"  Exact duplicate texts: {len(exact_duplicates)}")
    print(f"  Similar question pairs: {len(similar_pairs)}")
    print("=" * 80)


if __name__ == "__main__":
    check_duplicates()
