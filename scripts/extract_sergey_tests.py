#!/usr/bin/env python3
"""
Extract questions from Sergey tests PDF and generate JSON files
"""

import re
import json
import os
import sys
from bs4 import BeautifulSoup

# Prefer pymupdf as it handles encrypted PDFs better
try:
    import fitz  # PyMuPDF
    PDF_LIB = "pymupdf"
except ImportError:
    try:
        import pdfplumber
        PDF_LIB = "pdfplumber"
    except ImportError:
        try:
            import PyPDF2
            PDF_LIB = "PyPDF2"
        except ImportError:
            PDF_LIB = None


def extract_text_from_pdf(pdf_path):
    """Extract text from PDF using available library"""
    if PDF_LIB == "pymupdf":
        text = ""
        doc = fitz.open(pdf_path)
        # Try to decrypt if encrypted (common passwords)
        if doc.is_encrypted:
            # Try common passwords or empty password
            passwords = ["", "pass", "password", "1234"]
            decrypted = False
            for pwd in passwords:
                if doc.authenticate(pwd):
                    decrypted = True
                    break
            if not decrypted:
                print("Warning: PDF is encrypted. Trying to extract text anyway...")
        for page in doc:
            text += page.get_text() + "\n"
        doc.close()
        return text
    elif PDF_LIB == "pdfplumber":
        text = ""
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                text += page.extract_text() + "\n"
        return text
    elif PDF_LIB == "PyPDF2":
        text = ""
        with open(pdf_path, "rb") as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
        return text
    else:
        raise ImportError("No PDF library found. Please install one: pip install PyPDF2 pdfplumber pymupdf")


def determine_domain(text):
    """Determine SAA-C03 domain based on question content"""
    text_lower = text.lower()
    
    security_keywords = [
        "security", "encrypt", "iam", "access", "permission", "guardduty",
        "inspector", "macie", "waf", "shield", "kms", "ssl", "tls", "mfa",
        "vpc endpoint", "private", "authentication", "authorization",
        "cognito", "certificate", "compliance", "audit", "secrets manager"
    ]
    
    cost_keywords = [
        "cost", "price", "cheap", "expensive", "billing", "budget",
        "reserved", "spot", "savings", "optimize", "lifecycle", "s3 standard-ia",
        "s3 glacier", "s3 one zone", "cost-effective"
    ]
    
    performance_keywords = [
        "performance", "latency", "throughput", "speed", "fast", "slow",
        "cache", "cdn", "cloudfront", "accelerate", "optimize performance",
        "read replica", "elasticache", "rds", "aurora"
    ]
    
    resilient_keywords = [
        "availability", "durability", "disaster", "recovery", "backup",
        "multi-az", "failover", "redundancy", "high availability",
        "resilient", "replicate", "snapshot", "restore"
    ]
    
    security_count = sum(1 for kw in security_keywords if kw in text_lower)
    cost_count = sum(1 for kw in cost_keywords if kw in text_lower)
    performance_count = sum(1 for kw in performance_keywords if kw in text_lower)
    resilient_count = sum(1 for kw in resilient_keywords if kw in text_lower)
    
    counts = {
        "Design Secure Architectures": security_count,
        "Design Cost-Optimized Architectures": cost_count,
        "Design High-Performing Architectures": performance_count,
        "Design Resilient Architectures": resilient_count
    }
    
    max_domain = max(counts.items(), key=lambda x: x[1])
    return max_domain[0] if max_domain[1] > 0 else "Design Resilient Architectures"


