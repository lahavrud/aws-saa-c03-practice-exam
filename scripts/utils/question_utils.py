#!/usr/bin/env python3
"""
Shared utilities for question management scripts.
Provides common functions for text normalization, file operations, and question processing.
"""

import json
import os
import shutil
import re
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Set
from collections import defaultdict


def normalize_text(text: str) -> str:
    """
    Normalize text for comparison (lowercase, remove extra whitespace).
    
    Args:
        text: Text to normalize
        
    Returns:
        Normalized text string
    """
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
    """
    Get normalized question text from a question dictionary.
    
    Args:
        question: Question dictionary
        
    Returns:
        Normalized question text
    """
    text = question.get("text", "") or question.get("question", "")
    return normalize_text(text)


def get_question_signature(question: Dict) -> str:
    """
    Create a signature for a question based on text and options.
    This is more comprehensive than just text normalization.
    
    Args:
        question: Question dictionary
        
    Returns:
        Signature string
    """
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


def find_test_files(questions_dir: Path, exclude_backups: bool = True) -> List[Path]:
    """
    Find all test JSON files in the questions directory.
    
    Args:
        questions_dir: Path to questions directory
        exclude_backups: Whether to exclude .backup files
        
    Returns:
        List of test file paths, sorted by test number
    """
    test_files = []
    
    for test_file in questions_dir.glob("test*.json"):
        if exclude_backups and test_file.name.endswith(".backup"):
            continue
            
        # Extract test number
        try:
            test_num_str = test_file.stem.replace("test", "")
            if test_num_str.isdigit():
                test_files.append((int(test_num_str), test_file))
        except (ValueError, AttributeError):
            continue
    
    # Sort by test number and return paths
    test_files = sorted(test_files, key=lambda x: x[0])
    return [f[1] for f in test_files]


def load_questions_file(file_path: Path) -> Optional[List[Dict]]:
    """
    Load questions from a JSON file.
    
    Args:
        file_path: Path to JSON file
        
    Returns:
        List of questions or None if error
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Handle both list and dict formats
        if isinstance(data, list):
            return data
        elif isinstance(data, dict):
            # If it's a dict with question keys, extract all questions
            all_questions = []
            for key, questions in data.items():
                if isinstance(questions, list):
                    all_questions.extend(questions)
            return all_questions if all_questions else None
        
        return None
    except json.JSONDecodeError as e:
        print(f"❌ Error parsing {file_path.name}: {e}")
        return None
    except Exception as e:
        print(f"❌ Error reading {file_path.name}: {e}")
        return None


def save_questions_file(file_path: Path, questions: List[Dict], create_backup: bool = True) -> bool:
    """
    Save questions to a JSON file with optional backup.
    
    Args:
        file_path: Path to save to
        questions: List of question dictionaries
        create_backup: Whether to create a backup before saving
        
    Returns:
        True if successful, False otherwise
    """
    try:
        # Create backup if requested and file exists
        if create_backup and file_path.exists():
            backup_path = file_path.with_suffix('.json.backup')
            shutil.copy2(file_path, backup_path)
        
        # Save file
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(questions, f, indent=2, ensure_ascii=False)
        
        return True
    except Exception as e:
        print(f"❌ Error saving {file_path.name}: {e}")
        return False


def load_all_questions(questions_dir: Path) -> Dict[str, List[Tuple[str, int, Dict]]]:
    """
    Load all questions from all test JSON files.
    
    Args:
        questions_dir: Path to questions directory
        
    Returns:
        Dictionary mapping question signature to list of (test_name, question_id, question_dict)
    """
    question_map = defaultdict(list)
    
    # Find all test JSON files
    test_files = find_test_files(questions_dir)
    
    print(f"📂 Scanning {len(test_files)} test files...")
    
    for test_file in test_files:
        test_name = test_file.stem  # e.g., "test2"
        questions = load_questions_file(test_file)
        
        if questions is None:
            print(f"  ⚠️  Warning: {test_file.name} could not be loaded, skipping")
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
    
    return question_map


def find_duplicates(question_map: Dict[str, List[Tuple[str, int, Dict]]]) -> Dict[str, List[Tuple[str, int]]]:
    """
    Find duplicate questions (signatures that appear more than once).
    
    Args:
        question_map: Dictionary from load_all_questions()
        
    Returns:
        Dictionary mapping signature to list of (test_name, question_id) tuples
    """
    duplicates = {}
    
    for signature, occurrences in question_map.items():
        if len(occurrences) > 1:
            # Extract just test name and question ID for reporting
            duplicates[signature] = [(test_name, q_id) for test_name, q_id, _ in occurrences]
    
    return duplicates


def get_project_root() -> Path:
    """
    Get the project root directory (parent of scripts directory).
    
    Returns:
        Path to project root
    """
    return Path(__file__).parent.parent.parent


def get_questions_dir() -> Path:
    """
    Get the questions directory path.
    
    Returns:
        Path to questions directory
    """
    return get_project_root() / "questions"
