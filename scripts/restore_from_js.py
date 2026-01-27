#!/usr/bin/env python3
"""
Restore test1.json and test4.json from questions.js using a more robust method
"""

import json
import os
import subprocess
import sys

def restore_tests():
    """Restore test1 and test4 from questions.js"""
    project_root = os.path.dirname(os.path.dirname(__file__))
    questions_js = os.path.join(project_root, "questions.js")
    questions_dir = os.path.join(project_root, "questions")
    
    # Use Node.js to extract the tests
    node_script = f"""
    const fs = require('fs');
    try {{
        const content = fs.readFileSync('{questions_js}', 'utf8');
        const examQuestions = {{}};
        eval(content);
        
        if (examQuestions.test1) {{
            fs.writeFileSync('{questions_dir}/test1.json', JSON.stringify(examQuestions.test1, null, 2));
            console.log('✓ Restored test1.json');
        }} else {{
            console.log('✗ test1 not found in questions.js');
        }}
        
        if (examQuestions.test4) {{
            fs.writeFileSync('{questions_dir}/test4.json', JSON.stringify(examQuestions.test4, null, 2));
            console.log('✓ Restored test4.json');
        }} else {{
            console.log('✗ test4 not found in questions.js');
        }}
    }} catch (error) {{
        console.error('Error:', error.message);
        process.exit(1);
    }}
    """
    
    try:
        result = subprocess.run(
            ['node', '-e', node_script],
            cwd=project_root,
            capture_output=True,
            text=True,
            check=True
        )
        print(result.stdout)
        if result.stderr:
            print("Warnings:", result.stderr)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error running Node.js: {e}")
        print(f"stdout: {e.stdout}")
        print(f"stderr: {e.stderr}")
        return False
    except FileNotFoundError:
        print("Node.js not found. Trying alternative method...")
        # Alternative: try to parse with Python (more complex)
        return False

if __name__ == "__main__":
    success = restore_tests()
    sys.exit(0 if success else 1)
