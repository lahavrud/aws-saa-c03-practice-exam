// AWS SAA-C03 Practice Exam Application
let currentTest = null;
let currentMode = null;
let currentQuestions = [];
let currentQuestionIndex = 0;
let userAnswers = {};
let markedQuestions = new Set();
let testStartTime = null;
let testTimer = null;
let savedProgress = null;
let selectedDomain = null;
let selectedSource = null; // 'stephane', 'dojo', or 'sergey'
let currentTestDisplayNumber = null; // Display number (1, 2, 3...) for current test
let currentUser = null; // Current user object
let currentUserName = null; // Current user name (for localStorage keys)
let previousAnswers = {}; // Track previous answers to detect changes
const TEST_DURATION = 130 * 60 * 1000; // 130 minutes in milliseconds

// User System - Multi-User Support
function getAllUsers() {
    const usersJson = localStorage.getItem('saa-c03-users');
    return usersJson ? JSON.parse(usersJson) : [];
}

function saveUsersList(users) {
    localStorage.setItem('saa-c03-users', JSON.stringify(users));
}

function getUserKey(userName) {
    // Create a safe key from username (remove special chars, lowercase)
    return userName.toLowerCase().replace(/[^a-z0-9]/g, '-');
}

function initUserSystem() {
    // Show user selection screen first
    showUserSelection();
}

function showUserSelection() {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => screen.classList.add('hidden'));
    
    // Show user selection screen
    document.getElementById('user-selection').classList.remove('hidden');
    
    // Load and display users
    loadUsersList();
}

function loadUsersList() {
    const users = getAllUsers();
    const usersList = document.getElementById('users-list');
    usersList.innerHTML = '';
    
    if (users.length === 0) {
        usersList.innerHTML = '<p class="no-users">No users yet. Create one below!</p>';
        return;
    }
    
    users.forEach(userName => {
        const userDiv = document.createElement('div');
        userDiv.className = 'user-item';
        
        // Get user stats for display
        const userKey = getUserKey(userName);
        const userData = getUserData(userName);
        const stats = userData ? userData.stats : null;
        const questionsAnswered = stats ? stats.totalQuestionsAnswered : 0;
        const accuracy = stats && stats.totalQuestionsAnswered > 0
            ? Math.round((stats.totalCorrectAnswers / stats.totalQuestionsAnswered) * 100)
            : 0;
        
        userDiv.innerHTML = `
            <div class="user-item-content">
                <div class="user-item-name">${userName}</div>
                <div class="user-item-stats">
                    <span>${questionsAnswered} questions</span>
                    <span>${accuracy}% accuracy</span>
                </div>
            </div>
            <button class="user-select-btn" onclick="selectUser('${userName}')">Select</button>
        `;
        
        usersList.appendChild(userDiv);
    });
}

function selectUser(userName) {
    currentUserName = userName;
    const userKey = getUserKey(userName);
    const savedUser = localStorage.getItem(`saa-c03-user-${userKey}`);
    
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
    } else {
        // Create new user data
        currentUser = {
            name: userName,
            createdAt: new Date().toISOString(),
            stats: {
                totalQuestionsAnswered: 0,
                totalCorrectAnswers: 0,
                testsCompleted: 0,
                domainsPracticed: new Set(),
                questionsAnswered: new Set(),
                lastActivity: new Date().toISOString()
            }
        };
        saveUser();
    }
    
    // Convert Sets from storage
    if (currentUser.stats.domainsPracticed && !Array.isArray(currentUser.stats.domainsPracticed)) {
        currentUser.stats.domainsPracticed = Array.from(currentUser.stats.domainsPracticed);
    }
    if (currentUser.stats.questionsAnswered && !Array.isArray(currentUser.stats.questionsAnswered)) {
        currentUser.stats.questionsAnswered = Array.from(currentUser.stats.questionsAnswered);
    }
    
    // Convert back to Sets for runtime use
    if (Array.isArray(currentUser.stats.domainsPracticed)) {
        currentUser.stats.domainsPracticed = new Set(currentUser.stats.domainsPracticed);
    }
    if (Array.isArray(currentUser.stats.questionsAnswered)) {
        currentUser.stats.questionsAnswered = new Set(currentUser.stats.questionsAnswered);
    }
    
    // Hide user selection, show main selection
    document.getElementById('user-selection').classList.add('hidden');
    document.getElementById('main-selection').classList.remove('hidden');
    
    updateDashboardStats();
}

function createNewUser() {
    const nameInput = document.getElementById('new-user-name');
    const userName = nameInput.value.trim();
    
    if (!userName) {
        alert('Please enter a name');
        return;
    }
    
    if (userName.length > 50) {
        alert('Name must be 50 characters or less');
        return;
    }
    
    // Check if user already exists
    const users = getAllUsers();
    if (users.includes(userName)) {
        alert('User already exists! Please select them from the list.');
        return;
    }
    
    // Add to users list
    users.push(userName);
    saveUsersList(users);
    
    // Clear input
    nameInput.value = '';
    
    // Select the new user
    selectUser(userName);
}

function getUserData(userName) {
    const userKey = getUserKey(userName);
    const savedUser = localStorage.getItem(`saa-c03-user-${userKey}`);
    return savedUser ? JSON.parse(savedUser) : null;
}

function switchUser() {
    closeUserSettings();
    showUserSelection();
}

function saveUser() {
    if (!currentUser || !currentUserName) return;
    
    // Convert Sets to Arrays for JSON storage
    const userToSave = {
        ...currentUser,
        stats: {
            ...currentUser.stats,
            domainsPracticed: Array.from(currentUser.stats.domainsPracticed || []),
            questionsAnswered: Array.from(currentUser.stats.questionsAnswered || [])
        }
    };
    
    const userKey = getUserKey(currentUserName);
    localStorage.setItem(`saa-c03-user-${userKey}`, JSON.stringify(userToSave));
}

