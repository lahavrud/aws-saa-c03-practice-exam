#!/usr/bin/env python3
"""
Generate questions.js from the exam questions text
"""
import re
import json

# SAA-C03 Domains mapping (simplified - would need actual domain mapping)
DOMAINS = [
    "Design Secure Architectures",
    "Design Resilient Architectures", 
    "Design High-Performing Architectures",
    "Design Cost-Optimized Architectures"
]

def parse_question_block(text, test_num):
    """Parse a single question block"""
    questions = []
    lines = text.strip().split('\n')
    
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        
        # Match question start: Q1:, Q2:, etc.
        q_match = re.match(r'Q(\d+):\s*(.+)', line)
        if q_match:
            q_num = int(q_match.group(1))
            q_text = q_match.group(2)
            
            # Continue reading question text (may span multiple lines)
            i += 1
            while i < len(lines) and not lines[i].strip().startswith('['):
                q_text += ' ' + lines[i].strip()
                i += 1
            
            # Parse options
            options = []
            correct_answers = []
            option_id = 0
            
            while i < len(lines):
                line = lines[i].strip()
                if not line.startswith('['):
                    break
                
                # Check if this is the start of next question
                if re.match(r'Q\d+:', line):
                    break
                
                # Extract option
                is_correct = '[CORRECT]' in line
                option_text = re.sub(r'^\[.*?\]\s*', '', line).strip()
                
                # Continue reading option text if needed
                i += 1
                while i < len(lines) and not lines[i].strip().startswith('[') and not re.match(r'Q\d+:', lines[i].strip()):
                    next_line = lines[i].strip()
                    if next_line:
                        option_text += ' ' + next_line
                    i += 1
                
                options.append({
                    'id': option_id,
                    'text': option_text,
                    'correct': is_correct
                })
                
                if is_correct:
                    correct_answers.append(option_id)
                
                option_id += 1
                if i >= len(lines) or re.match(r'Q\d+:', lines[i].strip()):
                    break
            
            # Determine domain (simplified - would need keyword matching)
            domain = determine_domain(q_text)
            
            question = {
                'id': q_num,
                'text': q_text.strip(),
                'options': options,
                'correctAnswers': correct_answers,
                'explanation': generate_explanation(q_text, options, correct_answers),
                'domain': domain
            }
            
            questions.append(question)
        else:
            i += 1
    
    return questions

def determine_domain(text):
    """Determine domain based on question text keywords"""
    text_lower = text.lower()
    
    if any(word in text_lower for word in ['security', 'encrypt', 'iam', 'access', 'permission', 'guardduty', 'inspector', 'macie', 'waf', 'shield', 'kms', 'ssl', 'tls', 'mfa', 'vpc endpoint', 'private']):
        return "Design Secure Architectures"
    elif any(word in text_lower for word in ['availability', 'multi-az', 'replica', 'backup', 'disaster', 'recovery', 'failover', 'resilient', 'durable', 'snapshot']):
        return "Design Resilient Architectures"
    elif any(word in text_lower for word in ['performance', 'latency', 'throughput', 'scaling', 'auto scaling', 'load balancer', 'cloudfront', 'accelerator', 'caching', 'elastica', 'dax', 'kinesis']):
        return "Design High-Performing Architectures"
    elif any(word in text_lower for word in ['cost', 'optimize', 'reserved', 'spot', 'lifecycle', 's3-ia', 'glacier', 'savings']):
        return "Design Cost-Optimized Architectures"
    else:
        return "Design High-Performing Architectures"  # Default

def generate_explanation(q_text, options, correct_answers):
    """Generate explanation for the question"""
    correct_texts = [options[i]['text'] for i in correct_answers]
    return f"The correct answer{'s are' if len(correct_answers) > 1 else ' is'}: {', '.join(correct_texts)}. This solution best addresses the requirements described in the scenario."

if __name__ == '__main__':
    print("Question parser - run from app to generate questions.js")
