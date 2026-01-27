#!/usr/bin/env python3
"""
Fix explanations so each option has its own specific explanation.
Remove bullet points and ensure explanations match the actual option text.
"""

import json
import os
import re

def extract_option_specific_explanation(option_text, explanation_text):
    """Extract the explanation specific to this option from grouped text"""
    # Clean option text - get key words
    option_words = set(option_text.lower().split())
    # Remove common words
    option_words = {w for w in option_words if len(w) > 3 and w not in ['amazon', 'aws', 'service', 'use']}
    
    # Split explanation by lines
    lines = explanation_text.split('\n')
    
    # Look for lines that mention this option specifically
    matching_lines = []
    for line in lines:
        line_lower = line.lower()
        # Check if this line mentions the option
        if any(word in line_lower for word in option_words):
            # Remove bullet markers
            clean_line = re.sub(r'^[-•*]\s*', '', line).strip()
            # Remove option name prefix if present (like "Amazon RDS:")
            if ':' in clean_line:
                parts = clean_line.split(':', 1)
                if len(parts[0]) < 50:  # Likely an option name prefix
                    clean_line = parts[1].strip()
            matching_lines.append(clean_line)
    
    if matching_lines:
        return ' '.join(matching_lines)
    
    # If no specific match, return the first meaningful sentence
    for line in lines:
        clean_line = re.sub(r'^[-•*]\s*', '', line).strip()
        if clean_line and len(clean_line) > 20:
            # Remove option name prefix if present
            if ':' in clean_line:
                parts = clean_line.split(':', 1)
                if len(parts[0]) < 50:
                    clean_line = parts[1].strip()
            return clean_line
    
    return explanation_text.strip()

def fix_explanation(question):
    """Fix explanation to have one explanation per option"""
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
        return explanation  # Can't parse
    
    # Build a map of option_id -> explanation_text
    option_explanations = {}
    
    for i in range(1, len(parts), 3):
        if i + 2 < len(parts):
            option_id = int(parts[i])
            explanation_text = parts[i + 2].strip()
            
            # Get the actual option text
            option = next((opt for opt in options if opt['id'] == option_id), None)
            if option:
                # Extract specific explanation for this option
                specific_explanation = extract_option_specific_explanation(option['text'], explanation_text)
                # Clean up - remove bullet points, make it a single paragraph
                lines = specific_explanation.split('\n')
                cleaned_lines = []
                for line in lines:
                    line = line.strip()
                    if not line:
                        continue
                    # Remove bullet markers
                    line = re.sub(r'^[-•*]\s+', '', line)
                    # Remove option name prefixes
                    if ':' in line and len(line.split(':')[0]) < 50:
                        parts = line.split(':', 1)
                        line = parts[1].strip()
                    if line:
                        cleaned_lines.append(line)
                
                # Join into single paragraph
                cleaned_text = ' '.join(cleaned_lines)
                cleaned_text = re.sub(r'\s+', ' ', cleaned_text).strip()
                option_explanations[option_id] = cleaned_text
            else:
                # Fallback: clean the explanation text
                lines = explanation_text.split('\n')
                cleaned_lines = []
                for line in lines:
                    line = re.sub(r'^[-•*]\s+', '', line.strip())
                    if line and not line.startswith('**'):
                        cleaned_lines.append(line)
                option_explanations[option_id] = ' '.join(cleaned_lines).strip()
    
    # Rebuild explanation
    new_explanation = ""
    
    # Add correct options first
    for opt_id in correct_ids:
        if opt_id in option_explanations:
            new_explanation += f"**Why option {opt_id} is correct:**\n{option_explanations[opt_id]}\n\n"
    
    # Add incorrect options
    incorrect_options = [opt for opt in options if opt['id'] not in correct_ids]
    for opt in incorrect_options:
        opt_id = opt['id']
        if opt_id in option_explanations:
            new_explanation += f"**Why option {opt_id} is incorrect:**\n{option_explanations[opt_id]}\n\n"
        else:
            # Missing explanation - create a basic one
            new_explanation += f"**Why option {opt_id} is incorrect:**\nThis option does not meet the requirements specified in the scenario.\n\n"
    
    return new_explanation.strip()

def update_test1():
    """Update test1.json"""
    script_dir = os.path.dirname(__file__)
    project_root = os.path.dirname(script_dir) if os.path.basename(script_dir) == 'scripts' else script_dir
    test1_path = os.path.join(project_root, 'questions', 'test1.json')
    
    with open(test1_path, 'r', encoding='utf-8') as f:
        questions = json.load(f)
    
    updated = 0
    for question in questions:
        old_explanation = question.get('explanation', '')
        new_explanation = fix_explanation(question)
        
        if new_explanation != old_explanation:
            question['explanation'] = new_explanation
            updated += 1
    
    with open(test1_path, 'w', encoding='utf-8') as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)
    
    print(f"Updated {updated} explanations in test1.json")
    print(f"Total questions: {len(questions)}")

if __name__ == '__main__':
    update_test1()
