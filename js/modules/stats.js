// Statistics Calculation Module
const Stats = (function() {
    'use strict';
    
    return {
        // Recalculate user stats from saved progress
        recalculateUserStats: (includeCurrentSession = true) => {
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
                const allTestKeys = Object.keys(questions).filter(key => key.startsWith('test'));
                const maxTestNum = Math.max(...allTestKeys.map(key => parseInt(key.replace('test', ''))));
                
                for (let testNum = 1; testNum <= maxTestNum; testNum++) {
                    const progressKey = `${Config.STORAGE_KEYS.PROGRESS_PREFIX}${userKey}-test${testNum}`;
                    const saved = localStorage.getItem(progressKey);
                    if (saved) {
                        try {
                            const progress = JSON.parse(saved);
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
                const domainProgressKeys = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith(`${Config.STORAGE_KEYS.PROGRESS_PREFIX}${userKey}-domain-`)) {
                        domainProgressKeys.push(key);
                    }
                }
                
                domainProgressKeys.forEach(progressKey => {
                    const saved = localStorage.getItem(progressKey);
                    if (saved) {
                        try {
                            const progress = JSON.parse(saved);
                            if (progress.answers && progress.selectedDomain) {
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
