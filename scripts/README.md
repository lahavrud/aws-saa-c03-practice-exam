# Scripts Directory

This directory contains utility scripts for managing questions and generating the question bank.

## Essential Scripts

### `extract_questions_from_pdf.py`
**Purpose**: Extract questions from PDF or HTML files and generate JSON question files.

**Usage**:
```bash
python3 scripts/extract_questions_from_pdf.py
```

**What it does**:
- Scans `stephane tests/exams_pdf_files/` and `questions/` directories
- Extracts questions, options, and correct answers
- Generates `questions/testX.json` files
- Creates `questions/all_tests.json` with all questions combined

**Dependencies**:
- PyPDF2 or pdfplumber or PyMuPDF (for PDF extraction)
- beautifulsoup4 (for HTML parsing)

**Installation**:
```bash
pip install PyPDF2 beautifulsoup4
```

### `regenerate_questions_js.py`
**Purpose**: Regenerate `questions.js` from JSON files in the `questions/` directory.

**Usage**:
```bash
python3 scripts/regenerate_questions_js.py
```

**What it does**:
- Reads all `testX.json` files from `questions/` directory
- Combines them into a single `questions.js` file
- Maintains the correct JavaScript format for the frontend

**Dependencies**: None (uses standard library only)

**When to use**:
- After modifying JSON files directly
- After extracting new questions
- After updating question explanations

## Archived Scripts

Old/experimental scripts have been moved to `scripts/archive/` for reference. These include:
- Various explanation restructuring scripts
- Question fixing utilities
- Manual elaboration scripts

These are kept for historical reference but are not needed for normal operation.

## Workflow

1. **Extract new questions**:
   ```bash
   python3 scripts/extract_questions_from_pdf.py
   ```

2. **Review and edit JSON files**:
   - Edit `questions/testX.json` files
   - Add/update explanations
   - Verify correct answers

3. **Regenerate questions.js**:
   ```bash
   python3 scripts/regenerate_questions_js.py
   ```

4. **Test in browser**:
   - Open `index.html`
   - Verify questions load correctly
   - Check explanations display properly
