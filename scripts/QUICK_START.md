# Quick Start: Gemini Analysis & Tags

## ✅ What's Done

1. **Tags Added**: All 64 questions in test2.json now have tags extracted from Gemini analysis
2. **Migration Scripts**: Ready to migrate explanations to other tests
3. **Documentation**: Complete guides created

## 🎯 Finding Test 2 on Website

**Path to Test 2:**
1. Main Screen → Click **"By Test"**
2. Source Selection → Click **"Stephane"** (tests 1-7 are Stephane)
3. Test Selection → You'll see **"Test 1"**, **"Test 2"** (65 Questions), etc.

**If Test 2 doesn't appear:**
- Open browser console (F12) and check for errors
- Verify `questions/test2.json` exists and is valid JSON
- Check that questions are loading: `console.log(window.examQuestions)`

## 📋 Migration Workflow

### For Each New Test:

```bash
# 1. Analyze with Gemini
# Edit scripts/analyze_questions_gemini.py:
INPUT_FILE = "questions/test3.json"  # Change this
python3 scripts/analyze_questions_gemini.py

# 2. Merge explanations
# Edit scripts/merge_gemini_analysis.py:
QUESTIONS_FILE = "questions/test3.json"  # Change this
python3 scripts/merge_gemini_analysis.py

# 3. Add tags
# Edit scripts/add_tags_to_questions.py:
QUESTIONS_FILE = "questions/test3.json"  # Change this
ANALYSIS_FILE = "analysis_output.json"  # Make sure this matches
python3 scripts/add_tags_to_questions.py
```

### Quick Migration (Copy from test2):

```bash
# Copy explanations from test2 to test3 (if questions are similar)
python3 scripts/migrate_gemini_analysis.py questions/test2.json questions/test3.json
```

## 🏷️ Tags Structure

Tags are stored in each question:
```json
{
  "id": 1,
  "tags": [
    "amazon-s3",
    "amazon-ec2",
    "best-practice-encryption"
  ]
}
```

**Tags are hidden from users** - they're metadata for future features:
- Filter by AWS service
- Search by best practices
- Generate study guides
- Track coverage

## 📁 Files Created

- `scripts/add_tags_to_questions.py` - Adds tags from Gemini analysis
- `scripts/migrate_gemini_analysis.py` - Migrates explanations between tests
- `scripts/MIGRATION_GUIDE.md` - Detailed migration guide
- `scripts/QUICK_START.md` - This file

## 🔍 Verify Tags Were Added

```bash
python3 -c "import json; qs = json.load(open('questions/test2.json')); print('Q1 tags:', qs[0].get('tags', []))"
```

You should see tags like: `['amazon-ec2', 'amazon-guardduty', ...]`
