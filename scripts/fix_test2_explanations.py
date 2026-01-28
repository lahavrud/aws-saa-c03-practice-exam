#!/usr/bin/env python3
"""
Fix explanations in test2.json to match the expected format:
- **Why option X is correct:** [explanation]
- **Why option Y is incorrect:** [explanation]
"""

import json
import re
from pathlib import Path

def find_option_by_text(question, text_to_match):
    """Find option ID by matching text (handles partial matches)"""
    text_to_match = text_to_match.strip()
    for opt in question['options']:
        opt_text = opt['text'].strip()
        # Try exact match first
        if opt_text == text_to_match:
            return opt['id']
        # Try if the text starts with the option text (handles cases where explanation has extra text)
        if text_to_match.startswith(opt_text) or opt_text.startswith(text_to_match[:50]):
            return opt['id']
    return None

def parse_current_explanation(explanation_text, question):
    """Parse the current explanation format and extract information"""
    if not explanation_text or not explanation_text.strip():
        return None
    
    # Check if already in correct format
    if '**Why option' in explanation_text:
        return explanation_text
    
    # Extract correct answer text
    correct_match = re.search(r'The correct answer is:\s*(.+?)(?:\n\n|$)', explanation_text, re.DOTALL)
    correct_answer_text = correct_match.group(1).strip() if correct_match else None
    
    # Find which option matches the correct answer text
    correct_option_id = None
    if correct_answer_text:
        correct_option_id = find_option_by_text(question, correct_answer_text)
    
    # If we can't find match, use correctAnswers array
    if correct_option_id is None and question.get('correctAnswers'):
        correct_option_id = question['correctAnswers'][0]
        if correct_answer_text:
            # Try to find a better match by checking if any option text is in the correct answer text
            for opt in question['options']:
                if opt['id'] in question['correctAnswers']:
                    # Check if option text appears in the correct answer text
                    if opt['text'].strip() in correct_answer_text or correct_answer_text in opt['text'].strip():
                        correct_option_id = opt['id']
                        break
    
    # Extract the generic explanation text (between correct answer and incorrect section)
    generic_explanation = None
    generic_match = re.search(r'The correct answer is:.*?\n\n(.+?)\n\nWhy other options are incorrect:', explanation_text, re.DOTALL)
    if generic_match:
        generic_explanation = generic_match.group(1).strip()
    
    # Extract incorrect options explanations
    incorrect_explanations = {}
    incorrect_section = re.search(r'Why other options are incorrect:\s*(.+?)$', explanation_text, re.DOTALL)
    if incorrect_section:
        incorrect_text = incorrect_section.group(1)
        # Parse bullet points - format: "- Option text: explanation"
        # Handle multi-line explanations
        lines = incorrect_text.split('\n')
        current_option = None
        current_explanation = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            # Check if this is a new bullet point
            if line.startswith('-'):
                # Save previous if exists
                if current_option is not None:
                    opt_id = find_option_by_text(question, current_option)
                    if opt_id is not None:
                        incorrect_explanations[opt_id] = ' '.join(current_explanation).strip()
                
                # Start new bullet
                match = re.match(r'-\s*(.+?):\s*(.+)$', line)
                if match:
                    current_option = match.group(1).strip()
                    current_explanation = [match.group(2).strip()]
                else:
                    # Just the option text, no explanation yet
                    current_option = line[1:].strip().rstrip(':')
                    current_explanation = []
            else:
                # Continuation of explanation
                if current_option:
                    current_explanation.append(line)
        
        # Save last one
        if current_option is not None:
            opt_id = find_option_by_text(question, current_option)
            if opt_id is not None:
                incorrect_explanations[opt_id] = ' '.join(current_explanation).strip()
    
    return correct_option_id, incorrect_explanations, generic_explanation

def generate_proper_explanation(question):
    """Generate explanation in the proper format"""
    current_explanation = question.get('explanation', '')
    
    # If already in correct format, return as-is
    if '**Why option' in current_explanation:
        return current_explanation
    
    # Get correct answer IDs from the question structure (this is the source of truth)
    correct_answer_ids = question.get('correctAnswers', [])
    if not correct_answer_ids:
        # Fallback: find options marked as correct
        correct_answer_ids = [opt['id'] for opt in question['options'] if opt.get('correct', False)]
    
    # Parse current explanation to extract explanations for each option
    parsed = parse_current_explanation(current_explanation, question)
    if parsed is None or isinstance(parsed, str):
        # Already formatted or empty
        return parsed or current_explanation
    
    parsed_correct_id, incorrect_explanations, generic_explanation = parsed
    
    # Build new explanation
    parts = []
    
    # Add correct answer explanations
    for correct_option_id in correct_answer_ids:
        # Try to get explanation from incorrect_explanations (sometimes it's there by mistake)
        # or use generic explanation
        correct_explanation = incorrect_explanations.pop(correct_option_id, None)
        
        if not correct_explanation and generic_explanation:
            correct_explanation = generic_explanation
        elif not correct_explanation:
            # Generate a basic explanation based on the question
            correct_explanation = "This option correctly addresses all the requirements in the scenario. " + \
                                 "It follows AWS best practices and provides the most appropriate solution."
        
        parts.append(f"**Why option {correct_option_id} is correct:**\n{correct_explanation}")
    
    # Add incorrect answer explanations
    for opt in question['options']:
        if opt['id'] not in correct_answer_ids:
            explanation = incorrect_explanations.get(opt['id'], 
                "This option does not fully address the requirements, introduces unnecessary complexity, " +
                "or is not the most appropriate solution for this scenario.")
            parts.append(f"**Why option {opt['id']} is incorrect:**\n{explanation}")
    
    return "\n\n".join(parts)

def fix_explanations_in_file(file_path):
    """Fix all explanations in a JSON file"""
    with open(file_path, 'r', encoding='utf-8') as f:
        questions = json.load(f)
    
    updated_count = 0
    for question in questions:
        old_explanation = question.get('explanation', '')
        new_explanation = generate_proper_explanation(question)
        
        if new_explanation != old_explanation:
            question['explanation'] = new_explanation
            updated_count += 1
            print(f"  Updated question {question['id']}")
    
    # Write back to file
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)
    
    print(f"\n✓ Updated {updated_count} out of {len(questions)} questions in {file_path}")
    return updated_count

if __name__ == '__main__':
    script_dir = Path(__file__).parent
    repo_root = script_dir.parent
    test2_file = repo_root / 'questions' / 'test2.json'
    
    if not test2_file.exists():
        print(f"Error: {test2_file} not found")
        exit(1)
    
    print(f"Fixing explanations in {test2_file}...")
    fix_explanations_in_file(test2_file)
