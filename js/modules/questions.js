// Question Handling Module
const QuestionHandler = (function() {
    'use strict';
    
    // Helper function to detect and format JSON strings in text
    // Returns object with formatted text and whether JSON was found
    const formatJsonInText = (text) => {
        if (!text || typeof text !== 'string') return { text: text, hasJson: false };
        
        // Try to detect JSON-like patterns: { "key": "value" } or { "key": [ ... ] }
        // Match JSON objects that start with { and contain quoted keys
        // Use a more flexible pattern to catch nested JSON
        const jsonPattern = /\{[^{}]*(?:"[^"]*"\s*:\s*[^}]*)+[^{}]*\}/g;
        
        // Find all potential JSON strings
        const matches = [];
        let match;
        const textCopy = text; // Work with original text
        while ((match = jsonPattern.exec(textCopy)) !== null) {
            try {
                // Try to parse as JSON
                const jsonObj = JSON.parse(match[0]);
                // If successful, format it nicely with 2-space indentation
                const formatted = JSON.stringify(jsonObj, null, 2);
                matches.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    original: match[0],
                    formatted: formatted
                });
            } catch (e) {
                // Not valid JSON, skip
            }
        }
        
        if (matches.length === 0) {
            return { text: text, hasJson: false };
        }
        
        // Replace JSON strings with formatted versions (in reverse order to maintain indices)
        // First, escape HTML in the original text
        let escapedText = escapeHtml(text);
        
        // Now replace JSON parts with formatted versions
        // We need to find the JSON in the escaped text (quotes are now &quot;)
        let formattedText = escapedText;
        for (let i = matches.length - 1; i >= 0; i--) {
            const m = matches[i];
            // Find the escaped version of the JSON
            const escapedJson = escapeHtml(m.original);
            const jsonIndex = formattedText.indexOf(escapedJson);
            if (jsonIndex !== -1) {
                const before = formattedText.substring(0, jsonIndex);
                const after = formattedText.substring(jsonIndex + escapedJson.length);
                // Escape HTML in formatted JSON and wrap in <pre><code> tags
                const escapedFormatted = m.formatted
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');
                formattedText = before + '<pre class="json-code"><code>' + escapedFormatted + '</code></pre>' + after;
            }
        }
        
        return { text: formattedText, hasJson: true };
    };
    
    // Helper to escape HTML
    const escapeHtml = (text) => {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };
    
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
            
            // Use uniqueId for saving answers, fallback to id for backward compatibility
            const questionKey = (question.uniqueId || question.id).toString();
            const selectedAnswers = userAnswers[questionKey] || [];
            
            console.log(`loadQuestion: index=${currentQuestionIndex}, questionKey=${questionKey}, uniqueId=${question.uniqueId}, id=${question.id}, selectedAnswers=[${selectedAnswers.join(', ')}]`);
            console.log(`All userAnswers keys:`, Object.keys(userAnswers));
            
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
                // Support both 'text' (JSON) and 'question' (legacy) properties
                const questionText = question.text || question.question || 'Question text not available';
                // Format JSON if present
                const result = formatJsonInText(questionText);
                if (result.hasJson) {
                    // Contains JSON, use innerHTML with formatted JSON
                    questionTextEl.innerHTML = result.text.replace(/\n/g, '<br>');
                } else {
                    // No JSON, use textContent for safety
                    questionTextEl.textContent = questionText;
                }
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
                
                // Validate question has options
                if (!question.options || !Array.isArray(question.options) || question.options.length === 0) {
                    console.error('Question missing options array:', question);
                    optionsContainer.innerHTML = '<p class="error">Error: Question has no options available.</p>';
                    return;
                }
                
                const isMultipleChoice = question.correctAnswers && question.correctAnswers.length > 1;
                const inputType = isMultipleChoice ? 'checkbox' : 'radio';
                
                question.options.forEach((option, index) => {
                    const optionDiv = document.createElement('div');
                    optionDiv.className = 'option';
                    
                    const input = document.createElement('input');
                    input.type = inputType;
                    // Use uniqueId for form element IDs to ensure uniqueness
                    const questionUniqueId = question.uniqueId || question.id;
                    input.name = `question-${questionUniqueId}`;
                    input.value = index;
                    input.id = `option-${questionUniqueId}-${index}`;
                    input.checked = selectedAnswers.includes(index);
                    
                    if (input.checked) {
                        console.log(`  ✓ Option ${index} is checked for question ${questionKey}`);
                    }
                    
                    if (currentMode === Config.MODES.REVIEW && selectedAnswers.length > 0) {
                        input.disabled = true;
                    }
                    
                    // Handle input change - use uniqueId
                    input.addEventListener('change', (e) => {
                        QuestionHandler.updateOptionSelection(questionUniqueId, index, e.target.checked, isMultipleChoice);
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
                    label.htmlFor = `option-${questionUniqueId}-${index}`;
                    // Format JSON if present in option text
                    const optionText = option.text || '';
                    const result = formatJsonInText(optionText);
                    if (result.hasJson) {
                        // Contains JSON, use innerHTML with proper formatting
                        label.innerHTML = result.text;
                    } else {
                        label.textContent = optionText;
                    }
                    
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
                // Use uniqueId for marking questions
                const questionKey = (question.uniqueId || question.id).toString();
                const isMarked = markedQuestions.has(questionKey);
                
                // Find or create icon span
                let markIcon = markBtn.querySelector('#mark-icon');
                if (!markIcon) {
                    markIcon = document.createElement('span');
                    markIcon.id = 'mark-icon';
                    markBtn.insertBefore(markIcon, markBtn.firstChild);
                }
                
                // Find or create text span
                let textSpan = markBtn.querySelector('span:not(#mark-icon)');
                if (!textSpan) {
                    textSpan = document.createElement('span');
                    markBtn.appendChild(textSpan);
                }
                
                // Update icon and text
                markIcon.textContent = isMarked ? '★' : '☆';
                textSpan.textContent = isMarked ? ' Unmark' : ' Mark';
                
                // Update classes and title
                if (isMarked) {
                    markBtn.classList.add('marked');
                    markBtn.title = 'Unmark question';
                } else {
                    markBtn.classList.remove('marked');
                    markBtn.title = 'Mark for review';
                }
            }
            
            // Update submit/next button
            const submitBtn = document.getElementById('submit-btn');
            const nextBtn = document.getElementById('next-btn');
            // Use uniqueId for checking answers (questionKey already declared earlier)
            const hasAnswer = userAnswers[questionKey] && userAnswers[questionKey].length > 0;
            
            // Hide explanation initially when loading a question
            // In review mode, we'll show it again if user clicks "Check Answer"
            const explanationDiv = document.getElementById('explanation');
            if (explanationDiv) {
                explanationDiv.classList.add('hidden');
            }
            
            if (currentMode === Config.MODES.REVIEW) {
                // In review mode, always show "Check Answer" button if there's an answer
                // User can re-check answers by clicking the button again
                submitBtn.textContent = 'Check Answer';
                nextBtn.classList.add('hidden');
                submitBtn.classList.remove('hidden');
            } else {
                // Test mode
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
            
            // Update visual selection - only for current question's options
            const optionsContainer = document.getElementById('options');
            if (optionsContainer) {
                const options = optionsContainer.querySelectorAll('.option');
                options.forEach(opt => {
                    const input = opt.querySelector('input');
                    if (input && input.checked) {
                        opt.classList.add('selected');
                    } else {
                        opt.classList.remove('selected');
                    }
                });
            }
            
            // Update navbar and stats
            QuestionHandler.updateQuestionNavbar();
            UI.updateStats();
            
            // Recalculate user stats if answer changed
            if (answerChanged) {
                Stats.recalculateUserStats();
                
                // Auto-save progress for domain practice mode
                const selectedDomain = AppState.getSelectedDomain();
                if (selectedDomain) {
                    // Debounce save to avoid too frequent saves
                    if (window.domainProgressSaveTimeout) {
                        clearTimeout(window.domainProgressSaveTimeout);
                    }
                    window.domainProgressSaveTimeout = setTimeout(() => {
                        ProgressManager.saveProgress();
                        console.log('Domain progress auto-saved');
                    }, 1000); // Save 1 second after last answer change
                }
            }
        },
        
        // Show answer feedback
        showAnswerFeedback: (question, selectedAnswers) => {
            // Validate question structure
            if (!question || !question.options || !Array.isArray(question.options)) {
                console.error('Invalid question structure in showAnswerFeedback:', question);
                return;
            }
            
            if (!question.correctAnswers || !Array.isArray(question.correctAnswers)) {
                console.error('Question missing correctAnswers:', question);
                return;
            }
            
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
            
            // Auto-save progress for domain practice mode after showing feedback
            const selectedDomain = AppState.getSelectedDomain();
            if (selectedDomain) {
                ProgressManager.saveProgress();
                console.log('Domain progress auto-saved after answer feedback');
            }
            
            options.forEach(opt => {
                const input = opt.querySelector('input');
                if (!input) return;
                
                const optionId = parseInt(input.value);
                // Validate optionId is within bounds
                if (isNaN(optionId) || optionId < 0 || optionId >= question.options.length) {
                    console.warn(`Invalid optionId: ${optionId} for question with ${question.options.length} options`);
                    return;
                }
                
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
                // Split by the explanation headers, which includes capture groups
                // Format: **Why option X is correct/incorrect:**\n[text]\n\n**Why option Y is...
                const parts = question.explanation.split(/\*\*Why option (\d+) is (correct|incorrect):\*\*/);
                
                // Process in groups of 3: [text_before, optionId, type, text_after]
                // parts[0] is text before first match (usually empty)
                // parts[1] = first option ID, parts[2] = first type, parts[3] = first explanation text
                for (let i = 1; i < parts.length; i += 3) {
                    if (i + 2 < parts.length) {
                        const optionId = parseInt(parts[i]);
                        const type = parts[i + 1];
                        let explanationText = parts[i + 2].trim();
                        
                        // Remove the next section header if it's included in the text
                        // The next section starts with \n\n**Why option
                        explanationText = explanationText.replace(/\n\n\*\*Why option \d+ is (correct|incorrect):\*\*.*$/, '');
                        explanationText = explanationText.trim();
                        
                        optionExplanations[optionId] = {
                            type: type,
                            text: explanationText
                        };
                    }
                }
                
                // Debug: log if we found explanations
                if (Object.keys(optionExplanations).length === 0) {
                    console.warn('No explanations parsed from question.explanation. Raw explanation:', question.explanation.substring(0, 200));
                } else {
                    console.log('Parsed explanations for options:', Object.keys(optionExplanations));
                }
            }
            
            // Build correct answer explanation
            let correctHtml = '<div class="correct-explanation"><h4 class="explanation-title correct-title">✓ Correct Answer' + (correctOptions.length > 1 ? 's' : '') + ':</h4>';
            correctOptions.forEach(opt => {
                const explanation = optionExplanations[opt.id];
                // Format option text (may contain JSON)
                const optResult = formatJsonInText(opt.text);
                const formattedOptionText = optResult.hasJson ? optResult.text : escapeHtml(opt.text);
                
                if (explanation && explanation.type === 'correct') {
                    let formattedText = explanation.text
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/\n\n/g, '</p><p class="explanation-detail">')
                        .replace(/\n/g, '<br>');
                    // Format JSON in explanation if present
                    const expResult = formatJsonInText(explanation.text);
                    if (expResult.hasJson) {
                        // Re-escape the formatted text properly
                        formattedText = expResult.text.replace(/\n\n/g, '</p><p class="explanation-detail">').replace(/\n/g, '<br>');
                    }
                    correctHtml += `<div class="option-explanation"><strong>${formattedOptionText}</strong><p class="explanation-detail">${formattedText}</p></div>`;
                } else {
                    correctHtml += `<div class="option-explanation"><strong>${formattedOptionText}</strong><p class="explanation-detail">This is the correct answer because it best addresses all the requirements described in the scenario.</p></div>`;
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
                    // Format option text (may contain JSON)
                    const optResult = formatJsonInText(opt.text);
                    const formattedOptionText = optResult.hasJson ? optResult.text : escapeHtml(opt.text);
                    
                    if (explanation && explanation.type === 'incorrect') {
                        let formattedText = explanation.text
                            .replace(/&/g, '&amp;')
                            .replace(/</g, '&lt;')
                            .replace(/>/g, '&gt;')
                            .replace(/\n\n/g, '</p><p class="explanation-detail">')
                            .replace(/\n/g, '<br>');
                        // Format JSON in explanation if present
                        const expResult = formatJsonInText(explanation.text);
                        if (expResult.hasJson) {
                            // Re-escape the formatted text properly
                            formattedText = expResult.text.replace(/\n\n/g, '</p><p class="explanation-detail">').replace(/\n/g, '<br>');
                        }
                        incorrectHtml += `<div class="option-explanation"><strong>${formattedOptionText}</strong><p class="explanation-detail">${formattedText}</p></div>`;
                    } else {
                        incorrectHtml += `<div class="option-explanation"><strong>${formattedOptionText}</strong><p class="explanation-detail">This option is incorrect because it does not meet the specific requirements outlined in the scenario.</p></div>`;
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
                // Use uniqueId for all question operations
                const questionKey = (question.uniqueId || question.id).toString();
                const hasAnswer = userAnswers[questionKey] && userAnswers[questionKey].length > 0;
                const isMarked = markedQuestions.has(questionKey);
                const isCurrent = index === currentQuestionIndex;
                
                // Check if answer is correct (only in review mode)
                let isCorrect = null;
                if (currentMode === Config.MODES.REVIEW && hasAnswer && question.correctAnswers && Array.isArray(question.correctAnswers)) {
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
            
            // Setup quick jump functionality
            QuestionHandler.setupQuickJump();
            
            // Navbar toggle listener is attached in app.js and navigation.js
            // No need to attach here to prevent duplicate listeners
        },
        
        // Setup quick jump to question
        setupQuickJump: () => {
            const quickJumpInput = document.getElementById('quick-jump-input');
            const quickJumpBtn = document.getElementById('quick-jump-btn');
            
            if (!quickJumpInput || !quickJumpBtn) return;
            
            const currentQuestions = AppState.getCurrentQuestions();
            const maxQuestion = currentQuestions.length;
            
            // Set max attribute
            quickJumpInput.setAttribute('max', maxQuestion);
            quickJumpInput.setAttribute('placeholder', `1-${maxQuestion}`);
            
            const jumpToQuestion = () => {
                const questionNum = parseInt(quickJumpInput.value);
                if (questionNum >= 1 && questionNum <= maxQuestion) {
                    AppState.setCurrentQuestionIndex(questionNum - 1);
                    QuestionHandler.loadQuestion();
                    quickJumpInput.value = '';
                    quickJumpInput.blur();
                } else {
                    quickJumpInput.value = '';
                    if (typeof window.showToast === 'function') {
                        window.showToast(`Please enter a number between 1 and ${maxQuestion}`, 'warning');
                    }
                }
            };
            
            // Remove existing listeners by cloning
            const newInput = quickJumpInput.cloneNode(true);
            quickJumpInput.parentNode.replaceChild(newInput, quickJumpInput);
            
            const newBtn = quickJumpBtn.cloneNode(true);
            quickJumpBtn.parentNode.replaceChild(newBtn, quickJumpBtn);
            
            // Add event listeners
            newInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    jumpToQuestion();
                }
            });
            
            newBtn.addEventListener('click', jumpToQuestion);
            
            // Update max when questions change
            newInput.addEventListener('focus', () => {
                newInput.setAttribute('max', maxQuestion);
            });
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
            
            // Auto-scroll to current question on mobile
            if (window.innerWidth <= 768 && buttons[currentQuestionIndex]) {
                const currentButton = buttons[currentQuestionIndex];
                const scrollLeft = currentButton.offsetLeft - (questionGrid.offsetWidth / 2) + (currentButton.offsetWidth / 2);
                questionGrid.scrollTo({
                    left: scrollLeft,
                    behavior: 'smooth'
                });
            }
            
            buttons.forEach((btn, index) => {
                const question = currentQuestions[index];
                if (!question) return;
                
                // Use uniqueId for all question operations
                const questionKey = (question.uniqueId || question.id).toString();
                const hasAnswer = userAnswers[questionKey] && userAnswers[questionKey].length > 0;
                const isMarked = markedQuestions.has(questionKey);
                const isCurrent = index === currentQuestionIndex;
                
                // Check if answer is correct (only in review mode)
                let isCorrect = null;
                if (currentMode === Config.MODES.REVIEW && hasAnswer && question.correctAnswers && Array.isArray(question.correctAnswers)) {
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
        
        // Generate unique ID for a question
        generateUniqueId: (testKey, questionIndex, originalId) => {
            // Format: test{testNum}-q{originalId}
            // Use originalId instead of index to ensure stability even if questions are reordered
            const testNum = testKey.replace('test', '');
            return `test${testNum}-q${originalId}`;
        },
        
        // Get test questions
        getTestQuestions: (testNumber) => {
            // Check both window.examQuestions and global examQuestions
            const questions = window.examQuestions || (typeof examQuestions !== 'undefined' ? examQuestions : undefined);
            
            if (!questions) {
                console.error('examQuestions not loaded');
                return [];
            }
            
            const testKey = `test${testNumber}`;
            const testQuestions = questions[testKey] || [];
            
            // Add unique IDs to questions if not already present
            // Use original question ID for stability
            return testQuestions.map((q, index) => {
                if (!q.uniqueId) {
                    return {
                        ...q,
                        uniqueId: QuestionHandler.generateUniqueId(testKey, index, q.id),
                        originalId: q.id // Keep original for reference
                    };
                }
                return q;
            });
        },
        
        // Get domain questions
        getDomainQuestions: (domain) => {
            // Check both window.examQuestions and global examQuestions
            const questions = window.examQuestions || (typeof examQuestions !== 'undefined' ? examQuestions : undefined);
            
            if (!questions) {
                console.error('getDomainQuestions: examQuestions is undefined');
                console.error('window.examQuestions:', window.examQuestions);
                console.error('typeof examQuestions:', typeof examQuestions);
                return [];
            }
            
            const allQuestions = [];
            for (const testKey in questions) {
                if (questions.hasOwnProperty(testKey) && testKey.startsWith('test')) {
                    // Add unique IDs to questions using original question ID for stability
                    const testQuestions = questions[testKey].map((q, index) => {
                        if (!q.uniqueId) {
                            return {
                                ...q,
                                uniqueId: QuestionHandler.generateUniqueId(testKey, index, q.id),
                                originalId: q.id // Keep original ID for reference
                            };
                        }
                        return q;
                    });
                    allQuestions.push(...testQuestions);
                }
            }
            
            const domainQuestions = allQuestions.filter(q => q.domain === domain);
            return domainQuestions;
        }
    };
})();

// Immediately expose functions to window for onclick handlers
if (typeof window !== 'undefined' && typeof QuestionHandler !== 'undefined') {
    window.loadQuestion = QuestionHandler.loadQuestion;
    window.buildQuestionNavbar = QuestionHandler.buildQuestionNavbar;
}
