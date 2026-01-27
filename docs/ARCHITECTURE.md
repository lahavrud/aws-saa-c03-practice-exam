# Architecture Documentation

This document explains the architecture and code structure of the AWS SAA-C03 Practice Exam Platform.

## 🏗️ Architecture Overview

The application is a **client-side single-page application (SPA)** that runs entirely in the browser. No backend server is required.

### Technology Stack

- **HTML5**: Structure and semantic markup
- **CSS3**: Styling and responsive design
- **JavaScript (ES6+)**: Application logic
- **LocalStorage API**: Data persistence
- **Python 3**: Question extraction and processing scripts

## 📐 Application Structure

### Data Flow

```
User Interaction
    ↓
app.js (Event Handlers)
    ↓
State Management (Variables)
    ↓
DOM Updates (UI)
    ↓
LocalStorage (Persistence)
```

### Core Components

1. **User System**
   - Manages user data and statistics
   - Stores in localStorage as `saa-c03-user`
   - Tracks: questions answered, accuracy, tests completed

2. **Question System**
   - Loads questions from `questions.js` or JSON files
   - Supports multiple test sources (Stephane, Dojo)
   - Organizes by domain and test number

3. **Progress System**
   - Saves progress per test and mode
   - Key format: `saa-c03-progress-test{number}`
   - Stores: answers, question index, marked questions

4. **Stats System**
   - Recalculates stats from current answers
   - Updates in real-time as answers change
   - Aggregates across all tests

## 📁 File Structure

### Frontend Files

#### `index.html`
- Main HTML structure
- Defines all screens (main-selection, test-selection, question-screen, etc.)
- Contains dialog modals (user settings, dashboard)

#### `app.js` (Main Application Logic)

**State Variables:**
```javascript
let currentTest = null;           // Current test number
let currentMode = null;           // 'review' or 'test'
let currentQuestions = [];        // Questions for current session
let currentQuestionIndex = 0;     // Current question index
let userAnswers = {};             // User's answers {questionId: [optionIds]}
let markedQuestions = new Set();  // Marked question IDs
let currentUser = null;           // User object with stats
```

**Key Functions:**

- **User Management**
  - `initUserSystem()`: Initialize or load user
  - `saveUser()`: Save user data to localStorage
  - `recalculateUserStats()`: Recalculate stats from answers
  - `updateDashboardStats()`: Update UI with stats

- **Navigation Flow**
  - `selectPracticeMode(mode)`: Choose domain or test mode
  - `selectSource(source)`: Choose Stephane or Dojo
  - `selectTest(number)`: Select specific test
  - `selectMode(mode)`: Choose review or test mode

- **Question Management**
  - `loadQuestion()`: Load and display current question
  - `updateOptionSelection()`: Handle answer selection
  - `submitAnswer()`: Submit answer and show feedback
  - `showAnswerFeedback()`: Display explanations

- **Progress Management**
  - `saveAndReturnToDashboard()`: Save progress and return
  - `loadSavedProgress()`: Load saved progress
  - `getSavedProgressForTest()`: Get progress for specific test
  - `clearSavedProgressForTest()`: Clear progress for test

#### `styles.css`
- Complete styling for all components
- Responsive design with media queries
- Color scheme: "earthy" palette
- Component-based organization

#### `question-loader.js`
- Dynamically loads questions from JSON files
- Falls back to `questions.js` if JSON files unavailable
- Supports async loading

#### `questions.js`
- Auto-generated from JSON files
- Contains all exam questions
- Format: `examQuestions = { test1: [...], test2: [...] }`

### Data Files

#### `questions/testX.json`
- Individual test question files
- JSON format with question structure
- One file per test

#### `questions/all_tests.json`
- Combined file with all tests
- Generated automatically
- Used for backup/reference

### Scripts

#### `scripts/extract_questions_from_pdf.py`
- Extracts questions from PDF/HTML files
- Parses question text, options, correct answers
- Generates JSON files
- Supports multiple PDF libraries

#### `scripts/regenerate_questions_js.py`
- Reads all `testX.json` files
- Generates `questions.js` file
- Maintains question structure

## 🔄 Application Flow

### Initialization

1. Page loads → `DOMContentLoaded` event
2. `initUserSystem()` → Load or create user
3. `autoLoadQuestions()` → Load questions from JSON/JS
4. `updateDashboardStats()` → Display user stats
5. Show main selection screen

