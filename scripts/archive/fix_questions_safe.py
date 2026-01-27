#!/usr/bin/env python3
"""
Safely fix missing spaces after periods in questions.js
"""
import re

def fix_questions_safe():
    with open('questions.js', 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    fixes = 0
    
    # Fix missing spaces after periods in question text
    # Pattern: text: "...[a-z].[A-Z]..." - but we need to be very careful
    # We'll use a more targeted approach that only fixes within the text field
    
    # Find all text fields and fix them one by one
    def fix_text_field(match):
        nonlocal fixes
        prefix = match.group(1)  # text: "
        text_content = match.group(2)  # The actual text
        suffix = match.group(3)  # "
        
        # Fix missing spaces: [a-z].[A-Z] -> [a-z]. [A-Z]
        # But avoid URLs, decimals, and common abbreviations
        fixed_text = re.sub(
            r'([a-z])\.([A-Z])',
            r'\1. \2',
            text_content
        )
        
        # Only count if we actually made a change
        if fixed_text != text_content:
            fixes += 1
            return f'{prefix}{fixed_text}{suffix}'
        return match.group(0)
    
    # Match text fields in question objects
    # Pattern: text: "..." followed by options: or correctAnswers: or explanation:
    content = re.sub(
        r'(text:\s*")([^"]+?)"(\s*,\s*(?:options|correctAnswers|explanation|domain):)',
        fix_text_field,
        content
    )
    
    # Also fix "theboracay" -> "the boracay" in option text
    content = re.sub(
        r'(text:\s*"[^"]*?)theboracay([^"]*?")',
        r'\1the boracay\2',
        content
    )
    if 'the boracay' in content and 'theboracay' not in content:
        fixes += 1
    
    # Write the fixed content
    if content != original_content:
        # Backup
        with open('questions.js.backup2', 'w', encoding='utf-8') as f:
            f.write(original_content)
        
        # Write fixed version
        with open('questions.js', 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"✓ Applied {fixes} fixes")
        print("✓ Backup saved to questions.js.backup2")
        
        # Verify syntax
        import subprocess
        result = subprocess.run(['node', '-c', 'questions.js'], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            print("✓ JavaScript syntax is valid")
        else:
            print("✗ JavaScript syntax error detected!")
            print(result.stderr)
            print("\nRestoring from backup...")
            with open('questions.js.backup2', 'r', encoding='utf-8') as f:
                with open('questions.js', 'w', encoding='utf-8') as out:
                    out.write(f.read())
            print("✓ Restored from backup")
    else:
        print("No fixes needed")

if __name__ == '__main__':
    fix_questions_safe()
