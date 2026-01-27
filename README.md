# AWS SAA-C03 Practice Exam Platform

A comprehensive web-based practice exam application for AWS Solutions Architect Associate (SAA-C03) certification. Practice with multiple test sources, track your progress, and get detailed explanations for each question.

## 🚀 Features

### Practice Modes
- **By Domain**: Practice all questions from a specific AWS domain across all tests
- **By Test**: Take complete practice exams from multiple sources (Stephane Maarek, AWS Dojo, etc.)

### Test Modes
- **Review Mode**: Get immediate feedback with detailed explanations after each answer
- **Test Mode**: Timed exam simulation (130 minutes, matching the real AWS exam)

### User Features
- **Progress Tracking**: Save and resume tests at any time
- **Personalized Dashboard**: Track questions answered, accuracy, and tests completed
- **Detailed Explanations**: Each question includes:
  - Medium-to-large explanation for correct answers
  - Small-to-medium explanations for each incorrect option
  - Service-specific reasoning and architectural principles
- **Visual Feedback**: Color-coded answers (green for correct, red for incorrect)
- **Question Navigation**: Easy navigation with question number navbar
- **Domain-Based Scoring**: See your performance breakdown by AWS domain

## 📁 Project Structure

```
AWS-SAA-C03/
├── index.html              # Main HTML file
├── app.js                  # Core application logic
├── styles.css             # Styling and UI
├── question-loader.js     # Dynamic question loading
├── questions.js           # Generated question bank (auto-generated)
├── questions/             # Question JSON files
│   ├── test1.json
│   ├── test2.json
│   └── ...
├── scripts/                # Utility scripts
│   ├── extract_questions_from_pdf.py  # Extract questions from PDFs
│   └── regenerate_questions_js.py     # Regenerate questions.js
├── stephane tests/         # Source exam files
│   ├── exams_pdf_files/
│   └── exams_txt_files/
└── docs/                   # Documentation
    ├── DEVELOPMENT.md      # Development guide
    └── ARCHITECTURE.md     # Architecture documentation
```

## 🛠️ Setup

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Python 3.7+ (for question extraction scripts)
- Optional: PDF libraries for extracting questions from PDFs

### Quick Start

1. **Clone or download the repository**
   ```bash
   git clone <repository-url>
   cd AWS-SAA-C03
   ```

2. **Open in browser**
   - Simply open `index.html` in your web browser
   - No server required - works as a static site

3. **Start practicing!**
   - Choose "By Domain" or "By Test"
   - Select your preferred test source
   - Choose Review or Test mode
   - Begin answering questions

### For Developers

1. **Set up Python environment** (optional, for question extraction)
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install PyPDF2 beautifulsoup4
   ```

2. **Extract questions from PDFs**
   ```bash
   python3 scripts/extract_questions_from_pdf.py
   ```

3. **Regenerate questions.js** (after modifying JSON files)
   ```bash
   python3 scripts/regenerate_questions_js.py
   ```

## 📊 Question Format

Questions are stored in JSON format with the following structure:

```json
{
  "id": 1,
  "text": "Question text here...",
  "options": [
    { "id": 0, "text": "Option A", "correct": false },
    { "id": 1, "text": "Option B", "correct": false },
    { "id": 2, "text": "Option C", "correct": true },
    { "id": 3, "text": "Option D", "correct": false }
  ],
  "correctAnswers": [2],
  "explanation": "**Why option 2 is correct:**\nDetailed explanation...\n\n**Why option 0 is incorrect:**\nExplanation...",
  "domain": "Design High-Performing Architectures"
}
```

## 🎯 AWS Domains Covered

1. **Design Secure Architectures** (30%)
2. **Design Resilient Architectures** (26%)
3. **Design High-Performing Architectures** (24%)
4. **Design Cost-Optimized Architectures** (20%)

## 💾 Data Storage

- **User Progress**: Stored in browser localStorage
- **Test Progress**: Saved per test and mode (review/test)
- **User Stats**: Tracks questions answered, accuracy, tests completed
- **No Backend Required**: Everything runs client-side

## 🔧 Customization

### Adding New Questions

1. Add question JSON to `questions/testX.json`
2. Run `python3 scripts/regenerate_questions_js.py`
3. Refresh the browser

### Modifying Explanations

1. Edit the `explanation` field in the JSON file
2. Format: `**Why option X is correct:**\n...\n\n**Why option Y is incorrect:**\n...`
3. Regenerate `questions.js` if needed

### Styling

- Edit `styles.css` to customize colors, fonts, and layout
- Uses an "earthy" color palette by default

## 📝 Browser Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (responsive design)

## 🚀 Deployment

### GitHub Pages

1. Push to GitHub repository
2. Go to Settings → Pages
3. Select source branch (usually `main`)
4. Your site will be available at `https://<username>.github.io/AWS-SAA-C03/`

### Other Static Hosting

- Netlify
- Vercel
- AWS S3 + CloudFront
- Any static file hosting service

## 📚 Documentation

- **[DEVELOPMENT.md](docs/DEVELOPMENT.md)** - Development guide and future steps
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Architecture and code structure

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is for educational purposes. Exam questions are from various sources (Stephane Maarek, AWS Dojo, etc.) and are used for practice purposes.

## 🙏 Acknowledgments

- Question sources: Stephane Maarek, AWS Dojo
- AWS SAA-C03 exam content

## 📞 Support

For issues or questions:
1. Check the [DEVELOPMENT.md](docs/DEVELOPMENT.md) guide
2. Review existing issues
3. Create a new issue with details

---

**Happy studying! 🎓**
