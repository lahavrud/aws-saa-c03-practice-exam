# PDF Question Extraction

## Overview
The `extract_questions_from_pdf.py` script automatically extracts questions from PDF files in the `questions/` directory and generates the `questions.js` file.

## Requirements
- Python 3.6+
- PDF library (one of):
  - PyPDF2
  - pdfplumber
  - PyMuPDF (pymupdf)

## Installation

### Option 1: Using Virtual Environment (Recommended)
```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install PDF library
pip install PyPDF2
# OR
pip install pdfplumber
# OR
pip install pymupdf
```

### Option 2: System-wide Installation
```bash
# Ubuntu/Debian
sudo apt install python3-pypdf2

# Or use pip with --user flag
pip install --user PyPDF2
```

## Usage

1. Place your PDF files in the `questions/` directory:
   - `Exam_Questions.pdf` (for Test 1)
   - `Exam2_Questions.pdf` (for Test 2)

2. Run the extraction script:
```bash
# Using virtual environment
source venv/bin/activate
python3 extract_questions_from_pdf.py

# Or directly (if library is installed system-wide)
python3 extract_questions_from_pdf.py
```

3. The script will:
   - Extract text from both PDF files
   - Parse questions and answers
   - Determine domains automatically
   - Generate `questions.js` with all questions

## Output

The script generates `questions.js` with:
- All questions from Test 1 (65 questions)
- All questions from Test 2 (65 questions)
- Proper formatting for the web application
- Domain categorization
- Correct answer markers

## Troubleshooting

### No PDF library found
Install one of the required libraries:
```bash
pip install PyPDF2
```

### Questions not extracted properly
- Check that PDF files are in the correct format
- Verify questions follow the pattern: `Q1:`, `Q2:`, etc.
- Ensure correct answers are marked with `[CORRECT]`

### Encoding issues
The script uses UTF-8 encoding. If you encounter encoding errors, ensure your PDFs contain standard text (not scanned images).

## Re-extracting Questions

If you update the PDF files, simply run the script again:
```bash
python3 extract_questions_from_pdf.py
```

This will overwrite the existing `questions.js` file with fresh data.
