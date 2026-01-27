// Results Display Module
const Results = (function() {
    'use strict';
    
    return {
        // Show test results
        show: () => {
            const questionScreen = document.getElementById('question-screen');
            const resultsScreen = document.getElementById('results-screen');
            
            if (questionScreen) questionScreen.classList.add('hidden');
            if (resultsScreen) resultsScreen.classList.remove('hidden');
            
            const currentMode = AppState.getCurrentMode();
            const currentQuestions = AppState.getCurrentQuestions();
            const userAnswers = AppState.getUserAnswers();
            
            // Mark test as completed if in test mode
            if (currentMode === Config.MODES.TEST) {
                UserManager.markTestCompleted();
            }
            
            // Calculate scores
            let correct = 0;
            let incorrect = 0;
            let unanswered = 0;
            
            currentQuestions.forEach(question => {
                const questionKey = question.id.toString();
                const selectedAnswers = userAnswers[questionKey] || [];
                
                if (selectedAnswers.length === 0) {
                    unanswered++;
                } else {
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
            
            const total = currentQuestions.length;
            const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
            
            // Update results display (using correct element IDs from HTML)
            const totalScoreEl = document.getElementById('total-score');
            const correctEl = document.getElementById('correct-count');
            const incorrectEl = document.getElementById('incorrect-count');
            const unansweredEl = document.getElementById('unanswered-count');
            
            if (totalScoreEl) totalScoreEl.textContent = `${accuracy}%`;
            if (correctEl) correctEl.textContent = correct;
            if (incorrectEl) incorrectEl.textContent = incorrect;
            if (unansweredEl) unansweredEl.textContent = unanswered;
            
            // Build results breakdown
            Results.buildBreakdown(currentQuestions, userAnswers);
            
            // Show review questions
            Results.showReviewQuestions(currentQuestions, userAnswers);
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
                
                const questionKey = question.id.toString();
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
                domainDiv.innerHTML = `
                    <span class="domain-name">${domain}</span>
                    <span class="domain-score">${domainScore}% (${stats.correct}/${stats.total})</span>
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
                const questionKey = question.id.toString();
                const selectedAnswers = userAnswers[questionKey] || [];
                const correctAnswers = question.correctAnswers || [];
                
                const selectedSet = new Set(selectedAnswers.sort());
                const correctSet = new Set(correctAnswers.sort());
                const isCorrect = selectedAnswers.length > 0 && 
                                 selectedSet.size === correctSet.size && 
                                 [...selectedSet].every(id => correctSet.has(id));
                
                const reviewItem = document.createElement('div');
                reviewItem.className = `review-item ${selectedAnswers.length === 0 ? 'unanswered' : (isCorrect ? 'correct' : 'incorrect')}`;
                
                const selectedText = selectedAnswers.length > 0 
                    ? question.options.filter((opt, idx) => selectedAnswers.includes(idx)).map(opt => opt.text).join(', ')
                    : 'Not answered';
                
                const correctText = question.options.filter((opt, idx) => correctAnswers.includes(idx)).map(opt => opt.text).join(', ');
                
                reviewItem.innerHTML = `
                    <div class="review-question">Q${index + 1}: ${(question.text || question.question || 'Question').substring(0, 100)}...</div>
                    <div class="review-answer"><strong>Your answer:</strong> ${selectedText}</div>
                    <div class="review-answer"><strong>Correct answer:</strong> ${correctText}</div>
                `;
                
                reviewContainer.appendChild(reviewItem);
            });
        }
    };
})();