def parse_questions_from_text(text):
    """Parse questions from extracted PDF text"""
    questions = []
    
    # Split text into question blocks
    # Questions are separated by "QUESTION X" pattern
    question_blocks = re.split(r'QUESTION\s+(\d+)', text, flags=re.IGNORECASE)
    
    # The first element is usually header text, skip it
    # Then we have pairs of (question_num, question_content)
    for i in range(1, len(question_blocks), 2):
        if i + 1 >= len(question_blocks):
            break
        
        question_num = question_blocks[i]
        question_content = question_blocks[i + 1]
        
        # Extract question text (everything before options)
        # Options start with "A.", "B.", "C.", "D."
        option_match = re.search(r'^([\s\S]*?)(?=^[A-E]\.)', question_content, re.MULTILINE)
        if not option_match:
            # Try alternative pattern
            option_match = re.search(r'^([\s\S]*?)(?=^[A-E]\)\s)', question_content, re.MULTILINE)
        
        if option_match:
            question_text = option_match.group(1).strip()
            # Remove common prefixes
            question_text = re.sub(r'^(What|Which|How|Why|When|Where)\s+', '', question_text, flags=re.IGNORECASE)
            question_text = re.sub(r'^A\s+company\s+', 'A company ', question_text, flags=re.IGNORECASE)
        else:
            # Fallback: take first few lines
            lines = question_content.split('\n')[:5]
            question_text = ' '.join([l.strip() for l in lines if l.strip()])
        
        # Extract options (A., B., C., D.)
        options = []
        option_pattern = r'^([A-E])[\.\)]\s+(.+?)(?=^[A-E][\.\)]|^Answer:|$)'
        option_matches = re.finditer(option_pattern, question_content, re.MULTILINE | re.DOTALL)
        
        for match in option_matches:
            option_letter = match.group(1).upper()
            option_text = match.group(2).strip()
            # Clean up option text (remove extra whitespace, newlines)
            option_text = re.sub(r'\s+', ' ', option_text)
            option_id = ord(option_letter) - ord('A')
            options.append({
                "id": option_id,
                "text": option_text,
                "correct": False  # Will be set based on Answer
            })
        
        # Extract correct answer (Answer: X)
        correct_answer = None
        answer_match = re.search(r'Answer:\s*([A-E])', question_content, re.IGNORECASE)
        if answer_match:
            correct_letter = answer_match.group(1).upper()
            correct_answer = ord(correct_letter) - ord('A')
            # Mark the correct option
            if correct_answer < len(options):
                options[correct_answer]["correct"] = True
        
        # Extract explanation (starts with "Explanation:")
        explanation = ""
        explanation_match = re.search(r'Explanation:\s*(.+?)(?=QUESTION|\Z)', question_content, re.DOTALL | re.IGNORECASE)
        if explanation_match:
            explanation = explanation_match.group(1).strip()
            # Clean up explanation
            explanation = re.sub(r'\s+', ' ', explanation)
            # Remove URLs (they're in the explanation but we'll keep them)
        
        # Only add question if we have question text and at least 2 options
        if question_text and len(options) >= 2:
            domain = determine_domain(question_text)
            
            # Format explanation properly
            if not explanation:
                explanation = "Explanation not available."
            else:
                # Format explanation with correct answer info
                if correct_answer is not None and correct_answer < len(options):
                    correct_option_text = options[correct_answer]["text"]
                    explanation = f"**Why option {correct_answer} is correct:**\n{explanation}\n\n**Why other options are incorrect:**\nThe other options do not meet the requirements specified in the scenario."
            
            questions.append({
                "id": len(questions),
                "text": question_text,
                "options": options,
                "correctAnswers": [correct_answer] if correct_answer is not None else [],
                "explanation": explanation,
                "domain": domain
            })
    
    return questions


def main():
    """Main function to extract questions from Sergey PDF"""
    script_dir = os.path.dirname(__file__)
    project_root = os.path.dirname(script_dir) if os.path.basename(script_dir) == "scripts" else script_dir
    
    sergey_pdf = os.path.join(project_root, "sergey tests", "extracted", "SAA-C03", "SAA-C03.pdf")
    
    if not os.path.exists(sergey_pdf):
        print(f"Error: PDF file not found at {sergey_pdf}")
        sys.exit(1)
    
    if PDF_LIB is None:
        print("Error: No PDF library found!")
        print("Please install one: pip install PyPDF2 pdfplumber pymupdf")
        sys.exit(1)
    
    print(f"Extracting questions from {sergey_pdf}...")
    print(f"Using PDF library: {PDF_LIB}")
    
    try:
        # Extract text from PDF
        text = extract_text_from_pdf(sergey_pdf)
        
        # Save raw text for debugging
        debug_file = os.path.join(project_root, "sergey tests", "extracted", "raw_text.txt")
        with open(debug_file, "w", encoding="utf-8") as f:
            f.write(text)
        print(f"Saved raw text to {debug_file}")
        
        # Parse questions
        questions = parse_questions_from_text(text)
        
        if not questions:
            print("Warning: No questions extracted. Check the raw_text.txt file to see the PDF content.")
            print("You may need to adjust the parsing logic based on the actual PDF format.")
            return
        
        print(f"✓ Extracted {len(questions)} questions")
        
        # Determine how many tests to create (assuming 65 questions per test like others)
        questions_per_test = 65
        num_tests = (len(questions) + questions_per_test - 1) // questions_per_test
        
        # Find the next available test number (after stephane and dojo tests)
        # Stephane: test1-test7, Dojo: test8, so Sergey starts at test9
        start_test_num = 9
        
        # Create output directory
        output_dir = os.path.join(project_root, "questions")
        os.makedirs(output_dir, exist_ok=True)
        
        # Split questions into tests and save
        for test_idx in range(num_tests):
            test_num = start_test_num + test_idx
            start_idx = test_idx * questions_per_test
            end_idx = min(start_idx + questions_per_test, len(questions))
            test_questions = questions[start_idx:end_idx]
            
            # Reset IDs to start from 0 for each test
            for i, q in enumerate(test_questions):
                q["id"] = i
            
            # Save to JSON
            output_file = os.path.join(output_dir, f"test{test_num}.json")
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(test_questions, f, indent=2, ensure_ascii=False)
            
            print(f"✓ Saved {len(test_questions)} questions to {output_file}")
        
        print(f"\n✓ Successfully extracted {len(questions)} questions into {num_tests} test(s)")
        print(f"Tests created: test{start_test_num} through test{start_test_num + num_tests - 1}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
