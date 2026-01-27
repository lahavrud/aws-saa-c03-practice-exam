#!/usr/bin/env python3
"""
Restore test1.json and test4.json from questions.js
"""

import json
import re
import os

def extract_test_from_js(js_file, test_name):
    """Extract test data from questions.js"""
    with open(js_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find the test section
    pattern = rf'{test_name}:\s*\[(.*?)\],\s*{test_name.replace("test", "test") if test_name != "test26" else ""}'
    
    # Better approach: find the test block
    start_marker = f'{test_name}: ['
    end_marker = '],'
    
    start_idx = content.find(start_marker)
    if start_idx == -1:
        return None
    
    # Find the matching closing bracket
    bracket_count = 0
    in_string = False
    escape_next = False
    i = start_idx + len(start_marker) - 1
    
    while i < len(content):
        char = content[i]
        
        if escape_next:
            escape_next = False
            i += 1
            continue
        
        if char == '\\':
            escape_next = True
            i += 1
            continue
        
        if char == '"' and not escape_next:
            in_string = not in_string
        elif not in_string:
            if char == '[':
                bracket_count += 1
            elif char == ']':
                bracket_count -= 1
                if bracket_count == 0:
                    # Found the end
                    test_content = content[start_idx + len(start_marker):i]
                    # Convert JS to JSON
                    # Replace single quotes with double quotes (carefully)
                    # Remove trailing commas
                    test_content = re.sub(r',(\s*[}\]])', r'\1', test_content)
                    # Try to parse as JSON
                    try:
                        # Wrap in array brackets
                        json_str = '[' + test_content + ']'
                        data = json.loads(json_str)
                        return data
                    except:
                        # Try with eval (less safe but works for this case)
                        try:
                            data = eval('[' + test_content + ']')
                            return data
                        except:
                            return None
        i += 1
    
    return None

# Actually, let's use a simpler approach - parse the JS file as JavaScript
import subprocess

def restore_tests():
    """Restore test1 and test4 from questions.js using Node.js"""
    project_root = os.path.dirname(os.path.dirname(__file__))
    questions_js = os.path.join(project_root, "questions.js")
    questions_dir = os.path.join(project_root, "questions")
    
    # Use Node.js to extract the tests
    script = f"""
    const fs = require('fs');
    const content = fs.readFileSync('{questions_js}', 'utf8');
    // Execute in a sandbox
    const examQuestions = {{}};
    eval(content);
    
    if (examQuestions.test1) {{
        fs.writeFileSync('{questions_dir}/test1.json', JSON.stringify(examQuestions.test1, null, 2));
        console.log('Restored test1.json');
    }}
    if (examQuestions.test4) {{
        fs.writeFileSync('{questions_dir}/test4.json', JSON.stringify(examQuestions.test4, null, 2));
        console.log('Restored test4.json');
    }}
    """
    
    try:
        result = subprocess.run(['node', '-e', script], 
                             capture_output=True, text=True, cwd=project_root)
        print(result.stdout)
        if result.stderr:
            print("Errors:", result.stderr)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    restore_tests()
