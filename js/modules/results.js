// Results Display Module
const Results = (function() {
    'use strict';
    
    return {
        // Show test results
        show: () => {
            // Check if we're already on the results screen
            const resultsScreen = document.getElementById('results-screen');
            const isAlreadyOnResultsScreen = resultsScreen && !resultsScreen.classList.contains('hidden');
            
            // Use Navigation to properly handle screen switching and navbar back button
            if (typeof Navigation !== 'undefined') {
                Navigation.hideScreen('question-screen');
                if (!isAlreadyOnResultsScreen) {
                    Navigation.showScreen('results-screen');
                }
            } else {
                // Fallback if Navigation is not available
                const questionScreen = document.getElementById('question-screen');
                if (questionScreen) questionScreen.classList.add('hidden');
                if (resultsScreen && !isAlreadyOnResultsScreen) {
                    resultsScreen.classList.remove('hidden');
                }
            }
            
            // Scroll to top of results screen
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            const currentMode = AppState.getCurrentMode();
            const currentQuestions = AppState.getCurrentQuestions();
            const userAnswers = AppState.getUserAnswers();
            
            // Debug logging
            console.log('Results.show() called');
            console.log('Current questions:', currentQuestions ? currentQuestions.length : 'null');
            console.log('User answers:', userAnswers ? Object.keys(userAnswers).length : 'null');
            
            // Validate data
            if (!currentQuestions || currentQuestions.length === 0) {
                console.error('No questions available for results calculation');
                return;
            }
            
            // Mark test as completed if in test mode
            if (currentMode === Config.MODES.TEST) {
                UserManager.markTestCompleted();
            }
            
            // Calculate scores
            let correct = 0;
            let incorrect = 0;
            let unanswered = 0;
            
            if (currentQuestions && Array.isArray(currentQuestions)) {
                currentQuestions.forEach(question => {
                    // Use uniqueId for retrieving answers
                    const questionKey = (question.uniqueId || question.id).toString();
                    const selectedAnswers = (userAnswers && userAnswers[questionKey]) ? userAnswers[questionKey] : [];
                    
                    if (!selectedAnswers || selectedAnswers.length === 0) {
                        unanswered++;
                    } else {
                        // Ensure correctAnswers exists
                        if (!question.correctAnswers || !Array.isArray(question.correctAnswers)) {
                            console.warn('Question missing correctAnswers:', question);
                            unanswered++;
                            return;
                        }
                        
                        const selectedSet = new Set(selectedAnswers.sort());
                        const correctSet = new Set(question.correctAnswers.sort());
                        const isCorrect = selectedSet.size === correctSet.size && 
                                        [...selectedSet].every(id => correctSet.has(id));
                        
                        if (isCorrect) {
                            correct++;
                        } else {
                            incorrect++;
                        }
                    }
                });
            }
            
            const total = currentQuestions ? currentQuestions.length : 0;
            const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
            const isPassing = accuracy >= 72;
            
            console.log('Calculated scores:', { correct, incorrect, unanswered, total, accuracy });
            
            // Save submitted test if in test mode
            if (currentMode === Config.MODES.TEST) {
                Results.saveSubmittedTest(currentQuestions, userAnswers, correct, incorrect, unanswered, accuracy);
            }
            
            // Update results display (using correct element IDs from HTML)
            const totalScoreEl = document.getElementById('total-score');
            const correctEl = document.getElementById('correct-count');
            const incorrectEl = document.getElementById('incorrect-count');
            const unansweredEl = document.getElementById('unanswered-count');
            
            if (totalScoreEl) {
                totalScoreEl.textContent = `${accuracy}%`;
                // Add passing/failing class
                totalScoreEl.classList.remove('passing', 'failing');
                if (isPassing) {
                    totalScoreEl.classList.add('passing');
                } else {
                    totalScoreEl.classList.add('failing');
                }
            }
            if (correctEl) {
                correctEl.textContent = correct.toString();
                correctEl.classList.add('correct-stat');
                console.log('Set correct count to:', correct);
            } else {
                console.error('correct-count element not found');
            }
            if (incorrectEl) {
                incorrectEl.textContent = incorrect.toString();
                incorrectEl.classList.add('incorrect-stat');
                console.log('Set incorrect count to:', incorrect);
            } else {
                console.error('incorrect-count element not found');
            }
            if (unansweredEl) {
                unansweredEl.textContent = unanswered.toString();
                console.log('Set unanswered count to:', unanswered);
            } else {
                console.error('unanswered-count element not found');
            }
            
            // Animate circular progress
            const progressCircle = document.querySelector('.score-circle-progress');
            if (progressCircle) {
                const circumference = 2 * Math.PI * 90; // radius = 90
                const offset = circumference - (accuracy / 100) * circumference;
                const circleColor = isPassing ? '#4caf50' : '#f44336';
                progressCircle.style.stroke = circleColor;
                progressCircle.style.strokeDashoffset = offset;
            }
            
            // Build results breakdown
            Results.buildBreakdown(currentQuestions, userAnswers);
            
            // Show review questions
            Results.showReviewQuestions(currentQuestions, userAnswers);
            
            // Set up review section toggle
            const reviewToggle = document.getElementById('review-toggle-btn');
            const reviewContainer = document.getElementById('review-questions');
            if (reviewToggle && reviewContainer) {
                reviewToggle.addEventListener('click', () => {
                    const isExpanded = reviewToggle.getAttribute('aria-expanded') === 'true';
                    reviewToggle.setAttribute('aria-expanded', !isExpanded);
                    if (isExpanded) {
                        reviewContainer.classList.remove('expanded');
                    } else {
                        reviewContainer.classList.add('expanded');
                    }
                });
                // Start collapsed
                reviewToggle.setAttribute('aria-expanded', 'false');
            }
            
            // Show "View in Submitted Tests" button if in test mode
            const viewSubmittedBtn = document.getElementById('view-submitted-test-btn');
            if (viewSubmittedBtn) {
                if (currentMode === Config.MODES.TEST) {
                    viewSubmittedBtn.style.display = 'inline-block';
                    // Store the submitted test ID for later retrieval
                    const submittedTests = Results.loadSubmittedTests();
                    if (submittedTests.length > 0) {
                        viewSubmittedBtn.setAttribute('data-submitted-test-id', submittedTests[0].id);
                    }
                } else {
                    viewSubmittedBtn.style.display = 'none';
                }
            }
        },
        
        // Build results breakdown by domain
        buildBreakdown: (questions, userAnswers) => {
            const breakdownContainer = document.getElementById('domain-breakdown');
            if (!breakdownContainer) return;
            
            breakdownContainer.innerHTML = '';
            
            // Group questions by domain
            const domainStats = {};
            
            questions.forEach(question => {
                const domain = question.domain || 'Unknown';
                if (!domainStats[domain]) {
                    domainStats[domain] = { total: 0, correct: 0, incorrect: 0, unanswered: 0 };
                }
                
                domainStats[domain].total++;
                
                // Use uniqueId for retrieving answers
                const questionKey = (question.uniqueId || question.id).toString();
                const selectedAnswers = userAnswers[questionKey] || [];
                
                if (selectedAnswers.length === 0) {
                    domainStats[domain].unanswered++;
                } else {
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
            });
            
            // Display breakdown
            Object.keys(domainStats).forEach(domain => {
                const stats = domainStats[domain];
                const domainScore = stats.total > 0 ? ((stats.correct / stats.total) * 100).toFixed(1) : '0.0';
                
                const domainDiv = document.createElement('div');
                domainDiv.className = 'domain-item';
                const scorePercent = parseFloat(domainScore);
                const isPassing = scorePercent >= 72;
                
                domainDiv.innerHTML = `
                    <div class="domain-breakdown-content">
                        <span class="domain-name">${domain}</span>
                        <div class="domain-breakdown-bar">
                            <div class="domain-breakdown-progress" style="width: ${scorePercent}%; background: ${isPassing ? '#4caf50' : '#f44336'};"></div>
                        </div>
                    </div>
                    <span class="domain-score ${isPassing ? 'passing' : 'failing'}">${domainScore}% (${stats.correct}/${stats.total})</span>
                `;
                
                breakdownContainer.appendChild(domainDiv);
            });
        },
        
        // Show review questions
        showReviewQuestions: (questions, userAnswers) => {
            const reviewContainer = document.getElementById('review-questions');
            if (!reviewContainer) return;
            
            reviewContainer.innerHTML = '';
            
            questions.forEach((question, index) => {
                // Use uniqueId for retrieving answers
                const questionKey = (question.uniqueId || question.id).toString();
                const selectedAnswers = userAnswers[questionKey] || [];
                const correctAnswers = question.correctAnswers || [];
                
                const selectedSet = new Set(selectedAnswers.sort());
                const correctSet = new Set(correctAnswers.sort());
                const isCorrect = selectedAnswers.length > 0 && 
                                 selectedSet.size === correctSet.size && 
                                 [...selectedSet].every(id => correctSet.has(id));
                
                const reviewItem = document.createElement('div');
                reviewItem.className = `review-item ${selectedAnswers.length === 0 ? 'unanswered' : (isCorrect ? 'correct' : 'incorrect')}`;
                reviewItem.style.cursor = 'pointer';
                reviewItem.setAttribute('role', 'button');
                reviewItem.setAttribute('tabindex', '0');
                reviewItem.setAttribute('aria-label', `View question ${index + 1}`);
                
                const selectedText = selectedAnswers.length > 0 
                    ? question.options.filter((opt, idx) => selectedAnswers.includes(idx)).map(opt => opt.text).join(', ')
                    : 'Not answered';
                
                const correctText = question.options.filter((opt, idx) => correctAnswers.includes(idx)).map(opt => opt.text).join(', ');
                
                reviewItem.innerHTML = `
                    <div class="review-question">Q${index + 1}: ${(question.text || question.question || 'Question').substring(0, 100)}...</div>
                    <div class="review-answer"><strong>Your answer:</strong> ${selectedText}</div>
                    <div class="review-answer"><strong>Correct answer:</strong> ${correctText}</div>
                `;
                
                // Add click handler to open question in modal
                reviewItem.addEventListener('click', () => {
                    Results.showQuestionModal(question, index, selectedAnswers, correctAnswers, questions.length);
                });
                
                // Add keyboard support
                reviewItem.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        Results.showQuestionModal(question, index, selectedAnswers, correctAnswers, questions.length);
                    }
                });
                
                reviewContainer.appendChild(reviewItem);
            });
        },
        
        // Show question in modal window
        showQuestionModal: (question, index, selectedAnswers, correctAnswers, totalQuestions) => {
            // Create or get modal
            let modal = document.getElementById('question-review-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'question-review-modal';
                modal.className = 'modal hidden';
                modal.setAttribute('role', 'dialog');
                modal.setAttribute('aria-labelledby', 'question-review-title');
                modal.setAttribute('aria-modal', 'true');
                document.body.appendChild(modal);
            }
            
            const selectedText = selectedAnswers.length > 0 
                ? question.options.filter((opt, idx) => selectedAnswers.includes(idx)).map(opt => opt.text).join(', ')
                : 'Not answered';
            
            const correctText = question.options.filter((opt, idx) => correctAnswers.includes(idx)).map(opt => opt.text).join(', ');
            
            const selectedSet = new Set(selectedAnswers.sort());
            const correctSet = new Set(correctAnswers.sort());
            const isCorrect = selectedAnswers.length > 0 && 
                             selectedSet.size === correctSet.size && 
                             [...selectedSet].every(id => correctSet.has(id));
            
            const statusClass = selectedAnswers.length === 0 ? 'unanswered' : (isCorrect ? 'correct' : 'incorrect');
            const statusText = selectedAnswers.length === 0 ? 'Unanswered' : (isCorrect ? 'Correct' : 'Incorrect');
            
            modal.innerHTML = `
                <div class="modal-content question-review-modal-content">
                    <div class="question-review-header">
                        <h3 id="question-review-title">Question ${index + 1} of ${totalQuestions}</h3>
                        <button class="modal-close-btn" onclick="closeQuestionReviewModal()" aria-label="Close">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div class="question-review-body">
                        <div class="question-review-status ${statusClass}">
                            <span>${statusText}</span>
                        </div>
                        <div class="question-review-question">
                            <h4>Question:</h4>
                            <p>${question.text || question.question || 'Question'}</p>
                        </div>
                        <div class="question-review-options">
                            <h4>Options:</h4>
                            <ul>
                                ${question.options.map((opt, idx) => {
                                    const isSelected = selectedAnswers.includes(idx);
                                    const isCorrect = correctAnswers.includes(idx);
                                    let className = '';
                                    if (isCorrect) className = 'correct-option';
                                    if (isSelected && !isCorrect) className = 'incorrect-selected';
                                    if (isSelected && isCorrect) className = 'correct-selected';
                                    
                                    return `<li class="${className}">
                                        ${isSelected ? '✓ ' : ''}${opt.text}
                                        ${isCorrect ? ' (Correct)' : ''}
                                    </li>`;
                                }).join('')}
                            </ul>
                        </div>
                        <div class="question-review-summary">
                            <div class="review-summary-item">
                                <strong>Your answer:</strong> ${selectedText}
                            </div>
                            <div class="review-summary-item">
                                <strong>Correct answer:</strong> ${correctText}
                            </div>
                        </div>
                        ${question.explanation ? Results.formatExplanationForModal(question.explanation, question.options, correctAnswers) : ''}
                    </div>
                </div>
            `;
            
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            
            // Focus on close button for accessibility
            const closeBtn = modal.querySelector('.modal-close-btn');
            if (closeBtn) {
                closeBtn.focus();
            }
            
            // Close on backdrop click
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    closeQuestionReviewModal();
                }
            });
        },
        
        // Save submitted test
        saveSubmittedTest: (questions, userAnswers, correct, incorrect, unanswered, accuracy) => {
            const currentUser = AppState.getCurrentUser();
            const currentUserEmail = AppState.getCurrentUserEmail();
            const currentTest = AppState.getCurrentTest();
            const selectedSource = AppState.getSelectedSource();
            
            if (!currentUser || !currentUserEmail || !currentTest) return;
            
            const userKey = currentUserEmail.toLowerCase().replace(/[^a-z0-9@.-]/g, '-');
            const submittedTestsKey = `${Config.STORAGE_KEYS.SUBMITTED_TESTS_PREFIX}${userKey}`;
            
            // Get existing submitted tests
            let submittedTests = [];
            try {
                const saved = localStorage.getItem(submittedTestsKey);
                if (saved) {
                    submittedTests = JSON.parse(saved);
                }
            } catch (e) {
                console.error('Error loading submitted tests:', e);
            }
            
            // Create submitted test record
            const submittedTest = {
                test: currentTest,
                source: selectedSource,
                questions: questions.map(q => ({
                    uniqueId: q.uniqueId || q.id,
                    text: q.text || q.question,
                    domain: q.domain,
                    options: q.options,
                    correctAnswers: q.correctAnswers
                })),
                userAnswers: userAnswers,
                correct: correct,
                incorrect: incorrect,
                unanswered: unanswered,
                accuracy: accuracy,
                isPassing: accuracy >= 72,
                submittedAt: new Date().toISOString(),
                id: `${currentTest}-${Date.now()}`
            };
            
            // Add to beginning of array (most recent first)
            submittedTests.unshift(submittedTest);
            
            // Keep only last 50 submitted tests
            if (submittedTests.length > 50) {
                submittedTests = submittedTests.slice(0, 50);
            }
            
            // Save to localStorage
            try {
                localStorage.setItem(submittedTestsKey, JSON.stringify(submittedTests));
                console.log('Submitted test saved:', submittedTest.id);
            } catch (e) {
                console.error('Error saving submitted test:', e);
            }
        },
        
        // Load submitted tests
        loadSubmittedTests: () => {
            const currentUser = AppState.getCurrentUser();
            const currentUserEmail = AppState.getCurrentUserEmail();
            
            if (!currentUser || !currentUserEmail) return [];
            
            const userKey = currentUserEmail.toLowerCase().replace(/[^a-z0-9@.-]/g, '-');
            const submittedTestsKey = `${Config.STORAGE_KEYS.SUBMITTED_TESTS_PREFIX}${userKey}`;
            
            try {
                const saved = localStorage.getItem(submittedTestsKey);
                if (saved) {
                    return JSON.parse(saved);
                }
            } catch (e) {
                console.error('Error loading submitted tests:', e);
            }
            
            return [];
        },
        
        // View submitted test
        viewSubmittedTest: (submittedTestId) => {
            const submittedTests = Results.loadSubmittedTests();
            const submittedTest = submittedTests.find(t => t.id === submittedTestId);
            
            if (!submittedTest) {
                alert('Submitted test not found');
                return;
            }
            
            // Set state to review mode with submitted test data
            AppState.setCurrentTest(submittedTest.test);
            AppState.setSelectedSource(submittedTest.source);
            AppState.setCurrentMode(Config.MODES.REVIEW);
            AppState.setCurrentQuestions(submittedTest.questions);
            AppState.setUserAnswers(submittedTest.userAnswers);
            AppState.setCurrentQuestionIndex(0);
            
            // Navigate to results screen first, then show results
            Navigation.hideScreen('main-selection');
            Navigation.showScreen('results-screen');
            
            // Use setTimeout to ensure state is fully set before calculating results
            setTimeout(() => {
                Results.show();
            }, 50);
        },
        
        // Format explanation for modal display
        formatExplanationForModal: (explanationText, options, correctAnswers) => {
            if (!explanationText) return '';
            
            // Helper function to escape HTML
            const escapeHtml = (text) => {
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            };
            
            // Parse explanation text (same format as QuestionHandler)
            const optionExplanations = {};
            const parts = explanationText.split(/\*\*Why option (\d+) is (correct|incorrect):\*\*/);
            
            for (let i = 1; i < parts.length; i += 3) {
                if (i + 2 < parts.length) {
                    const optionId = parseInt(parts[i]);
                    const type = parts[i + 1];
                    let expText = parts[i + 2].trim();
                    
                    // Remove the next section header if it's included
                    expText = expText.replace(/\n\n\*\*Why option \d+ is (correct|incorrect):\*\*.*$/, '');
                    expText = expText.trim();
                    
                    optionExplanations[optionId] = {
                        type: type,
                        text: expText
                    };
                }
            }
            
            let html = '<div class="question-review-explanation"><h4>Explanation:</h4>';
            
            // Add correct answer explanations
            const correctOptions = options.filter((opt, idx) => correctAnswers.includes(idx));
            if (correctOptions.length > 0) {
                html += '<div class="explanation-section correct-explanation"><h5 class="explanation-title correct-title">✓ Correct Answer' + (correctOptions.length > 1 ? 's' : '') + ':</h5>';
                
                correctOptions.forEach((opt, optIdx) => {
                    const actualIdx = options.indexOf(opt);
                    const explanation = optionExplanations[actualIdx];
                    let formattedText = 'This is the correct answer because it best addresses all the requirements described in the scenario.';
                    
                    if (explanation && explanation.type === 'correct') {
                        formattedText = explanation.text
                            .replace(/&/g, '&amp;')
                            .replace(/</g, '&lt;')
                            .replace(/>/g, '&gt;')
                            .replace(/\n\n/g, '</p><p class="explanation-detail">')
                            .replace(/\n/g, '<br>');
                    }
                    
                    html += `<div class="option-explanation"><strong>${escapeHtml(opt.text)}</strong><p class="explanation-detail">${formattedText}</p></div>`;
                });
                
                html += '</div>';
            }
            
            // Add incorrect answer explanations
            const incorrectOptions = options.filter((opt, idx) => !correctAnswers.includes(idx));
            if (incorrectOptions.length > 0) {
                html += '<div class="explanation-section incorrect-explanation"><h5 class="explanation-title incorrect-title">✗ Why Other Options Are Incorrect:</h5>';
                
                incorrectOptions.forEach((opt, optIdx) => {
                    const actualIdx = options.indexOf(opt);
                    const explanation = optionExplanations[actualIdx];
                    let formattedText = 'This option is incorrect because it does not meet the specific requirements outlined in the scenario.';
                    
                    if (explanation && explanation.type === 'incorrect') {
                        formattedText = explanation.text
                            .replace(/&/g, '&amp;')
                            .replace(/</g, '&lt;')
                            .replace(/>/g, '&gt;')
                            .replace(/\n\n/g, '</p><p class="explanation-detail">')
                            .replace(/\n/g, '<br>');
                    }
                    
                    html += `<div class="option-explanation"><strong>${escapeHtml(opt.text)}</strong><p class="explanation-detail">${formattedText}</p></div>`;
                });
                
                html += '</div>';
            }
            
            html += '</div>';
            return html;
        },
        
        // Add "View Results" button to question screen header when reviewing completed test
        addViewResultsButton: () => {
            const questionHeader = document.querySelector('.question-header');
            if (!questionHeader) return;
            
            // Remove existing buttons if present
            const existingViewBtn = document.getElementById('view-results-btn');
            if (existingViewBtn) {
                existingViewBtn.remove();
            }
            const existingReturnBtn = document.getElementById('return-to-dashboard-btn');
            if (existingReturnBtn) {
                existingReturnBtn.remove();
            }
            
            // Restore the original dashboard button visibility if it was hidden
            const questionActions = questionHeader.querySelector('.question-actions');
            if (questionActions) {
                const originalDashboardBtn = questionActions.querySelector('.dashboard-btn:not(.view-results-btn):not(.return-dashboard-btn)');
                if (originalDashboardBtn && originalDashboardBtn.style.display === 'none') {
                    originalDashboardBtn.style.display = '';
                }
            }
            
            // Check if we're reviewing a completed test
            const currentMode = AppState.getCurrentMode();
            const currentTest = AppState.getCurrentTest();
            const currentQuestions = AppState.getCurrentQuestions();
            const userAnswers = AppState.getUserAnswers();
            
            if (currentMode === Config.MODES.REVIEW && currentTest && currentQuestions && userAnswers) {
                // Check if all questions are answered (completed test)
                const totalQuestions = currentQuestions.length;
                const answeredCount = Object.keys(userAnswers).length;
                
                if (answeredCount === totalQuestions) {
                    const questionActions = questionHeader.querySelector('.question-actions');
                    if (questionActions) {
                        // Add "Return to Dashboard" button
                        const returnBtn = document.createElement('button');
                        returnBtn.id = 'return-to-dashboard-btn';
                        returnBtn.className = 'dashboard-btn return-dashboard-btn';
                        returnBtn.innerHTML = `
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 5px;">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                <polyline points="9 22 9 12 15 12 15 22"></polyline>
                            </svg>
                            Dashboard
                        `;
                        returnBtn.title = 'Return to dashboard';
                        returnBtn.setAttribute('aria-label', 'Return to dashboard');
                        returnBtn.onclick = () => {
                            Navigation.returnToDashboard();
                        };
                        
                        // Add "View Results" button
                        const viewResultsBtn = document.createElement('button');
                        viewResultsBtn.id = 'view-results-btn';
                        viewResultsBtn.className = 'dashboard-btn view-results-btn';
                        viewResultsBtn.innerHTML = `
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 5px;">
                                <path d="M9 11l3 3L22 4"></path>
                                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                            </svg>
                            View Results
                        `;
                        viewResultsBtn.title = 'View test results and review dashboard';
                        viewResultsBtn.setAttribute('aria-label', 'View test results');
                        viewResultsBtn.onclick = () => {
                            Results.show();
                            Navigation.hideScreen('question-screen');
                            Navigation.showScreen('results-screen');
                        };
                        
                        // Hide or remove the original dashboard button to avoid duplicates
                        const existingDashboardBtn = questionActions.querySelector('.dashboard-btn:not(.view-results-btn):not(.return-dashboard-btn)');
                        if (existingDashboardBtn) {
                            // Hide the original dashboard button instead of removing it
                            existingDashboardBtn.style.display = 'none';
                            // Insert new buttons before the hidden one
                            questionActions.insertBefore(returnBtn, existingDashboardBtn);
                            questionActions.insertBefore(viewResultsBtn, existingDashboardBtn);
                        } else {
                            questionActions.appendChild(returnBtn);
                            questionActions.appendChild(viewResultsBtn);
                        }
                    }
                }
            }
        },
        
        // Display submitted tests on dashboard
        displaySubmittedTests: () => {
            const submittedTests = Results.loadSubmittedTests();
            const section = document.getElementById('submitted-tests-section');
            const container = document.getElementById('submitted-tests-container');
            
            if (!section || !container) return;
            
            if (submittedTests.length === 0) {
                section.style.display = 'none';
                return;
            }
            
            section.style.display = 'block';
            container.innerHTML = '';
            
            // Show only the 10 most recent tests
            const recentTests = submittedTests.slice(0, 10);
            
            recentTests.forEach(test => {
                const testCard = document.createElement('div');
                testCard.className = 'submitted-test-card';
                testCard.setAttribute('role', 'button');
                testCard.setAttribute('tabindex', '0');
                
                const sourceName = test.source === 'stephane' ? 'Stephane' : 
                                 test.source === 'dojo' ? 'Dojo' : 
                                 test.source === 'sergey' ? 'Sergey' : 'Unknown';
                
                // Convert actual test number to display number based on source
                let displayNumber = test.test;
                if (typeof TestManager !== 'undefined' && TestManager.organizeTestsBySource) {
                    const organized = TestManager.organizeTestsBySource();
                    
                    if (test.source === Config.TEST_SOURCES.STEPHANE) {
                        // Stephane tests: find position in stephane array (accounts for missing tests)
                        const stephaneTests = organized.stephane || [];
                        const testInfo = stephaneTests.find(t => t.number === test.test);
                        if (testInfo) {
                            displayNumber = stephaneTests.indexOf(testInfo) + 1;
                        } else {
                            displayNumber = test.test;
                        }
                    } else if (test.source === Config.TEST_SOURCES.DOJO) {
                        // Dojo: test number 8 displays as 1
                        displayNumber = 1;
                    } else if (test.source === Config.TEST_SOURCES.SERGEY) {
                        // Sergey tests: find position in sergey array
                        const sergeyTests = organized.sergey || [];
                        const testInfo = sergeyTests.find(t => t.number === test.test);
                        if (testInfo) {
                            displayNumber = sergeyTests.indexOf(testInfo) + 1;
                        } else {
                            displayNumber = test.test;
                        }
                    }
                }
                
                const date = new Date(test.submittedAt);
                const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                testCard.innerHTML = `
                    <div class="submitted-test-header">
                        <div class="submitted-test-info">
                            <h3>Test ${displayNumber} - ${sourceName}</h3>
                            <span class="submitted-test-date">${dateStr}</span>
                        </div>
                        <div class="submitted-test-score ${test.isPassing ? 'passing' : 'failing'}">
                            ${test.accuracy}%
                        </div>
                    </div>
                    <div class="submitted-test-stats">
                        <span class="stat-item correct">✓ ${test.correct}</span>
                        <span class="stat-item incorrect">✗ ${test.incorrect}</span>
                        <span class="stat-item unanswered">○ ${test.unanswered}</span>
                    </div>
                `;
                
                testCard.addEventListener('click', () => {
                    Results.viewSubmittedTest(test.id);
                });
                
                testCard.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        Results.viewSubmittedTest(test.id);
                    }
                });
                
                container.appendChild(testCard);
            });
        }
    };
})();

// Global function to view submitted test from results screen
window.viewSubmittedTestFromResults = () => {
    const btn = document.getElementById('view-submitted-test-btn');
    if (btn && btn.getAttribute('data-submitted-test-id')) {
        const testId = btn.getAttribute('data-submitted-test-id');
        Results.viewSubmittedTest(testId);
    }
};
