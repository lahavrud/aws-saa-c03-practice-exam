# Fix Domain Assignments Using Gemini

This script uses Google Gemini AI to analyze all questions and fix domain assignments to ensure they match the correct AWS SAA-C03 domain.

## Setup

1. **Install Dependencies** (if not already installed):
```bash
source venv/bin/activate
pip install -r scripts/requirements_gemini.txt
```

2. **Set up API Key**:
Create a `.env` file in the project root:
```bash
GOOGLE_API_KEY=your-api-key-here
```
Get your API key from: https://aistudio.google.com/app/apikey

## Usage

### Test Run (Dry Run - No Changes)
First, test on a single file to see what changes would be made:
```bash
python3 scripts/fix_domains_gemini.py questions/test2.json --dry-run
```

### Fix All Questions
Process all test files:
```bash
python3 scripts/fix_domains_gemini.py
```

### Fix Specific Files
Process only specific test files:
```bash
python3 scripts/fix_domains_gemini.py questions/test2.json questions/test3.json
```

## How It Works

1. **Loads Questions**: Reads questions from JSON files
2. **Creates Backup**: Automatically creates `.backup` files before making changes
3. **Analyzes with Gemini**: Sends each question to Gemini with a detailed prompt asking for the correct domain
4. **Validates**: Ensures the domain is one of the 5 valid AWS SAA-C03 domains
5. **Updates**: Only changes domains that are different from current assignment
6. **Saves**: Updates the JSON file with corrected domains

## Domain Guidelines

The script uses these guidelines for domain classification:

- **Design Secure Architectures**: Security, encryption, IAM, compliance, threat detection
- **Design Resilient Architectures**: High availability, fault tolerance, disaster recovery, backup
- **Design High-Performing Architectures**: Performance optimization, caching, content delivery, database performance
- **Design Cost-Optimized Architectures**: Cost reduction, resource optimization, right-sizing, cost-effective storage
- **Design Operational Excellence Architectures**: Monitoring, logging, automation, CI/CD, infrastructure as code

## Output

The script provides:
- Progress updates for each question
- Statistics per test file (total, changed, unchanged, errors)
- Summary of all changes made

## Safety Features

- ✅ Automatic backups (`.backup` files)
- ✅ Dry-run mode to preview changes
- ✅ Validation of domain names
- ✅ Error handling with retries
- ✅ Rate limiting to avoid API limits

## Example Output

```
📂 Processing test2.json...
   Found 65 questions
   💾 Creating backup: test2.json.backup
   ✓ Q2: Design Secure Architectures → Design Cost-Optimized Architectures
   ✓ Q8: Design Secure Architectures → Design High-Performing Architectures
   ...

📊 test2.json Statistics:
   Total: 65
   Analyzed: 65
   Changed: 6
   Unchanged: 59
   Errors: 0
```

## Troubleshooting

**API Key Not Found**
- Ensure `.env` file exists in project root
- Check that `GOOGLE_API_KEY=your-key` is set correctly

**Import Errors**
- Activate virtual environment: `source venv/bin/activate`
- Install dependencies: `pip install -r scripts/requirements_gemini.txt`

**Rate Limiting**
- The script includes delays between requests
- If you hit rate limits, wait a few minutes and resume
