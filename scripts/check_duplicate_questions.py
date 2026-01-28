#!/usr/bin/env python3
"""
Check for duplicate questions across all test JSON files.
Compares questions by their text content (normalized) to find duplicates.
"""

import json
import os
from pathlib import Path
from collections import defaultdict
from typing import Dict, List, Tuple, Set
import re


def normalize_text(text: str) -> str:
    """Normalize text for comparison (lowercase, remove extra whitespace)"""
    if not text:
        return ""
    # Convert to lowercase
    text = text.lower()
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    # Remove leading/trailing whitespace
    text = text.strip()
    return text


def normalize_question_text(question: Dict) -> str:
    """Get normalized question text"""
    text = question.get("text", "") or question.get("question", "")
    return normalize_text(text)


def get_question_signature(question: Dict) -> str:
    """Create a signature for a question based on text and options"""
    # Normalize question text
    text = normalize_question_text(question)
    
    # Normalize options text
    options = question.get("options", [])
    options_texts = []
    for opt in sorted(options, key=lambda x: x.get("id", 0)):
        opt_text = normalize_text(opt.get("text", ""))
        options_texts.append(opt_text)
    
    # Create signature from question text and options
    signature = f"{text}|||{'|||'.join(options_texts)}"
    return signature


def load_all_questions(questions_dir: Path) -> Dict[str, List[Tuple[str, int, Dict]]]:
    """
    Load all questions from all test JSON files.
    Returns: dict mapping question signature to list of (test_file, question_id, question_dict)
    """
    question_map = defaultdict(list)
    
    # Find all test JSON files
    test_files = sorted(questions_dir.glob("test*.json"))
    
    print(f"📂 Scanning {len(test_files)} test files...")
    
    for test_file in test_files:
        test_name = test_file.stem  # e.g., "test2"
        try:
            with open(test_file, 'r', encoding='utf-8') as f:
                questions = json.load(f)
            
            if not isinstance(questions, list):
                print(f"⚠️  Warning: {test_file.name} is not a list, skipping")
                continue
            
            print(f"  ✓ {test_file.name}: {len(questions)} questions")
            
            for question in questions:
                if not isinstance(question, dict):
                    continue
                
                q_id = question.get("id")
                if q_id is None:
                    print(f"  ⚠️  Warning: Question in {test_file.name} missing ID, skipping")
                    continue
                
                # Create signature
                signature = get_question_signature(question)
                
                # Store with test file and question ID
                question_map[signature].append((test_name, q_id, question))
        
        except json.JSONDecodeError as e:
            print(f"❌ Error parsing {test_file.name}: {e}")
        except Exception as e:
            print(f"❌ Error reading {test_file.name}: {e}")
    
    return question_map


def find_duplicates(question_map: Dict[str, List[Tuple[str, int, Dict]]]) -> Dict[str, List[Tuple[str, int]]]:
    """Find duplicate questions (signatures that appear more than once)"""
    duplicates = {}
    
    for signature, occurrences in question_map.items():
        if len(occurrences) > 1:
            # Extract just test name and question ID for reporting
            duplicates[signature] = [(test_name, q_id) for test_name, q_id, _ in occurrences]
    
    return duplicates


def print_duplicates_report(duplicates: Dict[str, List[Tuple[str, int]]], question_map: Dict):
    """Print a detailed report of duplicate questions"""
    if not duplicates:
        print("\n✅ No duplicate questions found!")
        return
    
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


def main():
    """Main function"""
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    questions_dir = project_root / "questions"
    
    if not questions_dir.exists():
        print(f"❌ Error: Questions directory not found: {questions_dir}")
        return 1
    
    print("🔍 Checking for duplicate questions...\n")
    
    # Load all questions
    question_map = load_all_questions(questions_dir)
    
    total_questions = sum(len(occurrences) for occurrences in question_map.values())
    unique_questions = len(question_map)
    
    print(f"\n📊 Statistics:")
    print(f"   - Total questions loaded: {total_questions}")
    print(f"   - Unique questions: {unique_questions}")
    
    # Find duplicates
    duplicates = find_duplicates(question_map)
    
    # Print report
    print_duplicates_report(duplicates, question_map)
    
    if duplicates:
        print(f"\n⚠️  Summary: {len(duplicates)} duplicate question(s) found across {sum(len(occs) for occs in duplicates.values())} location(s)")
        return 1
    else:
        print(f"\n✅ All questions are unique!")
        return 0


if __name__ == "__main__":
    exit(main())
