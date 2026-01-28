#!/usr/bin/env python3
"""
Normalize analysis_output.json to use consistent testX-qY format for all entries
Migrates old numeric IDs to new format and adds test_key field
"""

import json
import os
import shutil
from pathlib import Path
from typing import Dict, Any

ANALYSIS_FILE = "analysis_output.json"
BACKUP_SUFFIX = ".backup"


def normalize_analysis_output(analysis_file: str):
    """Normalize analysis output to use consistent testX-qY format"""
    
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
    
    # Normalize old format entries
    normalized_data = new_format.copy()  # Start with new format entries
    migrated_count = 0
    skipped_duplicates = 0
    
    print("🔄 Migrating old format entries to test2-qX format...")
    for old_id, entry in old_format.items():
        # Check if entry already has test_key
        if isinstance(entry, dict) and entry.get('test_key'):
            test_key = entry['test_key']
        else:
            # Assume old format entries are from test2
            test_key = "test2"
        
        # Create new ID
        question_id = entry.get('question_id') if isinstance(entry, dict) else None
        if question_id is None:
            question_id = int(old_id) if old_id.isdigit() else None
        
        if question_id is not None:
            new_id = f"{test_key}-q{question_id}"
            
            # Check if new_id already exists (might be duplicate)
            if new_id in normalized_data:
                print(f"⚠️  Skipping duplicate: {old_id} -> {new_id} (already exists)")
                skipped_duplicates += 1
                continue
            
            # Update entry
            if isinstance(entry, dict):
                entry['test_key'] = test_key
                # Remove old unique_id if it's None
                if entry.get('unique_id') is None:
                    entry.pop('unique_id', None)
            
            normalized_data[new_id] = entry
            migrated_count += 1
        else:
            print(f"⚠️  Warning: Could not migrate entry {old_id}")
    
    if skipped_duplicates > 0:
        print(f"⚠️  Skipped {skipped_duplicates} duplicates")
    
    print(f"✓ Migrated {migrated_count} entries\n")
    
    # Save normalized data
    print(f"💾 Saving normalized data to {analysis_file}...")
    with open(analysis_file, 'w', encoding='utf-8') as f:
        json.dump(normalized_data, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Normalization complete!")
    print(f"   - Total entries: {len(normalized_data)}")
    print(f"   - Migrated: {migrated_count}")
    print(f"   - Backup saved to: {backup_file}")
    
    # Verify all entries have test_key
    entries_with_test_key = sum(
        1 for v in normalized_data.values() 
        if isinstance(v, dict) and v.get('test_key')
    )
    print(f"   - Entries with test_key: {entries_with_test_key}/{len(normalized_data)}")
    
    return 0


if __name__ == "__main__":
    exit(normalize_analysis_output(ANALYSIS_FILE))
