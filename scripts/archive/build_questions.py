#!/usr/bin/env python3
"""
Parse exam questions from text and generate questions.js
"""
import re
import json

def determine_domain(text):
    """Determine SAA-C03 domain based on question content"""
    text_lower = text.lower()
    
    security_keywords = ['security', 'encrypt', 'iam', 'access', 'permission', 'guardduty', 
                        'inspector', 'macie', 'waf', 'shield', 'kms', 'ssl', 'tls', 'mfa', 
                        'vpc endpoint', 'private', 'authentication', 'authorization', 'cognito']
    
    resilient_keywords = ['availability', 'multi-az', 'replica', 'backup', 'disaster', 
                         'recovery', 'failover', 'resilient', 'durable', 'snapshot', 
                         'rds', 'aurora', 'read replica']
    
    performance_keywords = ['performance', 'latency', 'throughput', 'scaling', 'auto scaling', 
                           'load balancer', 'cloudfront', 'accelerator', 'caching', 'elastica', 
                           'dax', 'kinesis', 'streaming', 'real-time']
    
    cost_keywords = ['cost', 'optimize', 'reserved', 'spot', 'lifecycle', 's3-ia', 'glacier', 
                    'savings', 'expensive', 'reduce cost', 'cost-effective']
    
    if any(kw in text_lower for kw in security_keywords):
        return "Design Secure Architectures"
    elif any(kw in text_lower for kw in resilient_keywords):
        return "Design Resilient Architectures"
    elif any(kw in text_lower for kw in performance_keywords):
        return "Design High-Performing Architectures"
    elif any(kw in text_lower for kw in cost_keywords):
        return "Design Cost-Optimized Architectures"
    else:
        return "Design High-Performing Architectures"

def parse_questions_from_text(text):
    """Parse questions from the provided text format"""
    questions = []
    lines = text.split('\n')
    
    i = 0
    current_test = None
    test_questions = {'test1': [], 'test2': []}
    
    while i < len(lines):
        line = lines[i].strip()
        
        # Detect test separation
        if 'Test 2:' in line or 'Exam Questions Export' in line and i > 100:
            current_test = 'test2'
            i += 1
            continue
        elif current_test is None:
            current_test = 'test1'
        
        # Match question start
        q_match = re.match(r'Q(\d+):\s*(.+)', line)
        if q_match:
            q_num = int(q_match.group(1))
            q_text = q_match.group(2)
            
            # Continue reading question text
            i += 1
            while i < len(lines) and not lines[i].strip().startswith('['):
                next_line = lines[i].strip()
                if next_line and not next_line.startswith('Q'):
                    q_text += ' ' + next_line
                i += 1
                if i >= len(lines):
                    break
            
            # Parse options
            options = []
            correct_answers = []
            option_id = 0
            
            while i < len(lines):
                line = lines[i].strip()
                
                # Check if this is a new question
                if re.match(r'Q\d+:', line):
                    break
                
                # Check if this is test separation
                if 'Test 2:' in line:
                    break
                
                if line.startswith('['):
                    is_correct = '[CORRECT]' in line
                    option_text = re.sub(r'^\[.*?\]\s*', '', line).strip()
                    
                    # Continue reading option text
                    i += 1
                    while i < len(lines):
                        next_line = lines[i].strip()
                        if not next_line or next_line.startswith('[') or re.match(r'Q\d+:', next_line) or 'Test 2:' in next_line:
                            break
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
                else:
                    i += 1
                
                if i >= len(lines):
                    break
            
            if options:
                domain = determine_domain(q_text)
                explanation = f"The correct answer{'s are' if len(correct_answers) > 1 else ' is'} the option{'s' if len(correct_answers) > 1 else ''} marked as correct above. This solution best addresses the requirements in the scenario."
                
                question = {
                    'id': q_num,
                    'text': q_text.strip(),
                    'options': options,
                    'correctAnswers': correct_answers,
                    'explanation': explanation,
                    'domain': domain
                }
                
                test_questions[current_test].append(question)
        else:
            i += 1
    
    return test_questions

def generate_js_file(test_questions):
    """Generate the questions.js file"""
    js_content = """// AWS SAA-C03 Exam Questions
// Complete question bank for Test 1 and Test 2

const examQuestions = {
    test1: [
"""
    
    # Add test1 questions
    for q in test_questions['test1']:
        js_content += "        {\n"
        js_content += f"            id: {q['id']},\n"
        js_content += f"            text: {json.dumps(q['text'])},\n"
        js_content += "            options: [\n"
        for opt in q['options']:
            js_content += f"                {{ id: {opt['id']}, text: {json.dumps(opt['text'])}, correct: {str(opt['correct']).lower()} }},\n"
        js_content += "            ],\n"
        js_content += f"            correctAnswers: {q['correctAnswers']},\n"
        js_content += f"            explanation: {json.dumps(q['explanation'])},\n"
        js_content += f"            domain: {json.dumps(q['domain'])},\n"
        js_content += "        },\n"
    
    js_content += """    ],
    test2: [
"""
    
    # Add test2 questions
    for q in test_questions['test2']:
        js_content += "        {\n"
        js_content += f"            id: {q['id']},\n"
        js_content += f"            text: {json.dumps(q['text'])},\n"
        js_content += "            options: [\n"
        for opt in q['options']:
            js_content += f"                {{ id: {opt['id']}, text: {json.dumps(opt['text'])}, correct: {str(opt['correct']).lower()} }},\n"
        js_content += "            ],\n"
        js_content += f"            correctAnswers: {q['correctAnswers']},\n"
        js_content += f"            explanation: {json.dumps(q['explanation'])},\n"
        js_content += f"            domain: {json.dumps(q['domain'])},\n"
        js_content += "        },\n"
    
    js_content += """    ]
};

// Function to get all questions for a test
function getTestQuestions(testNumber) {
    const testKey = `test${testNumber}`;
    return examQuestions[testKey] || [];
}
"""
    
    return js_content

if __name__ == '__main__':
    print("Question parser ready. Paste questions text to parse.")