function recalculateUserStats(includeCurrentSession = true) {
    // Recalculate stats based on saved progress
    // If includeCurrentSession is true, also count current session answers (for real-time feedback during session)
    // If false, only count saved progress (for dashboard display when returning without saving)
    if (!currentUser) return;
    
    // Reset counters
    let totalQuestionsAnswered = 0;
    let totalCorrectAnswers = 0;
    const questionsAnsweredSet = new Set();
    const domainsPracticedSet = new Set();
    
    // Process current session answers only if includeCurrentSession is true
    // This allows real-time stats during session, but excludes unsaved answers when returning to dashboard
    if (includeCurrentSession && currentQuestions && currentQuestions.length > 0) {
        currentQuestions.forEach(question => {
            const questionKey = question.id.toString();
            const selectedAnswers = userAnswers[questionKey] || [];
            
            // Only count if question has an answer
            if (selectedAnswers.length > 0) {
                // Create unique question identifier
                const questionId = currentTest ? `test${currentTest}-q${question.id}` : `domain-${selectedDomain}-q${question.id}`;
                
                // Check if answer is correct
                const selectedSet = new Set(selectedAnswers.sort());
                const correctSet = new Set(question.correctAnswers.sort());
                const isCorrect = selectedSet.size === correctSet.size && 
                                [...selectedSet].every(id => correctSet.has(id));
                
                // Track this question (will overwrite if already exists from saved progress)
                questionsAnsweredSet.add(questionId);
                
                // Track correct answers (recalculate based on current answer)
                if (isCorrect) {
                    totalCorrectAnswers++;
                }
                
                // Track domains
                if (question.domain) {
                    domainsPracticedSet.add(question.domain);
                }
            }
        });
    }
    
    // Then, process all saved progress from other tests
    // This ensures we count questions from all tests, not just current one
    if (typeof examQuestions !== 'undefined' && currentUserName) {
        const userKey = getUserKey(currentUserName);
        // Check all tests: test1-test7 (Stephane), test8 (Dojo), test9-test26+ (Sergey)
        // Find max test number dynamically
        const allTestKeys = Object.keys(examQuestions).filter(key => key.startsWith('test'));
        const maxTestNum = Math.max(...allTestKeys.map(key => parseInt(key.replace('test', ''))));
        
        for (let testNum = 1; testNum <= maxTestNum; testNum++) {
            const progressKey = `saa-c03-progress-${userKey}-test${testNum}`;
            const saved = localStorage.getItem(progressKey);
            if (saved) {
                try {
                    const progress = JSON.parse(saved);
                    if (progress.answers && progress.test === testNum) {
                        // Get questions for this test
                        const testKey = `test${testNum}`;
                        const testQuestions = examQuestions[testKey];
                        if (testQuestions && testQuestions.length > 0) {
                            testQuestions.forEach(question => {
                                const questionKey = question.id.toString();
                                const selectedAnswers = progress.answers[questionKey] || [];
                                
                                // Only count if question has an answer and not already counted from current session
                                if (selectedAnswers.length > 0) {
                                    const questionId = `test${testNum}-q${question.id}`;
                                    
                                    // Skip if already counted from current session
                                    if (!questionsAnsweredSet.has(questionId)) {
                                        // Check if answer is correct
                                        const selectedSet = new Set(selectedAnswers.sort());
                                        const correctSet = new Set(question.correctAnswers.sort());
                                        const isCorrect = selectedSet.size === correctSet.size && 
                                                        [...selectedSet].every(id => correctSet.has(id));
                                        
                                        questionsAnsweredSet.add(questionId);
                                        
                                        if (isCorrect) {
                                            totalCorrectAnswers++;
                                        }
                                        
                                        if (question.domain) {
                                            domainsPracticedSet.add(question.domain);
                                        }
                                    }
                                }
                            });
                        }
                    }
                } catch (error) {
                    console.error(`Error processing saved progress for test ${testNum}:`, error);
                }
            }
        }
        
        // Also process domain review saved progress
        // Get all domain progress keys
        const domainProgressKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(`saa-c03-progress-${userKey}-domain-`)) {
                domainProgressKeys.push(key);
            }
        }
        
        // Process each domain review saved progress
        domainProgressKeys.forEach(progressKey => {
            const saved = localStorage.getItem(progressKey);
            if (saved) {
                try {
                    const progress = JSON.parse(saved);
                    if (progress.answers && progress.selectedDomain) {
                        // Get all questions from all tests for this domain
                        const allQuestions = [];
                        if (typeof examQuestions !== 'undefined') {
                            for (const testKey in examQuestions) {
                                if (examQuestions.hasOwnProperty(testKey) && testKey.startsWith('test')) {
                                    allQuestions.push(...examQuestions[testKey]);
                                }
                            }
                        }
                        const domainQuestions = allQuestions.filter(q => q.domain === progress.selectedDomain);
                        
                        if (domainQuestions && domainQuestions.length > 0) {
                            domainQuestions.forEach(question => {
                                const questionKey = question.id.toString();
                                const selectedAnswers = progress.answers[questionKey] || [];
                                
                                // Only count if question has an answer and not already counted
                                if (selectedAnswers.length > 0) {
                                    const questionId = `domain-${progress.selectedDomain}-q${question.id}`;
                                    
                                    // Skip if already counted from current session or other saved progress
                                    if (!questionsAnsweredSet.has(questionId)) {
                                        // Check if answer is correct
                                        const selectedSet = new Set(selectedAnswers.sort());
                                        const correctSet = new Set(question.correctAnswers.sort());
                                        const isCorrect = selectedSet.size === correctSet.size && 
                                                        [...selectedSet].every(id => correctSet.has(id));
                                        
                                        questionsAnsweredSet.add(questionId);
                                        
                                        if (isCorrect) {
                                            totalCorrectAnswers++;
                                        }
                                        
                                        if (question.domain) {
                                            domainsPracticedSet.add(question.domain);
                                        }
                                    }
                                }
                            });
                        }
                    }
                } catch (error) {
                    console.error(`Error processing saved domain progress:`, error);
                }
            }
        });
    }
    
    // Count total questions answered
    totalQuestionsAnswered = questionsAnsweredSet.size;
    
    // Update user stats
    currentUser.stats.totalQuestionsAnswered = totalQuestionsAnswered;
    currentUser.stats.totalCorrectAnswers = totalCorrectAnswers;
    currentUser.stats.questionsAnswered = questionsAnsweredSet;
    currentUser.stats.domainsPracticed = domainsPracticedSet;
    currentUser.stats.lastActivity = new Date().toISOString();
    
    saveUser();
    updateDashboardStats();
}

function updateUserStats(questionId, isCorrect, domain) {
    // Legacy function - now we use recalculateUserStats instead
    recalculateUserStats();
}

function markTestCompleted() {
    if (!currentUser) return;
    currentUser.stats.testsCompleted++;
    saveUser();
    updateDashboardStats();
}

function updateDashboardStats() {
    if (!currentUser) return;
    
    const accuracy = currentUser.stats.totalQuestionsAnswered > 0
        ? Math.round((currentUser.stats.totalCorrectAnswers / currentUser.stats.totalQuestionsAnswered) * 100)
        : 0;
    
    // Update dashboard stats
    const statCards = document.querySelectorAll('.stat-card');
    if (statCards.length >= 3) {
        statCards[0].querySelector('.stat-number').textContent = currentUser.stats.totalQuestionsAnswered;
        statCards[0].querySelector('.stat-label').textContent = 'Questions Answered';
        
        statCards[1].querySelector('.stat-number').textContent = `${accuracy}%`;
        statCards[1].querySelector('.stat-label').textContent = 'Accuracy';
        
        statCards[2].querySelector('.stat-number').textContent = currentUser.stats.testsCompleted;
        statCards[2].querySelector('.stat-label').textContent = 'Tests Completed';
    }
    
    // Update user name in header if element exists
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
        userNameElement.textContent = currentUser.name;
    }
}

// User Settings Functions
function showUserSettings() {
    if (!currentUser) return;
    
    const dialog = document.getElementById('user-settings-dialog');
    const nameInput = document.getElementById('user-name-input');
    const questionsAnswered = document.getElementById('settings-questions-answered');
    const accuracy = document.getElementById('settings-accuracy');
    const testsCompleted = document.getElementById('settings-tests-completed');
    const domainsPracticed = document.getElementById('settings-domains-practiced');
    
    nameInput.value = currentUser.name;
    questionsAnswered.textContent = currentUser.stats.totalQuestionsAnswered;
    
    const acc = currentUser.stats.totalQuestionsAnswered > 0
        ? Math.round((currentUser.stats.totalCorrectAnswers / currentUser.stats.totalQuestionsAnswered) * 100)
        : 0;
    accuracy.textContent = `${acc}%`;
    
    testsCompleted.textContent = currentUser.stats.testsCompleted;
    domainsPracticed.textContent = currentUser.stats.domainsPracticed.size || 0;
    
    dialog.classList.remove('hidden');
}

