#!/usr/bin/env python3
"""
Unified question management script for duplicate detection and removal.
Consolidates functionality from multiple separate scripts.

Usage:
    python question_management.py check-duplicates
    python question_management.py find-exact-duplicates
    python question_management.py analyze-by-test [--sergey-only]
    python question_management.py remove-duplicates [--sergey-only] [--dry-run]
"""

import sys
import argparse
from pathlib import Path
from collections import defaultdict, Counter
from difflib import SequenceMatcher

# Import shared utilities
sys.path.insert(0, str(Path(__file__).parent))
from utils.question_utils import (
    normalize_text,
    normalize_question_text,
    get_question_signature,
    find_test_files,
    load_questions_file,
    save_questions_file,
    load_all_questions,
    find_duplicates,
    get_questions_dir,
)


def similarity(a: str, b: str) -> float:
    """Calculate similarity ratio between two strings."""
    return SequenceMatcher(None, a, b).ratio()


def is_sergey_test(test_file: Path) -> bool:
    """Check if test belongs to Sergey (test9+)."""
    try:
        test_num = int(test_file.stem.replace("test", ""))
        return test_num >= 9
    except (ValueError, AttributeError):
        return False


def cmd_check_duplicates(questions_dir: Path) -> int:
    """
    Check for duplicate questions (similarity-based).
    Original functionality from check_duplicates.py
    """
    print("🔍 Checking for duplicate questions (similarity-based)...\n")
    
    test_files = find_test_files(questions_dir)
    print(f"Checking {len(test_files)} test files...\n")
    
    all_questions = []
    question_by_id = defaultdict(list)
    question_by_text = defaultdict(list)
    
    for test_file in test_files:
        test_num = test_file.stem.replace("test", "")
        questions = load_questions_file(test_file)
        
        if questions is None:
            continue
        
        for q in questions:
            if not isinstance(q, dict):
                continue
            
            q_id = q.get("id")
            text = normalize_question_text(q)
            
            if q_id is not None:
                question_by_id[q_id].append((test_file.name, q))
            if text:
                question_by_text[text].append((test_file.name, q_id, q))
                all_questions.append((test_file.name, q_id, text, q))
    
    # Find exact duplicates
    exact_duplicates = {k: v for k, v in question_by_text.items() if len(v) > 1}
    
    # Find similar questions
    similar_threshold = 0.95
    similar_pairs = []
    
    for i, (test1, id1, text1, q1) in enumerate(all_questions):
        for j, (test2, id2, text2, q2) in enumerate(all_questions[i+1:], i+1):
            if text1 and text2:
                sim = similarity(text1, text2)
                if sim >= similar_threshold and sim < 1.0:  # Similar but not exact
                    similar_pairs.append((test1, id1, test2, id2, sim, text1[:100]))
    
    print(f"\n{'='*80}")
    print(f"DUPLICATE CHECK RESULTS")
    print(f"{'='*80}\n")
    print(f"Total questions: {len(all_questions)}")
    print(f"Exact duplicates: {len(exact_duplicates)}")
    print(f"Similar questions (>{similar_threshold*100}%): {len(similar_pairs)}\n")
    
    if exact_duplicates:
        print(f"Exact duplicates found:")
        for text, occurrences in list(exact_duplicates.items())[:10]:  # Show first 10
            print(f"  Found in {len(occurrences)} location(s):")
            for test_name, q_id, _ in occurrences:
                print(f"    - {test_name} (ID: {q_id})")
            print(f"    Text: {text[:100]}...\n")
    
    if similar_pairs:
        print(f"\nSimilar questions found:")
        for test1, id1, test2, id2, sim, text in similar_pairs[:10]:  # Show first 10
            print(f"  {test1} (ID: {id1}) <-> {test2} (ID: {id2}): {sim:.2%} similar")
            print(f"    Text: {text}...\n")
    
    return 1 if (exact_duplicates or similar_pairs) else 0


