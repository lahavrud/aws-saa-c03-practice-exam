#!/usr/bin/env python3
"""
Extract questions from Dojo exam HTML file (wpProQuiz format)
and add it as test8.json
"""
import re
import json
import os
import sys
from bs4 import BeautifulSoup

def determine_domain(category_text):
    """Map category to SAA-C03 domain"""
    if 'Cost-Optimized' in category_text:
        return "Design Cost-Optimized Architectures"
    elif 'Secure' in category_text:
        return "Design Secure Architectures"
    elif 'Resilient' in category_text:
        return "Design Resilient Architectures"
    elif 'High-Performing' in category_text or 'Performance' in category_text:
        return "Design High-Performing Architectures"
    else:
        return "Design High-Performing Architectures"  # Default

def extract_dojo_exam(html_path):
    """Extract questions from Dojo exam HTML file"""
    try:
        with open(html_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        soup = BeautifulSoup(content, 'html.parser')
        questions = []
        
        # Find wpProQuiz_user_content div
        wpProQuiz_content = soup.find('div', id='wpProQuiz_user_content')
        if not wpProQuiz_content:
            print("Error: Could not find wpProQuiz_user_content div")
            return []
        
        # Find table with questions
        tables = wpProQuiz_content.find_all('table')
        if not tables:
            print("Error: Could not find question table")
            return []
        
        table = tables[0]  # Use first table
        rows = table.find_all('tr')
        current_category = None
        i = 0
        
        while i < len(rows):
            row = rows[i]
            
            # Check if it's a category row
            if 'categoryTr' in row.get('class', []):
                category_th = row.find('th')
                if category_th:
                    category_text = category_th.get_text(strip=True)
                    category_match = re.search(r'Category:\s*(.+)', category_text)
                    if category_match:
                        current_category = category_match.group(1).strip()
                        # Map to domain
                        current_category = determine_domain(current_category)
            
            # Check if it's a question row (first th contains a number)
            ths = row.find_all('th')
            if ths and ths[0].get_text(strip=True).isdigit():
                question_num = int(ths[0].get_text(strip=True))
                question_th = ths[1] if len(ths) > 1 else None
                
                if question_th:
                    # Extract question text (remove the "(view)" link)
                    question_text = question_th.get_text(strip=True)
                    question_text = re.sub(r'\(view\)\s*$', '', question_text, flags=re.IGNORECASE).strip()
                    
                    # Look for the next row which contains options and explanation
                    options = []
                    correct_answers = []
                    explanation = ""
                    
                    if i + 1 < len(rows):
                        detail_row = rows[i + 1]
                        # Check if it's a hidden detail row
                        if detail_row.get('style', '').find('display: none') != -1 or 'display:none' in detail_row.get('style', '').lower():
                            detail_th = detail_row.find('th')
                            if detail_th:
                                # Find options list
                                options_list = detail_th.find('ul', class_=re.compile(r'wpProQuiz.*questionList', re.I))
                                if options_list:
                                    for idx, li in enumerate(options_list.find_all('li')):
                                        label = li.find('label')
                                        if label:
                                            option_text = label.get_text(strip=True)
                                            if option_text:
                                                # Check if this is the correct answer
                                                is_correct = 'wpProQuiz_answerCorrect' in li.get('class', []) or \
                                                            'answerCorrect' in li.get('class', [])
                                                options.append({
                                                    'id': idx,
                                                    'text': option_text,
                                                    'correct': is_correct
                                                })
                                                if is_correct:
                                                    correct_answers.append(idx)
                                
                                # Find explanation - keep HTML structure for better parsing
                                explanation_div = detail_th.find('div', class_=re.compile(r'wpProQuiz.*response', re.I))
                                if explanation_div:
                                    # Keep HTML for parsing, but get text version too
                                    explanation_html = str(explanation_div)
                                    explanation = explanation_div.get_text(separator='\n', strip=True)
                                    # Remove references section
                                    explanation = re.sub(r'References?:.*', '', explanation, flags=re.DOTALL | re.IGNORECASE)
                                    explanation = re.sub(r'Check out.*', '', explanation, flags=re.DOTALL | re.IGNORECASE)
                                    # Clean up excessive newlines
                                    explanation = re.sub(r'\n{3,}', '\n\n', explanation)
                                    explanation = explanation.strip()
                                    # Store HTML for better parsing in format function
                                    explanation = (explanation, explanation_html)
                    
                    if question_text and options:
                        domain = current_category if current_category else "Design High-Performing Architectures"
                        
                        # Format explanation to match our format
                        if explanation:
                            # explanation is a tuple (text, html) if from HTML, or just text
                            if isinstance(explanation, tuple):
                                explanation_text, explanation_html = explanation
                            else:
                                explanation_text = explanation
                                explanation_html = None
                            
                            formatted_explanation = format_dojo_explanation(explanation_text, explanation_html, correct_answers, options)
                        else:
                            formatted_explanation = f"The correct answer{'s are' if len(correct_answers) > 1 else ' is'} the option{'s' if len(correct_answers) > 1 else ''} marked as correct."
                        
                        questions.append({
                            'id': question_num,
                            'text': question_text,
                            'options': options,
                            'correctAnswers': correct_answers,
                            'explanation': formatted_explanation,
                            'domain': domain
                        })
            
            i += 1
        
        return questions
    except Exception as e:
        print(f"Error extracting Dojo exam: {e}")
        import traceback
        traceback.print_exc()
        return []

def format_dojo_explanation(explanation, explanation_html, correct_answers, options):
    """Format Dojo explanation to match our format"""
    # Dojo explanations have structure:
    # - Background info
    # - "Hence, the correct answer is: [answer]"
    # - "The option that says: [option] is incorrect because [reason]"
    
    lines = explanation.split('\n')
    formatted_parts = []
    
    # Find correct answer explanation (everything before "The option that says:")
    correct_explanation_parts = []
    incorrect_sections = []
    
    # Find where incorrect options start
    incorrect_start_idx = None
    for i, line in enumerate(lines):
        if 'The option that says:' in line:
            incorrect_start_idx = i
            break
    
    # Extract correct explanation (everything before incorrect options)
    if incorrect_start_idx is not None:
        correct_explanation_parts = [l.strip() for l in lines[:incorrect_start_idx] if l.strip() and not l.strip().startswith('References')]
    else:
        # No incorrect sections found, use all explanation
        correct_explanation_parts = [l.strip() for l in lines if l.strip() and not l.strip().startswith('References')]
    
    correct_explanation = ' '.join(correct_explanation_parts)
    
    # Extract incorrect option explanations using HTML if available
    incorrect_explanations = {}
    if explanation_html:
        # Parse HTML to extract incorrect options with their explanations
        # Pattern: "The option that says: <strong><span>option text</span></strong> is incorrect because reason"
        # Each incorrect option is in a <p> tag
        # Try to find all <p> tags containing "The option that says:"
        soup_explanation = BeautifulSoup(explanation_html, 'html.parser')
        incorrect_paragraphs = soup_explanation.find_all('p', string=re.compile(r'The option that says:', re.I))
        
        # Also try finding by text content
        all_paragraphs = soup_explanation.find_all('p')
        matches = []
        
        for p in all_paragraphs:
            p_text = p.get_text()
            if 'The option that says:' in p_text and 'is incorrect because' in p_text:
                # Extract option text (between "says:" and "is incorrect")
                option_match = re.search(r'The option that says:.*?([^:]+?)\s+is incorrect because\s*(.+)', p_text, re.DOTALL | re.IGNORECASE)
                if option_match:
                    option_text = option_match.group(1).strip()
                    reason = option_match.group(2).strip()
                    # Clean HTML tags from option_text if present in original HTML
                    option_text_html = str(p)
                    span_match = re.search(r'<span[^>]*>([^<]+)</span>', option_text_html, re.IGNORECASE)
                    if span_match:
                        option_text = span_match.group(1).strip()
                    matches.append((option_text, reason))
        
        for option_text_html, reason_html in matches:
            # Clean HTML from option text
            option_text = re.sub(r'<[^>]+>', '', option_text_html).strip()
            reason = re.sub(r'<[^>]+>', '', reason_html).strip()
            
            # Match to option index
            matched_option_idx = None
            for opt_idx, opt in enumerate(options):
                opt_text = opt['text'].strip()
                # Try various matching strategies
                if option_text.lower() in opt_text.lower() or opt_text.lower() in option_text.lower():
                    matched_option_idx = opt_idx
                    break
                # Try matching first few significant words
                opt_words = [w.lower() for w in opt_text.split() if len(w) > 3][:3]
                option_words = [w.lower() for w in option_text.split() if len(w) > 3][:3]
                if opt_words and option_words and any(w in option_words for w in opt_words):
                    matched_option_idx = opt_idx
                    break
            
            if matched_option_idx is not None and reason:
                incorrect_explanations[matched_option_idx] = reason
    elif incorrect_start_idx is not None:
        # Fallback: parse from text lines
        i = incorrect_start_idx
        while i < len(lines):
            line = lines[i]
            if 'The option that says:' in line:
                # Extract option text and reason from text
                # This is less reliable but better than nothing
                option_match = re.search(r'The option that says:.*?([^:]+?)\s+is incorrect because\s*(.+)', line, re.IGNORECASE)
                if option_match:
                    option_text = option_match.group(1).strip()
                    reason = option_match.group(2).strip()
                    
                    # Match to option
                    for opt_idx, opt in enumerate(options):
                        if option_text.lower() in opt['text'].lower()[:50] or opt['text'].lower()[:50] in option_text.lower():
                            incorrect_explanations[opt_idx] = reason
                            break
            i += 1
    
    # Build formatted explanation
    formatted = ""
    
    # Add correct answer explanation (medium-to-large)
    if correct_explanation:
        for correct_idx in correct_answers:
            formatted += f"**Why option {correct_idx} is correct:**\n{correct_explanation}\n\n"
    else:
        # Fallback
        for correct_idx in correct_answers:
            formatted += f"**Why option {correct_idx} is correct:**\n{explanation}\n\n"
    
    # Add incorrect answer explanations (small-to-medium)
    for opt_idx, opt in enumerate(options):
        if opt_idx not in correct_answers:
            if opt_idx in incorrect_explanations:
                formatted += f"**Why option {opt_idx} is incorrect:**\n{incorrect_explanations[opt_idx]}\n\n"
            else:
                formatted += f"**Why option {opt_idx} is incorrect:**\nThis option is incorrect because it does not meet the specific requirements outlined in the scenario.\n\n"
    
    return formatted.strip()

def main():
    """Main function"""
    script_dir = os.path.dirname(__file__)
    project_root = os.path.dirname(script_dir) if os.path.basename(script_dir) == 'scripts' else script_dir
    
    dojo_file = os.path.join(project_root, 'dojo tests', 'exam1.html')
    
    if not os.path.exists(dojo_file):
        print(f"Error: Dojo exam file not found: {dojo_file}")
        sys.exit(1)
    
    print(f"Extracting questions from {dojo_file}...")
    questions = extract_dojo_exam(dojo_file)
    
    if not questions:
        print("Error: No questions extracted")
        sys.exit(1)
    
    print(f"✓ Extracted {len(questions)} questions")
    
    # Save as test8.json
    questions_dir = os.path.join(project_root, 'questions')
    os.makedirs(questions_dir, exist_ok=True)
    
    output_file = os.path.join(questions_dir, 'test8.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Saved to {output_file}")
    
    # Regenerate questions.js
    print("\nRegenerating questions.js...")
    import subprocess
    result = subprocess.run(['python3', os.path.join(script_dir, 'regenerate_questions_js.py')], 
                          capture_output=True, text=True)
    if result.returncode == 0:
        print("✓ questions.js regenerated")
    else:
        print(f"⚠ Warning: Could not regenerate questions.js: {result.stderr}")

if __name__ == '__main__':
    main()