function closeUserSettings() {
    document.getElementById('user-settings-dialog').classList.add('hidden');
}

function saveUserSettings() {
    const nameInput = document.getElementById('user-name-input');
    const newName = nameInput.value.trim();
    
    if (newName && newName !== currentUser.name) {
        currentUser.name = newName;
        saveUser();
        updateDashboardStats();
    }
    
    closeUserSettings();
}

function resetUserData() {
    if (!confirm('Are you sure you want to reset all your progress? This cannot be undone.')) {
        return;
    }
    
    const userName = currentUser.name;
    currentUser = {
        name: userName,
        createdAt: new Date().toISOString(),
        stats: {
            totalQuestionsAnswered: 0,
            totalCorrectAnswers: 0,
            testsCompleted: 0,
            domainsPracticed: new Set(),
            questionsAnswered: new Set(),
            lastActivity: new Date().toISOString()
        }
    };
    
    saveUser();
    updateDashboardStats();
    closeUserSettings();
    
    // Clear all saved progress for current user only
    if (!currentUserName) return;
    
    const userKey = getUserKey(currentUserName);
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
            key.startsWith(`saa-c03-progress-${userKey}-test`) ||
            key.startsWith(`saa-c03-progress-${userKey}-domain-`) ||
            key === `saa-c03-current-progress-${userKey}`
        )) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Reset current state
    savedProgress = null;
    userAnswers = {};
    markedQuestions = new Set();
    
    // Reload test buttons if on test selection screen to update UI
    if (selectedSource) {
        loadAvailableTests();
    }
}

// SAA-C03 Domains
const DOMAINS = [
    "Design Secure Architectures",
    "Design Resilient Architectures",
    "Design High-Performing Architectures",
    "Design Cost-Optimized Architectures"
];

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize user system first
    initUserSystem();
    
    // Try to load questions from JSON files first (preferred method)
    if (typeof autoLoadQuestions !== 'undefined') {
        const loadedQuestions = await autoLoadQuestions();
        if (loadedQuestions) {
            window.examQuestions = loadedQuestions;
            console.log('✓ Loaded questions from JSON files');
        } else if (typeof examQuestions !== 'undefined') {
            // Fallback to questions.js if JSON files not available
            console.log('✓ Loaded questions from questions.js (fallback)');
        } else {
            console.error('Questions not loaded. Please ensure questions are available in the questions directory or questions.js is loaded.');
            return;
        }
    } else if (typeof examQuestions === 'undefined') {
        console.error('Neither question-loader.js nor questions.js loaded');
        return;
    }
    
    // Don't load tests here - wait for source selection
    // loadAvailableTests() will be called when a source is selected
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
});

// Organize tests by source
function organizeTestsBySource() {
    if (typeof examQuestions === 'undefined') {
        console.error('organizeTestsBySource: examQuestions is undefined');
        return { stephane: [], dojo: [], sergey: [] };
    }
    
    const organized = { stephane: [], dojo: [], sergey: [] };
    
    // Get all test keys
    const allTests = Object.keys(examQuestions)
        .filter(key => key.startsWith('test'))
        .sort((a, b) => {
            const numA = parseInt(a.replace('test', ''));
            const numB = parseInt(b.replace('test', ''));
            return numA - numB;
        });
    
    console.log('All test keys found:', allTests);
    
    // Organize tests: test1-test7 are Stephane, test8 is Dojo, test9-test26+ are Sergey
    allTests.forEach(testKey => {
        const testNumber = parseInt(testKey.replace('test', ''));
        if (testNumber <= 7) {
            organized.stephane.push({ key: testKey, number: testNumber });
        } else if (testNumber === 8) {
            organized.dojo.push({ key: testKey, number: testNumber });
        } else {
            organized.sergey.push({ key: testKey, number: testNumber });
        }
    });
    
    console.log('Organized tests:', organized);
    return organized;
}

function loadAvailableTests() {
    if (typeof examQuestions === 'undefined') {
        console.error('examQuestions not loaded');
        return;
    }
    
    const testButtonsContainer = document.getElementById('test-buttons-container');
    if (!testButtonsContainer) {
        console.error('test-buttons-container not found');
        return;
    }
    
    // Clear existing test buttons
    testButtonsContainer.innerHTML = '';
    
    // Get tests for selected source
    const organized = organizeTestsBySource();
    if (!organized) {
        testButtonsContainer.innerHTML = '<p>No tests available.</p>';
        return;
    }
    
    let testsForSource = [];
    if (selectedSource === 'stephane') {
        testsForSource = organized.stephane || [];
    } else if (selectedSource === 'dojo') {
        testsForSource = organized.dojo || [];
    } else if (selectedSource === 'sergey') {
        testsForSource = organized.sergey || [];
    } else {
        testButtonsContainer.innerHTML = '<p>Please select a source first.</p>';
        return;
    }
    
    if (testsForSource.length === 0) {
        testButtonsContainer.innerHTML = `<p>No tests available for ${selectedSource}.</p>`;
        console.log('No tests found for source:', selectedSource, 'Available:', organized);
        return;
    }
    
    console.log(`Loading ${testsForSource.length} tests for ${selectedSource}:`, testsForSource);
    
    // Create buttons for each test with source-specific numbering (1, 2, 3... for each source)
    testsForSource.forEach(({ key, number }, index) => {
        const questions = examQuestions[key] || [];
        const questionCount = questions.length;
        const displayNumber = index + 1; // Display number: 1, 2, 3... for this source
        const actualTestNumber = number; // Actual test number in examQuestions (e.g., 8 for first Dojo test)
        
        console.log(`Creating button for ${key}: ${questionCount} questions (display: Test ${displayNumber}, actual: test${actualTestNumber})`);
        
        if (questionCount === 0) {
            console.warn(`No questions found for ${key}`);
            return;
        }
        
        const savedProgress = getSavedProgressForTest(actualTestNumber);
        
        const testBtn = document.createElement('div');
        testBtn.className = 'test-btn-wrapper';
        
        const buttonContent = document.createElement('button');
        buttonContent.className = 'test-btn';
        buttonContent.onclick = () => {
            // Store display number for reference
            currentTestDisplayNumber = displayNumber;
            if (savedProgress) {
                if (confirm(`You have saved progress for this test (${savedProgress.mode} mode). Resume?`)) {
                    loadSavedProgress(actualTestNumber);
                } else {
                    selectTest(actualTestNumber);
                }
            } else {
                selectTest(actualTestNumber);
            }
        };
        
        buttonContent.innerHTML = `
            <div class="test-btn-header">
                <h3>Test ${displayNumber}</h3>
                <span class="test-count">${questionCount} Questions</span>
            </div>
            <p>Comprehensive practice exam covering all domains</p>
            ${savedProgress ? `<div class="test-progress-indicator">📌 Saved progress (${savedProgress.mode} mode, Q${savedProgress.questionIndex + 1}/${questionCount})</div>` : ''}
        `;
        
        testBtn.appendChild(buttonContent);
        
        // Add restart button if progress exists
        if (savedProgress) {
            const restartBtn = document.createElement('button');
            restartBtn.className = 'restart-test-btn';
            restartBtn.textContent = '🔄 Restart';
            restartBtn.onclick = (e) => {
                e.stopPropagation();
                if (confirm(`Are you sure you want to restart Test ${displayNumber}? Your saved progress will be lost.`)) {
                    clearSavedProgressForTest(actualTestNumber);
                    loadAvailableTests(); // Refresh the list
                }
            };
            testBtn.appendChild(restartBtn);
        }
        
        testButtonsContainer.appendChild(testBtn);
        console.log(`Added test button for Test ${displayNumber} (${key})`);
    });
    
    console.log(`Total buttons created: ${testButtonsContainer.children.length}`);
    
    // Update stats on main screen
    const totalQuestions = Object.keys(examQuestions)
        .filter(key => key.startsWith('test'))
        .reduce((sum, testKey) => sum + (examQuestions[testKey]?.length || 0), 0);
    
    const totalTests = Object.keys(examQuestions)
        .filter(key => key.startsWith('test')).length;
    
    const totalStat = document.getElementById('total-questions-stat');
    const testCountStat = document.getElementById('total-tests-stat');
    if (totalStat) totalStat.textContent = totalQuestions;
    if (testCountStat) testCountStat.textContent = totalTests;
}

