# AWS SAA-C03 Practice Exam Platform

A comprehensive practice exam platform for AWS Solutions Architect Associate (SAA-C03) certification.

## Project Structure

### HTML Files (Modular)
The HTML is split into modular components for better organization:

- `html/components/` - Reusable components (head, navigation, footer, scripts, container-header)
- `html/screens/` - Individual screen components (sign-in, main-selection, question-screen, etc.)
- `html/modals/` - Modal dialogs (dashboard, settings, about-us)

### Building the HTML

To rebuild `index.html` from modular components, run:

```bash
python3 scripts/build_html.py
```

This will assemble all the modular HTML files into a single `index.html` file.

### CSS Files (Modular)
CSS is split into logical modules:

- `css/base.css` - Base styles, reset, typography
- `css/navigation.css` - Navbar and footer styles
- `css/hero.css` - Hero section styles
- `css/components.css` - Reusable components (buttons, cards, forms)
- `css/screens.css` - Screen-specific styles
- `css/responsive.css` - Mobile and responsive styles

### JavaScript Modules
Located in `js/modules/`:
- `config.js` - Configuration constants
- `state.js` - Application state management
- `user.js` - User authentication and management
- `stats.js` - Statistics tracking
- `progress.js` - Progress tracking
- `timer.js` - Timer functionality
- `questions.js` - Question handling
- `results.js` - Results processing
- `test.js` - Test management
- `ui.js` - UI utilities
- `insights.js` - Performance insights
- `navigation.js` - Navigation handling

## Development

### Making Changes

1. **HTML Changes**: Edit files in `html/` directory, then rebuild:
   ```bash
   python3 scripts/build_html.py
   ```

2. **CSS Changes**: Edit files in `css/` directory directly

3. **JavaScript Changes**: Edit files in `js/modules/` directory

## Features

- ✅ 650+ practice questions from multiple sources
- ✅ Review mode and timed test mode
- ✅ Domain-specific practice
- ✅ Performance tracking and analytics
- ✅ Progress syncing across devices (Firebase)
- ✅ Mobile-responsive design
- ✅ Detailed explanations for each question
- ✅ Study guide and FAQ sections

## Color Scheme

The platform uses AWS branding colors:
- Primary Dark: `#232F3E` (AWS dark blue)
- Accent Orange: `#FF9900` (AWS orange)
- Background: `#F5F5F5` (light gray)
- Borders: `#D5DBDB` (AWS light gray)

## License

Copyright © 2024 AWS Lahavda. All rights reserved.
