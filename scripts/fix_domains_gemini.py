#!/usr/bin/env python3
"""
Fix domain assignments for all questions using Google Gemini API
Analyzes each question and assigns the correct AWS SAA-C03 domain
"""

import json
import time
import os
from pathlib import Path
from typing import Dict, List, Any, Optional

try:
    import google.generativeai as genai
except ImportError:
    genai = None

try:
    from tqdm import tqdm
except ImportError:
    tqdm = None

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).parent.parent / ".env"
    load_dotenv(env_path)
except ImportError:
    pass

# Configuration
MODEL_NAME = "gemini-2.0-flash"
RATE_LIMIT_DELAY = 1.0  # Delay between requests (seconds)
RETRY_BASE_DELAY = 5
MAX_RETRIES = 5
BATCH_SAVE_SIZE = 10  # Save after every N questions

# AWS SAA-C03 Domains
VALID_DOMAINS = [
    "Design Secure Architectures",
    "Design Resilient Architectures",
    "Design High-Performing Architectures",
    "Design Cost-Optimized Architectures",
    "Design Operational Excellence Architectures"
]


def get_domain_analysis_prompt(question: Dict[str, Any]) -> str:
    """Create prompt for Gemini to analyze question domain"""
    question_text = question.get("text", "")
    options = question.get("options", [])
    correct_answers = question.get("correctAnswers", [])
    
    # Get correct answer text
    correct_text = ""
    if correct_answers and options:
        correct_idx = correct_answers[0]
        if correct_idx < len(options):
            correct_text = options[correct_idx].get("text", "")
    
    prompt = f"""You are an AWS Certified Solutions Architect expert analyzing exam questions for the AWS SAA-C03 certification.

Analyze the following question and determine which AWS SAA-C03 domain it primarily belongs to.

QUESTION:
{question_text}

CORRECT ANSWER:
{correct_text}

OPTIONS:
"""
    for i, opt in enumerate(options):
        prompt += f"{i}. {opt.get('text', '')}\n"
    
    prompt += f"""
AWS SAA-C03 Domains:
1. Design Secure Architectures - Focuses on security, encryption, IAM, compliance, threat detection
2. Design Resilient Architectures - Focuses on high availability, fault tolerance, disaster recovery, backup strategies
3. Design High-Performing Architectures - Focuses on performance optimization, caching, content delivery, database performance
4. Design Cost-Optimized Architectures - Focuses on cost reduction, resource optimization, right-sizing, cost-effective storage
5. Design Operational Excellence Architectures - Focuses on monitoring, logging, automation, CI/CD, infrastructure as code

IMPORTANT GUIDELINES:
- Choose the PRIMARY domain that best matches the question's main focus
- If a question mentions cost but the PRIMARY focus is security, choose "Design Secure Architectures"
- If a question mentions cost and the PRIMARY focus is cost optimization, choose "Design Cost-Optimized Architectures"
- If a question mentions performance and the PRIMARY focus is performance optimization, choose "Design High-Performing Architectures"
- If a question mentions availability/fault tolerance/disaster recovery, choose "Design Resilient Architectures"
- If a question mentions monitoring/logging/automation, choose "Design Operational Excellence Architectures"

Respond with ONLY the exact domain name from the list above, nothing else.
"""
    return prompt


def analyze_domain_with_retry(question: Dict[str, Any], model) -> Optional[str]:
    """Analyze question domain with retry logic"""
    prompt = get_domain_analysis_prompt(question)
    
    for attempt in range(MAX_RETRIES):
        try:
            response = model.generate_content(prompt)
            
            if response and response.text:
                domain = response.text.strip()
                
                # Clean up response (remove quotes, extra text)
                domain = domain.strip('"\'')
                domain = domain.split('\n')[0].strip()
                
                # Validate domain
                if domain in VALID_DOMAINS:
                    return domain
                else:
                    # Try to find partial match
                    for valid_domain in VALID_DOMAINS:
                        if valid_domain.lower() in domain.lower() or domain.lower() in valid_domain.lower():
                            return valid_domain
                    
                    print(f"⚠️  Warning: Invalid domain '{domain}' for Q{question.get('id')}, keeping original")
                    return None
            
        except Exception as e:
            if attempt < MAX_RETRIES - 1:
                delay = RETRY_BASE_DELAY * (2 ** attempt)
                print(f"⚠️  Error (attempt {attempt + 1}/{MAX_RETRIES}): {e}. Retrying in {delay}s...")
                time.sleep(delay)
            else:
                print(f"❌ Failed after {MAX_RETRIES} attempts: {e}")
                return None
        
        time.sleep(RATE_LIMIT_DELAY)
    
    return None


def find_all_test_files() -> List[Path]:
    """Find all test JSON files"""
    questions_dir = Path(__file__).parent.parent / "questions"
    test_files = sorted(questions_dir.glob("test*.json"))
    # Exclude backup files
    test_files = [f for f in test_files if not f.name.endswith(".backup")]
    return test_files


