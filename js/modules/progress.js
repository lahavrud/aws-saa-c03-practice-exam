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
            if (!currentUserEmail) {
                console.log('loadSavedProgress: No user email');
                return false;
            }
            
            const userKey = currentUserEmail.toLowerCase().replace(/[^a-z0-9@.-]/g, '-');
            let progressKey;
            
            if (testNumber) {
                progressKey = `${Config.STORAGE_KEYS.PROGRESS_PREFIX}${userKey}-test${testNumber}`;
            } else {
                // For domain mode, try to get from current progress or construct from selected domain
                const selectedDomain = AppState.getSelectedDomain();
                if (selectedDomain) {
                    // Construct domain progress key
                    progressKey = `${Config.STORAGE_KEYS.PROGRESS_PREFIX}${userKey}-domain-${selectedDomain.replace(/\s+/g, '-')}`;
                    console.log('Loading domain progress with key:', progressKey);
                } else {
                    // Fallback to current progress key
                    progressKey = localStorage.getItem(`${Config.STORAGE_KEYS.CURRENT_PROGRESS_PREFIX}${userKey}`);
                }
            }
            
            if (!progressKey) {
                console.log('No progress key found for testNumber:', testNumber, 'selectedDomain:', AppState.getSelectedDomain());
                return false;
            }
            
            const saved = localStorage.getItem(progressKey);
            if (!saved) {
                console.log('No saved progress found for key:', progressKey);
                return false;
            }
            
            console.log('Found saved progress, parsing...');
            
            try {
                const progress = JSON.parse(saved);
                
                AppState.setCurrentTest(progress.test);
                AppState.setCurrentMode(progress.mode);
                AppState.setCurrentQuestionIndex(progress.questionIndex || 0);
                
                // Handle answer ID mapping for domain review
                let answers = progress.answers || {};
                if (progress.selectedDomain && !progress.test) {
                    // Domain review mode - need to map answers to new question IDs
                    // Answers might be saved with uniqueId (testX-qY) or just id (number)
                    let currentQuestions = AppState.getCurrentQuestions();
                    
                    // If questions aren't loaded yet, try to load them
                    if (!currentQuestions || currentQuestions.length === 0) {
                        console.log('Questions not loaded, attempting to load domain questions...');
                        const domainQuestions = QuestionHandler.getDomainQuestions(progress.selectedDomain);
                        if (domainQuestions && domainQuestions.length > 0) {
                            AppState.setCurrentQuestions(domainQuestions);
                            currentQuestions = domainQuestions;
                        }
                    }
                    
                    if (currentQuestions && currentQuestions.length > 0) {
                        console.log(`Loading domain progress: ${Object.keys(answers).length} saved answers, ${currentQuestions.length} questions`);
                        console.log('Sample saved answer keys:', Object.keys(answers).slice(0, 5));
                        console.log('Sample question uniqueIds:', currentQuestions.slice(0, 5).map(q => ({ id: q.id, uniqueId: q.uniqueId, originalId: q.originalId })));
                        
                        const mappedAnswers = {};
                        let mappedCount = 0;
                        let unmatchedCount = 0;
                        
                        for (const [oldKey, answerValue] of Object.entries(answers)) {
                            // Try to find matching question by multiple methods
                            const question = currentQuestions.find(q => {
                                const qUniqueId = (q.uniqueId || '').toString();
                                const qId = q.id.toString();
                                const qOriginalId = q.originalId ? q.originalId.toString() : null;
                                
                                // Match by uniqueId (most common case - exact match)
                                if (qUniqueId === oldKey) return true;
                                
                                // Match by id (for backward compatibility)
                                if (qId === oldKey) return true;
                                
                                // Match by originalId
                                if (qOriginalId && qOriginalId === oldKey) return true;
                                
                                return false;
                            });
                            
                            if (question) {
                                // Use the current question's uniqueId format (this is what we use for saving)
                                const questionKey = (question.uniqueId || question.id).toString();
                                mappedAnswers[questionKey] = answerValue;
                                mappedCount++;
                                if (mappedCount <= 5) { // Only log first 5 to avoid spam
                                    console.log(`✓ Mapped answer: ${oldKey} -> ${questionKey} = [${answerValue.join(', ')}]`);
                                }
                            } else {
                                // Keep old key if no match found (might be from different session)
                                mappedAnswers[oldKey] = answerValue;
                                unmatchedCount++;
                                if (unmatchedCount <= 5) { // Only log first 5 to avoid spam
                                    console.warn(`✗ Could not map answer key: ${oldKey} (value: [${answerValue.join(', ')}])`);
                                }
                            }
                        }
                        answers = mappedAnswers;
                        console.log(`Domain progress loaded: ${mappedCount} mapped, ${unmatchedCount} unmatched, total: ${Object.keys(answers).length}`);
                        console.log('Final mapped answers sample:', Object.entries(answers).slice(0, 3));
                    } else {
                        console.warn('Cannot map domain answers: No questions available');
                    }
                }
                
                AppState.setUserAnswers(answers);
                AppState.setMarkedQuestions(new Set(progress.marked || []));
                AppState.setTestStartTime(progress.startTime);
                AppState.setSelectedDomain(progress.selectedDomain);
                AppState.setSelectedSource(progress.source);
                AppState.setSavedProgress(progress);
                
                console.log('Progress loaded successfully. Answers:', Object.keys(answers).length, 'Marked:', progress.marked?.length || 0);
                console.log('Sample answers:', Object.entries(answers).slice(0, 3));
                
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
