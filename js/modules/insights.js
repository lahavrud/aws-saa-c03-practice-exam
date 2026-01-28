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
            let testsCompleted = 0;
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
                                // Check if test is completed (all questions answered)
                                const answeredCount = Object.keys(progress.answers || {}).length;
                                if (answeredCount === testQuestions.length) {
                                    testsCompleted++;
                                }
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
            // Track which questions we've already counted to avoid double-counting
            const countedQuestionIds = new Set();
            
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
                                        
                                        // Count all answered questions, avoiding duplicates
                                        if (selectedAnswers.length > 0) {
                                            // Use uniqueId to avoid counting same question twice
                                            const questionId = questionUniqueId.toString();
                                            
                                            if (!countedQuestionIds.has(questionId)) {
                                                countedQuestionIds.add(questionId);
                                                
                                                // Only count if not already counted from test progress
                                                // Check if this question was already counted in test progress
                                                let alreadyCounted = false;
                                                if (question.testNumber) {
                                                    // This question might have been counted in test progress
                                                    // We'll count it anyway for domain-specific practice
                                                    alreadyCounted = false;
                                                }
                                                
                                                if (!alreadyCounted) {
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
                testsCompleted: testsCompleted,
                overallAccuracy: 0
            };
        },
        
        // Display insights on dashboard
        displayInsights: () => {
            const insightsContainer = document.getElementById('insights-container');
            if (!insightsContainer) return;
            
            // Setup toggle functionality
            const toggle = document.getElementById('insights-toggle');
            const content = document.getElementById('insights-content');
            if (toggle && content) {
                // Remove existing listeners by cloning
                const newToggle = toggle.cloneNode(true);
                toggle.parentNode.replaceChild(newToggle, toggle);
                
                newToggle.addEventListener('click', () => {
                    const isExpanded = newToggle.getAttribute('aria-expanded') === 'true';
                    if (isExpanded) {
                        content.style.display = 'none';
                        newToggle.setAttribute('aria-expanded', 'false');
                    } else {
                        content.style.display = 'block';
                        newToggle.setAttribute('aria-expanded', 'true');
                    }
                });
            }
            
            // Show loading state
            const contentDiv = content || insightsContainer;
            if (contentDiv) {
                contentDiv.innerHTML = '<div class="insights-loading"><div class="skeleton-loader"></div><div class="skeleton-loader"></div><div class="skeleton-loader"></div></div>';
            }
            
            // Simulate loading delay for better UX
            setTimeout(() => {
                const insights = Insights.calculateInsights();
                if (!insights) {
                    const emptyHtml = `
                        <div class="insights-empty" role="status" aria-live="polite">
                            <div class="empty-state-icon">📊</div>
                            <h3>No Data Yet</h3>
                            <p>Start practicing to see your performance insights here.</p>
                            <button class="empty-state-cta" onclick="if (typeof Navigation !== 'undefined') Navigation.selectPracticeMode('test');">
                                Start Your First Test
                            </button>
                        </div>
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 16px; opacity: 0.3;">
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                                <line x1="12" y1="22.08" x2="12" y2="12"></line>
                            </svg>
                            <p>Complete some questions to see insights!</p>
                            <p style="font-size: 0.9em; margin-top: 8px; opacity: 0.7;">Start practicing to track your performance across domains</p>
                        </div>
                    `;
                    if (contentDiv) {
                        contentDiv.innerHTML = emptyHtml;
                    }
                    return;
                }
            
            // Calculate overall accuracy
            insights.overallAccuracy = insights.totalAnswered > 0
                ? Math.round((insights.totalCorrect / insights.totalAnswered) * 100)
                : 0;
            
            let html = '<div class="insights-content">';
            
            // Calculate additional metrics
            const totalIncorrect = insights.totalAnswered - insights.totalCorrect;
            const domainsWithData = Object.keys(insights.domainStats).filter(domain => 
                insights.domainStats[domain].answered > 0
            );
            const strongestDomain = insights.strongestDomain;
            const strongestAccuracy = strongestDomain ? insights.domainStats[strongestDomain].accuracy : 0;
            
            // Compact stats grid - more informative
            html += '<div class="insights-quick-stats">';
            html += `
                <div class="quick-stat-card">
                    <div class="quick-stat-icon">📊</div>
                    <div class="quick-stat-info">
                        <div class="quick-stat-label">Tests Completed</div>
                        <div class="quick-stat-value">${insights.testsCompleted || 0}</div>
                    </div>
                </div>
                <div class="quick-stat-card">
                    <div class="quick-stat-icon">✅</div>
                    <div class="quick-stat-info">
                        <div class="quick-stat-label">Questions Answered</div>
                        <div class="quick-stat-value">${insights.totalAnswered}</div>
                        <div class="quick-stat-detail">${insights.totalCorrect} correct, ${totalIncorrect} incorrect</div>
                    </div>
                </div>
                <div class="quick-stat-card">
                    <div class="quick-stat-icon">🎯</div>
                    <div class="quick-stat-info">
                        <div class="quick-stat-label">Overall Accuracy</div>
                        <div class="quick-stat-value">${insights.overallAccuracy}%</div>
                        ${strongestDomain ? `<div class="quick-stat-detail">Best: ${strongestDomain.split(' ').pop()} (${strongestAccuracy}%)</div>` : ''}
                    </div>
                </div>
            `;
            html += '</div>';
            
            // Domain performance summary (compact)
            if (domainsWithData.length > 0) {
                html += '<div class="insights-domain-summary">';
                html += '<h4>Domain Performance</h4>';
                html += '<div class="domain-performance-list">';
                
                // Sort domains by accuracy (best to worst)
                const sortedDomains = domainsWithData.sort((a, b) => {
                    return insights.domainStats[b].accuracy - insights.domainStats[a].accuracy;
                });
                
                // Show top 2 and bottom 1 (or all if 3 or fewer)
                const domainsToShow = sortedDomains.length <= 3 
                    ? sortedDomains 
                    : [sortedDomains[0], sortedDomains[1], sortedDomains[sortedDomains.length - 1]];
                
                domainsToShow.forEach(domain => {
                    const stats = insights.domainStats[domain];
                    const domainShort = domain.replace('Design ', '').replace(' Architectures', '');
                    const isBest = domain === strongestDomain;
                    const isWorst = domain === insights.weakestDomain;
                    
                    html += `
                        <div class="domain-performance-item ${isBest ? 'best' : ''} ${isWorst ? 'worst' : ''}">
                            <div class="domain-name">${domainShort}</div>
                            <div class="domain-stats">
                                <span class="domain-accuracy">${stats.accuracy}%</span>
                                <span class="domain-count">(${stats.answered} answered)</span>
                            </div>
                        </div>
                    `;
                });
                
                html += '</div>';
                html += '</div>';
            }
            
            // Study recommendations
            if (insights.weakestDomain) {
                html += '<div class="insights-recommendation">';
                html += `
                    <div class="recommendation-card">
                        <div class="recommendation-icon">💡</div>
                        <div class="recommendation-content">
                            <h4>Focus Area</h4>
                            <p>Consider practicing <strong>${insights.weakestDomain}</strong> more to improve your overall performance.</p>
                            <button class="recommendation-btn" onclick="TestManager.selectDomainForReviewInModal('${insights.weakestDomain}')">
                                Practice This Domain
                            </button>
                        </div>
                    </div>
                `;
                html += '</div>';
            }
            
            html += '</div>';
            if (contentDiv) {
                contentDiv.innerHTML = html;
            }
            }, 300); // Small delay for better perceived performance
        }
    };
})();