def process_test_file(test_file: Path, model, dry_run: bool = False) -> Dict[str, Any]:
    """Process a single test file"""
    print(f"\n📂 Processing {test_file.name}...")
    
    # Load questions
    with open(test_file, 'r', encoding='utf-8') as f:
        questions = json.load(f)
    
    print(f"   Found {len(questions)} questions")
    
    # Create backup
    if not dry_run:
        backup_file = test_file.with_suffix('.json.backup')
        if not backup_file.exists():
            print(f"   💾 Creating backup: {backup_file.name}")
            with open(backup_file, 'w', encoding='utf-8') as f:
                json.dump(questions, f, indent=2, ensure_ascii=False)
    
    # Statistics
    stats = {
        'total': len(questions),
        'analyzed': 0,
        'changed': 0,
        'unchanged': 0,
        'errors': 0,
        'changes': []
    }
    
    # Process questions
    pbar = tqdm(questions, desc=f"Analyzing {test_file.name}") if tqdm else questions
    
    for question in pbar:
        q_id = question.get('id', 'unknown')
        current_domain = question.get('domain', 'MISSING')
        
        # Analyze domain
        new_domain = analyze_domain_with_retry(question, model)
        
        if new_domain:
            stats['analyzed'] += 1
            
            if new_domain != current_domain:
                stats['changed'] += 1
                stats['changes'].append({
                    'id': q_id,
                    'old': current_domain,
                    'new': new_domain
                })
                
                if not dry_run:
                    question['domain'] = new_domain
                    if tqdm:
                        pbar.write(f"   ✓ Q{q_id}: {current_domain} → {new_domain}")
                    else:
                        print(f"   ✓ Q{q_id}: {current_domain} → {new_domain}")
                else:
                    if tqdm:
                        pbar.write(f"   [DRY RUN] Q{q_id}: {current_domain} → {new_domain}")
                    else:
                        print(f"   [DRY RUN] Q{q_id}: {current_domain} → {new_domain}")
            else:
                stats['unchanged'] += 1
        else:
            stats['errors'] += 1
            if tqdm:
                pbar.write(f"   ⚠️  Q{q_id}: Failed to analyze, keeping '{current_domain}'")
            else:
                print(f"   ⚠️  Q{q_id}: Failed to analyze, keeping '{current_domain}'")
        
        time.sleep(RATE_LIMIT_DELAY)
    
    # Save updated file
    if not dry_run and stats['changed'] > 0:
        print(f"   💾 Saving {test_file.name}...")
        with open(test_file, 'w', encoding='utf-8') as f:
            json.dump(questions, f, indent=2, ensure_ascii=False)
    
    return stats


def main():
    """Main function"""
    import sys
    
    # Check for API key
    api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("API_KEY")
    if not api_key:
        print("❌ Error: API key not found")
        print("Create a .env file in the project root with: GOOGLE_API_KEY=your-key-here")
        return 1
    
    # Initialize Gemini
    if genai is None:
        print("❌ Error: google-generativeai not installed")
        print("Install it with: pip install -U google-generativeai")
        return 1
    
    print("🔧 Initializing Gemini API...")
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(MODEL_NAME)
        print(f"✓ Model {MODEL_NAME} ready\n")
    except Exception as e:
        print(f"❌ Error initializing Gemini: {e}")
        return 1
    
    # Check for dry-run flag
    dry_run = '--dry-run' in sys.argv or '-d' in sys.argv
    
    if dry_run:
        print("🔍 DRY RUN MODE - No files will be modified\n")
    
    # Find test files
    test_files = find_all_test_files()
    
    if not test_files:
        print("❌ No test*.json files found in questions directory")
        return 1
    
    # Check if specific files requested
    if len(sys.argv) > 1 and not dry_run:
        requested_files = [arg for arg in sys.argv[1:] if arg not in ['--dry-run', '-d']]
        if requested_files:
            test_files = [Path(f) for f in requested_files if Path(f).exists()]
    
    print(f"📂 Found {len(test_files)} test file(s) to process\n")
    
    # Process each file
    all_stats = {}
    total_changed = 0
    
    for test_file in test_files:
        stats = process_test_file(test_file, model, dry_run=dry_run)
        all_stats[test_file.name] = stats
        total_changed += stats['changed']
        
        print(f"\n📊 {test_file.name} Statistics:")
        print(f"   Total: {stats['total']}")
        print(f"   Analyzed: {stats['analyzed']}")
        print(f"   Changed: {stats['changed']}")
        print(f"   Unchanged: {stats['unchanged']}")
        print(f"   Errors: {stats['errors']}")
    
    # Summary
    print(f"\n{'='*60}")
    print(f"✅ Processing complete!")
    print(f"   Files processed: {len(test_files)}")
    print(f"   Total questions changed: {total_changed}")
    
    if dry_run:
        print(f"\n💡 This was a dry run. Run without --dry-run to apply changes.")
    
    return 0


if __name__ == "__main__":
    exit(main())
