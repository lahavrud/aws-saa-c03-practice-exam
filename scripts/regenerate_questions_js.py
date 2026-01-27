#!/usr/bin/env python3
"""
Regenerate questions.js from JSON files in questions directory
"""

import json
import os

def regenerate_questions_js():
    """Regenerate questions.js from JSON files"""
    script_dir = os.path.dirname(__file__)
    project_root = os.path.dirname(script_dir) if os.path.basename(script_dir) == 'scripts' else script_dir
    
    questions_dir = os.path.join(project_root, 'questions')
    questions_js_path = os.path.join(project_root, 'questions.js')
    
    # Load all test JSON files
    all_tests = {}
    for i in range(1, 21):  # Check test1.json through test20.json
        test_file = os.path.join(questions_dir, f'test{i}.json')
        if os.path.exists(test_file):
            with open(test_file, 'r', encoding='utf-8') as f:
                questions = json.load(f)
                all_tests[f'test{i}'] = questions
                print(f"Loaded test{i}.json: {len(questions)} questions")
    
    if not all_tests:
        print("No test JSON files found!")
        return
    
    # Generate questions.js
    js_content = """// AWS SAA-C03 Exam Questions
// Auto-generated from JSON files in questions directory

const examQuestions = {
"""
    
    # Sort tests by number
    sorted_tests = sorted(all_tests.items(), key=lambda x: int(x[0].replace('test', '')))
    
    for test_key, questions in sorted_tests:
        js_content += f"    {test_key}: [\n"
        
        for q in questions:
            js_content += "        {\n"
            js_content += f"            id: {q['id']},\n"
            js_content += f"            text: {json.dumps(q['text'], ensure_ascii=False)},\n"
            js_content += "            options: [\n"
            for opt in q['options']:
                js_content += f"                {{ id: {opt['id']}, text: {json.dumps(opt['text'], ensure_ascii=False)}, correct: {str(opt['correct']).lower()} }},\n"
            js_content += "            ],\n"
            js_content += f"            correctAnswers: {q['correctAnswers']},\n"
            js_content += f"            explanation: {json.dumps(q['explanation'], ensure_ascii=False)},\n"
            js_content += f"            domain: {json.dumps(q['domain'], ensure_ascii=False)},\n"
            js_content += "        },\n"
        
        js_content += "    ],\n"
    
    js_content += """};

// Function to get all questions for a test
function getTestQuestions(testNumber) {
    const testKey = `test${testNumber}`;
    return examQuestions[testKey] || [];
}
"""
    
    # Write questions.js
    with open(questions_js_path, 'w', encoding='utf-8') as f:
        f.write(js_content)
    
    print(f"\n✓ Successfully regenerated questions.js with {len(all_tests)} tests")
    print(f"  Total questions: {sum(len(q) for q in all_tests.values())}")

if __name__ == '__main__':
    regenerate_questions_js()
