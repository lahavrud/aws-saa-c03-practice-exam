#!/usr/bin/env python3
"""
Remove leftover "Why other options are incorrect:" markers from explanations
"""

import json
import os
import re

def cleanup_explanation(explanation):
    """Remove leftover markers"""
    # Remove "**Why other options are incorrect:**" lines
    lines = explanation.split('\n')
    cleaned_lines = []
    
    for line in lines:
        stripped = line.strip()
        if stripped == '**Why other options are incorrect:**' or stripped == '**Why other options are incorrect:**':
            continue  # Skip this line
        cleaned_lines.append(line)
    
    return '\n'.join(cleaned_lines)

def update_test1():
    """Update test1.json"""
    script_dir = os.path.dirname(__file__)
    project_root = os.path.dirname(script_dir) if os.path.basename(script_dir) == 'scripts' else script_dir
    test1_path = os.path.join(project_root, 'questions', 'test1.json')
    
    # Load test1
    with open(test1_path, 'r', encoding='utf-8') as f:
        questions = json.load(f)
    
    # Cleanup explanations
    updated = 0
    for question in questions:
        old_explanation = question.get('explanation', '')
        new_explanation = cleanup_explanation(old_explanation)
        
        if new_explanation != old_explanation:
            question['explanation'] = new_explanation
            updated += 1
    
    # Save updated file
    with open(test1_path, 'w', encoding='utf-8') as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)
    
    print(f"Cleaned up {updated} explanations in test1.json")
    print(f"Total questions: {len(questions)}")

if __name__ == '__main__':
    update_test1()
