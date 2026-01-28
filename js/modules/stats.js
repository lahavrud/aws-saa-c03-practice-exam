// Statistics Calculation Module
const Stats = (function() {
    'use strict';
    
    return {
        // Recalculate user stats from saved progress
        recalculateUserStats: (includeCurrentSession = true) => {
            // Don't recalculate if a reset was just performed - keep the reset values
            if (AppState.getResetJustPerformed && AppState.getResetJustPerformed()) {
                console.log('Skipping stats recalculation - reset was just performed');
                // Clear the flag after a short delay so future recalculations work
                setTimeout(() => {
                    if (AppState.setResetJustPerformed) {
                        AppState.setResetJustPerformed(false);
                    }
                }, 2000);
                return;
            }
            
            const currentUser = AppState.getCurrentUser();
            if (!currentUser) return;
            
            // Reset counters
            let totalQuestionsAnswered = 0;
            let totalCorrectAnswers = 0;
            const questionsAnsweredSet = new Set();
            const domainsPracticedSet = new Set();
            
            const currentQuestions = AppState.getCurrentQuestions();
            const userAnswers = AppState.getUserAnswers();
            const currentTest = AppState.getCurrentTest();
            const selectedDomain = AppState.getSelectedDomain();
            const currentUserName = AppState.getCurrentUserName();
            
            // Process current session answers only if includeCurrentSession is true
            if (includeCurrentSession && currentQuestions && currentQuestions.length > 0) {
                currentQuestions.forEach(question => {
                    // Use uniqueId for retrieving answers
                    const questionKey = (question.uniqueId || question.id).toString();
                    const selectedAnswers = userAnswers[questionKey] || [];
                    
                    if (selectedAnswers.length > 0) {
                        // Use uniqueId for tracking, fallback to generated ID
                        const questionId = question.uniqueId || (currentTest ? `test${currentTest}-q${question.id}` : `domain-${selectedDomain}-q${question.id}`);
                        
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
                });
            }
            
            // Process all saved progress from other tests
            // Check both window.examQuestions and global examQuestions
            const questions = window.examQuestions || (typeof examQuestions !== 'undefined' ? examQuestions : undefined);
            
            if (questions && currentUserName) {
                const userKey = UserManager.getUserKey(currentUserName);
                const currentUserEmail = AppState.getCurrentUserEmail();
                const allTestKeys = Object.keys(questions).filter(key => key.startsWith('test'));
                const maxTestNum = Math.max(...allTestKeys.map(key => parseInt(key.replace('test', ''))));
                
                // Also check for Firestore-synced progress (stored with document IDs as keys)
                const firestoreProgressKeys = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key) {
                        try {
                            const value = localStorage.getItem(key);
                            if (value) {
                                const parsed = JSON.parse(value);
                                // Check if this is a progress document for current user
                                if (parsed.userEmail === currentUserEmail && parsed.test) {
                                    firestoreProgressKeys.push({ key, progress: parsed });
                                }
                            }
                        } catch (e) {
                            // Not JSON, skip
                        }
                    }
                }
                
                for (let testNum = 1; testNum <= maxTestNum; testNum++) {
                    const progressKey = `${Config.STORAGE_KEYS.PROGRESS_PREFIX}${userKey}-test${testNum}`;
                    const saved = localStorage.getItem(progressKey);
                    
                    // Also check Firestore-synced progress for this test
                    const firestoreProgress = firestoreProgressKeys.find(p => p.progress.test === testNum);
                    const progressToUse = firestoreProgress ? firestoreProgress.progress : (saved ? JSON.parse(saved) : null);
                    
                    if (progressToUse) {
                        try {
                            const progress = progressToUse;
                            if (progress.answers && progress.test === testNum) {
                                const testKey = `test${testNum}`;
                                const testQuestions = questions[testKey];
                                if (testQuestions && testQuestions.length > 0) {
                                    testQuestions.forEach((question, qIndex) => {
                                        // Try to match by uniqueId first, then by id
                                        const questionUniqueId = question.uniqueId || `test${testNum}-q${qIndex + 1}`;
                                        const questionKey = questionUniqueId.toString();
                                        const oldQuestionKey = question.id.toString();
                                        const selectedAnswers = progress.answers[questionKey] || progress.answers[oldQuestionKey] || [];
                                        
                                        if (selectedAnswers.length > 0) {
                                            // Use uniqueId for tracking
                                            const questionId = questionUniqueId;
                                            
                                            if (!questionsAnsweredSet.has(questionId)) {
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
                
                // Process domain review saved progress
                // Also check Firestore-synced domain progress
                const domainProgressKeys = [];
                const firestoreDomainProgress = [];
                
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (!key) continue;
                    
                    // Old format
                    if (key.startsWith(`${Config.STORAGE_KEYS.PROGRESS_PREFIX}${userKey}-domain-`)) {
                        domainProgressKeys.push(key);
                    }
                    
                    // Firestore format - check if it's domain progress
                    try {
                        const value = localStorage.getItem(key);
                        if (value) {
                            const parsed = JSON.parse(value);
                            if (parsed.userEmail === currentUserEmail && parsed.selectedDomain && !parsed.test) {
                                firestoreDomainProgress.push({ key, progress: parsed });
                            }
                        }
                    } catch (e) {
                        // Not JSON, skip
                    }
                }
                
                // Process both old format and Firestore-synced domain progress
                const allDomainProgress = [];
                domainProgressKeys.forEach(progressKey => {
                    const saved = localStorage.getItem(progressKey);
                    if (saved) {
                        try {
                            allDomainProgress.push(JSON.parse(saved));
                        } catch (e) {
                            // Skip invalid JSON
                        }
                    }
                });
                // Add Firestore-synced domain progress
                firestoreDomainProgress.forEach(({ progress }) => {
                    allDomainProgress.push(progress);
                });
                
                allDomainProgress.forEach(progress => {
                    if (progress.answers && progress.selectedDomain) {
                        try {
                            const allQuestions = [];
                            // Check both window.examQuestions and global examQuestions
                            const domainQuestions = window.examQuestions || (typeof examQuestions !== 'undefined' ? examQuestions : undefined);
                            if (domainQuestions) {
                                for (const testKey in domainQuestions) {
                                    if (domainQuestions.hasOwnProperty(testKey) && testKey.startsWith('test')) {
                                        allQuestions.push(...domainQuestions[testKey]);
                                    }
                                }
                            }
                            const filteredDomainQuestions = allQuestions.filter(q => q.domain === progress.selectedDomain);
                            
                            if (filteredDomainQuestions && filteredDomainQuestions.length > 0) {
                                filteredDomainQuestions.forEach(question => {
                                    // Try to match by uniqueId first, then by id
                                    const questionUniqueId = question.uniqueId || question.id;
                                    const questionKey = questionUniqueId.toString();
                                    const oldQuestionKey = question.id.toString();
                                    const selectedAnswers = progress.answers[questionKey] || progress.answers[oldQuestionKey] || [];
                                    
                                    if (selectedAnswers.length > 0) {
                                        // Use uniqueId for tracking
                                        const questionId = questionUniqueId;
                                        
                                        if (!questionsAnsweredSet.has(questionId)) {
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
                        } catch (error) {
                            console.error(`Error processing saved domain progress:`, error);
                        }
                    }
                });
            }
            
            // Update user stats
            totalQuestionsAnswered = questionsAnsweredSet.size;
            currentUser.stats.totalQuestionsAnswered = totalQuestionsAnswered;
            currentUser.stats.totalCorrectAnswers = totalCorrectAnswers;
            currentUser.stats.questionsAnswered = questionsAnsweredSet;
            currentUser.stats.domainsPracticed = domainsPracticedSet;
            currentUser.stats.lastActivity = new Date().toISOString();
            
            UserManager.saveUser();
            Stats.updateDashboard();
        },
        
        // Update dashboard stats display
        updateDashboard: () => {
            const currentUser = AppState.getCurrentUser();
            if (!currentUser) return;
            
            const accuracy = currentUser.stats.totalQuestionsAnswered > 0
                ? Math.round((currentUser.stats.totalCorrectAnswers / currentUser.stats.totalQuestionsAnswered) * 100)
                : 0;
            
            // Update user name in header
            const userNameElement = document.getElementById('user-name');
            if (userNameElement && currentUser) {
                const currentUserEmail = AppState.getCurrentUserEmail();
                userNameElement.textContent = currentUser.name || currentUser.displayName || currentUserEmail?.split('@')[0] || 'Student';
            }
            
            // Update insights if available
            if (typeof Insights !== 'undefined' && Insights.displayInsights) {
                Insights.displayInsights();
            }
        }
    };
})();

// Expose Stats to global scope for compatibility
if (typeof window !== 'undefined') {
    window.Stats = Stats;
}
