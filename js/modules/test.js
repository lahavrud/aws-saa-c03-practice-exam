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
        
        // Load all tests on dashboard grouped by source
        loadAllTestsOnDashboard: () => {
            const questions = window.examQuestions || (typeof examQuestions !== 'undefined' ? examQuestions : undefined);
            
            if (!questions) {
                console.error('examQuestions not loaded');
                const allTestsContainer = document.getElementById('all-tests-container');
                if (allTestsContainer) {
                    allTestsContainer.innerHTML = `
                        <div class="empty-state" role="alert">
                            <div class="empty-state-icon">⚠️</div>
                            <h3>Unable to Load Tests</h3>
                            <p>Questions could not be loaded. Please refresh the page and try again.</p>
                            <button class="empty-state-cta" onclick="location.reload()">Refresh Page</button>
                        </div>
                    `;
                }
                return;
            }
            
            const allTestsContainer = document.getElementById('all-tests-container');
            if (!allTestsContainer) {
                console.error('all-tests-container not found');
                return;
            }
            
            allTestsContainer.innerHTML = '';
            
            const organized = TestManager.organizeTestsBySource();
            
            // Create sections for each source
            const sources = [
                { key: Config.TEST_SOURCES.STEPHANE, name: 'Stephane', tests: organized.stephane || [] },
                { key: Config.TEST_SOURCES.DOJO, name: 'Dojo', tests: organized.dojo || [] },
                { key: Config.TEST_SOURCES.SERGEY, name: 'Sergey', tests: organized.sergey || [] }
            ];
            
            sources.forEach(({ key, name, tests }) => {
                if (tests.length === 0) return;
                
                // Create source section
                const sourceSection = document.createElement('div');
                sourceSection.className = 'test-source-section';
                sourceSection.setAttribute('data-source', key);
                
                // Create collapsible header
                const header = document.createElement('div');
                header.className = 'test-source-header';
                header.style.cursor = 'pointer';
                header.innerHTML = `
                    <h3>${name} Tests</h3>
                    <button class="test-source-toggle" aria-expanded="false" aria-label="Toggle ${name} tests">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="18 15 12 9 6 15"></polyline>
                        </svg>
                    </button>
                `;
                
                // Create content container (collapsed by default)
                const content = document.createElement('div');
                content.className = 'test-source-content';
                content.style.display = 'none';
                
                // Toggle functionality - make entire header clickable
                const toggleContent = () => {
                    const toggle = header.querySelector('.test-source-toggle');
                    const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
                    content.style.display = isExpanded ? 'none' : 'block';
                    toggle.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
                };
                
                header.addEventListener('click', (e) => {
                    // Don't toggle if clicking directly on the button (it will handle its own click)
                    if (e.target.closest('.test-source-toggle')) {
                        return;
                    }
                    toggleContent();
                });
                
                // Also allow button click
                const toggle = header.querySelector('.test-source-toggle');
                toggle.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleContent();
                });
                
                // Create test cards
                tests.forEach(({ key: testKey, number }, index) => {
                    const testQuestions = questions[testKey] || [];
                    const questionCount = testQuestions.length;
                    const displayNumber = index + 1;
                    const actualTestNumber = number;
                    
                    if (questionCount === 0) {
                        console.warn(`No questions found for ${testKey}`);
                        return;
                    }
                    
                    // Create test card immediately with default status, then update if ProgressManager is available
                    const defaultProgressStatus = {
                        status: 'not-started',
                        progressPercent: 0,
                        answeredCount: 0,
                        totalQuestions: questionCount,
                        lastAccessed: null
                    };
                    
                    // Create and append test card immediately so it's visible
                    const testCard = TestManager.createTestCard(actualTestNumber, displayNumber, questionCount, key, defaultProgressStatus);
                    content.appendChild(testCard);
                    
                    // Then update with real progress status if ProgressManager is available
                    if (typeof ProgressManager !== 'undefined' && ProgressManager.getTestProgressStatus) {
                        ProgressManager.getTestProgressStatus(actualTestNumber).then(progressStatus => {
                            // Update the existing card with real progress status
                            const updatedCard = TestManager.createTestCard(actualTestNumber, displayNumber, questionCount, key, progressStatus);
                            testCard.replaceWith(updatedCard);
                        }).catch(error => {
                            console.error('Error loading progress status:', error);
                            // Keep the default card if there's an error
                        });
                    }
                });
                
                sourceSection.appendChild(header);
                sourceSection.appendChild(content);
                allTestsContainer.appendChild(sourceSection);
            });
        },
        
        // Create a test card with progress indicators
        createTestCard: (testNumber, displayNumber, questionCount, source, progressStatus) => {
            const card = document.createElement('div');
            card.className = 'test-card';
            card.setAttribute('data-test-number', testNumber);
            
            // Status badge
            let statusBadge = '';
            let statusClass = '';
            if (progressStatus.status === 'completed') {
                statusBadge = '<span class="test-status-badge test-status-completed">✓ Completed</span>';
                statusClass = 'completed';
            } else if (progressStatus.status === 'in-progress') {
                statusBadge = `<span class="test-status-badge test-status-in-progress">In Progress (${progressStatus.progressPercent}%)</span>`;
                statusClass = 'in-progress';
            } else {
                statusBadge = '<span class="test-status-badge test-status-not-started">Not Started</span>';
                statusClass = 'not-started';
            }
            
            // Last accessed time
            let lastAccessedText = '';
            if (progressStatus.lastAccessed) {
                const lastAccess = new Date(progressStatus.lastAccessed);
                const now = new Date();
                const diffMs = now - lastAccess;
                const diffMins = Math.floor(diffMs / 60000);
                const diffHours = Math.floor(diffMs / 3600000);
                const diffDays = Math.floor(diffMs / 86400000);
                
                if (diffMins < 1) {
                    lastAccessedText = 'Just now';
                } else if (diffMins < 60) {
                    lastAccessedText = `${diffMins}m ago`;
                } else if (diffHours < 24) {
                    lastAccessedText = `${diffHours}h ago`;
                } else if (diffDays < 7) {
                    lastAccessedText = `${diffDays}d ago`;
                } else {
                    lastAccessedText = lastAccess.toLocaleDateString();
                }
            }
            
            // Progress bar
            const progressBar = progressStatus.status !== 'not-started' 
                ? `<div class="test-progress-bar">
                    <div class="test-progress-fill" style="width: ${progressStatus.progressPercent}%"></div>
                   </div>`
                : '';
            
            card.innerHTML = `
                <div class="test-card-header">
                    <div>
                        <h3 class="test-card-title">Test ${displayNumber}</h3>
                        <p class="test-card-subtitle">${questionCount} Questions</p>
                    </div>
                    ${statusBadge}
                </div>
                ${progressBar}
                <div class="test-card-footer">
                    ${lastAccessedText ? `<span class="test-card-last-accessed">Last: ${lastAccessedText}</span>` : ''}
                    <span class="test-card-action-hint">${progressStatus.status === 'not-started' ? 'Click to start' : progressStatus.status === 'completed' ? 'Click to review' : 'Click to resume'}</span>
                </div>
            `;
            
            // Make entire card clickable
            card.style.cursor = 'pointer';
            card.addEventListener('click', (e) => {
                // Don't trigger if clicking on restart button (if we add it back later)
                if (e.target.closest('.test-action-restart')) {
                    return;
                }
                
                if (progressStatus.status === 'not-started') {
                    TestManager.startTest(testNumber, source, displayNumber);
                } else {
                    TestManager.resumeTest(testNumber, source, displayNumber);
                }
            });
            
            return card;
        },
        
        // Start a test (opens in modal)
        startTest: (testNumber, source, displayNumber) => {
            AppState.setCurrentTest(testNumber);
            AppState.setSelectedSource(source);
            AppState.setCurrentTestDisplayNumber(displayNumber);
            
            const questions = QuestionHandler.getTestQuestions(testNumber);
            AppState.setCurrentQuestions(questions);
            
            if (!questions || questions.length === 0) {
                alert('Questions not loaded. Please ensure questions.js is properly loaded.');
                return;
            }
            
            // Open mode selection in modal
            TestManager.showModeSelectionModal();
        },
        
        // Resume a test (opens in modal)
        resumeTest: async (testNumber, source, displayNumber) => {
            AppState.setCurrentTest(testNumber);
            AppState.setSelectedSource(source);
            AppState.setCurrentTestDisplayNumber(displayNumber);
            
            const saved = await ProgressManager.getSavedProgressForTest(testNumber);
            if (saved) {
                // Load saved progress and go directly to questions
                const loaded = await TestManager.loadSavedProgress(testNumber);
                if (loaded) {
                    // Open question screen in modal
                    TestManager.showQuestionModal();
                    return;
                }
            }
            
            // If no saved progress or loading failed, go to mode selection
            const questions = QuestionHandler.getTestQuestions(testNumber);
            AppState.setCurrentQuestions(questions);
            TestManager.showModeSelectionModal();
        },
        
        // Show mode selection in modal
        showModeSelectionModal: () => {
            const modal = document.getElementById('test-modal');
            if (!modal) {
                // Create modal if it doesn't exist
                TestManager.createTestModal();
            }
            
            const modalContent = document.getElementById('test-modal-content');
            if (modalContent) {
                modalContent.innerHTML = `
                    <div class="test-modal-header">
                        <h2>Select Mode</h2>
                        <button class="test-modal-close" onclick="TestManager.closeTestModal()" aria-label="Close">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div class="test-modal-body">
                        <div class="mode-buttons">
                            <button class="mode-btn" onclick="TestManager.selectModeInModal('review')">
                                <h3>Review Mode</h3>
                                <p>Get immediate feedback after each answer with detailed explanations</p>
                            </button>
                            <button class="mode-btn" onclick="TestManager.selectModeInModal('test')">
                                <h3>Test Mode</h3>
                                <p>Timed exam simulation (130 minutes)</p>
                            </button>
                        </div>
                    </div>
                `;
            }
            
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        },
        
        // Select mode in modal
        selectModeInModal: (mode) => {
            TestManager.selectMode(mode);
            TestManager.closeTestModal();
            TestManager.showQuestionModal();
        },
        
        // Show question screen in modal (full screen overlay)
        showQuestionModal: () => {
            // Close mode selection modal
            TestManager.closeTestModal();
            
            // Show question screen as full screen overlay
            Navigation.hideScreen('main-selection');
            Navigation.showScreen('question-screen');
            
            // Add close button to question screen header
            const questionHeader = document.querySelector('.question-header');
            if (questionHeader && !document.getElementById('question-close-btn')) {
                const closeBtn = document.createElement('button');
                closeBtn.id = 'question-close-btn';
                closeBtn.className = 'question-close-btn';
                closeBtn.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                `;
                closeBtn.onclick = () => {
                    Navigation.returnToDashboard();
                };
                closeBtn.setAttribute('aria-label', 'Close and return to dashboard');
                const questionActions = questionHeader.querySelector('.question-actions');
                if (questionActions) {
                    questionActions.insertBefore(closeBtn, questionActions.firstChild);
                }
            }
        },
        
        // Create test modal
        createTestModal: () => {
            const modal = document.createElement('div');
            modal.id = 'test-modal';
            modal.className = 'test-modal hidden';
            modal.innerHTML = `
                <div class="test-modal-backdrop" onclick="TestManager.closeTestModal()"></div>
                <div class="test-modal-container">
                    <div id="test-modal-content" class="test-modal-content"></div>
                </div>
            `;
            document.body.appendChild(modal);
        },
        
        // Close test modal
        closeTestModal: () => {
            const modal = document.getElementById('test-modal');
            if (modal) {
                modal.classList.add('hidden');
                document.body.style.overflow = '';
            }
        },
        
        // Confirm and restart a test
        restartTestConfirm: (testNumber, displayNumber) => {
            if (confirm(`Are you sure you want to restart Test ${displayNumber}? Your saved progress will be lost.`)) {
                ProgressManager.clearSavedProgressForTest(testNumber);
                TestManager.loadAllTestsOnDashboard();
            }
        },
        
        // Load available tests for selected source (legacy - for test-selection screen)
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
                
                // Load progress asynchronously
                ProgressManager.getSavedProgressForTest(actualTestNumber).then(savedProgress => {
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
                }).catch(error => {
                    console.error('Error loading progress for test:', actualTestNumber, error);
                    // Continue without progress
                    const testBtn = document.createElement('div');
                    testBtn.className = 'test-btn-wrapper';
                    const buttonContent = document.createElement('button');
                    buttonContent.className = 'test-btn';
                    buttonContent.type = 'button';
                    buttonContent.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        AppState.setCurrentTestDisplayNumber(displayNumber);
                        TestManager.selectTest(actualTestNumber);
                    });
                    buttonContent.innerHTML = `
                        <div class="test-btn-header">
                            <h3>Test ${displayNumber}</h3>
                            <span class="test-count">${questionCount} Questions</span>
                        </div>
                        <p>Comprehensive practice exam covering all domains</p>
                    `;
                    testBtn.appendChild(buttonContent);
                    testButtonsContainer.appendChild(testBtn);
                });
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
        
        // Select a test (legacy - for test-selection screen)
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
            
            // Check for saved progress (async, but don't block - user can continue)
            if (currentTest) {
                ProgressManager.getSavedProgressForTest(currentTest).then(saved => {
                    if (saved && saved.mode === mode) {
                        const displayNum = AppState.getCurrentTestDisplayNumber() || currentTest;
                        if (confirm(`You have saved progress for Test ${displayNum} (${saved.mode} mode, Q${saved.questionIndex + 1}). Would you like to resume?`)) {
                            TestManager.loadSavedProgress(currentTest).then(() => {
                                // Progress loaded successfully
                            });
                            return;
                        } else {
                            ProgressManager.clearSavedProgressForTest(currentTest);
                        }
                    }
                }).catch(error => {
                    console.error('Error checking saved progress:', error);
                    // Continue without saved progress
                });
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
        
        // Select domain for review in modal/overlay
        selectDomainForReviewInModal: async (domain) => {
            // This opens domain practice in full screen overlay (same as modal style)
            await TestManager.selectDomainForReview(domain);
        },
        
        // Select domain for review (opens in modal/full screen)
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
                return;
            }
            
            AppState.setCurrentQuestions(domainQuestions);
            AppState.setCurrentTest(null);
            
            // Try to load saved progress for this domain BEFORE resetting answers
            const progressLoaded = await TestManager.loadSavedProgress(null);
            
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
            
            // Add close button to question screen header (for overlay style)
            setTimeout(() => {
                const questionHeader = document.querySelector('.question-header');
                if (questionHeader && !document.getElementById('question-close-btn')) {
                    const closeBtn = document.createElement('button');
                    closeBtn.id = 'question-close-btn';
                    closeBtn.className = 'question-close-btn';
                    closeBtn.innerHTML = `
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    `;
                    closeBtn.onclick = () => {
                        Navigation.returnToDashboard();
                    };
                    closeBtn.setAttribute('aria-label', 'Close and return to dashboard');
                    const questionActions = questionHeader.querySelector('.question-actions');
                    if (questionActions) {
                        questionActions.insertBefore(closeBtn, questionActions.firstChild);
                    }
                }
            }, 100);
            
            // Scroll to top of page and question screen when navigating from insights
            setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                const questionScreen = document.getElementById('question-screen');
                if (questionScreen && !questionScreen.classList.contains('hidden')) {
                    questionScreen.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 200);
        },
        
        // Load saved progress (async - loads from Firestore first)
        loadSavedProgress: async (testNumber) => {
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
            const progress = await ProgressManager.loadSavedProgress(testNumber);
            if (progress) {
                console.log('Progress loaded, applying to AppState...', progress);
                
                // Apply the loaded progress to AppState
                if (progress.mode) {
                    AppState.setCurrentMode(progress.mode);
                }
                if (progress.questionIndex !== undefined) {
                    AppState.setCurrentQuestionIndex(progress.questionIndex || 0);
                }
                if (progress.answers) {
                    AppState.setUserAnswers(progress.answers);
                    console.log('Restored answers:', Object.keys(progress.answers).length, 'answers');
                }
                if (progress.marked) {
                    AppState.setMarkedQuestions(new Set(progress.marked));
                }
                if (progress.startTime) {
                    AppState.setTestStartTime(progress.startTime);
                    console.log('Restored startTime:', progress.startTime);
                }
                if (progress.selectedDomain) {
                    AppState.setSelectedDomain(progress.selectedDomain);
                }
                if (progress.source) {
                    AppState.setSelectedSource(progress.source);
                }
                AppState.setSavedProgress(progress);
                
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
                
                // Restore timer if in test mode - use saved startTime
                const currentMode = AppState.getCurrentMode();
                if (currentMode === Config.MODES.TEST) {
                    const savedStartTime = AppState.getTestStartTime();
                    if (savedStartTime) {
                        // Restore timer with saved startTime
                        Timer.restore(savedStartTime);
                        console.log('Timer restored with saved startTime');
                    } else {
                        // No saved startTime, start fresh timer
                        Timer.start();
                        console.log('No saved startTime, starting fresh timer');
                    }
                }
                
                return true; // Return true to indicate progress was loaded
            } else {
                console.error('Failed to load saved progress - ProgressManager.loadSavedProgress returned null');
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
            // Save progress before moving to next question
            if (typeof ProgressManager !== 'undefined' && ProgressManager.saveProgress) {
                ProgressManager.saveProgress();
            }
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
                
                // Save progress immediately after answering
                if (typeof ProgressManager !== 'undefined' && ProgressManager.saveProgress) {
                    ProgressManager.saveProgress();
                }
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
    window.startTest = TestManager.startTest;
    window.resumeTest = TestManager.resumeTest;
    window.showModeSelectionModal = TestManager.showModeSelectionModal;
    window.selectModeInModal = TestManager.selectModeInModal;
    window.closeTestModal = TestManager.closeTestModal;
    window.showQuestionModal = TestManager.showQuestionModal;
    window.selectDomainForReviewInModal = TestManager.selectDomainForReviewInModal;
}
