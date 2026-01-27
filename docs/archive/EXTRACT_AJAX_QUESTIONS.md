# Extracting Questions from AJAX-Loaded HTML

The HTML file you have is a course listing page. Questions are loaded dynamically via `admin-ajax.php`.

## Method 1: Save Actual Quiz Pages

1. Open the HTML file in a browser
2. Click on a quiz/test link
3. Wait for the quiz to load
4. Save that page (File → Save As → Web Page, Complete)
5. The saved quiz page should contain the questions

## Method 2: Capture AJAX Responses

1. Open the HTML file in a browser
2. Open DevTools (F12) → Network tab
3. Filter by "XHR" or "Fetch"
4. Click on a quiz to start it
5. Look for requests to `admin-ajax.php`
6. Find the response that contains question data (usually JSON)
7. Right-click → Save response
8. Save as `quiz_questions.json`

## Method 3: Use Browser Extension

Some browser extensions can capture and save AJAX responses automatically.

## Current Status

The extraction script is ready to process:
- ✅ PDF files with Q1:, Q2: format
- ✅ HTML files with embedded questions
- ⚠️ AJAX-loaded content (needs actual quiz pages or JSON responses)

Once you have quiz pages or JSON files, place them in the `questions/` directory and run:
```bash
python3 extract_questions_from_pdf.py
```
