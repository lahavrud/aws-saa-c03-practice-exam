// Question Handling Module
const QuestionHandler = (function() {
    'use strict';
    
    return {
        // Load and display current question
        loadQuestion: () => {
            const currentQuestions = AppState.getCurrentQuestions();
            const currentQuestionIndex = AppState.getCurrentQuestionIndex();
            const userAnswers = AppState.getUserAnswers();
            const markedQuestions = AppState.getMarkedQuestions();
            const currentMode = AppState.getCurrentMode();
            
            if (!currentQuestions || currentQuestions.length === 0) {
                console.error('No questions loaded');
                return;
            }
            
            const question = currentQuestions[currentQuestionIndex];
            if (!question) {
                console.error('Question not found at index:', currentQuestionIndex);
                return;
            }
            
            // Update question number display
            const questionNumberEl = document.getElementById('question-number');
            const questionCountEl = document.getElementById('question-count');
            if (questionNumberEl) {
                questionNumberEl.textContent = `Question ${currentQuestionIndex + 1}`;
            }
            if (questionCountEl) {
                questionCountEl.textContent = `of ${currentQuestions.length}`;
            }
            
            // Update question text
            const questionTextEl = document.getElementById('question-text');
            if (questionTextEl) {
                questionTextEl.textContent = question.question;
            }
            
            // Update domain badge
            const domainBadgeEl = document.getElementById('question-domain');
            if (domainBadgeEl) {
                domainBadgeEl.textContent = question.domain || 'Unknown Domain';
            }
            
            // Clear and rebuild options
            const optionsContainer = document.getElementById('options');
            if (optionsContainer) {
                optionsContainer.innerHTML = '';
                
                const isMultipleChoice = question.correctAnswers.length > 1;
                const inputType = isMultipleChoice ? 'checkbox' : 'radio';
                const questionKey = question.id.toString();
                const selectedAnswers = userAnswers[questionKey] || [];
                
                question.options.forEach((option, index) => {
                    const optionDiv = document.createElement('div');
                    optionDiv.className = 'option';
                    
                    const input = document.createElement('input');
                    input.type = inputType;
                    input.name = `question-${question.id}`;
                    input.value = index;
                    input.id = `option-${question.id}-${index}`;
                    input.checked = selectedAnswers.includes(index);
                    
                    if (currentMode === Config.MODES.REVIEW && selectedAnswers.length > 0) {
                        input.disabled = true;
                    }
                    
                    // Handle input change
                    input.addEventListener('change', (e) => {
                        QuestionHandler.updateOptionSelection(question.id, index, e.target.checked, isMultipleChoice);
                    });
                    
                    // Make entire option div clickable
                    optionDiv.addEventListener('click', (e) => {
                        // Don't trigger if clicking directly on the input or label (they handle their own clicks)
                        if (e.target === input || e.target === label || e.target.closest('label') === label) {
                            return;
                        }
                        
                        // Toggle the input when clicking anywhere else on the option div
                        if (!input.disabled) {
                            if (isMultipleChoice) {
                                // For checkboxes, toggle
                                input.checked = !input.checked;
                            } else {
                                // For radio buttons, just check (unchecking others handled by browser)
                                input.checked = true;
                            }
                            // Trigger change event to update state
                            input.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                    });
                    
                    const label = document.createElement('label');
                    label.htmlFor = `option-${question.id}-${index}`;
                    label.textContent = option.text;
                    
                    optionDiv.appendChild(input);
                    optionDiv.appendChild(label);
                    
                    if (input.checked) {
                        optionDiv.classList.add('selected');
                    }
                    
                    optionsContainer.appendChild(optionDiv);
                });
            }
            
            // Update mark button
            const markBtn = document.getElementById('mark-btn');
            if (markBtn) {
                const questionKey = question.id.toString();
                if (markedQuestions.has(questionKey)) {
                    markBtn.textContent = 'Unmark Question';
                    markBtn.classList.add('marked');
                } else {
                    markBtn.textContent = 'Mark Question';
                    markBtn.classList.remove('marked');
                }
            }
            
            // Hide explanation initially
            const explanationDiv = document.getElementById('explanation');
            if (explanationDiv) {
                explanationDiv.classList.add('hidden');
            }
            
            // Update submit/next button
            const submitBtn = document.getElementById('submit-btn');
            const nextBtn = document.getElementById('next-btn');
            const questionKey = question.id.toString();
            const hasAnswer = userAnswers[questionKey] && userAnswers[questionKey].length > 0;
            
            if (currentMode === Config.MODES.REVIEW) {
                if (hasAnswer) {
                    // Show answer feedback
                    QuestionHandler.showAnswerFeedback(question, userAnswers[questionKey]);
                    submitBtn.classList.add('hidden');
                    nextBtn.classList.remove('hidden');
                } else {
                    submitBtn.textContent = 'Check Answer';
                    nextBtn.classList.add('hidden');
                    submitBtn.classList.remove('hidden');
                }
            } else {
                submitBtn.textContent = currentQuestionIndex === currentQuestions.length - 1 ? 'Submit Test' : 'Next Question';
                nextBtn.classList.add('hidden');
                submitBtn.classList.remove('hidden');
            }
            
            // Update navigation buttons
            const prevBtn = document.getElementById('prev-btn');
            const nextNavBtn = document.getElementById('next-btn');
            if (prevBtn) {
                prevBtn.disabled = currentQuestionIndex === 0;
            }
            if (nextNavBtn) {
                nextNavBtn.disabled = currentQuestionIndex === currentQuestions.length - 1;
            }
            
            // Update question navbar
            QuestionHandler.updateQuestionNavbar();
        },
        
        // Update option selection
        updateOptionSelection: (questionId, optionId, isSelected, isMultipleChoice) => {
            const questionKey = questionId.toString();
            const userAnswers = AppState.getUserAnswers();
            const previousAnswer = userAnswers[questionKey] ? [...userAnswers[questionKey]] : [];
            
            if (!userAnswers[questionKey]) {
                userAnswers[questionKey] = [];
            }
            
            if (isMultipleChoice) {
                if (isSelected) {
                    if (!userAnswers[questionKey].includes(optionId)) {
                        userAnswers[questionKey].push(optionId);
                    }
                } else {
                    userAnswers[questionKey] = userAnswers[questionKey].filter(id => id !== optionId);
                }
            } else {
                userAnswers[questionKey] = isSelected ? [optionId] : [];
            }
            
            AppState.setUserAnswers(userAnswers);
            
            // Check if answer changed
            const currentAnswer = userAnswers[questionKey] || [];
            const answerChanged = JSON.stringify(previousAnswer.sort()) !== JSON.stringify(currentAnswer.sort());
            
            // Update visual selection
            const options = document.querySelectorAll('.option');
            options.forEach(opt => {
                const input = opt.querySelector('input');
                if (input && input.checked) {
                    opt.classList.add('selected');
                } else {
                    opt.classList.remove('selected');
                }
            });
            
            // Update navbar and stats
            QuestionHandler.updateQuestionNavbar();
            UI.updateStats();
            
            // Recalculate user stats if answer changed
            if (answerChanged) {
                Stats.recalculateUserStats();
            }
        },
        
        // Show answer feedback
        showAnswerFeedback: (question, selectedAnswers) => {
            const options = document.querySelectorAll('.option');
            const correctOptions = [];
            const incorrectSelectedOptions = [];
            const incorrectOptions = [];
            
            // Check if answer is correct
            const selectedSet = new Set(selectedAnswers.sort());
            const correctSet = new Set(question.correctAnswers.sort());
            const isCorrect = selectedSet.size === correctSet.size && 
                            [...selectedSet].every(id => correctSet.has(id));
            
            // Recalculate user stats
            Stats.recalculateUserStats();
            
            options.forEach(opt => {
                const input = opt.querySelector('input');
                if (!input) return;
                
                const optionId = parseInt(input.value);
                const isCorrectOption = question.correctAnswers.includes(optionId);
                const isSelected = selectedAnswers.includes(optionId);
                
                opt.classList.remove('correct', 'incorrect', 'selected');
                
                if (isCorrectOption) {
                    opt.classList.add('correct');
                    correctOptions.push({
                        text: question.options[optionId].text,
                        id: optionId
                    });
                } else if (isSelected && !isCorrectOption) {
                    opt.classList.add('incorrect');
                    incorrectSelectedOptions.push({
                        text: question.options[optionId].text,
                        id: optionId
                    });
                } else if (!isCorrectOption) {
                    incorrectOptions.push({
                        text: question.options[optionId].text,
                        id: optionId
                    });
                }
                
                input.disabled = true;
            });
            
            // Show detailed explanation
            const explanationDiv = document.getElementById('explanation');
            if (explanationDiv) {
                explanationDiv.classList.remove('hidden');
            }
            
            const correctExplanationDiv = document.getElementById('correct-explanation');
            const incorrectExplanationDiv = document.getElementById('incorrect-explanation');
            
            // Parse explanation text
            const optionExplanations = {};
            if (question.explanation) {
                const parts = question.explanation.split(/\*\*Why option (\d+) is (correct|incorrect):\*\*/);
                for (let i = 1; i < parts.length; i += 3) {
                    if (i + 2 < parts.length) {
                        const optionId = parseInt(parts[i]);
                        const type = parts[i + 1];
                        const explanationText = parts[i + 2].trim();
                        optionExplanations[optionId] = {
                            type: type,
                            text: explanationText
                        };
                    }
                }
            }
            
            // Build correct answer explanation
            let correctHtml = '<div class="correct-explanation"><h4 class="explanation-title correct-title">✓ Correct Answer' + (correctOptions.length > 1 ? 's' : '') + ':</h4>';
            correctOptions.forEach(opt => {
                const explanation = optionExplanations[opt.id];
                if (explanation && explanation.type === 'correct') {
                    let formattedText = explanation.text
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/\n\n/g, '</p><p class="explanation-detail">')
                        .replace(/\n/g, '<br>');
                    correctHtml += `<div class="option-explanation"><strong>${opt.text}</strong><p class="explanation-detail">${formattedText}</p></div>`;
                } else {
                    correctHtml += `<div class="option-explanation"><strong>${opt.text}</strong><p class="explanation-detail">This is the correct answer because it best addresses all the requirements described in the scenario.</p></div>`;
                }
            });
            correctHtml += '</div>';
            if (correctExplanationDiv) {
                correctExplanationDiv.innerHTML = correctHtml;
            }
            
            // Build incorrect answer explanation
            const allIncorrectOptions = [...incorrectSelectedOptions, ...incorrectOptions];
            if (allIncorrectOptions.length > 0) {
                let incorrectHtml = '<div class="incorrect-explanation"><h4 class="explanation-title incorrect-title">✗ Why Other Options Are Incorrect:</h4>';
                
                allIncorrectOptions.forEach(opt => {
                    const explanation = optionExplanations[opt.id];
                    if (explanation && explanation.type === 'incorrect') {
                        let formattedText = explanation.text
                            .replace(/&/g, '&amp;')
                            .replace(/</g, '&lt;')
                            .replace(/>/g, '&gt;')
                            .replace(/\n\n/g, '</p><p class="explanation-detail">')
                            .replace(/\n/g, '<br>');
                        incorrectHtml += `<div class="option-explanation"><strong>${opt.text}</strong><p class="explanation-detail">${formattedText}</p></div>`;
                    } else {
                        incorrectHtml += `<div class="option-explanation"><strong>${opt.text}</strong><p class="explanation-detail">This option is incorrect because it does not meet the specific requirements outlined in the scenario.</p></div>`;
                    }
                });
                
                incorrectHtml += '</div>';
                if (incorrectExplanationDiv) {
                    incorrectExplanationDiv.innerHTML = incorrectHtml;
                }
            } else {
                if (incorrectExplanationDiv) {
                    incorrectExplanationDiv.innerHTML = '';
                }
            }
        },
        
        // Build question navbar
        buildQuestionNavbar: () => {
            const questionGrid = document.getElementById('question-grid');
            if (!questionGrid) return;
            
            questionGrid.innerHTML = '';
            
            const currentQuestions = AppState.getCurrentQuestions();
            const userAnswers = AppState.getUserAnswers();
            const markedQuestions = AppState.getMarkedQuestions();
            const currentQuestionIndex = AppState.getCurrentQuestionIndex();
            const currentMode = AppState.getCurrentMode();
            
            currentQuestions.forEach((question, index) => {
                const questionKey = question.id.toString();
                const hasAnswer = userAnswers[questionKey] && userAnswers[questionKey].length > 0;
                const isMarked = markedQuestions.has(questionKey);
                const isCurrent = index === currentQuestionIndex;
                
                // Check if answer is correct (only in review mode)
                let isCorrect = null;
                if (currentMode === Config.MODES.REVIEW && hasAnswer) {
                    const selectedAnswers = userAnswers[questionKey] || [];
                    const selectedSet = new Set(selectedAnswers.sort());
                    const correctSet = new Set(question.correctAnswers.sort());
                    isCorrect = selectedSet.size === correctSet.size && 
                               [...selectedSet].every(id => correctSet.has(id));
                }
                
                const questionBtn = document.createElement('button');
                questionBtn.className = 'question-nav-item';
                questionBtn.textContent = index + 1;
                
                if (isCurrent) {
                    questionBtn.classList.add('current');
                }
                if (hasAnswer) {
                    questionBtn.classList.add('answered');
                }
                if (isMarked) {
                    questionBtn.classList.add('marked');
                }
                // Add correct/incorrect classes in review mode
                if (currentMode === Config.MODES.REVIEW && hasAnswer) {
                    if (isCorrect) {
                        questionBtn.classList.add('correct');
                    } else {
                        questionBtn.classList.add('incorrect');
                    }
                }
                
                questionBtn.addEventListener('click', () => {
                    AppState.setCurrentQuestionIndex(index);
                    QuestionHandler.loadQuestion();
                });
                
                questionGrid.appendChild(questionBtn);
            });
            
            // Ensure navbar toggle button has event listener
            const navbarToggle = document.getElementById('navbar-toggle');
            if (navbarToggle && !navbarToggle.hasAttribute('data-listener-attached')) {
                navbarToggle.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof window.toggleNavbar === 'function') {
                        window.toggleNavbar();
                    }
                });
                navbarToggle.setAttribute('data-listener-attached', 'true');
            }
        },
        
        // Update question navbar
        updateQuestionNavbar: () => {
            const questionGrid = document.getElementById('question-grid');
            if (!questionGrid) return;
            
            const currentQuestions = AppState.getCurrentQuestions();
            const userAnswers = AppState.getUserAnswers();
            const markedQuestions = AppState.getMarkedQuestions();
            const currentQuestionIndex = AppState.getCurrentQuestionIndex();
            const currentMode = AppState.getCurrentMode();
            
            const buttons = questionGrid.querySelectorAll('.question-nav-item');
            buttons.forEach((btn, index) => {
                const question = currentQuestions[index];
                if (!question) return;
                
                const questionKey = question.id.toString();
                const hasAnswer = questionKey && userAnswers[questionKey] && userAnswers[questionKey].length > 0;
                const isMarked = questionKey && markedQuestions.has(questionKey);
                const isCurrent = index === currentQuestionIndex;
                
                // Check if answer is correct (only in review mode)
                let isCorrect = null;
                if (currentMode === Config.MODES.REVIEW && hasAnswer) {
                    const selectedAnswers = userAnswers[questionKey] || [];
                    const selectedSet = new Set(selectedAnswers.sort());
                    const correctSet = new Set(question.correctAnswers.sort());
                    isCorrect = selectedSet.size === correctSet.size && 
                               [...selectedSet].every(id => correctSet.has(id));
                }
                
                btn.classList.remove('current', 'answered', 'marked', 'correct', 'incorrect');
                
                if (isCurrent) {
                    btn.classList.add('current');
                }
                if (hasAnswer) {
                    btn.classList.add('answered');
                }
                if (isMarked) {
                    btn.classList.add('marked');
                }
                // Add correct/incorrect classes in review mode
                if (currentMode === Config.MODES.REVIEW && hasAnswer) {
                    if (isCorrect) {
                        btn.classList.add('correct');
                    } else {
                        btn.classList.add('incorrect');
                    }
                }
            });
        },
        
        // Get test questions
        getTestQuestions: (testNumber) => {
            if (typeof examQuestions === 'undefined') {
                console.error('examQuestions not loaded');
                return [];
            }
            
            const testKey = `test${testNumber}`;
            return examQuestions[testKey] || [];
        },
        
        // Get domain questions
        getDomainQuestions: (domain) => {
            if (typeof examQuestions === 'undefined') {
                return [];
            }
            
            const allQuestions = [];
            for (const testKey in examQuestions) {
                if (examQuestions.hasOwnProperty(testKey) && testKey.startsWith('test')) {
                    allQuestions.push(...examQuestions[testKey]);
                }
            }
            
            return allQuestions.filter(q => q.domain === domain);
        }
    };
})();

// Immediately expose functions to window for onclick handlers
if (typeof window !== 'undefined' && typeof QuestionHandler !== 'undefined') {
    window.loadQuestion = QuestionHandler.loadQuestion;
    window.buildQuestionNavbar = QuestionHandler.buildQuestionNavbar;
}
