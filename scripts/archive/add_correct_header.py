#!/usr/bin/env python3
"""
Add "Why option X is correct:" header to all explanations in test1.json
"""

import json
import os
import re

def restructure_explanation(question):
    """Restructure explanation to add 'Why option X is correct:' header"""
    explanation = question.get('explanation', '')
    if not explanation:
        return explanation
    
    correct_ids = question.get('correctAnswers', [])
    if not correct_ids:
        return explanation
    
    # Check if it already has the correct format
    if explanation.startswith('**Why option'):
        return explanation  # Already formatted
    
    # Handle old format: "The correct answer is: ..." or "The correct answers are: ..."
    # Remove the header line if present
    lines = explanation.split('\n')
    start_idx = 0
    
    # Skip "The correct answer is:" or "The correct answers are:" line
    if lines[0].startswith('The correct answer'):
        start_idx = 1
        # Also skip "**Why these are correct:**" or "**Why this is correct:**" if present
        if start_idx < len(lines) and lines[start_idx].strip().startswith('**Why'):
            start_idx += 1
    
    # Get the correct option ID(s)
    if isinstance(correct_ids, list):
        if len(correct_ids) == 1:
            correct_id = correct_ids[0]
        else:
            # Multiple correct answers - format as list
            correct_id = correct_ids
    else:
        correct_id = correct_ids
    
    # Find where "Why other options are incorrect:" or "Why option X is incorrect:" starts
    remaining_text = '\n'.join(lines[start_idx:])
    
    # Split by "Why option X is incorrect:" markers
    parts = re.split(r'\n\n\*\*Why option (\d+) is incorrect:\*\*', remaining_text)
    
    if len(parts) < 2:
        # Try splitting by "Why other options are incorrect:"
        parts = re.split(r'\n\n\*\*Why other options are incorrect:\*\*', remaining_text)
        if len(parts) >= 2:
            # Has "Why other options are incorrect:" - need to parse individual options
            correct_explanation = parts[0].strip()
            incorrect_section = parts[1].strip() if len(parts) > 1 else ""
            
            # Build new explanation
            if isinstance(correct_id, list):
                # Multiple correct answers
                new_explanation = ""
                for cid in correct_id:
                    new_explanation += f"**Why option {cid} is correct:**\n{correct_explanation}\n\n"
            else:
                new_explanation = f"**Why option {correct_id} is correct:**\n{correct_explanation}\n\n"
            
            # Parse incorrect options from the text
            # Find all options in the question
            options = question.get('options', [])
            incorrect_options = [opt for opt in options if opt['id'] not in correct_ids]
            
            # Try to extract individual option explanations
            # Look for patterns like "- Option X:" or "Option X:" or just bullet points
            incorrect_lines = incorrect_section.split('\n')
            current_option = None
            option_texts = {}
            
            for line in incorrect_lines:
                line = line.strip()
                if not line:
                    continue
                # Check if line starts with option identifier
                for opt in incorrect_options:
                    opt_text_start = opt['text'][:30].lower()
                    if line.lower().startswith(opt_text_start[:20]) or line.startswith('-') or line.startswith('•'):
                        # This might be the start of an option explanation
                        if opt['id'] not in option_texts:
                            option_texts[opt['id']] = []
                        current_option = opt['id']
                        # Remove bullet/dash and option text prefix
                        clean_line = re.sub(r'^[-•]\s*', '', line)
                        if not clean_line.lower().startswith(opt_text_start[:20]):
                            option_texts[current_option].append(clean_line)
                        break
                else:
                    if current_option is not None:
                        option_texts[current_option].append(line)
            
            # Add incorrect option explanations
            for opt in incorrect_options:
                opt_id = opt['id']
                if opt_id in option_texts:
                    opt_explanation = ' '.join(option_texts[opt_id]).strip()
                else:
                    # Fallback: use the full incorrect section
                    opt_explanation = incorrect_section.strip()
                
                if opt_explanation:
                    new_explanation += f"**Why option {opt_id} is incorrect:**\n{opt_explanation}\n\n"
            
            return new_explanation.strip()
        else:
            # No markers found, return as is but add header
            correct_explanation = remaining_text.strip()
            if isinstance(correct_id, list):
                new_explanation = ""
                for cid in correct_id:
                    new_explanation += f"**Why option {cid} is correct:**\n{correct_explanation}\n\n"
            else:
                new_explanation = f"**Why option {correct_id} is correct:**\n{correct_explanation}\n\n"
            return new_explanation.strip()
    
    # First part is the correct answer explanation
    correct_explanation = parts[0].strip()
    
    # Build new explanation with header
    if isinstance(correct_id, list):
        new_explanation = ""
        for cid in correct_id:
            new_explanation += f"**Why option {cid} is correct:**\n{correct_explanation}\n\n"
    else:
        new_explanation = f"**Why option {correct_id} is correct:**\n{correct_explanation}\n\n"
    
    # Add incorrect option explanations
    for i in range(1, len(parts), 2):
        if i + 1 < len(parts):
            option_id = parts[i]
            option_explanation = parts[i + 1].strip()
            new_explanation += f"**Why option {option_id} is incorrect:**\n{option_explanation}\n\n"
    
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
