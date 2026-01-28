#!/usr/bin/env python3
"""
Clean up analysis_output.json by removing old format entries that have been migrated
"""

import json
import os
import shutil
from pathlib import Path

ANALYSIS_FILE = "analysis_output.json"
BACKUP_SUFFIX = ".backup"


def cleanup_analysis_output(analysis_file: str):
    """Remove old format entries that have corresponding new format entries"""
    
    if not os.path.exists(analysis_file):
        print(f"❌ File not found: {analysis_file}")
        return 1
    
    # Create backup
    backup_file = analysis_file + BACKUP_SUFFIX
    print(f"💾 Creating backup: {backup_file}...")
    shutil.copy2(analysis_file, backup_file)
    print("✓ Backup created\n")
    
    # Load existing data
    print(f"📂 Loading {analysis_file}...")
    with open(analysis_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"✓ Loaded {len(data)} entries\n")
    
    # Separate old and new format entries
    old_format = {k: v for k, v in data.items() if k.isdigit()}
    new_format = {k: v for k, v in data.items() if k not in old_format}
    
    print(f"📊 Current structure:")
    print(f"   - Old format (numeric IDs): {len(old_format)}")
    print(f"   - New format (testX-qY): {len(new_format)}\n")
    
    # Find old entries that have been migrated
    to_remove = []
    for old_id, entry in old_format.items():
        question_id = entry.get('question_id') if isinstance(entry, dict) else None
        if question_id:
            new_id = f"test2-q{question_id}"
            if new_id in new_format:
                to_remove.append(old_id)
    
    # Remove duplicates
    cleaned_data = {k: v for k, v in data.items() if k not in to_remove}
    
    print(f"🔄 Cleaning up duplicates...")
    print(f"   - Removing {len(to_remove)} duplicate old format entries\n")
    
    # Save cleaned data
    print(f"💾 Saving cleaned data to {analysis_file}...")
    with open(analysis_file, 'w', encoding='utf-8') as f:
        json.dump(cleaned_data, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Cleanup complete!")
    print(f"   - Removed: {len(to_remove)} duplicate entries")
    print(f"   - Remaining entries: {len(cleaned_data)}")
    print(f"   - Backup saved to: {backup_file}")
    
    return 0


if __name__ == "__main__":
    exit(cleanup_analysis_output(ANALYSIS_FILE))