// New flow: Main selection
function selectPracticeMode(mode) {
    if (mode === 'domain') {
        // Go directly to domain selection
        document.getElementById('main-selection').classList.add('hidden');
        document.getElementById('domain-selection').classList.remove('hidden');
    } else if (mode === 'test') {
        // Go to source selection
        document.getElementById('main-selection').classList.add('hidden');
        document.getElementById('source-selection').classList.remove('hidden');
    }
}

// Select source (Stephane or Dojo)
function selectSource(source) {
    console.log('selectSource called with:', source);
    
    try {
        selectedSource = source;
        
        // First, switch screens immediately - do this FIRST before anything else
        const sourceSelectionEl = document.getElementById('source-selection');
        const testSelectionEl = document.getElementById('test-selection');
        
        console.log('Screen elements:', { sourceSelectionEl, testSelectionEl });
        
        if (!sourceSelectionEl) {
            console.error('source-selection element not found!');
            alert('Error: Source selection screen not found. Please refresh the page.');
            return;
        }
        
        if (!testSelectionEl) {
            console.error('test-selection element not found!');
            alert('Error: Test selection screen not found. Please refresh the page.');
            return;
        }
        
        // Hide source selection and show test selection IMMEDIATELY
        sourceSelectionEl.classList.add('hidden');
        testSelectionEl.classList.remove('hidden');
        
        console.log('Screens switched. Now loading tests...');
        
        // Check if questions are loaded
        if (typeof examQuestions === 'undefined') {
            console.error('examQuestions is undefined');
            const container = document.getElementById('test-buttons-container');
            if (container) {
                container.innerHTML = '<p>Questions are still loading. Please wait a moment and try again.</p>';
            }
            return;
        }
        
        // Log available tests
        const testKeys = Object.keys(examQuestions).filter(k => k.startsWith('test'));
        console.log('Available test keys:', testKeys);
        console.log('Total tests:', testKeys.length);
        
        // Load tests for this source
        loadAvailableTests();
        
    } catch (error) {
        console.error('Error in selectSource:', error);
        console.error('Error stack:', error.stack);
        alert('An error occurred: ' + error.message + '\nCheck console for details.');
    }
}

// Make sure function is globally accessible
window.selectSource = selectSource;

function selectTest(testNumber) {
    currentTest = testNumber;
    currentQuestions = getTestQuestions(testNumber);
    
    if (!currentQuestions || currentQuestions.length === 0) {
        alert('Questions not loaded. Please ensure questions.js is properly loaded.');
        return;
    }
    
    document.getElementById('test-selection').classList.add('hidden');
    document.getElementById('mode-selection').classList.remove('hidden');
}

// Navigation functions
function goBackToMainSelection() {
    document.getElementById('main-selection').classList.remove('hidden');
    document.getElementById('source-selection').classList.add('hidden');
    document.getElementById('test-selection').classList.add('hidden');
    document.getElementById('domain-selection').classList.add('hidden');
    document.getElementById('mode-selection').classList.add('hidden');
    currentTest = null;
    selectedDomain = null;
    selectedSource = null;
}

function goBackToSourceSelection() {
    document.getElementById('source-selection').classList.remove('hidden');
    document.getElementById('test-selection').classList.add('hidden');
    currentTest = null;
}

function goBackToTestSelection() {
    document.getElementById('mode-selection').classList.add('hidden');
    document.getElementById('test-selection').classList.remove('hidden');
    currentTest = null;
}

function selectMode(mode) {
    currentMode = mode;
    currentQuestionIndex = 0;
    userAnswers = {};
    markedQuestions = new Set();
    selectedDomain = null;
    
    // Check for saved progress for this specific test
    if (currentTest) {
        const saved = getSavedProgressForTest(currentTest);
        if (saved && saved.mode === mode) {
            const displayNum = currentTestDisplayNumber || currentTest;
            if (confirm(`You have saved progress for Test ${displayNum} (${saved.mode} mode, Q${saved.questionIndex + 1}). Would you like to resume?`)) {
                loadSavedProgress(currentTest);
                return;
            } else {
                // User chose not to resume, clear the saved progress
                clearSavedProgressForTest(currentTest);
            }
        }
    }
    
    if (mode === 'test') {
        testStartTime = Date.now();
        startTimer();
    }
    
    document.getElementById('mode-selection').classList.add('hidden');
    document.getElementById('question-screen').classList.remove('hidden');
    
    buildQuestionNavbar();
    loadQuestion();
    updateStats();
    recalculateUserStats(); // Recalculate stats based on current answers
}

function selectDomainForReview(domain) {
    selectedDomain = domain;
    currentMode = 'review';
    currentQuestionIndex = 0;
    userAnswers = {};
    markedQuestions = new Set();
    
    // Combine questions from all tests for domain review
    const allQuestions = [];
    if (typeof examQuestions !== 'undefined') {
        for (const testKey in examQuestions) {
            if (examQuestions.hasOwnProperty(testKey) && testKey.startsWith('test')) {
                allQuestions.push(...examQuestions[testKey]);
            }
        }
    }
    
    currentQuestions = allQuestions.filter(q => q.domain === domain);
    
    if (currentQuestions.length === 0) {
        alert(`No questions found for domain: ${domain}`);
        goBackToMainSelection();
        return;
    }
    
    // Set currentTest to null since we're using questions from all tests
    currentTest = null;
    
    document.getElementById('domain-selection').classList.add('hidden');
    document.getElementById('question-screen').classList.remove('hidden');
    
    buildQuestionNavbar();
    loadQuestion();
    updateStats();
    recalculateUserStats(); // Recalculate stats based on current answers
}

function startTimer() {
    const timerElement = document.getElementById('timer');
    timerElement.classList.remove('hidden');
    
    testTimer = setInterval(() => {
        const elapsed = Date.now() - testStartTime;
        const remaining = TEST_DURATION - elapsed;
        
        if (remaining <= 0) {
            clearInterval(testTimer);
            submitTest();
            return;
        }
        
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        
        timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        if (remaining < 10 * 60 * 1000) { // Less than 10 minutes
            timerElement.classList.add('warning');
        }
    }, 1000);
}

function buildQuestionNavbar() {
    const questionGrid = document.getElementById('question-grid');
    questionGrid.innerHTML = '';
    
    currentQuestions.forEach((question, index) => {
        const navItem = document.createElement('div');
        navItem.className = 'question-nav-item';
        navItem.textContent = index + 1;
        navItem.onclick = () => jumpToQuestion(index);
        navItem.setAttribute('data-question-index', index);
        questionGrid.appendChild(navItem);
    });
    
    updateQuestionNavbar();
}