def cmd_find_exact_duplicates(questions_dir: Path) -> int:
    """
    Find exact duplicate questions (same text).
    Original functionality from find_exact_duplicates.py
    """
    print("🔍 Finding exact duplicate questions...\n")
    
    question_map = load_all_questions(questions_dir)
    duplicates = find_duplicates(question_map)
    
    total_questions = sum(len(occurrences) for occurrences in question_map.values())
    unique_questions = len(question_map)
    
    print(f"\n📊 Statistics:")
    print(f"   - Total questions loaded: {total_questions}")
    print(f"   - Unique questions: {unique_questions}")
    
    if not duplicates:
        print("\n✅ No exact duplicate questions found!")
        return 0
    
    print(f"\n❌ Found {len(duplicates)} duplicate question(s):\n")
    print("=" * 80)
    
    for idx, (signature, occurrences) in enumerate(duplicates.items(), 1):
        # Get the first question to show details
        first_occurrence = question_map[signature][0]
        _, _, question = first_occurrence
        
        print(f"\n📋 Duplicate #{idx}")
        print(f"   Found in {len(occurrences)} location(s):")
        for test_name, q_id in occurrences:
            print(f"     - {test_name}.json, Question ID: {q_id}")
        
        # Show question text (truncated if too long)
        question_text = question.get("text", "") or question.get("question", "")
        if len(question_text) > 200:
            question_text = question_text[:200] + "..."
        print(f"\n   Question text: {question_text}")
        
        # Show domain if available
        domain = question.get("domain", "Unknown")
        print(f"   Domain: {domain}")
        
        print("-" * 80)
    
    print(f"\n⚠️  Summary: {len(duplicates)} duplicate question(s) found across {sum(len(occs) for occs in duplicates.values())} location(s)")
    return 1


def cmd_analyze_by_test(questions_dir: Path, sergey_only: bool = False) -> int:
    """
    Analyze which test files have the most duplicate questions.
    Original functionality from analyze_duplicates_by_test.py
    """
    print(f"🔍 Analyzing duplicates by test file{' (Sergey tests only)' if sergey_only else ''}...\n")
    
    test_files = find_test_files(questions_dir)
    
    if sergey_only:
        test_files = [f for f in test_files if is_sergey_test(f)]
        print(f"Filtering to {len(test_files)} Sergey test files...\n")
    
    question_by_text = defaultdict(list)
    test_duplicate_count = Counter()
    
    for test_file in test_files:
        questions = load_questions_file(test_file)
        
        if questions is None:
            continue
        
        for q in questions:
            if not isinstance(q, dict):
                continue
            
            normalized = normalize_question_text(q)
            if normalized:
                question_by_text[normalized].append({
                    "test_file": test_file.name,
                    "test_num": test_file.stem.replace("test", ""),
                    "id": q.get("id"),
                })
    
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
    return 0


