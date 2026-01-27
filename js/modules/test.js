// Test/Exam Management Module
const TestManager = (function() {
    'use strict';
    
    return {
        // Organize tests by source
        organizeTestsBySource: () => {
            if (typeof examQuestions === 'undefined') {
                console.error('organizeTestsBySource: examQuestions is undefined');
                return { stephane: [], dojo: [], sergey: [] };
            }
            
            const organized = { stephane: [], dojo: [], sergey: [] };
            const allTests = Object.keys(examQuestions)
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
            if (typeof examQuestions === 'undefined') {
                console.error('examQuestions not loaded');
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
                testButtonsContainer.innerHTML = '<p>Please select a source first.</p>';
                return;
            }
            
            if (testsForSource.length === 0) {
                testButtonsContainer.innerHTML = `<p>No tests available for ${selectedSource}.</p>`;
                return;
            }
            
            // Create buttons for each test
            testsForSource.forEach(({ key, number }, index) => {
                const questions = examQuestions[key] || [];
                const questionCount = questions.length;
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
            const totalQuestions = Object.keys(examQuestions)
                .filter(key => key.startsWith('test'))
                .reduce((sum, testKey) => sum + (examQuestions[testKey]?.length || 0), 0);
            
            const totalTests = Object.keys(examQuestions)
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
        },
        
        // Select domain for review
        selectDomainForReview: (domain) => {
            AppState.setSelectedDomain(domain);
            AppState.setCurrentMode(Config.MODES.REVIEW);
            AppState.setCurrentQuestionIndex(0);
            AppState.setUserAnswers({});
            AppState.setMarkedQuestions(new Set());
            
            const questions = QuestionHandler.getDomainQuestions(domain);
            
            if (questions.length === 0) {
                alert(`No questions found for domain: ${domain}`);
                Navigation.goBackToMainSelection();
                return;
            }
            
            AppState.setCurrentQuestions(questions);
            AppState.setCurrentTest(null);
            
            Navigation.hideScreen('domain-selection');
            Navigation.showScreen('question-screen');
            
            QuestionHandler.buildQuestionNavbar();
            QuestionHandler.loadQuestion();
            Stats.updateDashboard();
            Stats.recalculateUserStats();
        },
        
        // Load saved progress
        loadSavedProgress: (testNumber) => {
            if (ProgressManager.loadSavedProgress(testNumber)) {
                Navigation.hideScreen('mode-selection');
                Navigation.showScreen('question-screen');
                
                QuestionHandler.buildQuestionNavbar();
                QuestionHandler.loadQuestion();
                Stats.updateDashboard();
                
                // Restore timer if in test mode
                const currentMode = AppState.getCurrentMode();
                if (currentMode === Config.MODES.TEST) {
                    Timer.start();
                }
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
            
            const questionKey = question.id.toString();
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
                const questionKey = question.id.toString();
                AppState.toggleMarkedQuestion(questionKey);
                QuestionHandler.loadQuestion();
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