function updateQuestionNavbar() {
    const navItems = document.querySelectorAll('.question-nav-item');
    navItems.forEach((item, index) => {
        item.classList.remove('current', 'answered', 'marked', 'correct', 'incorrect');
        
        if (index === currentQuestionIndex) {
            item.classList.add('current');
        }
        
        const questionKey = currentQuestions[index].id.toString();
        const question = currentQuestions[index];
        const hasAnswer = userAnswers[questionKey] && userAnswers[questionKey].length > 0;
        
        if (hasAnswer) {
            item.classList.add('answered');
            
            // In review mode, show correct/incorrect status
            if (currentMode === 'review') {
                const selectedAnswers = userAnswers[questionKey] || [];
                const selectedSet = new Set(selectedAnswers.sort());
                const correctSet = new Set(question.correctAnswers.sort());
                const isCorrect = selectedSet.size === correctSet.size && 
                                [...selectedSet].every(id => correctSet.has(id));
                
                if (isCorrect) {
                    item.classList.add('correct');
                } else {
                    item.classList.add('incorrect');
                }
            }
        }
        
        if (markedQuestions.has(index)) {
            item.classList.add('marked');
        }
    });
}

function toggleMarkQuestion() {
    if (markedQuestions.has(currentQuestionIndex)) {
        markedQuestions.delete(currentQuestionIndex);
    } else {
        markedQuestions.add(currentQuestionIndex);
    }
    
    updateMarkButton();
    updateQuestionNavbar();
    updateStats();
}

function updateMarkButton() {
    const markBtn = document.getElementById('mark-btn');
    const markIcon = document.getElementById('mark-icon');
    
    if (markedQuestions.has(currentQuestionIndex)) {
        markBtn.classList.add('marked');
        markIcon.textContent = '★';
    } else {
        markBtn.classList.remove('marked');
        markIcon.textContent = '☆';
    }
}

function updateStats() {
    const answeredCount = Object.keys(userAnswers).filter(key => 
        userAnswers[key] && userAnswers[key].length > 0
    ).length;
    const remainingCount = currentQuestions.length - answeredCount;
    const markedCount = markedQuestions.size;
    
    document.getElementById('answered-count').textContent = answeredCount;
    document.getElementById('remaining-count').textContent = remainingCount;
    document.getElementById('marked-count').textContent = markedCount;
}

function jumpToQuestion(index) {
    if (index >= 0 && index < currentQuestions.length) {
        currentQuestionIndex = index;
        loadQuestion();
        // Scroll to top of question
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function toggleNavbar() {
    const questionGrid = document.getElementById('question-grid');
    questionGrid.classList.toggle('collapsed');
}

function handleKeyboardShortcuts(e) {
    // Only handle shortcuts when on question screen
    const questionScreen = document.getElementById('question-screen');
    if (questionScreen.classList.contains('hidden')) {
        return;
    }
    
    // Prevent shortcuts when typing in inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }
    
    switch(e.key) {
        case 'ArrowLeft':
            e.preventDefault();
            if (currentQuestionIndex > 0) {
                previousQuestion();
            }
            break;
        case 'ArrowRight':
            e.preventDefault();
            if (currentQuestionIndex < currentQuestions.length - 1) {
                nextQuestion();
            }
            break;
        case 'Enter':
            if (currentMode === 'review') {
                e.preventDefault();
                submitAnswer();
            }
            break;
    }
}

function loadQuestion() {
    if (currentQuestionIndex >= currentQuestions.length) {
        if (currentMode === 'test') {
            submitTest();
        } else {
            showResults();
        }
        return;
    }
    
    const question = currentQuestions[currentQuestionIndex];
    const questionNumber = currentQuestionIndex + 1;
    
    // Update progress
    const progress = (questionNumber / currentQuestions.length) * 100;
    document.getElementById('progress').style.width = progress + '%';
    
    // Update question number
    document.getElementById('question-number').textContent = `Question ${questionNumber}`;
    document.getElementById('question-count').textContent = `of ${currentQuestions.length}`;
    
    // Update domain badge
    const domainBadge = document.getElementById('question-domain');
    if (question.domain) {
        domainBadge.textContent = question.domain.replace('Design ', '');
        domainBadge.classList.remove('hidden');
    } else {
        domainBadge.classList.add('hidden');
    }
    
    // Update navbar
    updateQuestionNavbar();
    updateMarkButton();
    updateStats();
    
    // Set question text
    document.getElementById('question-text').textContent = question.text;
    
    // Clear and populate options
    const optionsContainer = document.getElementById('options');
    optionsContainer.innerHTML = '';
    
    const isMultipleChoice = question.correctAnswers && question.correctAnswers.length > 1;
    const inputType = isMultipleChoice ? 'checkbox' : 'radio';
    const inputName = `question-${question.id}`;
    
    question.options.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option';
        
        const input = document.createElement('input');
        input.type = inputType;
        input.name = inputName;
        input.value = option.id;
        input.id = `option-${question.id}-${option.id}`;
        
        const label = document.createElement('label');
        label.htmlFor = input.id;
        label.textContent = option.text;
        
        label.insertBefore(input, label.firstChild);
        optionDiv.appendChild(label);
        
        // Check if this option was previously selected
        const questionKey = question.id.toString();
        if (userAnswers[questionKey] && userAnswers[questionKey].includes(option.id)) {
            input.checked = true;
            optionDiv.classList.add('selected');
        }
        
        // Add click handler
        optionDiv.addEventListener('click', function(e) {
            if (e.target.tagName !== 'INPUT') {
                input.checked = !input.checked;
            }
            updateOptionSelection(question.id, option.id, input.checked, isMultipleChoice);
        });
        
        input.addEventListener('change', function() {
            updateOptionSelection(question.id, option.id, input.checked, isMultipleChoice);
        });
        
        optionsContainer.appendChild(optionDiv);
    });
    
    // Check if this question has been answered (has saved answers)
    const questionKey = question.id.toString();
    const hasAnswer = userAnswers[questionKey] && userAnswers[questionKey].length > 0;
    
    // Hide explanation initially
    const explanationDiv = document.getElementById('explanation');
    explanationDiv.classList.add('hidden');
    
    // Update navigation buttons
    const prevBtn = document.getElementById('prev-btn');
    const submitBtn = document.getElementById('submit-btn');
    const nextBtn = document.getElementById('next-btn');
    
    prevBtn.disabled = currentQuestionIndex === 0;
    
    if (currentMode === 'review') {
        // In review mode, if question has been answered, show feedback automatically
        if (hasAnswer) {
            // Disable inputs and show feedback
            const inputs = optionsContainer.querySelectorAll('input');
            inputs.forEach(input => {
                input.disabled = true;
            });
            
            // Show answer feedback
            showAnswerFeedback(question, userAnswers[questionKey]);
            
            // Show next button instead of submit
            submitBtn.classList.add('hidden');
            nextBtn.classList.remove('hidden');
        } else {
            submitBtn.textContent = 'Check Answer';
            nextBtn.classList.add('hidden');
            submitBtn.classList.remove('hidden');
        }
    } else {
        submitBtn.textContent = currentQuestionIndex === currentQuestions.length - 1 ? 'Submit Test' : 'Next Question';
        nextBtn.classList.add('hidden');
        submitBtn.classList.remove('hidden');
    }
}