def cmd_remove_duplicates(questions_dir: Path, sergey_only: bool = False, dry_run: bool = False) -> int:
    """
    Remove duplicate questions from test files.
    Original functionality from remove_duplicates.py, remove_duplicates_improved.py, remove_duplicates_sergey_only.py
    """
    print(f"🧹 Removing duplicate questions{' (Sergey tests only)' if sergey_only else ''}{' [DRY RUN]' if dry_run else ''}...\n")
    
    test_files = find_test_files(questions_dir)
    
    if sergey_only:
        test_files = [f for f in test_files if is_sergey_test(f)]
        print(f"Filtering to {len(test_files)} Sergey test files...\n")
    
    # Build a map: text -> list of (test_file, question, question_index)
    text_to_questions = defaultdict(list)
    all_questions = {}
    
    for test_file in test_files:
        questions = load_questions_file(test_file)
        
        if questions is None:
            continue
        
        all_questions[test_file] = questions
        for idx, q in enumerate(questions):
            if not isinstance(q, dict):
                continue
            normalized = normalize_question_text(q)
            if normalized:
                text_to_questions[normalized].append((test_file, q, idx))
    
    # Find duplicates
    duplicates = {k: v for k, v in text_to_questions.items() if len(v) > 1}
    
    print(f"Found {len(duplicates)} duplicate question texts")
    
    # For each duplicate text, decide which test to keep it in
    # Strategy: Keep in the test with the lowest number, remove from others
    questions_to_remove = defaultdict(set)  # test_file -> set of indices to remove
    
    for text, occurrences in duplicates.items():
        # Sort by test number (lower test number = keep)
        occurrences_sorted = sorted(
            occurrences,
            key=lambda x: int(x[0].stem.replace("test", ""))
        )
        
        # Keep in first test, remove from others
        keep_test, keep_q, keep_idx = occurrences_sorted[0]
        
        for test_file, q, idx in occurrences_sorted[1:]:
            questions_to_remove[test_file].add(idx)
            if not dry_run:
                print(f"  Will remove duplicate from {test_file.name} (ID: {q.get('id', 'N/A')}): {text[:60]}...")
    
    if dry_run:
        print(f"\n[DRY RUN] Would remove duplicates from {len(questions_to_remove)} test file(s)")
        return 0
    
    # Remove duplicates from each test file
    cleaned_count = 0
    for test_file in test_files:
        if test_file not in all_questions:
            continue
            
        if test_file not in questions_to_remove:
            continue
            
        questions = all_questions[test_file]
        indices_to_remove = questions_to_remove[test_file]
        
        # Remove questions at specified indices
        unique_questions = [q for idx, q in enumerate(questions) if idx not in indices_to_remove]
        
        if len(unique_questions) != len(questions):
            if save_questions_file(test_file, unique_questions, create_backup=True):
                print(f"Cleaned {test_file.name}: removed {len(indices_to_remove)} duplicate(s), kept {len(unique_questions)} questions")
                cleaned_count += 1
    
    # Update all_tests.json if it exists
    all_tests_path = questions_dir / "all_tests.json"
    if all_tests_path.exists():
        print(f"\nUpdating {all_tests_path.name}...")
        all_tests_data = {}
        for test_file in test_files:
            questions = load_questions_file(test_file)
            if questions is not None:
                test_key = test_file.stem
                all_tests_data[test_key] = questions
        
        if save_questions_file(all_tests_path, all_tests_data, create_backup=False):
            print(f"Updated all_tests.json with {len(all_tests_data)} tests")
    
    print(f"\n{'='*80}")
    print(f"Summary:")
    print(f"  Cleaned test files: {cleaned_count}")
    print(f"{'='*80}")
    
    return 0


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Unified question management script for duplicate detection and removal"
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Command to execute')
    
    # check-duplicates command
    subparsers.add_parser('check-duplicates', help='Check for duplicate questions (similarity-based)')
    
    # find-exact-duplicates command
    subparsers.add_parser('find-exact-duplicates', help='Find exact duplicate questions')
    
    # analyze-by-test command
    analyze_parser = subparsers.add_parser('analyze-by-test', help='Analyze duplicates by test file')
    analyze_parser.add_argument('--sergey-only', action='store_true', help='Only analyze Sergey tests (test9+)')
    
    # remove-duplicates command
    remove_parser = subparsers.add_parser('remove-duplicates', help='Remove duplicate questions')
    remove_parser.add_argument('--sergey-only', action='store_true', help='Only process Sergey tests (test9+)')
    remove_parser.add_argument('--dry-run', action='store_true', help='Show what would be removed without making changes')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return 1
    
    questions_dir = get_questions_dir()
    
    if not questions_dir.exists():
        print(f"❌ Error: Questions directory not found: {questions_dir}")
        return 1
    
    # Execute command
    if args.command == 'check-duplicates':
        return cmd_check_duplicates(questions_dir)
    elif args.command == 'find-exact-duplicates':
        return cmd_find_exact_duplicates(questions_dir)
    elif args.command == 'analyze-by-test':
        return cmd_analyze_by_test(questions_dir, sergey_only=getattr(args, 'sergey_only', False))
    elif args.command == 'remove-duplicates':
        return cmd_remove_duplicates(
            questions_dir,
            sergey_only=getattr(args, 'sergey_only', False),
            dry_run=getattr(args, 'dry_run', False)
        )
    else:
        parser.print_help()
        return 1


if __name__ == "__main__":
    exit(main())
