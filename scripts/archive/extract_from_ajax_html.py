#!/usr/bin/env python3
"""
Extract questions from HTML files that use AJAX/JavaScript to load questions
This handles WordPress LearnDash/wpProQuiz format
"""
import re
import json
import os
import sys

def extract_wpproquiz_data(html_path):
    """Extract wpProQuiz question data from HTML"""
    with open(html_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    questions = []
    
    # Look for wpProQuiz data in various formats
    # Pattern 1: JavaScript variables with question data
    js_patterns = [
        r'wpProQuiz_questionList[^>]*data-question[^=]*=["\']([^"\']+)',
        r'wpProQuiz[^>]*question[^>]*>([^<]{50,500})',
        r'questionText["\']?\s*[:=]\s*["\']([^"\']{50,500})',
    ]
    
    # Pattern 2: Look for JSON data in script tags
    script_tags = re.findall(r'<script[^>]*>(.*?)</script>', content, re.DOTALL | re.IGNORECASE)
    
    for script in script_tags:
        # Look for JSON objects with question data
        json_matches = re.findall(r'\{[^{}]*"question"[^{}]*\}', script, re.IGNORECASE | re.DOTALL)
        if json_matches:
            try:
                for match in json_matches:
                    data = json.loads(match)
                    if 'question' in data:
                        print(f"Found question data in JSON: {data.get('question', '')[:100]}...")
            except:
                pass
    
    # Pattern 3: Extract visible question text from HTML
    # Remove scripts and styles
    text_content = re.sub(r'<script[^>]*>.*?</script>', '', content, flags=re.DOTALL | re.IGNORECASE)
    text_content = re.sub(r'<style[^>]*>.*?</style>', '', text_content, flags=re.DOTALL | re.IGNORECASE)
    
    # Look for question-like text patterns
    question_texts = re.findall(r'([A-Z][^.!?]{50,300}\?)', text_content)
    
    if question_texts:
        print(f"Found {len(question_texts)} potential questions in text")
        for i, q in enumerate(question_texts[:5], 1):
            print(f"  {i}. {q[:150]}...")
    
    return questions

def main():
    html_file = 'questions/AWS Certified Solutions Architect Associate Practice Exams SAA-C03 2026.html'
    
    if not os.path.exists(html_file):
        print(f"File not found: {html_file}")
        return
    
    print(f"Analyzing {html_file}...")
    print("=" * 60)
    
    questions = extract_wpproquiz_data(html_file)
    
    if not questions:
        print("\n⚠️  No questions found in HTML file.")
        print("\nThis appears to be a course listing page, not a quiz page.")
        print("\nTo extract questions, you need to:")
        print("1. Open the HTML file in a browser")
        print("2. Navigate to an actual quiz/test page")
        print("3. Save that quiz page (File → Save As)")
        print("4. Or use browser DevTools (F12) → Network tab")
        print("   - Start a quiz")
        print("   - Look for AJAX requests to admin-ajax.php")
        print("   - Find the response with question data (JSON)")
        print("   - Save that JSON response")
        print("\nThe quiz IDs found in this file: 39, 91")
        print("You would need to access those specific quiz pages to get the questions.")

if __name__ == '__main__':
    main()
