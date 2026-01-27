// Progress Tracking Module
const ProgressManager = (function() {
    'use strict';
    
    return {
        // Save progress for current test/domain
        saveProgress: () => {
            const currentTest = AppState.getCurrentTest();
            const currentMode = AppState.getCurrentMode();
            const currentQuestionIndex = AppState.getCurrentQuestionIndex();
            const userAnswers = AppState.getUserAnswers();
            const markedQuestions = AppState.getMarkedQuestions();
            const testStartTime = AppState.getTestStartTime();
            const selectedDomain = AppState.getSelectedDomain();
            const selectedSource = AppState.getSelectedSource();
            const currentUserEmail = AppState.getCurrentUserEmail();
            
            if (!currentUserEmail) return;
            
            const userKey = currentUserEmail.toLowerCase().replace(/[^a-z0-9@.-]/g, '-');
            
            if (currentTest) {
                // Save test progress
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
                
                const progressKey = `${Config.STORAGE_KEYS.PROGRESS_PREFIX}${userKey}-test${currentTest}`;
                
                localStorage.setItem(progressKey, JSON.stringify(progress));
                AppState.setSavedProgress(progress);
                localStorage.setItem(`${Config.STORAGE_KEYS.CURRENT_PROGRESS_PREFIX}${userKey}`, progressKey);
                
                // Save to Firestore if available
                if (typeof saveProgressToFirestore === 'function' && typeof isFirebaseAvailable === 'function' && isFirebaseAvailable()) {
                    saveProgressToFirestore(progress, progressKey, currentUserEmail);
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
                    source: selectedSource,
                    timestamp: new Date().toISOString()
                };
                
                const progressKey = `${Config.STORAGE_KEYS.PROGRESS_PREFIX}${userKey}-domain-${selectedDomain.replace(/\s+/g, '-')}`;
                
                localStorage.setItem(progressKey, JSON.stringify(progress));
                AppState.setSavedProgress(progress);
                localStorage.setItem(`${Config.STORAGE_KEYS.CURRENT_PROGRESS_PREFIX}${userKey}`, progressKey);
                
                // Save to Firestore if available
                if (typeof saveProgressToFirestore === 'function' && typeof isFirebaseAvailable === 'function' && isFirebaseAvailable()) {
                    saveProgressToFirestore(progress, progressKey, currentUserEmail);
                }
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
                AppState.setUserAnswers(progress.answers || {});
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
