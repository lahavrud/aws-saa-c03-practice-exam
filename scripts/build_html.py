#!/usr/bin/env python3
"""
Build index.html from modular HTML components.
"""

import os

def read_file(filepath):
    """Read a file and return its contents."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        print(f"Warning: {filepath} not found")
        return ""

def build_html(output_file="index.html"):
    """Build index.html from modular components."""
    
    html_parts = []
    
    # DOCTYPE and opening html tag
    html_parts.append('<!DOCTYPE html>')
    html_parts.append('<html lang="en">')
    
    # Head
    head_content = read_file("html/components/head.html")
    if head_content:
        html_parts.append(head_content)
    else:
        # Fallback if head.html doesn't exist
        html_parts.append('</head>')
    
    # Body opening
    html_parts.append('<body>')
    
    # Navigation
    nav_content = read_file("html/components/navigation.html")
    if nav_content:
        html_parts.append(nav_content)
    
    # Container opening
    html_parts.append('    <div class="container">')
    
    # Container header
    header_content = read_file("html/components/container-header.html")
    if header_content:
        html_parts.append(header_content)
    
    # Screens (in order)
    screens = [
        'sign-in-screen',
        'main-selection',
        'source-selection',
        'test-selection',
        'mode-selection',
        'study-guide-screen',
        'about-us-screen',
        'faq-screen',
        'domain-selection',
        'question-screen',
        'results-screen',
    ]
    
    for screen in screens:
        screen_content = read_file(f"html/screens/{screen}.html")
        if screen_content:
            html_parts.append(screen_content)
    
    # Container closing
    html_parts.append('    </div>')
    
    # Modals
    modals = [
        'dashboard-dialog',
        'user-settings-dialog',
        'about-us-modal',
    ]
    
    for modal in modals:
        modal_content = read_file(f"html/modals/{modal}.html")
        if modal_content:
            html_parts.append(modal_content)
    
    # Scripts
    scripts_content = read_file("html/components/scripts.html")
    if scripts_content:
        html_parts.append(scripts_content)
    
    # Footer
    footer_content = read_file("html/components/footer.html")
    if footer_content:
        html_parts.append(footer_content)
    
    # Body and html closing
    html_parts.append('</body>')
    html_parts.append('</html>')
    
    # Write to file
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(html_parts))
    
    print(f"Built {output_file} successfully!")

if __name__ == "__main__":
    build_html()
