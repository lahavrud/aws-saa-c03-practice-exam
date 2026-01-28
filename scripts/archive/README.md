# Archive Scripts Documentation

This directory contains archived scripts that were used during development but are no longer actively maintained. These scripts are kept for historical reference and may contain outdated patterns or dependencies.

## Script Categories

### Explanation Processing Scripts

#### `elaborate_explanations.py`
- **Purpose**: Generate detailed explanations for AWS SAA-C03 exam questions
- **Status**: Archived - replaced by Gemini-based analysis scripts
- **Notes**: Early attempt at automated explanation generation

#### `manual_elaborate_test1.py`
- **Purpose**: Manual elaboration of explanations for test1 questions
- **Status**: Archived - one-time use script
- **Notes**: Used for initial test1 question explanations

#### `manual_test1_explanations.py`
- **Purpose**: Manual processing of test1 explanations
- **Status**: Archived - one-time use script

#### `update_test1_explanations.py`
- **Purpose**: Update explanations for test1 questions
- **Status**: Archived - replaced by automated processes

#### `update_test1_explanations_structured.py`
- **Purpose**: Update test1 explanations with structured format
- **Status**: Archived - replaced by automated processes

#### `restructure_explanations.py`
- **Purpose**: Restructure explanation format across questions
- **Status**: Archived - format standardization completed

#### `restructure_all_explanations.py`
- **Purpose**: Restructure explanations for all test files
- **Status**: Archived - format standardization completed

#### `restructure_all_explanations_final.py`
- **Purpose**: Final restructuring of all explanations
- **Status**: Archived - format standardization completed

#### `fix_all_grouped_explanations.py`
- **Purpose**: Fix grouped explanation formatting issues
- **Status**: Archived - formatting issues resolved

#### `fix_first_5_questions.py`
- **Purpose**: Fix explanations for first 5 questions
- **Status**: Archived - one-time fix script

#### `fix_option_explanations.py`
- **Purpose**: Fix explanations for individual options
- **Status**: Archived - replaced by structured explanation format

#### `separate_option_explanations.py`
- **Purpose**: Separate option explanations into individual sections
- **Status**: Archived - format standardization completed

#### `add_correct_header.py`
- **Purpose**: Add "Why option X is correct" headers to explanations
- **Status**: Archived - format standardization completed

#### `cleanup_explanations.py`
- **Purpose**: Clean up explanation formatting and content
- **Status**: Archived - cleanup completed

### Question Processing Scripts

#### `fix_questions.py`
- **Purpose**: Fix malformed questions in questions.js
- **Status**: Archived - questions.js is now auto-generated
- **Notes**: Handles formatting fixes like missing spaces, quote escaping

#### `fix_questions_safe.py`
- **Purpose**: Safe version of fix_questions.py with validation
- **Status**: Archived - questions.js is now auto-generated

#### `check_questions.py`
- **Purpose**: Validate question structure and format
- **Status**: Archived - validation now part of generation process

#### `parse_questions.py`
- **Purpose**: Parse questions from various source formats
- **Status**: Archived - parsing now handled by extraction scripts

#### `build_questions.py`
- **Purpose**: Build questions.js from JSON files
- **Status**: Archived - replaced by `regenerate_questions_js.py`

#### `generate_questions.py`
- **Purpose**: Generate question files from templates
- **Status**: Archived - no longer needed

### Extraction Scripts

#### `extract_from_ajax_html.py`
- **Purpose**: Extract questions from AJAX-loaded HTML pages
- **Status**: Archived - extraction methods updated
- **Notes**: Early extraction method, may be useful for reference

### Deployment Scripts

#### `deploy.sh`
- **Purpose**: Deployment script for GitHub Pages
- **Status**: Archived - deployment process updated
- **Notes**: May contain outdated deployment steps

#### `complete-deployment.sh`
- **Purpose**: Complete deployment workflow script
- **Status**: Archived - deployment process updated

#### `push-to-github.sh`
- **Purpose**: Script to push changes to GitHub
- **Status**: Archived - use standard git commands instead

## Usage Notes

⚠️ **Warning**: These scripts are archived and may:
- Use outdated APIs or dependencies
- Contain hardcoded paths or configurations
- Have dependencies on old file structures
- Not work with current codebase

If you need similar functionality:
1. Check the main `scripts/` directory for current alternatives
2. Review the script to understand what it does
3. Adapt the logic to current patterns and utilities
4. Consider using shared utilities from `scripts/utils/`

## Migration Notes

Many of these scripts have been replaced by:
- **Explanation generation**: `scripts/analyze_questions_gemini.py`
- **Question management**: `scripts/question_management.py`
- **Question utilities**: `scripts/utils/question_utils.py`
- **Question generation**: `scripts/regenerate_questions_js.py`

## When to Delete

These scripts can be safely deleted if:
- The functionality has been fully replaced
- No historical reference is needed
- The codebase structure has changed significantly

However, they are kept for:
- Historical reference
- Understanding evolution of the codebase
- Potential future reference for similar tasks
