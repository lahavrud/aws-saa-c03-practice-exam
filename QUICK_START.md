# Quick Start Guide

## For Users

1. **Open the website**
   - Simply open `index.html` in your web browser
   - No installation needed!

2. **Start practicing**
   - Choose "By Domain" or "By Test"
   - Select your preferred test source
   - Choose Review or Test mode
   - Begin answering questions

## For Developers

### Setup
```bash
# Install Python dependencies (optional, for question extraction)
pip install PyPDF2 beautifulsoup4
```

### Extract Questions from PDFs
```bash
python3 scripts/extract_questions_from_pdf.py
```

### Regenerate questions.js (after editing JSON)
```bash
python3 scripts/regenerate_questions_js.py
```

### File Structure
- `index.html` - Main HTML file
- `app.js` - Application logic
- `styles.css` - Styling
- `questions.js` - Question bank (auto-generated)
- `questions/testX.json` - Individual test files

### Key Commands
- Extract questions: `python3 scripts/extract_questions_from_pdf.py`
- Regenerate JS: `python3 scripts/regenerate_questions_js.py`

See [README.md](README.md) and [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for more details.
