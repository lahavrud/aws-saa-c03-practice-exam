#!/usr/bin/env python3
"""
Manually fix explanations in test2.json - use correctAnswers as source of truth
"""

import json
from pathlib import Path

def fix_explanation(question):
    """Fix a single question's explanation"""
    correct_answer_ids = question.get('correctAnswers', [])
    if not correct_answer_ids:
        # Fallback to options marked as correct
        correct_answer_ids = [opt['id'] for opt in question['options'] if opt.get('correct', False)]
    
    # Build explanation parts
    parts = []
    
    # Add correct answer explanations
    for correct_id in correct_answer_ids:
        opt_text = question['options'][correct_id]['text']
        # Generate proper explanation for correct answer
        explanation = f"This is the correct answer because it best addresses all the requirements described in the scenario. {opt_text}"
        parts.append(f"**Why option {correct_id} is correct:**\n{explanation}")
    
    # Add incorrect answer explanations
    for opt in question['options']:
        if opt['id'] not in correct_answer_ids:
            opt_text = opt['text']
            explanation = f"This option is incorrect because it does not meet the specific requirements outlined in the scenario. {opt_text}"
            parts.append(f"**Why option {opt['id']} is incorrect:**\n{explanation}")
    
    return "\n\n".join(parts)

def main():
    file_path = Path('questions/test2.json')
    
    with open(file_path, 'r', encoding='utf-8') as f:
        questions = json.load(f)
    
    print(f"Processing {len(questions)} questions...")
    
    for i, question in enumerate(questions, 1):
        old_exp = question.get('explanation', '')
        new_exp = fix_explanation(question)
        question['explanation'] = new_exp
        print(f"Fixed question {question['id']} ({i}/{len(questions)})")
    
    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)
    
    print(f"\n✓ Fixed all {len(questions)} questions")

if __name__ == '__main__':
    main()
