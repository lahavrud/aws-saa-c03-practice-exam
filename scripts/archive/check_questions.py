#!/usr/bin/env python3
"""
Check for malformed questions in questions.js
"""
import re
import json

def check_questions():
    with open('questions.js', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find test3
    test3_start = content.find('test3: [')
    if test3_start == -1:
        print("test3 not found")
        return
    
    # Extract test3 by finding matching brackets
    bracket_count = 0
    i = test3_start + 7
    test3_end = len(content)
    
    while i < len(content):
        if content[i] == '[':
            bracket_count += 1
        elif content[i] == ']':
            if bracket_count == 0:
                test3_end = i
                break
            bracket_count -= 1
        i += 1
    
    test3_content = content[test3_start:test3_end+1]
    
    # Find all questions
    question_pattern = r'\{\s*id:\s*(\d+),\s*text:\s*"((?:[^"\\]|\\.)*)"'
    questions = []
    for match in re.finditer(question_pattern, test3_content, re.DOTALL):
        q_id = int(match.group(1))
        q_text = match.group(2)
        questions.append((q_id, q_text))
    
    print(f"Checking {len(questions)} questions in test3...\n")
    
    issues = []
    
    for q_id, q_text in questions:
        q_issues = []
        
        # Check for missing spaces after periods
        if re.search(r'[a-z]\.[A-Z]', q_text):
            q_issues.append("Missing space after period")
        
        # Check for image tags
        if '<img' in q_text.lower():
            q_issues.append("Contains image tag")
        
        # Check for HTML entities
        if '&amp;' in q_text or '&lt;' in q_text or '&gt;' in q_text:
            q_issues.append("Contains HTML entities")
        
        # Check for data attributes
        if 'data-renderer' in q_text.lower():
            q_issues.append("Contains data-renderer attribute")
        
        # Check for very short questions
        if len(q_text) < 30:
            q_issues.append(f"Very short ({len(q_text)} chars)")
        
        # Check for JSON-like structures
        if re.search(r'\{[^}]{10,}"[^"]*":[^}]*\}', q_text):
            q_issues.append("Contains JSON-like structure")
        
        if q_issues:
            issues.append((q_id, q_issues, q_text))
    
    # Check explanations
    explanation_pattern = r'explanation:\s*"((?:[^"\\]|\\.)*)"'
    explanations = []
    for match in re.finditer(explanation_pattern, test3_content, re.DOTALL):
        explanations.append(match.group(1))
    
    exp_issues = []
    for i, exp in enumerate(explanations, 1):
        exp_problems = []
        
        # Check for image tags
        if '<img' in exp.lower():
            exp_problems.append("Contains image tag")
        
        # Check for broken image references
        if 'src=' in exp.lower() and '<img' not in exp.lower():
            exp_problems.append("Contains image src without img tag")
        
        # Check for very long explanations (might indicate unparsed content)
        if len(exp) > 3000:
            exp_problems.append(f"Very long ({len(exp)} chars)")
        
        if exp_problems:
            exp_issues.append((i, exp_problems, exp[:100]))
    
    # Report issues
    if issues:
        print(f"⚠️  Found {len(issues)} questions with issues:\n")
        for q_id, q_issues, q_text in issues:
            print(f"Q{q_id}: {', '.join(q_issues)}")
            # Show problematic part
            if 'Missing space' in ', '.join(q_issues):
                match = re.search(r'[a-z]\.[A-Z][^.]{0,30}', q_text)
                if match:
                    print(f"  Context: ...{match.group()}...")
            elif len(q_text) < 100:
                print(f"  Text: {q_text}")
            print()
    else:
        print("✓ No issues found in question texts")
    
    if exp_issues:
        print(f"\n⚠️  Found {len(exp_issues)} explanations with issues:\n")
        for exp_num, exp_problems, preview in exp_issues[:10]:
            print(f"Explanation {exp_num}: {', '.join(exp_problems)}")
            print(f"  Preview: {preview}...")
            print()
    else:
        print("\n✓ No issues found in explanations")
    
    # Summary
    print(f"\n{'='*60}")
    print(f"Summary:")
    print(f"  Total questions checked: {len(questions)}")
    print(f"  Questions with issues: {len(issues)}")
    print(f"  Explanations with issues: {len(exp_issues)}")
    print(f"{'='*60}")

if __name__ == '__main__':
    check_questions()
