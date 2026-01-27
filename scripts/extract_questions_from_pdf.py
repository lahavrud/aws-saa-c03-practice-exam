#!/usr/bin/env python3
"""
Extract questions from PDF files in the questions directory
and generate questions.js file
"""
import re
import json
import os
import sys

# Try to import PDF libraries
try:
    import PyPDF2
    PDF_LIB = 'PyPDF2'
except ImportError:
    try:
        import pdfplumber
        PDF_LIB = 'pdfplumber'
    except ImportError:
        try:
            import fitz  # PyMuPDF
            PDF_LIB = 'pymupdf'
        except ImportError:
            PDF_LIB = None

def extract_text_pypdf2(pdf_path):
    """Extract text using PyPDF2"""
    text = ""
    with open(pdf_path, 'rb') as file:
        pdf_reader = PyPDF2.PdfReader(file)
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
    return text

def extract_text_pdfplumber(pdf_path):
    """Extract text using pdfplumber"""
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text += page.extract_text() + "\n"
    return text

def extract_text_pymupdf(pdf_path):
    """Extract text using PyMuPDF"""
    text = ""
    doc = fitz.open(pdf_path)
    for page in doc:
        text += page.get_text() + "\n"
    doc.close()
    return text

def extract_text_from_pdf(pdf_path):
    """Extract text from PDF using available library"""
    if PDF_LIB == 'PyPDF2':
        return extract_text_pypdf2(pdf_path)
    elif PDF_LIB == 'pdfplumber':
        return extract_text_pdfplumber(pdf_path)
    elif PDF_LIB == 'pymupdf':
        return extract_text_pymupdf(pdf_path)
    else:
        raise ImportError("No PDF library found. Please install one: pip install PyPDF2 pdfplumber pymupdf")

def determine_domain(text):
    """Determine SAA-C03 domain based on question content"""
    text_lower = text.lower()
    
    security_keywords = ['security', 'encrypt', 'iam', 'access', 'permission', 'guardduty', 
                        'inspector', 'macie', 'waf', 'shield', 'kms', 'ssl', 'tls', 'mfa', 
                        'vpc endpoint', 'private', 'authentication', 'authorization', 'cognito',
                        'certificate', 'compliance', 'audit']
    
    resilient_keywords = ['availability', 'multi-az', 'replica', 'backup', 'disaster', 
                         'recovery', 'failover', 'resilient', 'durable', 'snapshot', 
                         'rds', 'aurora', 'read replica', 'multi-az', 'standby']
    
    performance_keywords = ['performance', 'latency', 'throughput', 'scaling', 'auto scaling', 
                           'load balancer', 'cloudfront', 'accelerator', 'caching', 'elastica', 
                           'dax', 'kinesis', 'streaming', 'real-time', 'global']
    
    cost_keywords = ['cost', 'optimize', 'reserved', 'spot', 'lifecycle', 's3-ia', 'glacier', 
                    'savings', 'expensive', 'reduce cost', 'cost-effective', 'cheap', 'pricing']
    
    if any(kw in text_lower for kw in security_keywords):
        return "Design Secure Architectures"
    elif any(kw in text_lower for kw in resilient_keywords):
        return "Design Resilient Architectures"
    elif any(kw in text_lower for kw in performance_keywords):
        return "Design High-Performing Architectures"
    elif any(kw in text_lower for kw in cost_keywords):
        return "Design Cost-Optimized Architectures"
    else:
        return "Design High-Performing Architectures"  # Default

