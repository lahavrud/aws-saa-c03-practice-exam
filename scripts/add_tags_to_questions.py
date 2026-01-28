#!/usr/bin/env python3
"""
Add tags to questions based on Gemini analysis
Tags are extracted from AWS concepts and best practices for future use
"""

import json
from pathlib import Path
from typing import Dict, Any, List

ANALYSIS_FILE = "analysis_output.json"
QUESTIONS_FILE = "questions/test2.json"
BACKUP_SUFFIX = ".backup"


def get_question_key(question: Dict[str, Any]) -> str:
    """Get unique identifier for a question"""
    if "uniqueId" in question:
        return str(question["uniqueId"])
    elif "id" in question:
        test_key = question.get("testKey", "test2")
        return f"{test_key}-q{question['id']}"
    else:
        return str(hash(question.get("text", "")) % (10**10))


def extract_tags_from_analysis(gemini_analysis: Dict[str, Any]) -> List[str]:
    """Extract tags from Gemini analysis (AWS concepts and best practices)"""
    tags = []

    # Add AWS concepts as tags
    aws_concepts = gemini_analysis.get("aws_concepts", [])
    if isinstance(aws_concepts, list):
        tags.extend([concept.lower().replace(" ", "-") for concept in aws_concepts])

    # Add best practices as tags (with "best-practice-" prefix)
    best_practices = gemini_analysis.get("best_practices", [])
    if isinstance(best_practices, list):
        tags.extend(
            [
                f"best-practice-{practice.lower().replace(' ', '-')}"
                for practice in best_practices
            ]
        )

    # Remove duplicates and sort
    return sorted(list(set(tags)))


def add_tags_to_questions(analysis_file: str, questions_file: str):
    """Add tags to questions based on Gemini analysis"""

    # Load analysis
    print(f"📂 Loading analysis from {analysis_file}...")
    with open(analysis_file, "r", encoding="utf-8") as f:
        analysis_data = json.load(f)
    print(f"✓ Loaded {len(analysis_data)} analyses\n")

    # Load questions
    print(f"📂 Loading questions from {questions_file}...")
    with open(questions_file, "r", encoding="utf-8") as f:
        questions = json.load(f)
    print(f"✓ Loaded {len(questions)} questions\n")

    # Create backup
    backup_file = questions_file + BACKUP_SUFFIX
    print(f"💾 Creating backup: {backup_file}...")
    with open(backup_file, "w", encoding="utf-8") as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)
    print("✓ Backup created\n")

    # Add tags to questions
    updated_count = 0
    for question in questions:
        q_id = get_question_key(question)

        # Find matching analysis
        analysis_entry = analysis_data.get(q_id)
        if not analysis_entry:
            # Try alternative keys
            alt_keys = [str(question.get("id")), f"test2-q{question.get('id')}"]
            for alt_key in alt_keys:
                if alt_key in analysis_data:
                    analysis_entry = analysis_data[alt_key]
                    break

        if analysis_entry and "analysis" in analysis_entry:
            # Extract tags from analysis
            tags = extract_tags_from_analysis(analysis_entry["analysis"])

            # Add tags to question (only if not already present)
            if "tags" not in question or not question["tags"]:
                question["tags"] = tags
                updated_count += 1
                print(
                    f"  ✓ Added {len(tags)} tags to question {question.get('id')}: {', '.join(tags[:3])}{'...' if len(tags) > 3 else ''}"
                )
            else:
                # Merge with existing tags
                existing_tags = set(question.get("tags", []))
                new_tags = set(tags)
                merged_tags = sorted(list(existing_tags | new_tags))
                if len(merged_tags) > len(existing_tags):
                    question["tags"] = merged_tags
                    updated_count += 1
                    print(
                        f"  ✓ Updated tags for question {question.get('id')}: {len(merged_tags)} total"
                    )
        else:
            # Add empty tags array if no analysis found
            if "tags" not in question:
                question["tags"] = []

    # Save updated questions
    print(f"\n💾 Saving updated questions to {questions_file}...")
    with open(questions_file, "w", encoding="utf-8") as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Tags added!")
    print(f"   - Updated {updated_count} out of {len(questions)} questions")
    print(f"   - Backup saved to {backup_file}")


if __name__ == "__main__":
    add_tags_to_questions(ANALYSIS_FILE, QUESTIONS_FILE)
