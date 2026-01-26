# AWS SAA-C03 Practice Exam Website

A web-based practice exam application for AWS Solutions Architect Associate (SAA-C03) certification.

## Features

- **Two Test Modes:**
  - **Review Mode**: Get immediate feedback after each answer with explanations
  - **Test Mode**: Timed exam simulation (130 minutes, just like the real exam)

- **Comprehensive Scoring:**
  - Overall score percentage
  - Score breakdown by SAA-C03 domain:
    - Design Secure Architectures
    - Design Resilient Architectures
    - Design High-Performing Architectures
    - Design Cost-Optimized Architectures

- **Question Review:**
  - Review all answers after completing the test
  - See correct answers and explanations
  - Identify areas for improvement

## Files

- `index.html` - Main HTML structure
- `styles.css` - Styling and layout
- `app.js` - Application logic and functionality
- `questions.js` - Question bank (Test 1 and Test 2, 65 questions each)

## Setup

1. Ensure all files are in the same directory
2. Open `index.html` in a web browser
3. Select a test (Test 1 or Test 2)
4. Choose your mode (Review or Test)
5. Start practicing!

## Adding Questions

The `questions.js` file contains the question structure. Each question has:
- `id`: Question number
- `text`: Question text
- `options`: Array of answer options with `id`, `text`, and `correct` flag
- `correctAnswers`: Array of correct option IDs
- `explanation`: Explanation of the correct answer
- `domain`: SAA-C03 domain category

## Notes

- Test mode includes a 130-minute timer (matching the real exam)
- Questions support both single and multiple correct answers
- Progress is tracked throughout the exam
- Results are displayed with domain-based scoring

## Browser Compatibility

Works in all modern browsers (Chrome, Firefox, Safari, Edge).
