// Insights and Analytics Module
const Insights = (function() {
    'use strict';
    
    return {
        // Calculate comprehensive insights from all user progress
        calculateInsights: () => {
            const currentUser = AppState.getCurrentUser();
            if (!currentUser) return null;
            
            const currentUserEmail = AppState.getCurrentUserEmail();
            if (!currentUserEmail) return null;
            
            const userKey = currentUserEmail.toLowerCase().replace(/[^a-z0-9@.-]/g, '-');
            const questions = window.examQuestions || (typeof examQuestions !== 'undefined' ? examQuestions : undefined);
            
            if (!questions) {
                console.warn('Cannot calculate insights: questions not loaded');
                return null;
            }
            
            // Domain statistics
            const domainStats = {};
            const allDomains = [
                'Design Secure Architectures',
                'Design Resilient Architectures',
                'Design High-Performing Architectures',
                'Design Cost-Optimized Architectures'
            ];
            
            // Initialize domain stats
            allDomains.forEach(domain => {
                domainStats[domain] = {
                    total: 0,
                    answered: 0,
                    correct: 0,
                    incorrect: 0,
                    unanswered: 0,
                    accuracy: 0
                };
            });
            
            // Collect all questions by domain
            const questionsByDomain = {};
            Object.keys(questions).forEach(testKey => {
                if (testKey.startsWith('test')) {
                    const testQuestions = questions[testKey];
                    if (Array.isArray(testQuestions)) {
                        testQuestions.forEach(question => {
                            const domain = question.domain || 'Unknown';
                            if (!questionsByDomain[domain]) {
                                questionsByDomain[domain] = [];
                            }
                            questionsByDomain[domain].push({
                                question: question,
                                testKey: testKey
                            });
                        });
                    }
                }
            });
            
            // Process all saved progress
            const allTestKeys = Object.keys(questions).filter(key => key.startsWith('test'));
            const maxTestNum = allTestKeys.length > 0 
                ? Math.max(...allTestKeys.map(key => parseInt(key.replace('test', ''))))
                : 0;
            
            // Process test progress
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
                                testQuestions.forEach(question => {
                                    const domain = question.domain || 'Unknown';
                                    if (domainStats[domain]) {
                                        domainStats[domain].total++;
                                        
                                        const questionUniqueId = question.uniqueId || `test${testNum}-q${question.id}`;
                                        const questionKey = questionUniqueId.toString();
                                        const oldQuestionKey = question.id.toString();
                                        const selectedAnswers = progress.answers[questionKey] || progress.answers[oldQuestionKey] || [];
                                        
                                        if (selectedAnswers.length > 0) {
                                            domainStats[domain].answered++;
                                            
                                            const selectedSet = new Set(selectedAnswers.sort());
                                            const correctSet = new Set(question.correctAnswers.sort());
                                            const isCorrect = selectedSet.size === correctSet.size && 
                                                            [...selectedSet].every(id => correctSet.has(id));
                                            
                                            if (isCorrect) {
                                                domainStats[domain].correct++;
                                            } else {
                                                domainStats[domain].incorrect++;
                                            }
                                        } else {
                                            domainStats[domain].unanswered++;
                                        }
                                    }
                                });
                            }
                        }
                    } catch (error) {
                        console.error(`Error processing test ${testNum} for insights:`, error);
                    }
                }
            }
            
            // Process domain review progress
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(`${Config.STORAGE_KEYS.PROGRESS_PREFIX}${userKey}-domain-`)) {
                    const saved = localStorage.getItem(key);
                    if (saved) {
                        try {
                            const progress = JSON.parse(saved);
                            if (progress.answers && progress.selectedDomain) {
                                const domain = progress.selectedDomain;
                                if (domainStats[domain]) {
                                    // Get all questions for this domain
                                    const domainQuestions = questionsByDomain[domain] || [];
                                    domainQuestions.forEach(({ question }) => {
                                        const questionUniqueId = question.uniqueId || question.id;
                                        const questionKey = questionUniqueId.toString();
                                        const oldQuestionKey = question.id.toString();
                                        const selectedAnswers = progress.answers[questionKey] || progress.answers[oldQuestionKey] || [];
                                        
                                        // Only count if not already counted in test progress
                                        // We'll use a simple heuristic: if domain stats total is less than domain questions, add it
                                        if (selectedAnswers.length > 0) {
                                            // Check if we've already counted this question
                                            // For simplicity, we'll just update if domain total is 0
                                            if (domainStats[domain].total === 0) {
                                                domainStats[domain].total++;
                                                domainStats[domain].answered++;
                                                
                                                const selectedSet = new Set(selectedAnswers.sort());
                                                const correctSet = new Set(question.correctAnswers.sort());
                                                const isCorrect = selectedSet.size === correctSet.size && 
                                                                [...selectedSet].every(id => correctSet.has(id));
                                                
                                                if (isCorrect) {
                                                    domainStats[domain].correct++;
                                                } else {
                                                    domainStats[domain].incorrect++;
                                                }
                                            }
                                        }
                                    });
                                }
                            }
                        } catch (error) {
                            console.error('Error processing domain progress for insights:', error);
                        }
                    }
                }
            }
            
            // Calculate accuracy for each domain
            Object.keys(domainStats).forEach(domain => {
                const stats = domainStats[domain];
                if (stats.answered > 0) {
                    stats.accuracy = Math.round((stats.correct / stats.answered) * 100);
                }
            });
            
            // Find strongest and weakest domains
            const domainsWithData = Object.keys(domainStats).filter(domain => domainStats[domain].answered > 0);
            let strongestDomain = null;
            let weakestDomain = null;
            let highestAccuracy = -1;
            let lowestAccuracy = 101;
            
            domainsWithData.forEach(domain => {
                const accuracy = domainStats[domain].accuracy;
                if (accuracy > highestAccuracy) {
                    highestAccuracy = accuracy;
                    strongestDomain = domain;
                }
                if (accuracy < lowestAccuracy) {
                    lowestAccuracy = accuracy;
                    weakestDomain = domain;
                }
            });
            
            return {
                domainStats: domainStats,
                strongestDomain: strongestDomain,
                weakestDomain: weakestDomain,
                totalQuestions: Object.values(domainStats).reduce((sum, stats) => sum + stats.total, 0),
                totalAnswered: Object.values(domainStats).reduce((sum, stats) => sum + stats.answered, 0),
                totalCorrect: Object.values(domainStats).reduce((sum, stats) => sum + stats.correct, 0),
                overallAccuracy: 0
            };
        },
        
        // Display insights on dashboard
        displayInsights: () => {
            const insightsContainer = document.getElementById('insights-container');
            if (!insightsContainer) return;
            
            const insights = Insights.calculateInsights();
            if (!insights) {
                insightsContainer.innerHTML = '<p class="insights-empty">Complete some questions to see insights!</p>';
                return;
            }
            
            // Calculate overall accuracy
            insights.overallAccuracy = insights.totalAnswered > 0
                ? Math.round((insights.totalCorrect / insights.totalAnswered) * 100)
                : 0;
            
            let html = '<div class="insights-content">';
            
            // Overall summary
            html += `
                <div class="insights-summary">
                    <h3>Overall Performance</h3>
                    <div class="summary-stats">
                        <div class="summary-stat">
                            <span class="stat-label">Total Answered</span>
                            <span class="stat-value">${insights.totalAnswered}</span>
                        </div>
                        <div class="summary-stat">
                            <span class="stat-label">Overall Accuracy</span>
                            <span class="stat-value">${insights.overallAccuracy}%</span>
                        </div>
                        <div class="summary-stat">
                            <span class="stat-label">Correct Answers</span>
                            <span class="stat-value">${insights.totalCorrect}</span>
                        </div>
                    </div>
                </div>
            `;
            
            // Domain breakdown
            html += '<div class="insights-domains"><h3>Performance by Domain</h3>';
            
            const domains = [
                'Design Secure Architectures',
                'Design Resilient Architectures',
                'Design High-Performing Architectures',
                'Design Cost-Optimized Architectures'
            ];
            
            domains.forEach(domain => {
                const stats = insights.domainStats[domain];
                const progressPercent = stats.total > 0 ? Math.round((stats.answered / stats.total) * 100) : 0;
                
                html += `
                    <div class="domain-insight-card">
                        <div class="domain-header">
                            <h4>${domain}</h4>
                            <span class="domain-accuracy">${stats.accuracy}%</span>
                        </div>
                        <div class="domain-progress-bar">
                            <div class="progress-fill" style="width: ${progressPercent}%"></div>
                        </div>
                        <div class="domain-details">
                            <span>Answered: ${stats.answered}/${stats.total}</span>
                            <span>Correct: ${stats.correct}</span>
                            <span>Incorrect: ${stats.incorrect}</span>
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
            
            // Strongest/Weakest domains
            if (insights.strongestDomain || insights.weakestDomain) {
                html += '<div class="insights-highlights">';
                if (insights.strongestDomain) {
                    html += `
                        <div class="highlight-card highlight-strong">
                            <h4>🏆 Strongest Domain</h4>
                            <p>${insights.strongestDomain}</p>
                            <span class="highlight-value">${insights.domainStats[insights.strongestDomain].accuracy}% accuracy</span>
                        </div>
                    `;
                }
                if (insights.weakestDomain) {
                    html += `
                        <div class="highlight-card highlight-weak">
                            <h4>📚 Needs Practice</h4>
                            <p>${insights.weakestDomain}</p>
                            <span class="highlight-value">${insights.domainStats[insights.weakestDomain].accuracy}% accuracy</span>
                        </div>
                    `;
                }
                html += '</div>';
            }
            
            html += '</div>';
            insightsContainer.innerHTML = html;
        }
    };
})();
