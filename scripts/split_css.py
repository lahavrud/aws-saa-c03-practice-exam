#!/usr/bin/env python3
"""Split styles.css into multiple organized files."""

import re
import os

def split_css():
    # Read the original CSS file
    with open('styles.css', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Create css directory if it doesn't exist
    os.makedirs('css', exist_ok=True)
    
    # Define file sections with their start markers
    sections = {
        'base.css': {
            'start': 0,
            'end': 30,  # Before "/* Navigation Bar */"
            'header': '/* Base Styles - Reset, HTML, Body, Container */\n'
        },
        'navigation.css': {
            'start': 30,  # "/* Navigation Bar */"
            'end': 207,   # Before "/* Hero Section */"
            'header': '/* Navigation - Navbar and Footer */\n'
        },
        'hero.css': {
            'start': 207,  # "/* Hero Section */"
            'end': 444,    # Before "/* Dashboard */"
            'header': '/* Hero Sections */\n'
        },
        'components.css': {
            'start': 444,  # "/* Dashboard */" - includes dashboard, buttons, cards, forms, modals
            'end': 1300,   # Before "/* Modal Dialog */" - actually modals are part of components
            'header': '/* Components - Buttons, Cards, Forms, Modals */\n'
        },
        'screens.css': {
            'start': 1300,  # "/* Modal Dialog */" onwards - includes modals, screens, insights
            'end': 1650,    # Before "/* Responsive */"
            'header': '/* Screens - Question Screen, Results, Dashboard, Insights, Sign-In */\n'
        },
        'responsive.css': {
            'start': 1650,  # "/* Responsive */"
            'end': None,    # To end of file
            'header': '/* Responsive Styles - Media Queries */\n'
        }
    }
    
    # Split by lines
    lines = content.split('\n')
    
    # Write each section
    for filename, config in sections.items():
        start_idx = config['start']
        end_idx = config['end'] if config['end'] else len(lines)
        
        section_lines = lines[start_idx:end_idx]
        section_content = config['header'] + '\n'.join(section_lines)
        
        with open(f'css/{filename}', 'w', encoding='utf-8') as f:
            f.write(section_content)
        
        print(f"Created css/{filename} ({len(section_lines)} lines)")

if __name__ == '__main__':
    split_css()
