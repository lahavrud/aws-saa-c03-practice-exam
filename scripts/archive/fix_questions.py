#!/usr/bin/env python3
"""
Fix malformed questions in questions.js
"""
import re

def fix_questions():
    with open('questions.js', 'r', encoding='utf-8') as f:
        content = f.read()
    
    fixes_applied = []
    original_content = content
    
    # Fix 1: Add missing spaces after periods before capital letters in question text
    # Pattern: lowercase letter, period, capital letter (but not in URLs, decimals, or abbreviations)
    def fix_missing_space(match):
        full_match = match.group(0)
        before = match.group(1)
        period = match.group(2)
        after = match.group(3)
        
        # Don't fix if it's part of a URL
        if '://' in before[-10:] or before[-1].isdigit():
            return full_match
        
        # Don't fix common abbreviations
        abbrevs = ['Dr', 'Mr', 'Mrs', 'Ms', 'Prof', 'Inc', 'Ltd', 'Corp', 'etc', 'vs', 'i.e', 'e.g']
        if any(before.endswith(f'.{abbrev}') for abbrev in abbrevs):
            return full_match
        
        fixes_applied.append(f"Fixed missing space after period")
        return f'{before}{period} {after}'
    
    # Fix missing spaces in question text (but not in explanations or options)
    # Look for: text: "....[a-z].[A-Z]...."
    content = re.sub(
        r'(text:\s*"[^"]*?)([a-z])\.([A-Z][^"]*?)"',
        fix_missing_space,
        content
    )
    
    # Fix 2: Fix the JSON policy in Q22 (test3) - format it properly
    # The JSON has literal \n and \" which should be formatted better
    json_question_pattern = r'(text:\s*"[^"]*?bucket\.)\{ \\n \\"Version\\"([^"]*?)\}What does'
    
    def fix_json_in_question(match):
        prefix = match.group(1)
        json_part = match.group(2)
        
        # Replace escaped newlines and quotes with proper formatting
        # Convert \n to actual newline representation (we'll keep it as text)
        json_fixed = json_part.replace('\\n', ' ').replace('\\"', '"').replace('  ', ' ')
        # Clean up extra spaces
        json_fixed = re.sub(r'\s+', ' ', json_fixed)
        
        fixes_applied.append("Fixed JSON formatting in Q22")
        return f'{prefix}{{ "Version":{json_fixed}}} What does'
    
    if re.search(json_question_pattern, content):
        content = re.sub(json_question_pattern, fix_json_in_question, content)
    
    # Also fix the simpler pattern
    content = re.sub(
        r'(\{ \\n  "Version")',
        r'{ "Version"',
        content
    )
    
    # Fix 3: Fix missing space before "What does" after JSON
    content = re.sub(r'\}\s*What does', r'} What does', content)
    
    # Fix 4: Fix missing space in option text "theboracay" -> "the boracay"
    content = re.sub(
        r'(text:\s*"[^"]*?)theboracay([^"]*?")',
        r'\1the boracay\2',
        content
    )
    
    # Write the fixed content
    if fixes_applied or content != original_content:
        # Backup original
        with open('questions.js.backup', 'w', encoding='utf-8') as f:
            f.write(original_content)
        
        # Write fixed version
        with open('questions.js', 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"✓ Applied fixes:")
        if fixes_applied:
            for fix in set(fixes_applied):  # Remove duplicates
                print(f"  - {fix}")
        print("  - Fixed missing spaces after periods")
        print("  - Fixed JSON formatting")
        print("  - Fixed 'theboracay' -> 'the boracay'")
        print("\n✓ Backup saved to questions.js.backup")
        print("✓ Fixed questions.js")
    else:
        print("No fixes needed")

if __name__ == '__main__':
    fix_questions()
