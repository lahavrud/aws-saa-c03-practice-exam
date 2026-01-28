#!/usr/bin/env python3
"""
Question analysis script using Google Gemini 2.0 Flash API
Uses gemini-2.0-flash for ultra-fast analysis with checkpointing and resume capability
"""

import json
import time
import os
from pathlib import Path
from typing import Dict, List, Any, Optional, Set, Tuple

try:
    import google.generativeai as genai  # type: ignore
except ImportError:
    genai = None  # type: ignore

try:
    from tqdm import tqdm  # type: ignore
except ImportError:
    tqdm = None  # type: ignore

# Load environment variables from .env file
try:
    from dotenv import load_dotenv  # type: ignore

    # Load .env from project root (parent of scripts directory)
    env_path = Path(__file__).parent.parent / ".env"
    load_dotenv(env_path)
except ImportError:
    # dotenv not installed, will rely on system environment variables
    pass

# Configuration - Optimized Speed 🏎️
INPUT_FILES = None  # None = auto-detect all test*.json files, or specify list like ["questions/test2.json", "questions/test3.json"]
OUTPUT_FILE = "analysis_output.json"
MODEL_NAME = "gemini-2.0-flash"  # Latest Gemini 2.0 Flash model

RATE_LIMIT_DELAY = 2.0  # Delay between requests (seconds)
RETRY_BASE_DELAY = 5  # Base delay for exponential backoff (seconds)
MAX_RETRIES = 10  # Maximum number of retries
BATCH_SAVE_SIZE = 5  # Save after every N questions
MAX_QUESTIONS = (
    None  # Set to a number to limit processing (e.g., 5 for testing), None for all
)


def load_questions(file_path: str) -> List[Dict[str, Any]]:
    """Load questions from JSON file"""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Input file not found: {file_path}")

    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # If it's a list of questions
    if isinstance(data, list):
        return data

    # If it's an object with keys like test1, test2, etc.
    all_questions = []
    for key, questions in data.items():
        if isinstance(questions, list):
            all_questions.extend(questions)

    return all_questions


def find_all_test_files(questions_dir: str = "questions") -> List[str]:
    """Find all test*.json files in the questions directory"""
    questions_path = Path(questions_dir)
    if not questions_path.exists():
        return []

    test_files = []
    # Find all test*.json files and sort them numerically
    for test_file in sorted(
        questions_path.glob("test*.json"),
        key=lambda x: int(x.stem.replace("test", ""))
        if x.stem.replace("test", "").isdigit()
        else 999,
    ):
        test_files.append(str(test_file))

    return test_files


def load_existing_output(
    file_path: str,
) -> Tuple[Dict[str, Any], Set[str], Dict[str, str]]:  # type: ignore
    """
    Load existing output and return the full data, processed question IDs, and question text map.
    Returns: (output_dict, processed_ids_set, question_text_map)
    question_text_map: maps question text hash to question ID for matching
    """
    if not os.path.exists(file_path):
        return {}, set(), {}

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data: Any = json.load(f)

        # Extract processed question IDs and create text hash map
        processed_ids: Set[str] = set()
        output_dict: Dict[str, Any] = {}
        question_text_map: Dict[str, str] = {}  # text_hash -> question_id

        if isinstance(data, dict):
            # If it's a dict with question keys
            processed_ids = set(data.keys())
            output_dict = data
            # Build text hash map for matching
            for q_id, entry in data.items():
                if isinstance(entry, dict):
                    question_text = entry.get("question_text", "")
                    if question_text:
                        text_hash = str(hash(question_text) % (10**10))
                        question_text_map[text_hash] = q_id
        elif isinstance(data, list):
            # If it's a list of question objects - convert to dict
            for item in data:
                if isinstance(item, dict):
                    q_id = item.get("question_id") or item.get("id")
                    if q_id is not None:
                        q_id_str = str(q_id)
                        processed_ids.add(q_id_str)
                        output_dict[q_id_str] = item
                        # Build text hash map
                        question_text = item.get("question_text", "")
                        if question_text:
                            text_hash = str(hash(question_text) % (10**10))
                            question_text_map[text_hash] = q_id_str

        return output_dict, processed_ids, question_text_map
    except (json.JSONDecodeError, FileNotFoundError) as e:
        print(f"⚠️  Warning: Could not load existing output: {e}")
        return {}, set(), {}


