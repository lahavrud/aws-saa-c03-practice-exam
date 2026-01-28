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
                        
                        // Track last accessed
                        AppState.setLastAccessedTest(currentTest);
                        AppState.setLastAccessedMode(currentMode);
                        AppState.setLastAccessedDomain(null);
                        
                        console.log('Progress saved to localStorage:', progressKey);
                    } catch (storageError) {
                        console.error('Error saving to localStorage:', storageError);
                        // Try to continue with Firestore save even if localStorage fails
                    }
                    
                    // Save to Firestore if available
                    if (typeof window.saveProgressToFirestore === 'function' && typeof window.isFirebaseAvailable === 'function' && window.isFirebaseAvailable()) {
                        try {
                            console.log('Saving progress to Firestore:', progressKey, 'for user:', currentUserEmail);
                            window.saveProgressToFirestore(progress, progressKey, currentUserEmail);
                        } catch (firestoreError) {
                            console.error('Error saving to Firestore:', firestoreError);
                        }
                    } else {
                        console.warn('Firestore functions not available. saveProgressToFirestore:', typeof window.saveProgressToFirestore, 'isFirebaseAvailable:', typeof window.isFirebaseAvailable);
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
                        
                        // Track last accessed
                        AppState.setLastAccessedDomain(selectedDomain);
                        AppState.setLastAccessedMode(currentMode);
                        AppState.setLastAccessedTest(null);
                        
                        console.log('Domain progress saved to localStorage:', progressKey);
                    } catch (storageError) {
                        console.error('Error saving to localStorage:', storageError);
                    }
                    
                    // Save to Firestore if available
                    if (typeof window.saveProgressToFirestore === 'function' && typeof window.isFirebaseAvailable === 'function' && window.isFirebaseAvailable()) {
                        try {
                            console.log('Saving domain progress to Firestore:', progressKey, 'for user:', currentUserEmail);
                            window.saveProgressToFirestore(progress, progressKey, currentUserEmail);
                        } catch (firestoreError) {
                            console.error('Error saving to Firestore:', firestoreError);
                        }
                    } else {
                        console.warn('Firestore functions not available for domain progress save.');
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
        
        // Get saved progress for a specific test (loads from localStorage first, then Firestore if needed)
        getSavedProgressForTest: async (testNumber) => {
            const currentUserEmail = AppState.getCurrentUserEmail();
            if (!currentUserEmail) return null;
            
            const userKey = currentUserEmail.toLowerCase().replace(/[^a-z0-9@.-]/g, '-');
            const progressKey = `${Config.STORAGE_KEYS.PROGRESS_PREFIX}${userKey}-test${testNumber}`;
            
            // Check localStorage first (primary source for client-side progress)
            const saved = localStorage.getItem(progressKey);
            if (saved) {
                try {
                    const progress = JSON.parse(saved);
                    // If we have localStorage data, use it immediately
                    // Only check Firestore if localStorage is empty (for cross-device sync)
                    return progress;
                } catch (error) {
                    console.error('Error parsing saved progress from localStorage:', error);
                }
            }
            
            // Only try Firestore if localStorage doesn't have it (for cross-device sync)
            if (typeof window.loadProgressFromFirestore === 'function' && typeof window.isFirebaseAvailable === 'function' && window.isFirebaseAvailable()) {
                try {
                    const firestoreProgress = await window.loadProgressFromFirestore(progressKey, currentUserEmail);
                    if (firestoreProgress) {
                        // Sync to localStorage for offline access
                        try {
                            localStorage.setItem(progressKey, JSON.stringify(firestoreProgress));
                        } catch (storageError) {
                            console.warn('Could not sync Firestore progress to localStorage:', storageError);
                        }
                        console.log('✓ Progress synced from Firestore:', progressKey);
                        return firestoreProgress;
                    }
                } catch (firestoreError) {
                    // Silently fail - localStorage is primary source
                }
            }
            
            return null;
        },
        
        // Load saved progress (loads from Firestore first, then localStorage)
        loadSavedProgress: async (testNumber) => {
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
            
            // Check localStorage first (primary source for client-side progress)
            const saved = localStorage.getItem(progressKey);
            if (saved) {
                try {
                    const progress = JSON.parse(saved);
                    console.log('Found saved progress in localStorage, parsing...');
                    // If we have localStorage data, use it immediately
                    // Only check Firestore if localStorage is empty (for cross-device sync)
                    return progress;
                } catch (error) {
                    console.error('Error parsing saved progress from localStorage:', error);
                }
            }
            
            // Only try Firestore if localStorage doesn't have it (for cross-device sync)
            if (typeof window.loadProgressFromFirestore === 'function' && typeof window.isFirebaseAvailable === 'function' && window.isFirebaseAvailable()) {
                try {
                    const firestoreProgress = await window.loadProgressFromFirestore(progressKey, currentUserEmail);
                    if (firestoreProgress) {
                        // Sync to localStorage for offline access
                        try {
                            localStorage.setItem(progressKey, JSON.stringify(firestoreProgress));
                        } catch (storageError) {
                            console.warn('Could not sync Firestore progress to localStorage:', storageError);
                        }
                        console.log('Progress loaded from Firestore:', progressKey);
                        return firestoreProgress;
                    }
                } catch (firestoreError) {
                    // Silently fail - localStorage is primary source
                }
            }
            
            // No progress found in either location
            console.log('No saved progress found for key:', progressKey);
            return null;
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
        },
        
        // Calculate progress percentage for a test
        calculateTestProgress: (testNumber) => {
            const progress = ProgressManager.getSavedProgressForTest(testNumber);
            if (!progress || !progress.answers) return 0;
            
            const questions = window.examQuestions || (typeof examQuestions !== 'undefined' ? examQuestions : undefined);
            if (!questions) return 0;
            
            const testKey = `test${testNumber}`;
            const testQuestions = questions[testKey] || [];
            const totalQuestions = testQuestions.length;
            
            if (totalQuestions === 0) return 0;
            
            const answeredCount = Object.keys(progress.answers).length;
            return Math.round((answeredCount / totalQuestions) * 100);
        },
        
        // Get last progress point (loads from Firestore first, then localStorage)
        getLastProgressPoint: async () => {
            const currentUserEmail = AppState.getCurrentUserEmail();
            if (!currentUserEmail) return null;
            
            const userKey = currentUserEmail.toLowerCase().replace(/[^a-z0-9@.-]/g, '-');
            let lastProgressKey = localStorage.getItem(`${Config.STORAGE_KEYS.CURRENT_PROGRESS_PREFIX}${userKey}`);
            
            // If no key in localStorage, try to find most recent progress from Firestore
            if (!lastProgressKey && typeof window.isFirebaseAvailable === 'function' && window.isFirebaseAvailable()) {
                try {
                    // Query Firestore for most recent progress for this user
                    // Access db through window
                    const db = window.db;
                    if (db && db.collection) {
                        const userEmail = currentUserEmail;
                        console.log('Querying Firestore for most recent progress for user:', userEmail);
                        const progressQuery = await db.collection('progress')
                            .where('userEmail', '==', userEmail)
                            .orderBy('timestamp', 'desc')
                            .limit(1)
                            .get();
                        
                        if (!progressQuery.empty) {
                            const mostRecentDoc = progressQuery.docs[0];
                            const progressData = mostRecentDoc.data();
                            lastProgressKey = mostRecentDoc.id;
                            
                            // Verify the data belongs to the current user
                            if (progressData.userEmail === userEmail) {
                                // Sync to localStorage
                                try {
                                    localStorage.setItem(lastProgressKey, JSON.stringify(progressData));
                                    localStorage.setItem(`${Config.STORAGE_KEYS.CURRENT_PROGRESS_PREFIX}${userKey}`, lastProgressKey);
                                } catch (storageError) {
                                    console.warn('Could not sync Firestore progress to localStorage:', storageError);
                                }
                                
                                console.log('Most recent progress loaded from Firestore:', lastProgressKey);
                                return progressData;
                            } else {
                                console.warn('Progress document belongs to different user');
                            }
                        } else {
                            console.log('No progress found in Firestore for user:', userEmail);
                        }
                    } else {
                        console.warn('Firestore db not available for querying');
                    }
                } catch (firestoreError) {
                    console.warn('Error querying Firestore for last progress, falling back to localStorage:', firestoreError);
                }
            }
            
            if (!lastProgressKey) return null;
            
            // Check localStorage first (primary source for client-side progress)
            const saved = localStorage.getItem(lastProgressKey);
            if (saved) {
                try {
                    const progress = JSON.parse(saved);
                    console.log('Most recent progress loaded from localStorage:', lastProgressKey);
                    return progress;
                } catch (error) {
                    console.error('Error parsing saved progress from localStorage:', error);
                }
            }
            
            // Only try Firestore if localStorage doesn't have it (for cross-device sync)
            if (typeof window.loadProgressFromFirestore === 'function' && typeof window.isFirebaseAvailable === 'function' && window.isFirebaseAvailable()) {
                try {
                    const firestoreProgress = await window.loadProgressFromFirestore(lastProgressKey, currentUserEmail);
                    if (firestoreProgress) {
                        // Sync to localStorage for offline access
                        try {
                            localStorage.setItem(lastProgressKey, JSON.stringify(firestoreProgress));
                        } catch (storageError) {
                            console.warn('Could not sync Firestore progress to localStorage:', storageError);
                        }
                        console.log('✓ Last progress synced from Firestore:', lastProgressKey);
                        return firestoreProgress;
                    }
                } catch (firestoreError) {
                    // Silently fail - localStorage is primary source
                }
            }
            
            // No progress found in either location
            return null;
        },
        
        // Sync all progress from Firestore to localStorage
        syncAllProgressFromFirestore: async () => {
            const currentUserEmail = AppState.getCurrentUserEmail();
            if (!currentUserEmail) {
                console.log('Cannot sync: No user email');
                return false;
            }
            
            if (typeof window.isFirebaseAvailable !== 'function' || !window.isFirebaseAvailable()) {
                console.log('Firebase not available for sync');
                return false;
            }
            
            const userKey = currentUserEmail.toLowerCase().replace(/[^a-z0-9@.-]/g, '-');
            const userEmail = currentUserEmail;
            
            try {
                console.log('Syncing all progress from Firestore for user:', userEmail);
                const db = window.db;
                if (!db || !db.collection) {
                    console.warn('Firestore db not available');
                    return false;
                }
                
                // Query all progress documents for this user
                const progressQuery = await db.collection('progress')
                    .where('userEmail', '==', userEmail)
                    .get();
                
                if (progressQuery.empty) {
                    console.log('No progress found in Firestore for user:', userEmail);
                    return false;
                }
                
                let syncedCount = 0;
                progressQuery.forEach(doc => {
                    const progressData = doc.data();
                    const progressKey = doc.id;
                    
                    // Verify it belongs to current user
                    if (progressData.userEmail === userEmail) {
                        try {
                            // Sync to localStorage
                            localStorage.setItem(progressKey, JSON.stringify(progressData));
                            
                            // Update current progress reference if this is the most recent
                            if (progressData.timestamp) {
                                const currentProgressKey = localStorage.getItem(`${Config.STORAGE_KEYS.CURRENT_PROGRESS_PREFIX}${userKey}`);
                                if (!currentProgressKey) {
                                    localStorage.setItem(`${Config.STORAGE_KEYS.CURRENT_PROGRESS_PREFIX}${userKey}`, progressKey);
                                } else {
                                    // Check if this is more recent
                                    const currentProgress = localStorage.getItem(currentProgressKey);
                                    if (currentProgress) {
                                        try {
                                            const currentData = JSON.parse(currentProgress);
                                            if (progressData.timestamp > (currentData.timestamp || '')) {
                                                localStorage.setItem(`${Config.STORAGE_KEYS.CURRENT_PROGRESS_PREFIX}${userKey}`, progressKey);
                                            }
                                        } catch (e) {
                                            // If current progress can't be parsed, use this one
                                            localStorage.setItem(`${Config.STORAGE_KEYS.CURRENT_PROGRESS_PREFIX}${userKey}`, progressKey);
                                        }
                                    }
                                }
                            }
                            
                            syncedCount++;
                            console.log('Synced progress:', progressKey);
                        } catch (storageError) {
                            console.error('Error syncing progress to localStorage:', progressKey, storageError);
                        }
                    }
                });
                
                if (syncedCount > 0) {
                    console.log(`✓ Synced ${syncedCount} progress document(s) from Firestore`);
                }
                return syncedCount > 0;
            } catch (error) {
                console.error('Error syncing progress from Firestore:', error);
                return false;
            }
        },
        
        // Get progress status for a test (async - loads from Firestore first)
        getTestProgressStatus: async (testNumber) => {
            const progress = await ProgressManager.getSavedProgressForTest(testNumber);
            if (!progress) {
                return {
                    status: 'not-started',
                    progressPercent: 0,
                    answeredCount: 0,
                    totalQuestions: 0,
                    lastAccessed: null
                };
            }
            
            const questions = window.examQuestions || (typeof examQuestions !== 'undefined' ? examQuestions : undefined);
            if (!questions) {
                return {
                    status: 'unknown',
                    progressPercent: 0,
                    answeredCount: 0,
                    totalQuestions: 0,
                    lastAccessed: progress.timestamp || null
                };
            }
            
            const testKey = `test${testNumber}`;
            const testQuestions = questions[testKey] || [];
            const totalQuestions = testQuestions.length;
            const answeredCount = Object.keys(progress.answers || {}).length;
            const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
            
            let status = 'in-progress';
            if (progressPercent === 0) {
                status = 'not-started';
            } else if (progressPercent === 100) {
                status = 'completed';
            }
            
            return {
                status,
                progressPercent,
                answeredCount,
                totalQuestions,
                lastAccessed: progress.timestamp || null,
                mode: progress.mode || 'review'
            };
        }
    };
})();

// Expose ProgressManager to global scope for compatibility
if (typeof window !== 'undefined') {
    window.ProgressManager = ProgressManager;
}
