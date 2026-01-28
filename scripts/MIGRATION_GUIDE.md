# Gemini Analysis Migration Guide

## Overview

This guide explains how to migrate Gemini-generated explanations from test2 to other test files, and how to add tags to questions.

## Scripts Created

### 1. `add_tags_to_questions.py`
Adds tags to questions based on Gemini analysis (AWS concepts and best practices).

**Usage:**
```bash
python3 scripts/add_tags_to_questions.py
```

**What it does:**
- Extracts AWS concepts and best practices from Gemini analysis
- Adds them as `tags` array to each question
- Tags are hidden from users but available for future features (filtering, search, etc.)

**Example tags:**
- `amazon-s3`, `amazon-ec2`, `aws-iam`
- `best-practice-encryption-at-rest`
- `best-practice-least-privilege`

### 2. `migrate_gemini_analysis.py`
Migrates explanations from one test file to another by matching questions.

**Usage:**
```bash
# Migrate from test2 to test3
python3 scripts/migrate_gemini_analysis.py questions/test2.json questions/test3.json

# Or specify analysis file
python3 scripts/migrate_gemini_analysis.py questions/test2.json questions/test3.json analysis_output.json
```

**What it does:**
- Matches questions between source and target by comparing question text
- Copies Gemini explanations to matching questions
- Creates backup before modifying target file

**When to use:**
- When you have similar questions across different tests
- To quickly populate explanations for tests with overlapping content

### 3. `merge_gemini_analysis.py`
Merges Gemini analysis into the same test file (already used for test2).

**Usage:**
```bash
python3 scripts/merge_gemini_analysis.py
```

## Finding Test 2 on the Website

Test 2 is accessible through the **Stephane** source:

1. **Select Source**: Click on "Stephane" (tests 1-7 are in Stephane)
2. **Select Test**: You'll see "Test 1", "Test 2", etc.
3. **Test 2** should show "65 Questions"

If Test 2 doesn't appear:
- Check browser console for errors
- Verify `questions/test2.json` exists and is valid JSON
- Check that `question-loader.js` is loading the file correctly

## Workflow for Processing All Tests

### Step 1: Analyze with Gemini
```bash
# Edit analyze_questions_gemini.py to change INPUT_FILE
INPUT_FILE = "questions/test3.json"  # Change this

# Run analysis
python3 scripts/analyze_questions_gemini.py
```

### Step 2: Merge Analysis
```bash
# Edit merge_gemini_analysis.py to change QUESTIONS_FILE
QUESTIONS_FILE = "questions/test3.json"  # Change this

# Merge explanations
python3 scripts/merge_gemini_analysis.py
```

### Step 3: Add Tags
```bash
# Edit add_tags_to_questions.py to change QUESTIONS_FILE
QUESTIONS_FILE = "questions/test3.json"  # Change this

# Add tags
python3 scripts/add_tags_to_questions.py
```

## Batch Processing Multiple Tests

Create a simple batch script:

```python
# batch_process_tests.py
import subprocess
import sys

tests = ["test3", "test4", "test5"]  # Add more as needed

for test in tests:
    print(f"\n{'='*60}")
    print(f"Processing {test}...")
    print(f"{'='*60}\n")
    
    # Update INPUT_FILE in analyze_questions_gemini.py
    # Then run:
    # subprocess.run(["python3", "scripts/analyze_questions_gemini.py"])
    # subprocess.run(["python3", "scripts/merge_gemini_analysis.py"])
    # subprocess.run(["python3", "scripts/add_tags_to_questions.py"])
```

## Tags Structure

Tags are stored in each question as:
```json
{
  "id": 1,
  "text": "...",
  "tags": [
    "amazon-s3",
    "amazon-ec2",
    "best-practice-encryption",
    "aws-iam"
  ]
}
```

**Future uses:**
- Filter questions by AWS service
- Search by best practices
- Generate study guides by topic
- Track which concepts you've covered

## Notes

- Tags are **not visible to users** - they're metadata for future features
- All scripts create backups before modifying files
- Questions are matched by text similarity (first 100 characters)
- If a question already has an explanation, migration will skip it (unless it's generic)
