// Progress Tracking Module
const ProgressManager = (function() {
    'use strict';
    
    return {
        // Save progress for current test/domain
        saveProgress: () => {
            console.log('saveProgress called');
            try {
                const currentTest = AppState.getCurrentTest();
                const currentMode = AppState.getCurrentMode();
                const currentQuestionIndex = AppState.getCurrentQuestionIndex();
                const userAnswers = AppState.getUserAnswers();
                const markedQuestions = AppState.getMarkedQuestions();
                const testStartTime = AppState.getTestStartTime();
                const selectedDomain = AppState.getSelectedDomain();
                const selectedSource = AppState.getSelectedSource();
                const currentUserEmail = AppState.getCurrentUserEmail();
                
                console.log('Save progress - currentTest:', currentTest, 'selectedDomain:', selectedDomain, 'userEmail:', currentUserEmail);
                
                if (!currentUserEmail) {
                    console.warn('Cannot save progress: No user email available');
                    return false;
                }
                
                const userKey = currentUserEmail.toLowerCase().replace(/[^a-z0-9@.-]/g, '-');
                
                if (currentTest) {
                    // Save test progress
                    const progress = {
                        test: currentTest,
                        mode: currentMode,
                        questionIndex: currentQuestionIndex || 0,
                        answers: userAnswers || {},
                        marked: Array.from(markedQuestions || []),
                        startTime: testStartTime,
                        selectedDomain: selectedDomain,
                        source: selectedSource,
                        timestamp: new Date().toISOString()
                    };
                    
                    const progressKey = `${Config.STORAGE_KEYS.PROGRESS_PREFIX}${userKey}-test${currentTest}`;
                    
                    try {
                        localStorage.setItem(progressKey, JSON.stringify(progress));
                        AppState.setSavedProgress(progress);
                        localStorage.setItem(`${Config.STORAGE_KEYS.CURRENT_PROGRESS_PREFIX}${userKey}`, progressKey);
                        console.log('Progress saved to localStorage:', progressKey);
                    } catch (storageError) {
                        console.error('Error saving to localStorage:', storageError);
                        // Try to continue with Firestore save even if localStorage fails
                    }
                    
                    // Save to Firestore if available
                    if (typeof saveProgressToFirestore === 'function' && typeof isFirebaseAvailable === 'function' && isFirebaseAvailable()) {
                        try {
                            saveProgressToFirestore(progress, progressKey, currentUserEmail);
                        } catch (firestoreError) {
                            console.error('Error saving to Firestore:', firestoreError);
                        }
                    }
                    
                    return true;
                } else if (selectedDomain) {
                    // Save domain review progress
                    const progress = {
                        test: null,
                        mode: currentMode,
                        questionIndex: currentQuestionIndex || 0,
                        answers: userAnswers || {},
                        marked: Array.from(markedQuestions || []),
                        startTime: testStartTime,
                        selectedDomain: selectedDomain,
                        source: selectedSource,
                        timestamp: new Date().toISOString()
                    };
                    
                    const progressKey = `${Config.STORAGE_KEYS.PROGRESS_PREFIX}${userKey}-domain-${selectedDomain.replace(/\s+/g, '-')}`;
                    
                    try {
                        localStorage.setItem(progressKey, JSON.stringify(progress));
                        AppState.setSavedProgress(progress);
                        localStorage.setItem(`${Config.STORAGE_KEYS.CURRENT_PROGRESS_PREFIX}${userKey}`, progressKey);
                        console.log('Domain progress saved to localStorage:', progressKey);
                    } catch (storageError) {
                        console.error('Error saving to localStorage:', storageError);
                    }
                    
                    // Save to Firestore if available
                    if (typeof saveProgressToFirestore === 'function' && typeof isFirebaseAvailable === 'function' && isFirebaseAvailable()) {
                        try {
                            saveProgressToFirestore(progress, progressKey, currentUserEmail);
                        } catch (firestoreError) {
                            console.error('Error saving to Firestore:', firestoreError);
                        }
                    }
                    
                    return true;
                } else {
                    // Even if no test or domain, try to save if there are answers
                    const hasAnswers = userAnswers && Object.keys(userAnswers).length > 0;
                    if (hasAnswers) {
                        console.warn('Cannot save progress: No current test or selected domain, but answers exist');
                        console.warn('Current test:', currentTest, 'Selected domain:', selectedDomain);
                    } else {
                        console.warn('Cannot save progress: No current test, selected domain, or answers');
                    }
                    return false;
                }
            } catch (error) {
                console.error('Error in saveProgress:', error);
                console.error('Error stack:', error.stack);
                return false;
            }
        },
        
        // Get saved progress for a specific test
        getSavedProgressForTest: (testNumber) => {
            const currentUserEmail = AppState.getCurrentUserEmail();
            if (!currentUserEmail) return null;
            
            const userKey = currentUserEmail.toLowerCase().replace(/[^a-z0-9@.-]/g, '-');
            const progressKey = `${Config.STORAGE_KEYS.PROGRESS_PREFIX}${userKey}-test${testNumber}`;
            const saved = localStorage.getItem(progressKey);
            
            if (!saved) return null;
            
            try {
                return JSON.parse(saved);
            } catch (error) {
                console.error('Error parsing saved progress:', error);
                return null;
            }
        },
        
        // Load saved progress
        loadSavedProgress: (testNumber) => {
            const currentUserEmail = AppState.getCurrentUserEmail();
            if (!currentUserEmail) return false;
            
            const userKey = currentUserEmail.toLowerCase().replace(/[^a-z0-9@.-]/g, '-');
            let progressKey;
            
            if (testNumber) {
                progressKey = `${Config.STORAGE_KEYS.PROGRESS_PREFIX}${userKey}-test${testNumber}`;
            } else {
                progressKey = localStorage.getItem(`${Config.STORAGE_KEYS.CURRENT_PROGRESS_PREFIX}${userKey}`);
            }
            
            if (!progressKey) return false;
            
            const saved = localStorage.getItem(progressKey);
            if (!saved) return false;
            
            try {
                const progress = JSON.parse(saved);
                
                AppState.setCurrentTest(progress.test);
                AppState.setCurrentMode(progress.mode);
                AppState.setCurrentQuestionIndex(progress.questionIndex || 0);
                
                // Handle answer ID mapping for domain review
                let answers = progress.answers || {};
                if (progress.selectedDomain && !progress.test) {
                    // Domain review mode - need to map answers to new question IDs
                    // If answers were saved with old IDs (just numbers), map them to new format (testX-id)
                    const currentQuestions = AppState.getCurrentQuestions();
                    if (currentQuestions && currentQuestions.length > 0) {
                        const mappedAnswers = {};
                        for (const [oldKey, answerValue] of Object.entries(answers)) {
                            // Try to find matching question
                            const question = currentQuestions.find(q => {
                                const qKey = q.id.toString();
                                const qOriginalId = q.originalId ? q.originalId.toString() : null;
                                return qKey === oldKey || qOriginalId === oldKey;
                            });
                            
                            if (question) {
                                // Use the current question's uniqueId format
                                const questionKey = (question.uniqueId || question.id).toString();
                                mappedAnswers[questionKey] = answerValue;
                            } else {
                                // Keep old key if no match found (might be from different session)
                                mappedAnswers[oldKey] = answerValue;
                            }
                        }
                        answers = mappedAnswers;
                    }
                }
                
                AppState.setUserAnswers(answers);
                AppState.setMarkedQuestions(new Set(progress.marked || []));
                AppState.setTestStartTime(progress.startTime);
                AppState.setSelectedDomain(progress.selectedDomain);
                AppState.setSelectedSource(progress.source);
                AppState.setSavedProgress(progress);
                
                return true;
            } catch (error) {
                console.error('Error loading saved progress:', error);
                return false;
            }
        },
        
        // Clear saved progress for a test
        clearSavedProgressForTest: (testNumber) => {
            const currentUserEmail = AppState.getCurrentUserEmail();
            if (!currentUserEmail) return;
            
            const userKey = currentUserEmail.toLowerCase().replace(/[^a-z0-9@.-]/g, '-');
            const progressKey = `${Config.STORAGE_KEYS.PROGRESS_PREFIX}${userKey}-test${testNumber}`;
            localStorage.removeItem(progressKey);
            
            // Clear current progress reference if it matches
            const currentProgressKey = localStorage.getItem(`${Config.STORAGE_KEYS.CURRENT_PROGRESS_PREFIX}${userKey}`);
            if (currentProgressKey === progressKey) {
                localStorage.removeItem(`${Config.STORAGE_KEYS.CURRENT_PROGRESS_PREFIX}${userKey}`);
            }
            
            // Reload test buttons to update UI
            if (AppState.getSelectedSource()) {
                TestManager.loadAvailableTests();
            }
        }
    };
})();