def parse_questions_from_text(text):
    """Parse questions from extracted text"""
    questions = []
    lines = text.split('\n')
    
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        
        # Match question start: Q1:, Q2:, etc.
        q_match = re.match(r'Q(\d+):\s*(.+)', line, re.IGNORECASE)
        if q_match:
            q_num = int(q_match.group(1))
            q_text = q_match.group(2)
            
            # Continue reading question text (may span multiple lines)
            i += 1
            while i < len(lines):
                next_line = lines[i].strip()
                # Stop if we hit an option marker or next question
                if next_line.startswith('[') or re.match(r'Q\d+:', next_line, re.IGNORECASE):
                    break
                # Skip empty lines but continue reading
                if next_line:
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
                if re.match(r'Q\d+:', line, re.IGNORECASE):
                    break
                
                if line.startswith('['):
                    is_correct = '[CORRECT]' in line.upper() or '[CORRECT]' in line
                    option_text = re.sub(r'^\[.*?\]\s*', '', line, flags=re.IGNORECASE).strip()
                    
                    # Continue reading option text
                    i += 1
                    while i < len(lines):
                        next_line = lines[i].strip()
                        if not next_line or next_line.startswith('[') or re.match(r'Q\d+:', next_line, re.IGNORECASE):
                            break
                        option_text += ' ' + next_line
                        i += 1
                    
                    if option_text:  # Only add if we have text
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
            
            if options and q_text.strip():
                domain = determine_domain(q_text)
                explanation = f"The correct answer{'s are' if len(correct_answers) > 1 else ' is'} the option{'s' if len(correct_answers) > 1 else ''} marked as correct. This solution best addresses the requirements described in the scenario."
                
                question = {
                    'id': q_num,
                    'text': q_text.strip(),
                    'options': options,
                    'correctAnswers': correct_answers,
                    'explanation': explanation,
                    'domain': domain
                }
                
                questions.append(question)
        else:
            i += 1
    
    return questions

def extract_questions_from_json(json_path):
    """Extract questions from JSON file (AJAX response)"""
    try:
        with open(json_path, 'r', encoding='utf-8') as file:
            data = json.load(file)
            
        questions = []
        
        # Handle different JSON structures
        # Structure 1: Direct questions array
        if isinstance(data, list):
            for item in data:
                if 'question' in item or 'text' in item:
                    questions.append(item)
        
        # Structure 2: Nested structure
        elif isinstance(data, dict):
            # Look for questions in various possible keys
            for key in ['questions', 'data', 'quiz', 'items', 'results']:
                if key in data and isinstance(data[key], list):
                    questions.extend(data[key])
                    break
            
            # If no list found, check if the dict itself is a question
            if 'question' in data or 'text' in data:
                questions.append(data)
        
        # Convert to our format
        parsed_questions = []
        for i, q in enumerate(questions, 1):
            question_text = q.get('question', q.get('text', q.get('title', '')))
            if not question_text:
                continue
            
            options = q.get('answers', q.get('options', q.get('choices', [])))
            correct_answers = []
            option_list = []
            
            for idx, opt in enumerate(options):
                opt_text = opt.get('text', opt.get('answer', opt.get('label', str(opt))))
                is_correct = opt.get('correct', opt.get('isCorrect', False))
                
                option_list.append({
                    'id': idx,
                    'text': opt_text,
                    'correct': is_correct
                })
                
                if is_correct:
                    correct_answers.append(idx)
            
            if option_list:
                parsed_questions.append({
                    'id': i,
                    'text': question_text,
                    'options': option_list,
                    'correctAnswers': correct_answers,
                    'explanation': q.get('explanation', q.get('solution', '')),
                    'domain': determine_domain(question_text)
                })
        
        return parsed_questions
    except Exception as e:
        print(f"Error parsing JSON: {e}")
        return []

