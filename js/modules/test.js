// Test/Exam Management Module
const TestManager = (function() {
    'use strict';
    
    return {
        // Organize tests by source
        organizeTestsBySource: () => {
            // Check both window.examQuestions and global examQuestions
            const questions = window.examQuestions || (typeof examQuestions !== 'undefined' ? examQuestions : undefined);
            
            if (!questions) {
                console.error('organizeTestsBySource: examQuestions is undefined');
                return { stephane: [], dojo: [], sergey: [] };
            }
            
            const organized = { stephane: [], dojo: [], sergey: [] };
            const allTests = Object.keys(questions)
                .filter(key => key.startsWith('test'))
                .sort((a, b) => {
                    const numA = parseInt(a.replace('test', ''));
                    const numB = parseInt(b.replace('test', ''));
                    return numA - numB;
                });
            
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
            
            return organized;
        },
        
        // Load available tests for selected source
        loadAvailableTests: () => {
            // Check both window.examQuestions and global examQuestions
            const questions = window.examQuestions || (typeof examQuestions !== 'undefined' ? examQuestions : undefined);
            
            if (!questions) {
                console.error('examQuestions not loaded');
                const testButtonsContainer = document.getElementById('test-buttons-container');
                if (testButtonsContainer) {
                    testButtonsContainer.innerHTML = `
                        <div class="empty-state" role="alert">
                            <div class="empty-state-icon">⚠️</div>
                            <h3>Unable to Load Tests</h3>
                            <p>Questions could not be loaded. Please refresh the page and try again.</p>
                            <button class="empty-state-cta" onclick="location.reload()">Refresh Page</button>
                        </div>
                    `;
                }
                if (typeof window.handleError === 'function') {
                    window.handleError(new Error('Questions not loaded'), 'Failed to load test questions. Please refresh the page.');
                }
                return;
            }
            
            const testButtonsContainer = document.getElementById('test-buttons-container');
            if (!testButtonsContainer) {
                console.error('test-buttons-container not found');
                return;
            }
            
            testButtonsContainer.innerHTML = '';
            
            const organized = TestManager.organizeTestsBySource();
            const selectedSource = AppState.getSelectedSource();
            
            let testsForSource = [];
            if (selectedSource === Config.TEST_SOURCES.STEPHANE) {
                testsForSource = organized.stephane || [];
            } else if (selectedSource === Config.TEST_SOURCES.DOJO) {
                testsForSource = organized.dojo || [];
            } else if (selectedSource === Config.TEST_SOURCES.SERGEY) {
                testsForSource = organized.sergey || [];
            } else {
                testButtonsContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">📚</div>
                        <h3>Select a Source</h3>
                        <p>Please go back and select a test source first.</p>
                    </div>
                `;
                return;
            }
            
            if (testsForSource.length === 0) {
                testButtonsContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">📝</div>
                        <h3>No Tests Available</h3>
                        <p>No tests are currently available for ${selectedSource}.</p>
                        <button class="empty-state-cta" onclick="goBackToSourceSelection()">Choose Another Source</button>
                    </div>
                `;
                return;
            }
            
            // Create buttons for each test
            testsForSource.forEach(({ key, number }, index) => {
                const testQuestions = questions[key] || [];
                const questionCount = testQuestions.length;
                const displayNumber = index + 1;
                const actualTestNumber = number;
                
                if (questionCount === 0) {
                    console.warn(`No questions found for ${key}`);
                    return;
                }
                
                const savedProgress = ProgressManager.getSavedProgressForTest(actualTestNumber);
                
                const testBtn = document.createElement('div');
                testBtn.className = 'test-btn-wrapper';
                
                const buttonContent = document.createElement('button');
                buttonContent.className = 'test-btn';
                buttonContent.type = 'button'; // Prevent form submission
                buttonContent.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    AppState.setCurrentTestDisplayNumber(displayNumber);
                    if (savedProgress) {
                        if (confirm(`You have saved progress for this test (${savedProgress.mode} mode). Resume?`)) {
                            TestManager.loadSavedProgress(actualTestNumber);
                        } else {
                            TestManager.selectTest(actualTestNumber);
                        }
                    } else {
                        TestManager.selectTest(actualTestNumber);
                    }
                });
                
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
                            ProgressManager.clearSavedProgressForTest(actualTestNumber);
                            TestManager.loadAvailableTests();
                        }
                    };
                    testBtn.appendChild(restartBtn);
                }
                
                testButtonsContainer.appendChild(testBtn);
            });
            
            // Update stats on main screen
            const totalQuestions = Object.keys(questions)
                .filter(key => key.startsWith('test'))
                .reduce((sum, testKey) => sum + (questions[testKey]?.length || 0), 0);
            
            const totalTests = Object.keys(questions)
                .filter(key => key.startsWith('test')).length;
            
            const totalStat = document.getElementById('total-questions-stat');
            const testCountStat = document.getElementById('total-tests-stat');
            if (totalStat) totalStat.textContent = totalQuestions;
            if (testCountStat) testCountStat.textContent = totalTests;
        },
        
        // Select a test
        selectTest: (testNumber) => {
            AppState.setCurrentTest(testNumber);
            const questions = QuestionHandler.getTestQuestions(testNumber);
            AppState.setCurrentQuestions(questions);
            
            if (!questions || questions.length === 0) {
                alert('Questions not loaded. Please ensure questions.js is properly loaded.');
                return;
            }
            
            Navigation.hideScreen('test-selection');
            Navigation.showScreen('mode-selection');
        },
        
        // Select mode (review or test)
        selectMode: (mode) => {
            AppState.setCurrentMode(mode);
            AppState.setCurrentQuestionIndex(0);
            AppState.setUserAnswers({});
            AppState.setMarkedQuestions(new Set());
            AppState.setSelectedDomain(null);
            
            const currentTest = AppState.getCurrentTest();
            
            // Check for saved progress
            if (currentTest) {
                const saved = ProgressManager.getSavedProgressForTest(currentTest);
                if (saved && saved.mode === mode) {
                    const displayNum = AppState.getCurrentTestDisplayNumber() || currentTest;
                    if (confirm(`You have saved progress for Test ${displayNum} (${saved.mode} mode, Q${saved.questionIndex + 1}). Would you like to resume?`)) {
                        TestManager.loadSavedProgress(currentTest);
                        return;
                    } else {
                        ProgressManager.clearSavedProgressForTest(currentTest);
                    }
                }
            }
            
            if (mode === Config.MODES.TEST) {
                AppState.setTestStartTime(Date.now());
                Timer.start();
            }
            
            Navigation.hideScreen('mode-selection');
            Navigation.showScreen('question-screen');
            
            QuestionHandler.buildQuestionNavbar();
            QuestionHandler.loadQuestion();
            Stats.updateDashboard();
            Stats.recalculateUserStats();
            
            // Ensure navbar toggle is attached
            if (typeof window.attachNavbarToggleListener === 'function') {
                setTimeout(() => window.attachNavbarToggleListener(), 100);
            }
        },
        
        // Select domain for review
        selectDomainForReview: async (domain) => {
            AppState.setSelectedDomain(domain);
            AppState.setCurrentMode(Config.MODES.REVIEW);
            
            // Ensure questions are loaded
            let questions = window.examQuestions || (typeof examQuestions !== 'undefined' ? examQuestions : undefined);
            
            if (!questions) {
                console.log('Questions not loaded yet, attempting to load...');
                if (typeof autoLoadQuestions === 'function') {
                    try {
                        const loadedQuestions = await autoLoadQuestions();
                        if (loadedQuestions) {
                            window.examQuestions = loadedQuestions;
                            questions = loadedQuestions;
                        } else {
                            alert('Failed to load questions. Please refresh the page.');
                            return;
                        }
                    } catch (error) {
                        console.error('Error loading questions:', error);
                        alert('Failed to load questions. Please refresh the page.');
                        return;
                    }
                } else {
                    alert('Questions are not loaded. Please refresh the page.');
                    return;
                }
            }
            
            const domainQuestions = QuestionHandler.getDomainQuestions(domain);
            
            if (domainQuestions.length === 0) {
                alert(`No questions found for domain: ${domain}`);
                Navigation.goBackToMainSelection();
                return;
            }
            
            AppState.setCurrentQuestions(domainQuestions);
            AppState.setCurrentTest(null);
            
            // Try to load saved progress for this domain BEFORE resetting answers
            const progressLoaded = TestManager.loadSavedProgress(null);
            
            if (progressLoaded) {
                // Progress was loaded and screen/question already shown by loadSavedProgress
                // Just update stats
                Stats.updateDashboard();
                Stats.recalculateUserStats();
            } else {
                // No saved progress, start fresh
                AppState.setCurrentQuestionIndex(0);
                AppState.setUserAnswers({});
                AppState.setMarkedQuestions(new Set());
                
                Navigation.hideScreen('domain-selection');
                Navigation.hideScreen('main-selection');
                Navigation.showScreen('question-screen');
                
                QuestionHandler.buildQuestionNavbar();
                QuestionHandler.loadQuestion();
                Stats.updateDashboard();
                Stats.recalculateUserStats();
            }
            
            // Ensure navbar toggle is attached
            if (typeof window.attachNavbarToggleListener === 'function') {
                setTimeout(() => window.attachNavbarToggleListener(), 100);
            }
            
            // Scroll to top of page and question screen when navigating from insights
            setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                const questionScreen = document.getElementById('question-screen');
                if (questionScreen && !questionScreen.classList.contains('hidden')) {
                    questionScreen.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 200);
        },
        
        // Load saved progress
        loadSavedProgress: (testNumber) => {
            // Load questions first before loading progress
            const selectedDomain = AppState.getSelectedDomain();
            
            if (testNumber) {
                // Load test questions first
                const testQuestions = QuestionHandler.getTestQuestions(testNumber);
                if (!testQuestions || testQuestions.length === 0) {
                    console.error('Cannot load saved progress: Test questions not available');
                    alert('Questions not loaded. Please try again.');
                    return;
                }
                AppState.setCurrentQuestions(testQuestions);
                AppState.setCurrentTest(testNumber);
            } else if (selectedDomain) {
                // Load domain questions first
                const domainQuestions = QuestionHandler.getDomainQuestions(selectedDomain);
                if (domainQuestions.length > 0) {
                    AppState.setCurrentQuestions(domainQuestions);
                    console.log(`Loaded ${domainQuestions.length} domain questions for mapping`);
                } else {
                    console.error('Cannot load saved progress: Domain questions not available');
                    return false;
                }
            }
            
            // Now load the saved progress (answers, marked questions, etc.)
            const progressLoaded = ProgressManager.loadSavedProgress(testNumber);
            if (progressLoaded) {
                console.log('ProgressManager.loadSavedProgress returned true');
                // Ensure questions are still loaded (they should be, but double-check)
                const currentQuestions = AppState.getCurrentQuestions();
                if (!currentQuestions || currentQuestions.length === 0) {
                    console.error('Questions lost after loading progress, reloading...');
                    if (testNumber) {
                        const testQuestions = QuestionHandler.getTestQuestions(testNumber);
                        AppState.setCurrentQuestions(testQuestions);
                    } else if (selectedDomain) {
                        const domainQuestions = QuestionHandler.getDomainQuestions(selectedDomain);
                        AppState.setCurrentQuestions(domainQuestions);
                    }
                }
                
                Navigation.hideScreen('mode-selection');
                Navigation.hideScreen('test-selection');
                Navigation.showScreen('question-screen');
                
                QuestionHandler.buildQuestionNavbar();
                QuestionHandler.loadQuestion();
                Stats.updateDashboard();
                
                // Ensure navbar toggle is attached
                if (typeof window.attachNavbarToggleListener === 'function') {
                    setTimeout(() => window.attachNavbarToggleListener(), 100);
                }
                
                // Restore timer if in test mode
                const currentMode = AppState.getCurrentMode();
                if (currentMode === Config.MODES.TEST) {
                    Timer.start();
                }
                
                return true; // Return true to indicate progress was loaded
            } else {
                console.error('Failed to load saved progress - ProgressManager.loadSavedProgress returned false');
                return false; // Return false to indicate no progress was loaded
            }
        },
        
        // Submit test
        submitTest: () => {
            const currentMode = AppState.getCurrentMode();
            const currentQuestions = AppState.getCurrentQuestions();
            const userAnswers = AppState.getUserAnswers();
            const currentQuestionIndex = AppState.getCurrentQuestionIndex();
            
            if (currentMode === Config.MODES.TEST) {
                // Confirm submission
                if (currentQuestionIndex < currentQuestions.length - 1) {
                    const unanswered = currentQuestions.length - Object.keys(userAnswers).length;
                    if (unanswered > 0 && !confirm(`You have ${unanswered} unanswered questions. Are you sure you want to submit?`)) {
                        return;
                    }
                }
                
                Timer.stop();
            }
            
            Results.show();
        },
        
        // Next question
        nextQuestion: () => {
            const currentQuestionIndex = AppState.getCurrentQuestionIndex();
            const currentQuestions = AppState.getCurrentQuestions();
            
            if (currentQuestionIndex < currentQuestions.length - 1) {
                AppState.incrementQuestionIndex();
                QuestionHandler.loadQuestion();
            }
        },
        
        // Previous question
        previousQuestion: () => {
            AppState.decrementQuestionIndex();
            QuestionHandler.loadQuestion();
        },
        
        // Submit answer
        submitAnswer: () => {
            const currentQuestions = AppState.getCurrentQuestions();
            const currentQuestionIndex = AppState.getCurrentQuestionIndex();
            const currentMode = AppState.getCurrentMode();
            const userAnswers = AppState.getUserAnswers();
            
            if (!currentQuestions || currentQuestions.length === 0) {
                console.error('No questions loaded');
                return;
            }
            
            const question = currentQuestions[currentQuestionIndex];
            if (!question) {
                console.error('Question not found at index:', currentQuestionIndex);
                return;
            }
            
            // Use uniqueId for saving answers
            const questionKey = (question.uniqueId || question.id).toString();
            const selectedAnswers = userAnswers[questionKey] || [];
            
            const submitBtn = document.getElementById('submit-btn');
            const nextBtn = document.getElementById('next-btn');
            
            if (currentMode === Config.MODES.REVIEW) {
                // Review mode: show feedback
                if (selectedAnswers.length === 0) {
                    alert('Please select an answer before submitting.');
                    return;
                }
                QuestionHandler.showAnswerFeedback(question, selectedAnswers);
                // Hide submit button and show next button
                if (submitBtn) submitBtn.classList.add('hidden');
                if (nextBtn) nextBtn.classList.remove('hidden');
            } else {
                // Test mode: check if this is the last question
                if (currentQuestionIndex === currentQuestions.length - 1) {
                    // Last question - submit the test
                    TestManager.submitTest();
                } else {
                    // Not last question - move to next
                    TestManager.nextQuestion();
                }
            }
        },
        
        // Toggle mark question
        toggleMarkQuestion: () => {
            const currentQuestions = AppState.getCurrentQuestions();
            const currentQuestionIndex = AppState.getCurrentQuestionIndex();
            const question = currentQuestions[currentQuestionIndex];
            
            if (question) {
                // Use uniqueId for marking questions
                const questionKey = (question.uniqueId || question.id).toString();
                AppState.toggleMarkedQuestion(questionKey);
                
                // Update UI immediately
                QuestionHandler.loadQuestion();
                UI.updateStats();
                
                console.log('Question marked/unmarked:', questionKey);
            } else {
                console.warn('Cannot mark question: No question found at index', currentQuestionIndex);
            }
        }
    };
})();

// Immediately expose functions to window for onclick handlers
if (typeof window !== 'undefined' && typeof TestManager !== 'undefined') {
    window.submitAnswer = TestManager.submitAnswer;
    window.nextQuestion = TestManager.nextQuestion;
    window.previousQuestion = TestManager.previousQuestion;
    window.toggleMarkQuestion = TestManager.toggleMarkQuestion;
    window.submitTest = TestManager.submitTest;
}