def save_output_json(data: Dict[str, Any], file_path: str):
    """Save output to JSON file (full rewrite)"""
    # Create backup before writing
    if os.path.exists(file_path):
        backup_path = f"{file_path}.backup"
        try:
            import shutil

            shutil.copy2(file_path, backup_path)
        except Exception:
            pass

    # Write atomically using temp file
    temp_path = f"{file_path}.tmp"
    try:
        with open(temp_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        os.replace(temp_path, file_path)  # Atomic replace
    except Exception as e:
        print(f"❌ Error saving output: {e}")
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise


def get_question_id(question: Dict[str, Any], test_key: Optional[str] = None) -> str:
    """Get unique identifier for a question in testX-qY format"""
    # Priority: uniqueId (if in testX-qY format) > id with test context > hash of text
    if "uniqueId" in question:
        unique_id = str(question["uniqueId"])
        # If uniqueId is already in testX-qY format, use it
        if "-q" in unique_id:
            return unique_id
        # Otherwise, convert it using test_key
        if test_key and "id" in question:
            return f"{test_key}-q{question['id']}"
        return unique_id
    elif "id" in question:
        # Always use test context if available
        question_test_key = question.get("testKey") or test_key
        if question_test_key:
            return f"{question_test_key}-q{question['id']}"
        # If no test_key, use numeric ID (shouldn't happen in normal operation)
        return str(question["id"])
    else:
        # Fallback: hash of question text (shouldn't happen in normal operation)
        return str(hash(question.get("text", "")) % (10**10))


def analyze_question_with_retry(
    question: Dict[str, Any], model
) -> Optional[Dict[str, Any]]:
    """Analyze question with exponential backoff retry logic"""

    # Build comprehensive prompt
    prompt = f"""You are an expert AWS Solutions Architect. Analyze the following AWS SAA-C03 exam question in detail.

Question: {question.get("text", "")}

Options:
"""
    for i, opt in enumerate(question.get("options", [])):
        marker = "✓ CORRECT" if opt.get("correct", False) else ""
        prompt += f"{i}. {opt.get('text', '')} {marker}\n"

    correct_answers = question.get("correctAnswers", [])

    # Build example correct_explanations structure
    correct_explanations_example = ", ".join(
        [
            f'"{ans}": "Detailed explanation of why option {ans} is correct..."'
            for ans in correct_answers
        ]
    )

    prompt += f"""
Domain: {question.get("domain", "Unknown")}
Correct Answer(s): {correct_answers}

Provide a detailed analysis in JSON format with the following structure:
{{
    "analysis": "Comprehensive analysis of the question and scenario",
    "correct_explanations": {{
        {correct_explanations_example}
    }},
    "incorrect_explanations": {{
        "0": "Explanation of why option 0 is incorrect",
        "1": "Explanation of why option 1 is incorrect"
    }},
    "aws_concepts": ["List of relevant AWS concepts and services"],
    "best_practices": ["List of AWS best practices relevant to this question"],
    "key_takeaways": "Key learning points from this question"
}}

IMPORTANT: 
- Provide a separate explanation for EACH correct option ({len(correct_answers)} total) in the "correct_explanations" object.
- Each explanation should focus specifically on why THAT particular option is correct.
- Do NOT include phrases like "Option 1 is correct because..." or "Option X" in the explanation text - just explain why it's correct directly.
- Start explanations directly with the reasoning (e.g., "This is correct because..." or "This solution addresses the requirement by...").

Return ONLY valid JSON, no markdown formatting or code blocks.
"""

    # Configure safety settings to allow security exam questions
    # Set all harm categories to BLOCK_NONE to prevent false positives
    safety_settings = []
    if (
        genai
        and hasattr(genai.types, "HarmCategory")
        and hasattr(genai.types, "HarmBlockThreshold")
    ):
        safety_settings = [
            {
                "category": genai.types.HarmCategory.HARM_CATEGORY_HARASSMENT,
                "threshold": genai.types.HarmBlockThreshold.BLOCK_NONE,
            },
            {
                "category": genai.types.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                "threshold": genai.types.HarmBlockThreshold.BLOCK_NONE,
            },
            {
                "category": genai.types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                "threshold": genai.types.HarmBlockThreshold.BLOCK_NONE,
            },
            {
                "category": genai.types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                "threshold": genai.types.HarmBlockThreshold.BLOCK_NONE,
            },
        ]

    for attempt in range(MAX_RETRIES):
        try:
            response = model.generate_content(
                prompt,
                generation_config={
                    "temperature": 0.3,
                    "top_p": 0.95,
                    "top_k": 40,
                },
                safety_settings=safety_settings,
            )

            # Extract JSON from response
            response_text = response.text.strip()

            # Remove markdown code blocks if present
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            elif response_text.startswith("```"):
                response_text = response_text[3:]

            if response_text.endswith("```"):
                response_text = response_text[:-3]

            response_text = response_text.strip()

            # Parse JSON
            try:
                analysis = json.loads(response_text)
                return analysis
            except json.JSONDecodeError as e:
                # If JSON parsing fails, return raw response with error flag
                return {
                    "raw_response": response_text,
                    "analysis": response_text[:500],  # Truncate for storage
                    "error": f"JSON parse error: {str(e)}",
                    "aws_concepts": [],
                    "best_practices": [],
                }

        except Exception as e:
            error_str = str(e)
            error_code = getattr(e, "status_code", None)

            # Check for rate limit or quota errors
            is_rate_limit = (
                "429" in error_str
                or "ResourceExhausted" in error_str
                or "quota" in error_str.lower()
                or error_code == 429
            )

            # Check for server errors
            is_server_error = (
                "500" in error_str
                or "503" in error_str
                or "502" in error_str
                or error_code in [500, 502, 503]
            )

            if (is_rate_limit or is_server_error) and attempt < MAX_RETRIES - 1:
                # Exponential backoff: 2^attempt * base_delay
                wait_time = RETRY_BASE_DELAY * (2**attempt)
                error_type = "Rate limit" if is_rate_limit else "Server error"
                print(
                    f"\n⚠️  {error_type} hit. Waiting {wait_time}s before retry {attempt + 1}/{MAX_RETRIES}..."
                )
                time.sleep(wait_time)
                continue
            else:
                if attempt == MAX_RETRIES - 1:
                    print(f"\n❌ Max retries reached. Error: {error_str}")
                    return None
                # For other errors, retry with shorter delay
                wait_time = RETRY_BASE_DELAY
                print(
                    f"\n⚠️  Error: {error_str[:100]}. Waiting {wait_time}s before retry {attempt + 1}/{MAX_RETRIES}..."
                )
                time.sleep(wait_time)
                continue

    return None


def main():
    """Main function"""

    # Check for API key (from .env file or environment variables)
    # Try both GOOGLE_API_KEY and API_KEY for flexibility
    api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("API_KEY")
    if not api_key:
        print("❌ Error: API key not found")
        print("Options:")
        print(
            "  1. Create a .env file in the project root with: GOOGLE_API_KEY=your-key-here"
        )
        print("     (or use API_KEY=your-key-here)")
        print("  2. Or set environment variable: export GOOGLE_API_KEY='your-key-here'")
        print(
            "\nNote: .env file is git-ignored and will not be committed to the repository."
        )
        return 1

    # Initialize Gemini
    if genai is None:
        print("❌ Error: google-generativeai not installed")
        print("Install it with: pip install -U google-generativeai")
        return 1

    print("🔧 Initializing Gemini 2.0 Flash API...")
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(MODEL_NAME)
        print(f"✓ Model {MODEL_NAME} ready\n")
    except Exception as e:
        print(f"❌ Error initializing Gemini: {e}")
        print(
            "Make sure you have the latest version: pip install -U google-generativeai"
        )
        return 1

    # Determine which test files to process
    if INPUT_FILES is None:
        # Auto-detect all test files
        test_files = find_all_test_files()
        if not test_files:
            print("❌ No test*.json files found in questions directory")
            return 1
        print(f"📂 Auto-detected {len(test_files)} test files to process\n")
    else:
        # Use specified files
        test_files = INPUT_FILES if isinstance(INPUT_FILES, list) else [INPUT_FILES]
        print(f"📂 Processing {len(test_files)} specified test file(s)\n")

    # Load existing output and get processed IDs
    print(f"📂 Loading existing output from {OUTPUT_FILE}...")
    existing_output, processed_ids, question_text_map = load_existing_output(
        OUTPUT_FILE
    )
    print(f"✓ Found {len(processed_ids)} questions already analyzed\n")

    # Process all test files
    total_questions = 0
    total_skipped = 0
    total_analyzed = 0
    total_errors = 0

    # Initialize output structure (should already be a dict from load_existing_output)
    if not isinstance(existing_output, dict):
        existing_output = {}

    # Process each test file
    for test_file in test_files:
        test_path = Path(test_file)
        # Always extract test_key from filename (e.g., "test2.json" -> "test2")
        test_key = test_path.stem if test_path.stem.startswith("test") else None

        if not test_key:
            print(
                f"⚠️  Warning: Could not extract test key from {test_path.name}, skipping..."
            )
            continue

        print("=" * 60)
        print(f"📋 Processing: {test_path.name}")
        print(f"   Test key: {test_key}")
        print("=" * 60 + "\n")

        # Load questions from this test file
        try:
            questions = load_questions(test_file)
            print(f"✓ Loaded {len(questions)} questions from {test_path.name}\n")
        except Exception as e:
            print(f"❌ Error loading {test_path.name}: {e}")
            print(f"⚠️  Skipping {test_path.name} and continuing...\n")
            continue

        total_questions += len(questions)

        # Filter out already processed questions
        questions_to_process = []
        skipped_count = 0

        for question in questions:
            q_id = get_question_id(question, test_key)
            question_text = question.get("text", "")

            # Check if already processed using multiple methods
            is_processed = False

            # Method 1: Check new format ID (testX-qY)
            if q_id in processed_ids:
                is_processed = True

            # Method 2: Check old format ID (numeric) - only for test2 (backward compatibility)
            if not is_processed and test_key == "test2":
                question_id = question.get("id")
                old_format_id = str(question_id) if question_id is not None else None
                if old_format_id and old_format_id in processed_ids:
                    is_processed = True

            # Method 3: Check by question text hash (handles cross-test duplicates and ID mismatches)
            if not is_processed and question_text:
                text_hash = str(hash(question_text) % (10**10))
                if text_hash in question_text_map:
                    # Found by text hash - this question was already processed
                    is_processed = True

            if is_processed:
                skipped_count += 1
            else:
                questions_to_process.append((q_id, question))

        print(f"📊 Processing plan for {test_path.name}:")
        print(f"   - Total questions: {len(questions)}")
        print(f"   - Already processed: {skipped_count}")
        print(f"   - To process: {len(questions_to_process)}\n")

        total_skipped += skipped_count

        if len(questions_to_process) == 0:
            print(
                f"✅ All questions from {test_path.name} have already been analyzed!\n"
            )
            continue

        # Analyze questions from this test file
        analyzed_count = 0
        error_count = 0
        save_counter = 0

        # Create progress bar for this test file
        if tqdm is None:
            print(f"🚀 Starting analysis of {test_path.name}...\n")
            pbar = None
        else:
            pbar = tqdm(
                total=len(questions_to_process),
                desc=f"Analyzing {test_path.name}",
                unit="question",
            )

        try:
            for q_id, question in questions_to_process:
                # Analyze question
                analysis = analyze_question_with_retry(question, model)

                if analysis:
                    # Ensure test_key is set (should always be set from test file name)
                    if not test_key:
                        # Fallback: try to extract from q_id
                        if "-q" in q_id:
                            test_key = q_id.split("-q")[0]
                        else:
                            test_key = "unknown"

                    # Add to output with consistent format
                    existing_output[q_id] = {
                        "question_id": question.get("id"),
                        "unique_id": question.get("uniqueId"),
                        "test_key": test_key,  # Always include test key
                        "question_text": question.get("text"),
                        "domain": question.get("domain"),
                        "correct_answers": question.get("correctAnswers"),
                        "analysis": analysis,
                        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                    }

                    analyzed_count += 1
                    save_counter += 1

                    # Save in batches or immediately
                    if save_counter >= BATCH_SAVE_SIZE:
                        save_output_json(existing_output, OUTPUT_FILE)
                        save_counter = 0
                else:
                    error_count += 1
                    # Still save progress even on error
                    if save_counter > 0:
                        save_output_json(existing_output, OUTPUT_FILE)
                        save_counter = 0

                # Update progress bar
                if pbar is not None:
                    pbar.update(1)
                # No rate limiting - unlimited requests (RATE_LIMIT_DELAY = 0)
                # Only sleep if delay is explicitly set (for testing/debugging)
                if RATE_LIMIT_DELAY > 0 and analyzed_count < len(questions_to_process):
                    time.sleep(RATE_LIMIT_DELAY)

            # Final save for this test file
            if save_counter > 0:
                save_output_json(existing_output, OUTPUT_FILE)

            total_analyzed += analyzed_count
            total_errors += error_count

            print(
                f"\n✓ Completed {test_path.name}: {analyzed_count} analyzed, {error_count} errors\n"
            )

        except KeyboardInterrupt:
            print("\n\n⚠️  Interrupted by user. Saving progress...")
            save_output_json(existing_output, OUTPUT_FILE)
            print("✓ Progress saved. You can resume later.")
            if pbar is not None:
                pbar.close()
            return 1
        except Exception as e:
            print(f"\n\n❌ Unexpected error processing {test_path.name}: {e}")
            save_output_json(existing_output, OUTPUT_FILE)
            print("✓ Progress saved before exit.")
            if pbar is not None:
                pbar.close()
            # Continue with next test file instead of exiting
            continue
        finally:
            if pbar is not None:
                pbar.close()

    # Final summary across all test files
    print("\n" + "=" * 60)
    print("✅ Analysis complete for all test files!")
    print("📊 Overall Summary:")
    print(f"   - Total questions across all tests: {total_questions}")
    print(f"   - Already processed (skipped): {total_skipped}")
    print(f"   - Newly analyzed: {total_analyzed}")
    print(f"   - Errors: {total_errors}")
    print(f"   - Output saved to: {OUTPUT_FILE}")
    print("=" * 60)

    return 0


if __name__ == "__main__":
    exit(main())
