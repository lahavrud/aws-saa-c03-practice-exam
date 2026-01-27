#!/usr/bin/env python3
"""
Split index.html into modular HTML files for better organization.
"""

import os
import re

def extract_section(content, start_marker, end_marker=None, include_markers=True):
    """Extract a section between two markers."""
    start_index = content.find(start_marker)
    if start_index == -1:
        return None
    
    if end_marker:
        end_index = content.find(end_marker, start_index + len(start_marker))
        if end_index == -1:
            return None
        if include_markers:
            return content[start_index:end_index]
        else:
            return content[start_index + len(start_marker):end_index].strip()
    else:
        # Extract until end of file
        if include_markers:
            return content[start_index:]
        else:
            return content[start_index + len(start_marker):].strip()

def split_html(input_file, output_dir):
    """Split index.html into modular files."""
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # Create subdirectories
    os.makedirs(os.path.join(output_dir, 'screens'), exist_ok=True)
    os.makedirs(os.path.join(output_dir, 'modals'), exist_ok=True)
    os.makedirs(os.path.join(output_dir, 'components'), exist_ok=True)
    
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract head section
    head_start = '<head>'
    head_end = '</head>'
    head_content = extract_section(content, head_start, head_end, include_markers=True)
    if head_content:
        with open(os.path.join(output_dir, 'components', 'head.html'), 'w', encoding='utf-8') as f:
            f.write(head_content)
        print("Created components/head.html")
    
    # Extract navigation
    nav_start = '<!-- Navigation Bar -->'
    nav_end = '</nav>'
    nav_content = extract_section(content, nav_start, nav_end + '</nav>', include_markers=True)
    if nav_content:
        with open(os.path.join(output_dir, 'components', 'navigation.html'), 'w', encoding='utf-8') as f:
            f.write(nav_content)
        print("Created components/navigation.html")
    
    # Extract footer
    footer_start = '<!-- Footer -->'
    footer_end = '</footer>'
    footer_content = extract_section(content, footer_start, footer_end + '</footer>', include_markers=True)
    if footer_content:
        with open(os.path.join(output_dir, 'components', 'footer.html'), 'w', encoding='utf-8') as f:
            f.write(footer_content)
        print("Created components/footer.html")
    
    # Extract scripts section
    scripts_start = '<!-- Firebase SDK'
    scripts_end = '<script src="app.js"></script>'
    scripts_content = extract_section(content, scripts_start, scripts_end + '</script>', include_markers=True)
    if scripts_content:
        with open(os.path.join(output_dir, 'components', 'scripts.html'), 'w', encoding='utf-8') as f:
            f.write(scripts_content)
        print("Created components/scripts.html")
    
    # Extract screens
    screens = [
        ('sign-in-screen', '<!-- Sign-In Screen'),
        ('main-selection', '<!-- Main Selection Screen'),
        ('source-selection', '<!-- Source Selection Screen'),
        ('test-selection', '<!-- Test Selection Screen'),
        ('mode-selection', '<!-- Mode Selection Screen'),
        ('study-guide-screen', '<!-- Study Guide Screen'),
        ('about-us-screen', '<!-- About Us Screen'),
        ('faq-screen', '<!-- FAQ Screen'),
        ('domain-selection', '<!-- Domain Selection Screen'),
        ('question-screen', '<!-- Question Screen'),
        ('results-screen', '<!-- Results Screen'),
    ]
    
    for screen_id, marker in screens:
        screen_start = marker
        screen_end = f'<!-- {marker.split("<!-- ")[1].split(" Screen")[0]}'
        if screen_id == 'results-screen':
            screen_end = '<!-- Dashboard Dialog'
        elif screen_id == 'question-screen':
            screen_end = '<!-- Results Screen'
        elif screen_id == 'domain-selection':
            screen_end = '<!-- Question Screen'
        elif screen_id == 'faq-screen':
            screen_end = '<!-- Domain Selection Screen'
        elif screen_id == 'about-us-screen':
            screen_end = '<!-- FAQ Screen'
        elif screen_id == 'study-guide-screen':
            screen_end = '<!-- About Us Screen'
        elif screen_id == 'mode-selection':
            screen_end = '<!-- Study Guide Screen'
        elif screen_id == 'test-selection':
            screen_end = '<!-- Mode Selection Screen'
        elif screen_id == 'source-selection':
            screen_end = '<!-- Test Selection Screen'
        elif screen_id == 'main-selection':
            screen_end = '<!-- Source Selection Screen'
        elif screen_id == 'sign-in-screen':
            screen_end = '<!-- User Selection Screen'
        
        screen_content = extract_section(content, screen_start, screen_end, include_markers=True)
        if screen_content:
            # Find the closing div for this screen
            # Look for the pattern: <div id="screen-id" ...> ... </div>
            pattern = rf'<div id="{screen_id}"[^>]*>.*?</div>\s*(?={screen_end}|$)'
            match = re.search(pattern, content, re.DOTALL)
            if match:
                screen_html = match.group(0)
                with open(os.path.join(output_dir, 'screens', f'{screen_id}.html'), 'w', encoding='utf-8') as f:
                    f.write(screen_html)
                print(f"Created screens/{screen_id}.html")
    
    # Extract modals
    modals = [
        ('dashboard-dialog', '<!-- Dashboard Dialog'),
        ('user-settings-dialog', '<!-- User Settings Dialog'),
        ('about-us-modal', '<!-- About Us Modal'),
    ]
    
    for modal_id, marker in modals:
        modal_start = marker
        if modal_id == 'dashboard-dialog':
            modal_end = '<!-- User Settings Dialog'
        elif modal_id == 'user-settings-dialog':
            modal_end = '<!-- Footer -->'
        elif modal_id == 'about-us-modal':
            modal_end = '</body>'
        
        modal_content = extract_section(content, modal_start, modal_end, include_markers=True)
        if modal_content:
            # Find the closing div for this modal
            pattern = rf'<div id="{modal_id}"[^>]*>.*?</div>\s*(?={modal_end}|$)'
            match = re.search(pattern, content, re.DOTALL)
            if match:
                modal_html = match.group(0)
                with open(os.path.join(output_dir, 'modals', f'{modal_id}.html'), 'w', encoding='utf-8') as f:
                    f.write(modal_html)
                print(f"Created modals/{modal_id}.html")
    
    print("\nHTML splitting complete!")

if __name__ == "__main__":
    input_html = "index.html"
    output_dir = "html"
    split_html(input_html, output_dir)
