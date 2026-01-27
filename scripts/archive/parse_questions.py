#!/usr/bin/env python3
"""
Script to parse exam questions from text and convert to JSON format
"""
import re
import json

# This is a helper script - the actual questions will be in questions.js
# Run this if you need to re-parse questions from raw text

def parse_questions(text):
    questions = []
    current_question = None
    
    lines = text.split('\n')
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Check for question start (Q1:, Q2:, etc.)
        q_match = re.match(r'Q(\d+):\s*(.+)', line)
        if q_match:
            if current_question:
                questions.append(current_question)
            current_question = {
                'id': int(q_match.group(1)),
                'text': q_match.group(2),
                'options': [],
                'correctAnswers': [],
                'explanation': ''
            }
        elif current_question:
            # Check for options
            if line.startswith('['):
                # Extract option text and correctness
                option_text = re.sub(r'^\[.*?\]\s*', '', line).strip()
                is_correct = '[CORRECT]' in line
                option_id = len(current_question['options'])
                current_question['options'].append({
                    'id': option_id,
                    'text': option_text,
                    'correct': is_correct
                })
                if is_correct:
                    current_question['correctAnswers'].append(option_id)
    
    if current_question:
        questions.append(current_question)
    
    return questions

if __name__ == '__main__':
    # This would read from a file, but for now we'll manually structure
    print("Use this script to parse questions if needed")
