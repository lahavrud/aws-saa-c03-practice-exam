// Resume Manager Module - Handles continue/resume functionality
const ResumeManager = (function() {
    'use strict';
    
    return {
        // Get last progress point (delegates to ProgressManager for Firestore sync)
        getLastProgressPoint: async () => {
            if (typeof ProgressManager !== 'undefined' && ProgressManager.getLastProgressPoint) {
                return await ProgressManager.getLastProgressPoint();
            }
            console.warn('ProgressManager not available');
            return null;
        },
        
        // Calculate progress percentage for a test or domain
        calculateProgress: (progress) => {
            if (!progress || !progress.answers) return 0;
            
            const currentTest = progress.test;
            const selectedDomain = progress.selectedDomain;
            let totalQuestions = 0;
            
            const questions = window.examQuestions || (typeof examQuestions !== 'undefined' ? examQuestions : undefined);
            if (!questions) return 0;
            
            if (currentTest) {
                // Test mode - get questions for this test
                const testKey = `test${currentTest}`;
                const testQuestions = questions[testKey] || [];
                totalQuestions = testQuestions.length;
            } else if (selectedDomain) {
                // Domain mode - get all questions for this domain
                const domainQuestions = QuestionHandler.getDomainQuestions(selectedDomain);
                totalQuestions = domainQuestions.length;
            }
            
            if (totalQuestions === 0) return 0;
            
            const answeredCount = Object.keys(progress.answers || {}).length;
            return Math.round((answeredCount / totalQuestions) * 100);
        },
        
        // Get progress details for display
        getProgressDetails: (progress) => {
            if (!progress) return null;
            
            const currentTest = progress.test;
            const selectedDomain = progress.selectedDomain;
            const mode = progress.mode || 'review';
            const questionIndex = progress.questionIndex || 0;
            
            let totalQuestions = 0;
            let displayName = '';
            let source = progress.source || '';
            
            const questions = window.examQuestions || (typeof examQuestions !== 'undefined' ? examQuestions : undefined);
            if (!questions) return null;
            
            if (currentTest) {
                // Test mode
                const testKey = `test${currentTest}`;
                const testQuestions = questions[testKey] || [];
                totalQuestions = testQuestions.length;
                
                // Get display number for test
                let displayNumber = currentTest;
                if (typeof TestManager !== 'undefined' && TestManager.organizeTestsBySource) {
                    const organized = TestManager.organizeTestsBySource();
                    
                    if (source === Config.TEST_SOURCES.STEPHANE) {
                        const stephaneTests = organized.stephane || [];
                        const testInfo = stephaneTests.find(t => t.number === currentTest);
                        if (testInfo) {
                            displayNumber = stephaneTests.indexOf(testInfo) + 1;
                        }
                    } else if (source === Config.TEST_SOURCES.DOJO) {
                        displayNumber = 1; // Dojo only has test 8
                    } else if (source === Config.TEST_SOURCES.SERGEY) {
                        const sergeyTests = organized.sergey || [];
                        const testInfo = sergeyTests.find(t => t.number === currentTest);
                        if (testInfo) {
                            displayNumber = sergeyTests.indexOf(testInfo) + 1;
                        }
                    }
                }
                
                const sourceName = source === Config.TEST_SOURCES.STEPHANE ? 'Stephane' :
                                  source === Config.TEST_SOURCES.DOJO ? 'Dojo' :
                                  source === Config.TEST_SOURCES.SERGEY ? 'Sergey' : '';
                
                displayName = `${sourceName} Test ${displayNumber}`;
            } else if (selectedDomain) {
                // Domain mode
                const domainQuestions = QuestionHandler.getDomainQuestions(selectedDomain);
                totalQuestions = domainQuestions.length;
                displayName = selectedDomain;
            }
            
            const answeredCount = Object.keys(progress.answers || {}).length;
            const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
            
            // Format last accessed time
            let lastAccessed = 'Recently';
            if (progress.timestamp) {
                const lastAccess = new Date(progress.timestamp);
                const now = new Date();
                const diffMs = now - lastAccess;
                const diffMins = Math.floor(diffMs / 60000);
                const diffHours = Math.floor(diffMs / 3600000);
                const diffDays = Math.floor(diffMs / 86400000);
                
                if (diffMins < 1) {
                    lastAccessed = 'Just now';
                } else if (diffMins < 60) {
                    lastAccessed = `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
                } else if (diffHours < 24) {
                    lastAccessed = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
                } else if (diffDays < 7) {
                    lastAccessed = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
                } else {
                    lastAccessed = lastAccess.toLocaleDateString();
                }
            }
            
            return {
                displayName,
                mode,
                currentQuestion: questionIndex + 1,
                totalQuestions,
                answeredCount,
                progressPercent,
                lastAccessed,
                test: currentTest,
                domain: selectedDomain,
                source: source
            };
        },
        
        // Resume last progress in modal/overlay
        resumeInModal: async () => {
            const progress = await ResumeManager.getLastProgressPoint();
            if (!progress) {
                console.warn('No progress to resume');
                return false;
            }
            
            const currentTest = progress.test;
            const selectedDomain = progress.selectedDomain;
            
            if (currentTest) {
                // Resume test - use TestManager's resume function which opens in modal
                const organized = TestManager.organizeTestsBySource();
                let displayNumber = currentTest;
                const source = progress.source || '';
                
                if (source === Config.TEST_SOURCES.STEPHANE) {
                    const stephaneTests = organized.stephane || [];
                    const testInfo = stephaneTests.find(t => t.number === currentTest);
                    if (testInfo) {
                        displayNumber = stephaneTests.indexOf(testInfo) + 1;
                    }
                } else if (source === Config.TEST_SOURCES.DOJO) {
                    displayNumber = 1;
                } else if (source === Config.TEST_SOURCES.SERGEY) {
                    const sergeyTests = organized.sergey || [];
                    const testInfo = sergeyTests.find(t => t.number === currentTest);
                    if (testInfo) {
                        displayNumber = sergeyTests.indexOf(testInfo) + 1;
                    }
                }
                
                TestManager.resumeTest(currentTest, source, displayNumber);
                return true;
            } else if (selectedDomain) {
                // Resume domain review - opens full screen
                TestManager.selectDomainForReview(selectedDomain);
                return true;
            }
            
            return false;
        },
        
        // Resume last progress (legacy - direct resume)
        resume: async () => {
            const progress = await ResumeManager.getLastProgressPoint();
            if (!progress) {
                console.warn('No progress to resume');
                return false;
            }
            
            const currentTest = progress.test;
            const selectedDomain = progress.selectedDomain;
            
            if (currentTest) {
                // Resume test
                AppState.setCurrentTest(currentTest);
                AppState.setSelectedSource(progress.source);
                AppState.setCurrentTestDisplayNumber(progress.displayNumber);
                
                // Load the test questions
                const testQuestions = QuestionHandler.getTestQuestions(currentTest);
                if (!testQuestions || testQuestions.length === 0) {
                    console.error('Cannot resume: Test questions not available');
                    return false;
                }
                AppState.setCurrentQuestions(testQuestions);
                
                // Load saved progress
                const loaded = await TestManager.loadSavedProgress(currentTest);
                if (loaded) {
                    return true;
                } else {
                    // If loading failed, start fresh
                    AppState.setCurrentMode(progress.mode || Config.MODES.REVIEW);
                    Navigation.hideScreen('main-selection');
                    Navigation.showScreen('mode-selection');
                    return false;
                }
            } else if (selectedDomain) {
                // Resume domain review
                AppState.setSelectedDomain(selectedDomain);
                AppState.setSelectedSource(progress.source);
                
                // Load domain questions
                const domainQuestions = QuestionHandler.getDomainQuestions(selectedDomain);
                if (domainQuestions.length === 0) {
                    console.error('Cannot resume: Domain questions not available');
                    return false;
                }
                AppState.setCurrentQuestions(domainQuestions);
                
                // Load saved progress
                const loaded = await TestManager.loadSavedProgress(null);
                if (loaded) {
                    return true;
                } else {
                    // If loading failed, start fresh
                    AppState.setCurrentMode(Config.MODES.REVIEW);
                    Navigation.hideScreen('main-selection');
                    Navigation.showScreen('question-screen');
                    QuestionHandler.buildQuestionNavbar();
                    QuestionHandler.loadQuestion();
                    return false;
                }
            }
            
            return false;
        },
        
        // Display continue section on dashboard
        displayContinueSection: async () => {
            const continueContainer = document.getElementById('continue-section');
            if (!continueContainer) return;
            
            const progress = await ResumeManager.getLastProgressPoint();
            if (!progress) {
                continueContainer.style.display = 'none';
                return;
            }
            
            const details = ResumeManager.getProgressDetails(progress);
            if (!details) {
                continueContainer.style.display = 'none';
                return;
            }
            
            continueContainer.style.display = 'block';
            
            // Check if test is completed (100% progress and it's a test, not domain)
            const isTestCompleted = details.test && details.progressPercent === 100;
            
            const modeLabel = details.mode === Config.MODES.TEST ? 'Test Mode' : 'Review Mode';
            const modeIcon = isTestCompleted ? '📝' : (details.mode === Config.MODES.TEST ? '⏱️' : '📖');
            const cardTitle = isTestCompleted ? 'Review Test' : 'Continue Practice';
            const buttonText = isTestCompleted ? 'Review' : 'Continue';
            
            continueContainer.innerHTML = `
                <div class="continue-card">
                    <div class="continue-header">
                        <div class="continue-icon">${modeIcon}</div>
                        <div class="continue-info">
                            <h3>${cardTitle}</h3>
                            <p class="continue-name">${details.displayName}</p>
                            <p class="continue-mode">${isTestCompleted ? 'Completed Test' : modeLabel}</p>
                        </div>
                    </div>
                    <div class="continue-progress">
                        <div class="continue-progress-bar">
                            <div class="continue-progress-fill" style="width: ${details.progressPercent}%"></div>
                        </div>
                        <div class="continue-progress-text">
                            <span>${isTestCompleted ? `All ${details.totalQuestions} questions completed` : `Question ${details.currentQuestion} of ${details.totalQuestions}`}</span>
                            <span class="continue-percentage">${details.progressPercent}%</span>
                        </div>
                    </div>
                    <div class="continue-footer">
                        <span class="continue-last-accessed">Last accessed: ${details.lastAccessed}</span>
                        <button class="continue-btn" data-action="${isTestCompleted ? 'review' : 'resume'}">
                            ${buttonText}
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
            
            // Attach event listener to continue/review button
            const actionBtn = continueContainer.querySelector('.continue-btn');
            if (actionBtn) {
                // Remove any existing listeners by cloning
                const newBtn = actionBtn.cloneNode(true);
                actionBtn.parentNode.replaceChild(newBtn, actionBtn);
                
                const handleAction = async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    if (isTestCompleted) {
                        // Review completed test - switch to review mode
                        if (details.test && details.source) {
                            // Load test in review mode (force review mode even if saved as test mode)
                            AppState.setCurrentTest(details.test);
                            AppState.setSelectedSource(details.source);
                            AppState.setCurrentMode(Config.MODES.REVIEW);
                            
                            // Load test questions
                            const testQuestions = QuestionHandler.getTestQuestions(details.test);
                            if (testQuestions && testQuestions.length > 0) {
                                AppState.setCurrentQuestions(testQuestions);
                                
                                // Load saved progress to get answers, but force review mode
                                const progress = await ProgressManager.loadSavedProgress(details.test);
                                if (progress) {
                                    // Force review mode for completed tests
                                    AppState.setCurrentMode(Config.MODES.REVIEW);
                                    
                                    // Apply answers and other progress data
                                    if (progress.answers) {
                                        AppState.setUserAnswers(progress.answers);
                                    }
                                    if (progress.marked) {
                                        AppState.setMarkedQuestions(new Set(progress.marked));
                                    }
                                    
                                    AppState.setCurrentQuestionIndex(0);
                                    Navigation.hideScreen('main-selection');
                                    Navigation.showScreen('question-screen');
                                    QuestionHandler.loadQuestion();
                                    QuestionHandler.buildQuestionNavbar();
                                    
                                    // Add "View Results" button to question screen header
                                    Results.addViewResultsButton();
                                }
                            }
                        }
                    } else {
                        // Resume practice
                        if (typeof ResumeManager !== 'undefined' && ResumeManager.resumeInModal) {
                            await ResumeManager.resumeInModal();
                        }
                    }
                };
                
                // Add event listener for both click and touch events
                newBtn.addEventListener('click', handleAction);
                newBtn.addEventListener('touchstart', handleAction);
            }
        }
    };
})();

// Expose to window
if (typeof window !== 'undefined') {
    window.ResumeManager = ResumeManager;
}
