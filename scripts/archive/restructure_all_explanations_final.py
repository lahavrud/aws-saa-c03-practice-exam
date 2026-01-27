#!/usr/bin/env python3
"""
Restructure all explanations in test1.json to have:
- **Why option X is correct:** [medium-large explanation] for each correct option
- **Why option Y is incorrect:** [small-medium explanation] for each incorrect option
"""

import json
import os
import re

def restructure_explanation(question):
    """Restructure explanation to the new format"""
    explanation = question.get('explanation', '')
    if not explanation:
        return explanation
    
    correct_ids = question.get('correctAnswers', [])
    options = question.get('options', [])
    
    if not correct_ids or not options:
        return explanation
    
    # Check if already in correct format
    if explanation.startswith('**Why option'):
        return explanation
    
    # Parse the explanation
    lines = explanation.split('\n')
    
    # Find "Why these are correct:" or "Why this is correct:" section
    correct_section_start = None
    incorrect_section_start = None
    
    for i, line in enumerate(lines):
        if '**Why these are correct:**' in line or '**Why this is correct:**' in line:
            correct_section_start = i + 1
        if '**Why other options are incorrect:**' in line:
            incorrect_section_start = i + 1
            break
    
    new_explanation = ""
    
    # Extract correct option explanations
    if correct_section_start is not None:
        correct_section_lines = []
        end_idx = incorrect_section_start if incorrect_section_start else len(lines)
        
        for i in range(correct_section_start, end_idx):
            line = lines[i].strip()
            if line:
                correct_section_lines.append(line)
        
        correct_text = '\n'.join(correct_section_lines)
        
        # Parse bullet points for each correct option
        # Format: "- Option Name: explanation"
        bullet_points = re.split(r'^- ', correct_text, flags=re.MULTILINE)
        
        # Map correct options to their explanations
        correct_explanations = {}
        for bullet in bullet_points:
            if not bullet.strip():
                continue
            # Find which correct option this belongs to
            for opt in options:
                if opt['id'] in correct_ids:
                    opt_name = opt['text'].split(':')[0].split('(')[0].strip()
                    # Check if bullet starts with option name or key words
                    if opt_name[:20].lower() in bullet.lower()[:50] or \
                       any(word in bullet[:50] for word in opt['text'].split()[:3] if len(word) > 4):
                        # Extract explanation (remove option name prefix)
                        explanation_text = bullet
                        # Remove option name if present at start
                        if ':' in explanation_text:
                            explanation_text = explanation_text.split(':', 1)[1].strip()
                        correct_explanations[opt['id']] = explanation_text
                        break
        
        # If we couldn't parse individual explanations, use the full text for all correct options
        if not correct_explanations:
            for opt_id in correct_ids:
                correct_explanations[opt_id] = correct_text
        
        # Add correct option explanations
        for opt_id in correct_ids:
            exp_text = correct_explanations.get(opt_id, correct_text)
            new_explanation += f"**Why option {opt_id} is correct:**\n{exp_text}\n\n"
    else:
        # No "Why these are correct:" section, extract from beginning
        # Skip "The correct answer is:" line
        start_idx = 0
        for i, line in enumerate(lines):
            if line.startswith('The correct answer'):
                start_idx = i + 1
                break
        
        # Get text until "Why other options" or end
        correct_text_lines = []
        end_idx = incorrect_section_start if incorrect_section_start else len(lines)
        for i in range(start_idx, end_idx):
            line = lines[i].strip()
            if line and not line.startswith('**'):
                correct_text_lines.append(line)
        
        correct_text = '\n'.join(correct_text_lines)
        
        # Add correct option explanations
        for opt_id in correct_ids:
            new_explanation += f"**Why option {opt_id} is correct:**\n{correct_text}\n\n"
    
    # Extract incorrect option explanations
    if incorrect_section_start is not None:
        incorrect_section_lines = []
        for i in range(incorrect_section_start, len(lines)):
            line = lines[i].strip()
            if line:
                incorrect_section_lines.append(line)
        
        incorrect_text = '\n'.join(incorrect_section_lines)
        
        # Parse bullet points for each incorrect option
        bullet_points = re.split(r'^- ', incorrect_text, flags=re.MULTILINE)
        
        # Map incorrect options to their explanations
        incorrect_explanations = {}
        for bullet in bullet_points:
            if not bullet.strip():
                continue
            # Find which incorrect option this belongs to
            for opt in options:
                if opt['id'] not in correct_ids:
                    opt_name = opt['text'].split(':')[0].split('(')[0].strip()
                    # Check if bullet starts with option name or key words
                    if opt_name[:20].lower() in bullet.lower()[:50] or \
                       any(word in bullet[:50] for word in opt['text'].split()[:3] if len(word) > 4):
                        # Extract explanation
                        explanation_text = bullet
                        # Remove option name if present at start
                        if ':' in explanation_text:
                            explanation_text = explanation_text.split(':', 1)[1].strip()
                        incorrect_explanations[opt['id']] = explanation_text
                        break
        
        # Add incorrect option explanations
        incorrect_options = [opt for opt in options if opt['id'] not in correct_ids]
        for opt in incorrect_options:
            opt_id = opt['id']
            if opt_id in incorrect_explanations:
                exp_text = incorrect_explanations[opt_id]
            else:
                # Fallback: use full incorrect section
                exp_text = incorrect_text
            new_explanation += f"**Why option {opt_id} is incorrect:**\n{exp_text}\n\n"
    
    return new_explanation.strip()

def update_test1():
    """Update test1.json with restructured explanations"""
    script_dir = os.path.dirname(__file__)
    project_root = os.path.dirname(script_dir) if os.path.basename(script_dir) == 'scripts' else script_dir
    test1_path = os.path.join(project_root, 'questions', 'test1.json')
    
    # Load test1
    with open(test1_path, 'r', encoding='utf-8') as f:
        questions = json.load(f)
    
    # Restructure explanations
    updated = 0
    for question in questions:
        old_explanation = question.get('explanation', '')
        new_explanation = restructure_explanation(question)
        
        if new_explanation != old_explanation and new_explanation:
            question['explanation'] = new_explanation
            updated += 1
    
    # Save updated file
    with open(test1_path, 'w', encoding='utf-8') as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)
    
    print(f"Updated {updated} explanations in test1.json")
    print(f"Total questions: {len(questions)}")

if __name__ == '__main__':
    update_test1()