def extract_questions_from_wpProQuiz(html_path):
    """Extract questions from wpProQuiz format HTML"""
    try:
        from bs4 import BeautifulSoup
        
        # Read file with multiple encoding attempts
        content = None
        for encoding in ['utf-8', 'latin-1', 'cp1252']:
            try:
                with open(html_path, 'r', encoding=encoding) as file:
                    content = file.read()
                break
            except (UnicodeDecodeError, FileNotFoundError):
                continue
        
        if not content:
            print(f"⚠️  Could not read file: {html_path}")
            return []
        
        # Parse HTML - handle both full documents and fragments
        soup = BeautifulSoup(content, 'html.parser')
        
        questions = []
        
        # Look for wpProQuiz_user_content div - try multiple methods
        wpProQuiz_content = soup.find('div', id='wpProQuiz_user_content')
        if not wpProQuiz_content:
            # Try CSS selector
            wpProQuiz_content = soup.select_one('#wpProQuiz_user_content')
        if not wpProQuiz_content:
            # Try to find any div with wpProQuiz classes
            wpProQuiz_content = soup.find('div', class_=re.compile(r'wpProQuiz', re.I))
        if not wpProQuiz_content:
            # If file is just a fragment starting with the div, try finding the first div
            first_div = soup.find('div')
            if first_div and 'wpProQuiz' in str(first_div.get('id', '')):
                wpProQuiz_content = first_div
        
        if wpProQuiz_content:
            # Method 1: Table format with question rows and hidden detail rows
            tables = wpProQuiz_content.find_all('table', class_=re.compile(r'wp.*table|list.*table', re.I))
            for table in tables:
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
                                # Map category to domain
                                if 'Cost-Optimized' in current_category:
                                    current_category = "Design Cost-Optimized Architectures"
                                elif 'Secure' in current_category:
                                    current_category = "Design Secure Architectures"
                                elif 'Resilient' in current_category:
                                    current_category = "Design Resilient Architectures"
                                elif 'High-Performing' in current_category or 'Performance' in current_category:
                                    current_category = "Design High-Performing Architectures"
                    
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
                                        
                                        # Find explanation
                                        explanation_div = detail_th.find('div', class_=re.compile(r'wpProQuiz.*response', re.I))
                                        if explanation_div:
                                            # Get text, but clean up HTML
                                            explanation = explanation_div.get_text(separator='\n', strip=True)
                                            # Remove excessive newlines
                                            explanation = re.sub(r'\n{3,}', '\n\n', explanation)
                            
                            if question_text and options:
                                domain = current_category if current_category else determine_domain(question_text)
                                questions.append({
                                    'id': question_num,
                                    'text': question_text,
                                    'options': options,
                                    'correctAnswers': correct_answers,
                                    'explanation': explanation if explanation else f"The correct answer{'s are' if len(correct_answers) > 1 else ' is'} the option{'s' if len(correct_answers) > 1 else ''} marked as correct.",
                                    'domain': domain
                                })
                    
                    i += 1
            
            # Method 2: Look for non-table format (div-based questions) - fallback
            if not questions:
                question_divs = wpProQuiz_content.find_all('div', class_=re.compile(r'question|statistic', re.I))
                for div in question_divs:
                    question_text_elem = div.find(class_=re.compile(r'question.*text|wpProQuiz.*question', re.I))
                    if question_text_elem:
                        question_text = question_text_elem.get_text(strip=True)
                        if question_text and len(question_text) > 20 and '?' in question_text:
                            # Look for answer list
                            answer_list = div.find('ul', class_=re.compile(r'question.*list|answer.*list', re.I))
                            if answer_list:
                                options = []
                                correct_answers = []
                                for idx, li in enumerate(answer_list.find_all('li')):
                                    option_text = li.get_text(strip=True)
                                    if option_text:
                                        is_correct = 'correct' in li.get('class', []) or \
                                                    'answerCorrect' in li.get('class', [])
                                        options.append({
                                            'id': idx,
                                            'text': option_text,
                                            'correct': bool(is_correct)
                                        })
                                        if is_correct:
                                            correct_answers.append(idx)
                                
                                if options:
                                    questions.append({
                                        'id': len(questions) + 1,
                                        'text': question_text,
                                        'options': options,
                                        'correctAnswers': correct_answers,
                                        'explanation': '',
                                        'domain': determine_domain(question_text)
                                    })
        
        return questions
    except ImportError:
        # BeautifulSoup not available, try regex-based extraction
        with open(html_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        questions = []
        # This is a fallback - would need more complex regex parsing
        return questions
    except Exception as e:
        print(f"Error extracting wpProQuiz questions: {e}")
        import traceback
        traceback.print_exc()
        return []

def extract_text_from_html(html_path):
    """Extract text from HTML file - handles various formats"""
    try:
        from bs4 import BeautifulSoup
        with open(html_path, 'r', encoding='utf-8') as file:
            soup = BeautifulSoup(file.read(), 'html.parser')
            
            # First, try to extract wpProQuiz questions if present
            wpProQuiz_questions = extract_questions_from_wpProQuiz(html_path)
            if wpProQuiz_questions:
                print(f"✓ Found {len(wpProQuiz_questions)} questions in wpProQuiz format")
                # Convert to text format for parsing
                text = ""
                for q in wpProQuiz_questions:
                    text += f"Q{q['id']}: {q['text']}\n"
                    for opt in q['options']:
                        marker = "[CORRECT]" if opt['correct'] else "[ ]"
                        text += f"{marker} {opt['text']}\n"
                    text += "\n"
                return text
            
            # First, try to find JSON data in script tags that might contain questions
            scripts = soup.find_all('script')
            for script in scripts:
                if script.string:
                    # Look for JSON data with questions
                    import json
                    try:
                        # Try to find JSON objects
                        script_text = script.string
                        # Look for common patterns
                        if 'question' in script_text.lower() or 'quiz' in script_text.lower():
                            # Try to extract JSON
                            json_matches = re.findall(r'\{[^{}]*"question"[^{}]*\}', script_text, re.IGNORECASE | re.DOTALL)
                            if json_matches:
                                # Found potential question data
                                pass
                    except:
                        pass
            
            # Remove script and style elements
            for script in soup(["script", "style"]):
                script.decompose()
            
            # Get text with better formatting
            text = soup.get_text(separator='\n', strip=True)
            
            # If text is too short or doesn't contain question patterns, it might be a listing page
            if len(text) < 5000 or not re.search(r'[A-Z][^.!?]{30,}\?', text):
                print(f"⚠️  Warning: HTML file appears to be a course listing page, not question content.")
                print(f"   Questions may be loaded dynamically. Trying to extract any visible text...")
                print(f"   Tip: If you have a saved quiz page with wpProQuiz_user_content populated, place it in the questions directory.")
            
            return text
    except ImportError:
        # Fallback: simple text extraction with better regex
        with open(html_path, 'r', encoding='utf-8') as file:
            import re
            text = file.read()
            # Remove HTML tags but preserve line breaks
            text = re.sub(r'<br\s*/?>', '\n', text, flags=re.IGNORECASE)
            text = re.sub(r'</p>|</div>|</li>', '\n', text, flags=re.IGNORECASE)
            text = re.sub(r'<[^>]+>', '', text)
            # Clean up multiple newlines
            text = re.sub(r'\n{3,}', '\n\n', text)
            return text
    except Exception as e:
        print(f"Error extracting HTML: {e}")
        return ""

def generate_js_file(all_tests):
    """Generate the questions.js file from all tests"""
    js_content = """// AWS SAA-C03 Exam Questions
// Auto-generated from files in questions directory

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
    
    return js_content

def main():
    """Main function to extract questions from PDFs and HTML files"""
    script_dir = os.path.dirname(__file__)
    project_root = os.path.dirname(script_dir) if os.path.basename(script_dir) == 'scripts' else script_dir
    
    # Check multiple possible question directories
    questions_dirs = [
        os.path.join(project_root, 'questions'),
        os.path.join(project_root, 'stephane tests', 'exams_pdf_files'),
    ]
    
    # Find all existing directories
    existing_dirs = [qdir for qdir in questions_dirs if os.path.exists(qdir)]
    
    if not existing_dirs:
        print(f"Error: Questions directory not found. Checked:")
        for qdir in questions_dirs:
            print(f"  - {qdir}")
        sys.exit(1)
    
    print(f"Found {len(existing_dirs)} question directory(ies):")
    for qdir in existing_dirs:
        print(f"  - {qdir}")
    
    # Check for PDF library
    if PDF_LIB is None:
        print("Error: No PDF library found!")
        print("Please install one of the following:")
        print("  pip install PyPDF2")
        print("  pip install pdfplumber")
        print("  pip install pymupdf")
        sys.exit(1)
    
    print(f"Using PDF library: {PDF_LIB}")
    
    # Find all question files (PDF, HTML, and JSON) from all directories
    all_files = []
    for questions_dir in existing_dirs:
        print(f"\nScanning {questions_dir}...")
        for filename in os.listdir(questions_dir):
            filepath = os.path.join(questions_dir, filename)
            if os.path.isfile(filepath):
                if filename.lower().endswith('.pdf'):
                    all_files.append(('pdf', filepath, filename))
                elif filename.lower().endswith('.html'):
                    all_files.append(('html', filepath, filename))
                elif filename.lower().endswith('.json'):
                    all_files.append(('json', filepath, filename))
    
    # Sort files by name for consistent ordering
    all_files.sort(key=lambda x: x[2])
    
    if not all_files:
        print("Error: No PDF or HTML files found in questions directory")
        sys.exit(1)
    
    all_tests = {}
    test_number = 1
    
    # Extract questions from each file
    for file_type, filepath, filename in all_files:
        test_key = f'test{test_number}'
        print(f"\nExtracting questions from {filename}...")
        
        try:
            if file_type == 'pdf':
                text = extract_text_from_pdf(filepath)
                questions = parse_questions_from_text(text)
            elif file_type == 'json':
                questions = extract_questions_from_json(filepath)
            else:  # HTML
                # First try wpProQuiz extraction
                wpProQuiz_questions = extract_questions_from_wpProQuiz(filepath)
                if wpProQuiz_questions:
                    questions = wpProQuiz_questions
                else:
                    # Fallback to text extraction
                    text = extract_text_from_html(filepath)
                    questions = parse_questions_from_text(text)
            if questions:
                all_tests[test_key] = questions
                print(f"✓ Found {len(questions)} questions in {test_key}")
                test_number += 1
            else:
                print(f"⚠ Warning: No questions extracted from {filename}")
        except Exception as e:
            print(f"❌ Error extracting {filename}: {e}")
    
    # Generate questions.js and JSON text files
    if all_tests:
        # Create questions directory for JSON files (in project root)
        questions_json_dir = os.path.join(project_root, 'questions')
        os.makedirs(questions_json_dir, exist_ok=True)
        
        print("\nGenerating questions.js and JSON text files...")
        js_content = generate_js_file(all_tests)
        
        # Write questions.js (for backward compatibility)
        output_file = os.path.join(project_root, 'questions.js')
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(js_content)
        print(f"✓ Generated {output_file}")
        
        # Write individual JSON files for each test
        for test_key, questions in sorted(all_tests.items(), key=lambda x: int(x[0].replace('test', ''))):
            json_file = os.path.join(questions_json_dir, f'{test_key}.json')
            with open(json_file, 'w', encoding='utf-8') as f:
                json.dump(questions, f, indent=2, ensure_ascii=False)
            print(f"✓ Generated {json_file} ({len(questions)} questions)")
        
        # Write combined JSON file
        combined_json_file = os.path.join(questions_json_dir, 'all_tests.json')
        with open(combined_json_file, 'w', encoding='utf-8') as f:
            json.dump(all_tests, f, indent=2, ensure_ascii=False)
        print(f"✓ Generated {combined_json_file}")
        
        print(f"\n✓ Successfully generated all files")
        for test_key, questions in sorted(all_tests.items(), key=lambda x: int(x[0].replace('test', ''))):
            print(f"  {test_key}: {len(questions)} questions")
    else:
        print("\nError: No questions extracted. Please check the files.")
        sys.exit(1)

if __name__ == '__main__':
    main()