function updateOptionSelection(questionId, optionId, isSelected, isMultipleChoice) {
    const questionKey = questionId.toString();
    
    // Store previous answer state
    const previousAnswer = userAnswers[questionKey] ? [...userAnswers[questionKey]] : [];
    
    if (!userAnswers[questionKey]) {
        userAnswers[questionKey] = [];
    }
    
    if (isMultipleChoice) {
        if (isSelected) {
            if (!userAnswers[questionKey].includes(optionId)) {
                userAnswers[questionKey].push(optionId);
            }
        } else {
            userAnswers[questionKey] = userAnswers[questionKey].filter(id => id !== optionId);
        }
    } else {
        userAnswers[questionKey] = isSelected ? [optionId] : [];
    }
    
    // Check if answer changed
    const currentAnswer = userAnswers[questionKey] || [];
    const answerChanged = JSON.stringify(previousAnswer.sort()) !== JSON.stringify(currentAnswer.sort());
    
    // Update visual selection
    const options = document.querySelectorAll(`.option`);
    options.forEach(opt => {
        const input = opt.querySelector('input');
        if (input && input.checked) {
            opt.classList.add('selected');
        } else {
            opt.classList.remove('selected');
        }
    });
    
    // Update navbar to show answered status
    updateQuestionNavbar();
    updateStats();
    
    // Recalculate user stats whenever answer changes
    if (answerChanged) {
        recalculateUserStats();
    }
}

function submitAnswer() {
    const question = currentQuestions[currentQuestionIndex];
    const questionKey = question.id.toString();
    const selectedAnswers = userAnswers[questionKey] || [];
    
    if (currentMode === 'review') {
        // Show explanation and highlight correct/incorrect answers
        showAnswerFeedback(question, selectedAnswers);
        
        // Show next button
        document.getElementById('submit-btn').classList.add('hidden');
        document.getElementById('next-btn').classList.remove('hidden');
    } else {
        // Test mode - just move to next question
        nextQuestion();
    }
}

function showAnswerFeedback(question, selectedAnswers) {
    const options = document.querySelectorAll('.option');
    const correctOptions = [];
    const incorrectSelectedOptions = [];
    const incorrectOptions = [];
    
    // Check if answer is correct
    const selectedSet = new Set(selectedAnswers.sort());
    const correctSet = new Set(question.correctAnswers.sort());
    const isCorrect = selectedSet.size === correctSet.size && 
                    [...selectedSet].every(id => correctSet.has(id));
    
    // Recalculate user stats based on current answers
    recalculateUserStats();
    
    options.forEach(opt => {
        const input = opt.querySelector('input');
        if (!input) return;
        
        const optionId = parseInt(input.value);
        const isCorrectOption = question.correctAnswers.includes(optionId);
        const isSelected = selectedAnswers.includes(optionId);
        
        opt.classList.remove('correct', 'incorrect', 'selected');
        
        if (isCorrectOption) {
            opt.classList.add('correct');
            correctOptions.push({
                text: question.options[optionId].text,
                id: optionId
            });
        } else if (isSelected && !isCorrectOption) {
            opt.classList.add('incorrect');
            incorrectSelectedOptions.push({
                text: question.options[optionId].text,
                id: optionId
            });
        } else if (!isCorrectOption) {
            incorrectOptions.push({
                text: question.options[optionId].text,
                id: optionId
            });
        }
        
        // Disable inputs
        input.disabled = true;
    });
    
    // Show detailed explanation
    const explanationDiv = document.getElementById('explanation');
    if (explanationDiv) {
        explanationDiv.classList.remove('hidden');
    }
    
    const correctExplanationDiv = document.getElementById('correct-explanation');
    const incorrectExplanationDiv = document.getElementById('incorrect-explanation');
    
    // Parse explanation text to extract explanations for each option
    const optionExplanations = {};
    if (question.explanation) {
        // Split by "**Why option X is correct/incorrect:**" markers
        const parts = question.explanation.split(/\*\*Why option (\d+) is (correct|incorrect):\*\*/);
        for (let i = 1; i < parts.length; i += 3) {
            if (i + 2 < parts.length) {
                const optionId = parseInt(parts[i]);
                const type = parts[i + 1]; // "correct" or "incorrect"
                const explanationText = parts[i + 2].trim();
                optionExplanations[optionId] = {
                    type: type,
                    text: explanationText
                };
            }
        }
    }
    
    // Build correct answer explanation
    let correctHtml = '<div class="correct-explanation"><h4 class="explanation-title correct-title">✓ Correct Answer' + (correctOptions.length > 1 ? 's' : '') + ':</h4>';
    correctOptions.forEach(opt => {
        const explanation = optionExplanations[opt.id];
        if (explanation && explanation.type === 'correct') {
            // Escape HTML and format newlines
            let formattedText = explanation.text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\n\n/g, '</p><p class="explanation-detail">')
                .replace(/\n/g, '<br>');
            correctHtml += `<div class="option-explanation"><strong>${opt.text}</strong><p class="explanation-detail">${formattedText}</p></div>`;
        } else {
            correctHtml += `<div class="option-explanation"><strong>${opt.text}</strong><p class="explanation-detail">This is the correct answer because it best addresses all the requirements described in the scenario.</p></div>`;
        }
    });
    correctHtml += '</div>';
    correctExplanationDiv.innerHTML = correctHtml;
    
    // Build incorrect answer explanation
    const allIncorrectOptions = [...incorrectSelectedOptions, ...incorrectOptions];
    if (allIncorrectOptions.length > 0) {
        let incorrectHtml = '<div class="incorrect-explanation"><h4 class="explanation-title incorrect-title">✗ Why Other Options Are Incorrect:</h4>';
        
        allIncorrectOptions.forEach(opt => {
            const explanation = optionExplanations[opt.id];
            if (explanation && explanation.type === 'incorrect') {
                // Escape HTML and format newlines
                let formattedText = explanation.text
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/\n\n/g, '</p><p class="explanation-detail">')
                    .replace(/\n/g, '<br>');
                incorrectHtml += `<div class="option-explanation"><strong>${opt.text}</strong><p class="explanation-detail">${formattedText}</p></div>`;
            } else {
                incorrectHtml += `<div class="option-explanation"><strong>${opt.text}</strong><p class="explanation-detail">This option is incorrect because it does not meet the specific requirements outlined in the scenario.</p></div>`;
            }
        });
        
        incorrectHtml += '</div>';
        incorrectExplanationDiv.innerHTML = incorrectHtml;
    } else {
        incorrectExplanationDiv.innerHTML = '';
    }
    
    explanationDiv.classList.remove('hidden');
}

function nextQuestion() {
    currentQuestionIndex++;
    loadQuestion();
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        loadQuestion();
    }
}

function submitTest() {
    if (currentMode === 'test') {
        // Confirm submission
        if (currentQuestionIndex < currentQuestions.length - 1) {
            const unanswered = currentQuestions.length - Object.keys(userAnswers).length;
            if (unanswered > 0 && !confirm(`You have ${unanswered} unanswered questions. Are you sure you want to submit?`)) {
                return;
            }
        }
        
        clearInterval(testTimer);
        document.getElementById('timer').classList.add('hidden');
    }
    
    showResults();
}

