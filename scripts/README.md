# Question Analysis Script Documentation

## Overview

This script analyzes AWS SAA-C03 exam questions using Google Gemini 2.0 Flash API to generate detailed explanations, AWS concepts, and best practices for each question.

## Features

- ✅ **Gemini 2.0 Flash**: Uses the latest, fastest Gemini model
- ✅ **Checkpointing**: Automatically resumes from where you stopped
- ✅ **Fast Processing**: Minimal delays (0.01s) - optimized for upgraded billing plans
- ✅ **Batch Saving**: Saves progress after every 5 questions
- ✅ **Error Handling**: Exponential backoff retry logic for API errors
- ✅ **Progress Tracking**: Real-time progress bar with tqdm
- ✅ **Secure**: API keys loaded from `.env` file (git-ignored)

## Setup

### 1. Install Dependencies

```bash
# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install packages
pip install -r scripts/requirements_gemini.txt
```

Or install directly:
```bash
pip install google-generativeai tqdm python-dotenv
```

### 2. Configure API Key

Create a `.env` file in the project root:

```bash
# .env file (in project root, NOT in scripts/)
GOOGLE_API_KEY=your-api-key-here
```

Get your API key from: https://aistudio.google.com/app/apikey

**Security Note**: The `.env` file is git-ignored and will never be committed to the repository.

### 3. Configure Input File

Edit the script to point to your questions file:

```python
INPUT_FILE = "questions/test2.json"  # Change as needed
```

## Usage

```bash
cd /home/lahav/repos/AWS-SAA-C03
source venv/bin/activate
python3 scripts/analyze_questions_gemini.py
```

## How It Works

1. **Loads Questions**: Reads questions from the specified JSON file
2. **Checkpointing**: Loads existing `analysis_output.json` and skips already processed questions
3. **Analysis**: Sends each question to Gemini 2.0 Flash for detailed analysis
4. **Saving**: Saves results in batches (every 5 questions) to prevent data loss
5. **Resume**: If interrupted, simply run again - it will continue from where it stopped

## Output Format

Results are saved to `analysis_output.json`:

```json
{
  "test2-q1": {
    "question_id": 1,
    "unique_id": "test2-q1",
    "question_text": "Question text here...",
    "domain": "Design Secure Architectures",
    "correct_answers": [2],
    "analysis": {
      "analysis": "Comprehensive analysis of the question",
      "correct_explanation": "Why the correct answer is correct",
      "incorrect_explanations": {
        "0": "Why option 0 is wrong",
        "1": "Why option 1 is wrong"
      },
      "aws_concepts": ["S3", "IAM", "KMS"],
      "best_practices": ["Encryption at rest", "Least privilege"],
      "key_takeaways": "Key learning points"
    },
    "timestamp": "2024-01-01 12:00:00"
  }
}
```

## Configuration

Edit these constants in the script:

```python
INPUT_FILE = "questions/test2.json"      # Input questions file
OUTPUT_FILE = "analysis_output.json"     # Output file
MODEL_NAME = "gemini-2.0-flash"          # Gemini model
RATE_LIMIT_DELAY = 0.01                  # Delay between requests (seconds)
RETRY_BASE_DELAY = 2                     # Base delay for retries (seconds)
MAX_RETRIES = 3                          # Maximum retry attempts
BATCH_SAVE_SIZE = 5                      # Save after N questions
```

## Error Handling

- **Rate Limits (429)**: Automatic exponential backoff (2s, 4s, 8s)
- **Server Errors (500/502/503)**: Automatic retry with backoff
- **Other Errors**: Retry with base delay
- **Interruptions**: Progress is saved, can resume anytime

## Troubleshooting

### API Key Not Found
- Ensure `.env` file exists in project root (not in `scripts/`)
- Check that `GOOGLE_API_KEY=your-key` is set correctly
- Verify `python-dotenv` is installed

### Import Errors
- Activate the virtual environment: `source venv/bin/activate`
- Install dependencies: `pip install -r scripts/requirements_gemini.txt`

### Model Not Found
- Update to latest version: `pip install -U google-generativeai`
- Check that `gemini-2.0-flash` is available in your region

## Performance

With upgraded billing plan:
- **Speed**: ~0.01s delay between requests
- **Throughput**: Can process hundreds of questions quickly
- **Cost**: Gemini 2.0 Flash is cost-effective for bulk analysis

## Security

- ✅ `.env` file is in `.gitignore` - never committed
- ✅ API keys loaded securely from environment
- ✅ No hardcoded credentials in code
- ✅ Safe for production use

## Files

- `analyze_questions_gemini.py` - Main script
- `requirements_gemini.txt` - Python dependencies
- `.env` - API key (git-ignored, create your own)
- `analysis_output.json` - Generated results