### Test Flow

1. **Select Practice Mode**
   - User clicks "By Domain" or "By Test"
   - Navigate to appropriate selection screen

2. **Select Source** (if By Test)
   - Choose "Stephane" or "Dojo"
   - Load available tests for source

3. **Select Test**
   - Choose test number
   - Check for saved progress
   - Prompt to resume or restart

4. **Select Mode**
   - Choose "Review" or "Test"
   - Load questions
   - Start timer (if test mode)

5. **Answer Questions**
   - Select options
   - Submit answer
   - See feedback (review mode)
   - Navigate between questions

6. **Save/Return**
   - Save progress to localStorage
   - Return to dashboard
   - Stats update automatically

### Domain Review Flow

1. **Select Domain**
   - Choose one of 4 AWS domains
   - Load all questions from that domain across all tests
   - Start in review mode

2. **Answer Questions**
   - Same as test flow
   - All questions from selected domain

## 💾 Data Storage

### LocalStorage Keys

- `saa-c03-user`: User data and statistics
- `saa-c03-progress-test{number}`: Progress for specific test
- `saa-c03-progress-domain-{domain}`: Progress for domain review
- `saa-c03-current-progress`: Reference to current progress

### Data Structures

**User Object:**
```javascript
{
  name: "Student",
  createdAt: "2024-01-01T00:00:00.000Z",
  stats: {
    totalQuestionsAnswered: 0,
    totalCorrectAnswers: 0,
    testsCompleted: 0,
    domainsPracticed: Set(),
    questionsAnswered: Set(),
    lastActivity: "2024-01-01T00:00:00.000Z"
  }
}
```

**Progress Object:**
```javascript
{
  test: 1,
  mode: "review",
  questionIndex: 5,
  answers: { "1": [2], "2": [0, 1] },
  marked: [3, 7],
  startTime: "2024-01-01T00:00:00.000Z",
  timestamp: "2024-01-01T00:00:00.000Z"
}
```

## 🎨 UI Components

### Screens

1. **main-selection**: Initial screen with mode selection
2. **source-selection**: Choose test source (Stephane/Dojo)
3. **test-selection**: Choose specific test
4. **domain-selection**: Choose domain for review
5. **mode-selection**: Choose review or test mode
6. **question-screen**: Main question interface
7. **results-screen**: Test results and review

### Dialogs

1. **user-settings-dialog**: User settings and stats
2. **dashboard-dialog**: Return to dashboard options

### Question Components

- Question text display
- Option buttons (radio/checkbox)
- Explanation section (parsed from markdown)
- Navigation bar (question numbers)
- Progress indicators

## 🔐 Security Considerations

- **Client-Side Only**: No server-side validation
- **LocalStorage**: Data stored locally, not synced
- **No Authentication**: Single-user application
- **XSS Prevention**: HTML escaping in explanations

## ⚡ Performance

### Optimizations

- **Lazy Loading**: Questions loaded on demand
- **LocalStorage**: Fast local data access
- **Minimal Dependencies**: No heavy frameworks
- **Static Assets**: Served directly, no build step

### Potential Improvements

- Code splitting for large question banks
- Service worker for offline support
- Lazy loading of question images (if added)
- Virtual scrolling for large question lists

## 🧪 Testing Strategy

### Manual Testing Checklist

- [ ] All tests load correctly
- [ ] Questions display properly
- [ ] Answers can be selected
- [ ] Explanations show correctly
- [ ] Progress saves and loads
- [ ] Stats update correctly
- [ ] Navigation works
- [ ] Timer functions (test mode)
- [ ] Mobile responsive
- [ ] Cross-browser compatible

### Future Testing

- Unit tests for core functions
- Integration tests for flows
- E2E tests for complete scenarios
- Performance testing for large question banks

## 🔮 Future Architecture Considerations

### Potential Enhancements

1. **Backend Integration**
   - User accounts and sync
   - Shared progress across devices
   - Analytics and reporting

2. **Progressive Web App (PWA)**
   - Service worker
   - Offline support
   - Installable app

3. **Modular Architecture**
   - Component-based structure
   - Module bundler (Webpack/Vite)
   - TypeScript for type safety

4. **State Management**
   - Centralized state (Redux/Vuex)
   - Better state persistence
   - Undo/redo functionality

---

**Last Updated**: 2024
**Version**: 1.0
