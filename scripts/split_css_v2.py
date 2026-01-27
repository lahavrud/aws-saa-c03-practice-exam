#!/usr/bin/env python3
"""Split styles.css into multiple organized files - improved version."""

import re
import os

def split_css():
    # Read the original CSS file
    with open('styles.css', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Create css directory if it doesn't exist
    os.makedirs('css', exist_ok=True)
    
    # Split by lines
    lines = content.split('\n')
    
    # Find section markers
    markers = {}
    for i, line in enumerate(lines):
        if re.match(r'^/\*.*\*/$', line.strip()) or re.match(r'^/\* ====', line.strip()):
            markers[i] = line.strip()
    
    # Define sections more accurately
    # Base: lines 0-29 (before Navigation Bar)
    base_end = 30
    # Navigation: lines 30-206 (Navigation Bar to Hero Section)
    nav_start, nav_end = 30, 207
    # Hero: lines 207-443 (Hero Section to Dashboard)
    hero_start, hero_end = 207, 444
    # Components: lines 444-1299 (Dashboard, Test Selection, Buttons, Cards, Progress Bar, Question Nav Bar)
    components_start, components_end = 444, 1300
    # Screens: lines 1300-1649 (Modal, User Selection, Sign-In, Question Screen, Results)
    screens_start, screens_end = 1300, 1650
    # Responsive: lines 1650-1913 (first responsive section)
    responsive1_start, responsive1_end = 1650, 1914
    # Insights: lines 1914-2105 (Insights Section)
    insights_start, insights_end = 1914, 2106
    # Responsive continued: lines 2106-end (more responsive, footer responsive)
    responsive2_start = 2106
    
    # Extract footer from responsive section (it's mixed in)
    # Footer starts around line 2202
    footer_start = None
    for i in range(2200, min(2210, len(lines))):
        if 'Footer' in lines[i] or 'footer' in lines[i].lower():
            footer_start = i
            break
    
    # Write base.css
    base_content = '/* Base Styles - Reset, HTML, Body, Container, Screen, Typography */\n\n'
    base_content += '\n'.join(lines[0:base_end])
    with open('css/base.css', 'w', encoding='utf-8') as f:
        f.write(base_content)
    print(f"Created css/base.css ({base_end} lines)")
    
    # Write navigation.css (includes footer)
    nav_content = '/* Navigation - Navbar and Footer */\n\n'
    nav_content += '\n'.join(lines[nav_start:nav_end])
    # Add footer if found
    if footer_start:
        nav_content += '\n\n' + '\n'.join(lines[footer_start:])
    with open('css/navigation.css', 'w', encoding='utf-8') as f:
        f.write(nav_content)
    print(f"Created css/navigation.css ({nav_end - nav_start + (len(lines) - footer_start if footer_start else 0)} lines)")
    
    # Write hero.css
    hero_content = '/* Hero Sections */\n\n'
    hero_content += '\n'.join(lines[hero_start:hero_end])
    with open('css/hero.css', 'w', encoding='utf-8') as f:
        f.write(hero_content)
    print(f"Created css/hero.css ({hero_end - hero_start} lines)")
    
    # Write components.css
    components_content = '/* Components - Buttons, Cards, Forms, Progress Bars, Question Navigation */\n\n'
    components_content += '\n'.join(lines[components_start:components_end])
    with open('css/components.css', 'w', encoding='utf-8') as f:
        f.write(components_content)
    print(f"Created css/components.css ({components_end - components_start} lines)")
    
    # Write screens.css (includes insights)
    screens_content = '/* Screens - Question Screen, Results, Dashboard, Insights, Sign-In, Modals */\n\n'
    screens_content += '\n'.join(lines[screens_start:screens_end])
    # Add insights section
    if insights_start < len(lines):
        screens_content += '\n\n' + '\n'.join(lines[insights_start:insights_end])
    with open('css/screens.css', 'w', encoding='utf-8') as f:
        f.write(screens_content)
    print(f"Created css/screens.css ({screens_end - screens_start + (insights_end - insights_start if insights_start < len(lines) else 0)} lines)")
    
    # Write responsive.css
    responsive_content = '/* Responsive Styles - Media Queries */\n\n'
    responsive_content += '\n'.join(lines[responsive1_start:responsive1_end])
    if responsive2_start < len(lines) and footer_start:
        # Add responsive2 but exclude footer
        responsive_content += '\n\n' + '\n'.join(lines[responsive2_start:footer_start])
    elif responsive2_start < len(lines):
        responsive_content += '\n\n' + '\n'.join(lines[responsive2_start:])
    with open('css/responsive.css', 'w', encoding='utf-8') as f:
        f.write(responsive_content)
    print(f"Created css/responsive.css")

if __name__ == '__main__':
    split_css()
