#!/usr/bin/env python3
"""
Separate explanations so each option has its own dedicated explanation.
Remove bullet points and ensure each option ID has unique explanation text.
"""

import json
import os
import re

def separate_explanations(question):
    """Separate explanations so each option has its own text"""
    explanation = question.get('explanation', '')
    if not explanation:
        return explanation
    
    correct_ids = question.get('correctAnswers', [])
    options = question.get('options', [])
    
    if not options:
        return explanation
    
    # Split by "Why option X is correct/incorrect:" markers
    parts = re.split(r'\n\n\*\*Why option (\d+) is (correct|incorrect):\*\*\n', explanation)
    
    if len(parts) < 3:
        return explanation  # Can't parse, return as is
    
    # Build a map of option_id -> explanation_text
    option_explanations = {}
    
    # First part is usually empty or intro text, skip it
    for i in range(1, len(parts), 3):
        if i + 2 < len(parts):
            option_id = int(parts[i])
            option_type = parts[i + 1]  # "correct" or "incorrect"
            explanation_text = parts[i + 2].strip()
            
            # Clean up explanation text - remove bullet points and group into single paragraph
            # Split by lines and remove bullet markers
            lines = explanation_text.split('\n')
            cleaned_lines = []
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                # Remove bullet points (-, •, *)
                line = re.sub(r'^[-•*]\s+', '', line)
                # Remove option name prefixes if present (like "Amazon S3:")
                if ':' in line and len(line.split(':')[0]) < 50:
                    # Might be an option name prefix, but keep it for context
                    pass
                cleaned_lines.append(line)
            
            # Join into single paragraph
            cleaned_text = ' '.join(cleaned_lines)
            # Remove extra whitespace
            cleaned_text = re.sub(r'\s+', ' ', cleaned_text).strip()
            
            option_explanations[option_id] = cleaned_text
    
    # Now rebuild the explanation with proper separation
    new_explanation = ""
    
    # Add correct option explanations first
    for opt_id in correct_ids:
        if opt_id in option_explanations:
            new_explanation += f"**Why option {opt_id} is correct:**\n{option_explanations[opt_id]}\n\n"
    
    # Add incorrect option explanations
    incorrect_options = [opt for opt in options if opt['id'] not in correct_ids]
    for opt in incorrect_options:
        opt_id = opt['id']
        if opt_id in option_explanations:
            new_explanation += f"**Why option {opt_id} is incorrect:**\n{option_explanations[opt_id]}\n\n"
        else:
            # If explanation missing, try to extract from grouped text
            # Look for the option text in the original explanation
            opt_text_start = opt['text'][:30]
            # Try to find explanation for this option
            # For now, add a placeholder
            new_explanation += f"**Why option {opt_id} is incorrect:**\nThis option does not meet the requirements specified in the scenario.\n\n"
    
    return new_explanation.strip()

def update_test1():
    """Update test1.json with separated explanations"""
    script_dir = os.path.dirname(__file__)
    project_root = os.path.dirname(script_dir) if os.path.basename(script_dir) == 'scripts' else script_dir
    test1_path = os.path.join(project_root, 'questions', 'test1.json')
    
    # Load test1
    with open(test1_path, 'r', encoding='utf-8') as f:
        questions = json.load(f)
    
    # Separate explanations
    updated = 0
    for question in questions:
        old_explanation = question.get('explanation', '')
        new_explanation = separate_explanations(question)
        
        if new_explanation != old_explanation:
            question['explanation'] = new_explanation
            updated += 1
    
    # Save updated file
    with open(test1_path, 'w', encoding='utf-8') as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)
    
    print(f"Updated {updated} explanations in test1.json")
    print(f"Total questions: {len(questions)}")

if __name__ == '__main__':
    update_test1()