function showResults() {
    document.getElementById('question-screen').classList.add('hidden');
    document.getElementById('results-screen').classList.remove('hidden');
    
    // Mark test as completed if in test mode
    if (currentMode === 'test') {
        markTestCompleted();
    }
    
    // Calculate scores
    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;
    const domainScores = {};
    
    DOMAINS.forEach(domain => {
        domainScores[domain] = { correct: 0, total: 0 };
    });
    
    currentQuestions.forEach(question => {
        const questionKey = question.id.toString();
        const selectedAnswers = userAnswers[questionKey] || [];
        const correctAnswers = question.correctAnswers || [];
        
        if (selectedAnswers.length === 0) {
            unanswered++;
        } else {
            // Check if answers match (order doesn't matter for multiple choice)
            const selectedSet = new Set(selectedAnswers.sort());
            const correctSet = new Set(correctAnswers.sort());
            
            const isCorrect = selectedSet.size === correctSet.size && 
                            [...selectedSet].every(id => correctSet.has(id));
            
            if (isCorrect) {
                correct++;
            } else {
                incorrect++;
            }
        }
        
        // Update domain scores
        const domain = question.domain || DOMAINS[0];
        if (!domainScores[domain]) {
            domainScores[domain] = { correct: 0, total: 0 };
        }
        domainScores[domain].total++;
        
        const questionKey2 = question.id.toString();
        const selectedAnswers2 = userAnswers[questionKey2] || [];
        const correctAnswers2 = question.correctAnswers || [];
        
        if (selectedAnswers2.length > 0) {
            const selectedSet2 = new Set(selectedAnswers2.sort());
            const correctSet2 = new Set(correctAnswers2.sort());
            const isCorrect2 = selectedSet2.size === correctSet2.size && 
                             [...selectedSet2].every(id => correctSet2.has(id));
            if (isCorrect2) {
                domainScores[domain].correct++;
            }
        }
    });
    
    const total = currentQuestions.length;
    const score = ((correct / total) * 100).toFixed(1);
    
    // Update score display
    document.getElementById('total-score').textContent = score + '%';
    document.getElementById('correct-count').textContent = correct;
    document.getElementById('incorrect-count').textContent = incorrect;
    document.getElementById('unanswered-count').textContent = unanswered;
    
    // Update domain breakdown
    const domainBreakdown = document.getElementById('domain-breakdown');
    domainBreakdown.innerHTML = '';
    
    DOMAINS.forEach(domain => {
        const domainData = domainScores[domain];
        if (domainData.total > 0) {
            const domainScore = ((domainData.correct / domainData.total) * 100).toFixed(1);
            
            const domainItem = document.createElement('div');
            domainItem.className = 'domain-item';
            domainItem.innerHTML = `
                <span class="domain-name">${domain}</span>
                <span class="domain-score">${domainScore}% (${domainData.correct}/${domainData.total})</span>
            `;
            domainBreakdown.appendChild(domainItem);
        }
    });
    
    // Show review questions
    showReviewQuestions();
}

function showReviewQuestions() {
    const reviewContainer = document.getElementById('review-questions');
    reviewContainer.innerHTML = '';
    
    currentQuestions.forEach((question, index) => {
        const questionKey = question.id.toString();
        const selectedAnswers = userAnswers[questionKey] || [];
        const correctAnswers = question.correctAnswers || [];
        
        const selectedSet = new Set(selectedAnswers.sort());
        const correctSet = new Set(correctAnswers.sort());
        const isCorrect = selectedAnswers.length > 0 && 
                         selectedSet.size === correctSet.size && 
                         [...selectedSet].every(id => correctSet.has(id));
        
        const reviewItem = document.createElement('div');
        reviewItem.className = `review-item ${selectedAnswers.length === 0 ? 'unanswered' : (isCorrect ? 'correct' : 'incorrect')}`;
        
        const selectedText = selectedAnswers.length > 0 
            ? question.options.filter(opt => selectedAnswers.includes(opt.id)).map(opt => opt.text).join(', ')
            : 'Not answered';
        
        const correctText = question.options.filter(opt => correctAnswers.includes(opt.id)).map(opt => opt.text).join(', ');
        
        reviewItem.innerHTML = `
            <div class="review-question">Q${index + 1}: ${question.text.substring(0, 100)}...</div>
            <div class="review-answer"><strong>Your answer:</strong> ${selectedText}</div>
            <div class="review-answer"><strong>Correct answer:</strong> ${correctText}</div>
        `;
        
        reviewContainer.appendChild(reviewItem);
    });
}

function reviewAnswers() {
    // Scroll to review section
    document.getElementById('review-questions').scrollIntoView({ behavior: 'smooth' });
}

function showDashboardDialog() {
    document.getElementById('dashboard-dialog').classList.remove('hidden');
}

function closeDashboardDialog() {
    document.getElementById('dashboard-dialog').classList.add('hidden');
}

function saveAndReturnToDashboard() {
    // Save progress to localStorage per test
    if (currentTest) {
        const progress = {
            test: currentTest,
            mode: currentMode,
            questionIndex: currentQuestionIndex,
            answers: userAnswers,
            marked: Array.from(markedQuestions),
            startTime: testStartTime,
            selectedDomain: selectedDomain,
            source: selectedSource,
            timestamp: new Date().toISOString()
        };
        
        // Save progress with test-specific key (user-specific)
        if (currentUserName) {
            const userKey = getUserKey(currentUserName);
            const progressKey = `saa-c03-progress-${userKey}-test${currentTest}`;
            localStorage.setItem(progressKey, JSON.stringify(progress));
            savedProgress = progress;
            
            // Also save a reference to the current test progress
            localStorage.setItem(`saa-c03-current-progress-${userKey}`, progressKey);
        }
    } else if (selectedDomain) {
        // Save domain review progress
        const progress = {
            test: null,
            mode: currentMode,
            questionIndex: currentQuestionIndex,
            answers: userAnswers,
            marked: Array.from(markedQuestions),
            startTime: testStartTime,
            selectedDomain: selectedDomain,
            timestamp: new Date().toISOString()
        };
        
        if (currentUserName) {
            const userKey = getUserKey(currentUserName);
            const progressKey = `saa-c03-progress-${userKey}-domain-${selectedDomain.replace(/\s+/g, '-')}`;
            localStorage.setItem(progressKey, JSON.stringify(progress));
            savedProgress = progress;
            localStorage.setItem(`saa-c03-current-progress-${userKey}`, progressKey);
        }
    }
    
    if (testTimer) {
        clearInterval(testTimer);
        testTimer = null;
    }
    
    // Recalculate stats after saving (include current session since it's now saved)
    recalculateUserStats(true);
    
    closeDashboardDialog();
    returnToDashboard();
}

