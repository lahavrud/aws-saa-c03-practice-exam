#!/usr/bin/env python3
"""
Organize analysis_output.json by sorting keys and grouping by test
Makes it easier to read and debug, but doesn't affect functionality
"""

import json
import os
import shutil
from pathlib import Path
from typing import Dict, Any

ANALYSIS_FILE = "analysis_output.json"
BACKUP_SUFFIX = ".backup"


def sort_key(key: str) -> tuple:
    """Sort key function: test name first, then question number"""
    if "-q" in key:
        # Format: testX-qY
        parts = key.split("-q")
        test_name = parts[0]
        q_num = int(parts[1]) if parts[1].isdigit() else 999
        # Extract test number for sorting
        test_num = int(test_name.replace("test", "")) if test_name.replace("test", "").isdigit() else 999
        return (test_num, q_num)
    elif key.isdigit():
        # Old numeric format - put at end
        return (9999, int(key))
    else:
        # Unknown format - put at very end
        return (99999, 0)


def organize_analysis_output(analysis_file: str):
    """Organize analysis output by sorting keys"""
    
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
    
    # Sort keys
    print("🔄 Organizing entries...")
    sorted_keys = sorted(data.keys(), key=sort_key)
    
    # Create organized dictionary (Python 3.7+ preserves insertion order)
    organized_data = {key: data[key] for key in sorted_keys}
    
    # Save organized data
    print(f"💾 Saving organized data to {analysis_file}...")
    with open(analysis_file, 'w', encoding='utf-8') as f:
        json.dump(organized_data, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Organization complete!")
    print(f"   - Total entries: {len(organized_data)}")
    print(f"   - Backup saved to: {backup_file}")
    
    # Show organization
    print(f"\n📊 Organization preview:")
    first_10 = list(organized_data.keys())[:10]
    last_10 = list(organized_data.keys())[-10:]
    print(f"   First 10 keys: {first_10}")
    print(f"   Last 10 keys: {last_10}")
    
    return 0


if __name__ == "__main__":
    exit(organize_analysis_output(ANALYSIS_FILE))
