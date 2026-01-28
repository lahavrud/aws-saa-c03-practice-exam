# Test2 Domain Analysis Summary

## Current State (Before Fix)

**Total Questions:** 65

**Current Domain Distribution:**
- Design Secure Architectures: 28 questions (43.1%)
- Design High-Performing Architectures: 19 questions (29.2%)
- Design Resilient Architectures: 11 questions (16.9%)
- Design Cost-Optimized Architectures: 7 questions (10.8%)

## Issues Identified

Based on manual analysis, the following questions likely have incorrect domain assignments:

### Questions That Should Be Changed:

1. **Q2** - Currently: "Design Secure Architectures"  
   Should be: "Design Cost-Optimized Architectures"  
   Reason: Primary focus is reducing S3 storage costs with lifecycle policies

2. **Q8** - Currently: "Design Secure Architectures"  
   Should be: "Design High-Performing Architectures"  
   Reason: About high-performance storage (FSx for Lustre) for hot/cold data

3. **Q26** - Currently: "Design Secure Architectures"  
   Should be: "Design Cost-Optimized Architectures"  
   Reason: Primary goal is minimizing costs and automated tiering

4. **Q47** - Currently: "Design Secure Architectures"  
   Should be: "Design Cost-Optimized Architectures"  
   Reason: Asks for "MOST cost-effective storage class"

5. **Q49** - Currently: "Design Secure Architectures"  
   Should be: "Design Cost-Optimized Architectures"  
   Reason: Asks for "MOST cost-optimal and resource-efficient solution"

6. **Q65** - Currently: "Design Secure Architectures"  
   Should be: "Design Cost-Optimized Architectures" or "Design High-Performing Architectures"  
   Reason: Focuses on scalability and cost optimization (S3 prefix optimization)

## Expected Changes After Running Script

**Projected New Distribution:**
- Design Secure Architectures: ~22 questions (33.8%) ⬇️ from 28
- Design High-Performing Architectures: ~20 questions (30.8%) ⬆️ from 19
- Design Resilient Architectures: 11 questions (16.9%) ➡️ unchanged
- Design Cost-Optimized Architectures: ~12 questions (18.5%) ⬆️ from 7

## How to Run the Script

### Prerequisites:
1. Ensure `.env` file exists with: `GOOGLE_API_KEY=your-key-here`
2. Install dependencies: `pip install -r scripts/requirements_gemini.txt`

### Test Run (Dry Run):
```bash
python3 scripts/fix_domains_gemini.py questions/test2.json --dry-run
```

This will show what changes would be made without modifying files.

### Apply Changes:
```bash
python3 scripts/fix_domains_gemini.py questions/test2.json
```

The script will:
- Create a backup: `questions/test2.json.backup`
- Analyze each question with Gemini
- Update domain assignments
- Show statistics of changes made

## Script Features

✅ **Safety Settings**: Configured to prevent false positives on security questions  
✅ **Validation**: Only accepts the 4 valid AWS SAA-C03 domains  
✅ **Backup**: Automatic backup before making changes  
✅ **Dry Run**: Preview changes before applying  
✅ **Error Handling**: Retry logic with exponential backoff  
✅ **Progress Tracking**: Shows progress for each question

## Expected Output

```
📂 Processing test2.json...
   Found 65 questions
   💾 Creating backup: test2.json.backup
   ✓ Q2: Design Secure Architectures → Design Cost-Optimized Architectures
   ✓ Q8: Design Secure Architectures → Design High-Performing Architectures
   ✓ Q26: Design Secure Architectures → Design Cost-Optimized Architectures
   ✓ Q47: Design Secure Architectures → Design Cost-Optimized Architectures
   ✓ Q49: Design Secure Architectures → Design Cost-Optimized Architectures
   ✓ Q65: Design Secure Architectures → Design Cost-Optimized Architectures

📊 test2.json Statistics:
   Total: 65
   Analyzed: 65
   Changed: 6
   Unchanged: 59
   Errors: 0
```