function returnToDashboardWithoutSaving() {
    if (testTimer) {
        clearInterval(testTimer);
        testTimer = null;
    }
    
    // Restore to last saved progress (discard unsaved changes)
    if (currentTest) {
        const saved = getSavedProgressForTest(currentTest);
        if (saved) {
            // Restore saved state
            savedProgress = saved;
            currentQuestionIndex = saved.questionIndex || 0;
            userAnswers = saved.answers || {};
            markedQuestions = new Set(saved.marked || []);
            testStartTime = saved.startTime ? new Date(saved.startTime) : Date.now();
            
            // Save the restored state back (to keep it as the current saved state)
            if (currentUserName) {
                const userKey = getUserKey(currentUserName);
                const progressKey = `saa-c03-progress-${userKey}-test${currentTest}`;
                localStorage.setItem(progressKey, JSON.stringify(savedProgress));
                localStorage.setItem(`saa-c03-current-progress-${userKey}`, progressKey);
            }
            
            // Recalculate stats based on restored answers (only saved progress, not current session)
            recalculateUserStats(false);
        } else {
            // No saved progress exists, clear everything
            userAnswers = {};
            markedQuestions = new Set();
            savedProgress = null;
            localStorage.removeItem('saa-c03-current-progress');
            // Recalculate stats (only saved progress, not current session)
            recalculateUserStats(false);
        }
    } else if (selectedDomain && currentUserName) {
        // For domain review, restore saved progress if it exists
        const userKey = getUserKey(currentUserName);
        const progressKey = `saa-c03-progress-${userKey}-domain-${selectedDomain.replace(/\s+/g, '-')}`;
        const saved = localStorage.getItem(progressKey);
        if (saved) {
            try {
                const progress = JSON.parse(saved);
                savedProgress = progress;
                currentQuestionIndex = progress.questionIndex || 0;
                userAnswers = progress.answers || {};
                markedQuestions = new Set(progress.marked || []);
                
                // Save the restored state back
                localStorage.setItem(progressKey, JSON.stringify(progress));
                localStorage.setItem(`saa-c03-current-progress-${userKey}`, progressKey);
                
                // Recalculate stats based on restored answers (only saved progress, not current session)
                recalculateUserStats(false);
            } catch (error) {
                console.error('Error restoring domain progress:', error);
                // Clear on error
                userAnswers = {};
                markedQuestions = new Set();
                savedProgress = null;
                localStorage.removeItem(progressKey);
                localStorage.removeItem(`saa-c03-current-progress-${userKey}`);
                // Recalculate stats (only saved progress, not current session)
                recalculateUserStats(false);
            }
        } else {
            // No saved progress exists, clear everything
            userAnswers = {};
            markedQuestions = new Set();
            savedProgress = null;
            if (currentUserName) {
                const userKey = getUserKey(currentUserName);
                localStorage.removeItem(`saa-c03-current-progress-${userKey}`);
            }
            // Recalculate stats (only saved progress, not current session)
            recalculateUserStats(false);
        }
    } else {
        // No test or domain, just clear
        userAnswers = {};
        markedQuestions = new Set();
        savedProgress = null;
        if (currentUserName) {
            const userKey = getUserKey(currentUserName);
            localStorage.removeItem(`saa-c03-current-progress-${userKey}`);
        }
        // Recalculate stats (only saved progress, not current session)
        recalculateUserStats(false);
    }
    
    closeDashboardDialog();
    returnToDashboard();
}

function returnToDashboard() {
    // Hide all screens
    document.getElementById('question-screen').classList.add('hidden');
    document.getElementById('results-screen').classList.add('hidden');
    document.getElementById('mode-selection').classList.add('hidden');
    document.getElementById('domain-selection').classList.add('hidden');
    document.getElementById('source-selection').classList.add('hidden');
    document.getElementById('test-selection').classList.add('hidden');
    document.getElementById('user-selection').classList.add('hidden');
    document.getElementById('timer').classList.add('hidden');
    
    // Show main selection (only if user is logged in)
    if (currentUser && currentUserName) {
        document.getElementById('main-selection').classList.remove('hidden');
        // Recalculate stats based only on saved progress (not current session)
        recalculateUserStats(false);
        updateDashboardStats();
    } else {
        showUserSelection();
    }
    
    // Reset state
    currentTest = null;
    selectedSource = null;
    selectedDomain = null;
}

function getSavedProgressForTest(testNumber) {
    if (!currentUserName) return null;
    const userKey = getUserKey(currentUserName);
    const progressKey = `saa-c03-progress-${userKey}-test${testNumber}`;
    const saved = localStorage.getItem(progressKey);
    if (!saved) return null;
    
    try {
        return JSON.parse(saved);
    } catch (error) {
        console.error('Error parsing saved progress:', error);
        return null;
    }
}

function clearSavedProgressForTest(testNumber) {
    if (!currentUserName) return;
    const userKey = getUserKey(currentUserName);
    const progressKey = `saa-c03-progress-${userKey}-test${testNumber}`;
    localStorage.removeItem(progressKey);
    
    // Clear current progress reference if it matches
    const currentProgressKey = localStorage.getItem(`saa-c03-current-progress-${userKey}`);
    if (currentProgressKey === progressKey) {
        localStorage.removeItem(`saa-c03-current-progress-${userKey}`);
    }
    
    // Reload test buttons to update UI
    if (selectedSource) {
        loadAvailableTests();
    }
}

function loadSavedProgress(testNumber) {
    if (!currentUserName) return false;
    const userKey = getUserKey(currentUserName);
    
    // Load progress for specific test or current progress
    let progressKey;
    if (testNumber) {
        progressKey = `saa-c03-progress-${userKey}-test${testNumber}`;
    } else {
        progressKey = localStorage.getItem(`saa-c03-current-progress-${userKey}`);
    }
    
    if (!progressKey) return false;
    
    const saved = localStorage.getItem(progressKey);
    if (!saved) return false;
    
    try {
        const progress = JSON.parse(saved);
        savedProgress = progress;
        currentTest = progress.test;
        currentMode = progress.mode;
        currentQuestionIndex = progress.questionIndex || 0;
        userAnswers = progress.answers || {};
        markedQuestions = new Set(progress.marked || []);
        selectedDomain = progress.selectedDomain;
        selectedSource = progress.source || null;
        testStartTime = progress.startTime ? new Date(progress.startTime) : Date.now();
        
        // Reload questions
        // After loading, recalculate stats based on loaded answers
        setTimeout(() => {
            recalculateUserStats();
        }, 100);
        if (selectedDomain) {
            // Get all questions from all tests for domain review
            const allQuestions = [];
            if (typeof examQuestions !== 'undefined') {
                for (const testKey in examQuestions) {
                    if (examQuestions.hasOwnProperty(testKey) && testKey.startsWith('test')) {
                        allQuestions.push(...examQuestions[testKey]);
                    }
                }
            }
            currentQuestions = allQuestions.filter(q => q.domain === selectedDomain);
        } else {
            currentQuestions = getTestQuestions(currentTest);
        }
        
        if (currentMode === 'test') {
            startTimer();
        }
        
        // Hide all selection screens
        document.getElementById('main-selection').classList.add('hidden');
        document.getElementById('mode-selection').classList.add('hidden');
        document.getElementById('domain-selection').classList.add('hidden');
        document.getElementById('source-selection').classList.add('hidden');
        document.getElementById('test-selection').classList.add('hidden');
        
        // Show question screen
        document.getElementById('question-screen').classList.remove('hidden');
        
        buildQuestionNavbar();
        loadQuestion();
        updateStats();
        recalculateUserStats(); // Recalculate stats based on loaded answers
        return true;
    } catch (error) {
        console.error('Error loading saved progress:', error);
        localStorage.removeItem(progressKey);
        return false;
    }
}

function restartTest() {
    // Reset everything
    currentTest = null;
    currentMode = null;
    currentQuestions = [];
    currentQuestionIndex = 0;
    userAnswers = {};
    markedQuestions = new Set();
    testStartTime = null;
    savedProgress = null;
    selectedDomain = null;
    
    if (testTimer) {
        clearInterval(testTimer);
        testTimer = null;
    }
    
    // Clear saved progress
    localStorage.removeItem('saa-c03-progress');
    
    // Show test selection
    document.getElementById('results-screen').classList.add('hidden');
    document.getElementById('test-selection').classList.remove('hidden');
    document.getElementById('timer').classList.add('hidden');
}
