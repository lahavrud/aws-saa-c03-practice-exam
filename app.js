// AWS SAA-C03 Practice Exam Application
let currentTest = null;
let currentMode = null;
let currentQuestions = [];
let currentQuestionIndex = 0;
let userAnswers = {};
let markedQuestions = new Set();
let testStartTime = null;
let testTimer = null;
let savedProgress = null;
let selectedDomain = null;
const TEST_DURATION = 130 * 60 * 1000; // 130 minutes in milliseconds

// SAA-C03 Domains
const DOMAINS = [
    "Design Secure Architectures",
    "Design Resilient Architectures",
    "Design High-Performing Architectures",
    "Design Cost-Optimized Architectures"
];

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    // Try to load questions from various sources
    if (typeof examQuestions === 'undefined') {
        if (typeof autoLoadQuestions !== 'undefined') {
            const loadedQuestions = await autoLoadQuestions();
            if (loadedQuestions) {
                window.examQuestions = loadedQuestions;
            } else {
                console.error('Questions not loaded. Please ensure questions.js is properly loaded or questions are available in the questions directory.');
                return;
            }
        } else {
            console.error('questions.js not loaded');
            return;
        }
    }
    
    // Dynamically load available tests
    loadAvailableTests();
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
});

function loadAvailableTests() {
    if (typeof examQuestions === 'undefined') return;
    
    const testButtonsContainer = document.querySelector('.test-buttons');
    if (!testButtonsContainer) return;
    
    // Clear existing test buttons (except Review by Domain)
    const existingButtons = testButtonsContainer.querySelectorAll('.test-btn');
    existingButtons.forEach(btn => {
        if (!btn.onclick || !btn.onclick.toString().includes('goToDomainReview')) {
            btn.remove();
        }
    });
    
    // Get all available tests
    const availableTests = Object.keys(examQuestions)
        .filter(key => key.startsWith('test'))
        .sort((a, b) => {
            const numA = parseInt(a.replace('test', ''));
            const numB = parseInt(b.replace('test', ''));
            return numA - numB;
        });
    
    // Update stats
    const totalQuestions = availableTests.reduce((sum, testKey) => {
        return sum + (examQuestions[testKey]?.length || 0);
    }, 0);
    
    const statNumber = document.querySelector('.stat-number');
    if (statNumber && statNumber.textContent === '130') {
        // Update total questions stat
        const totalStat = document.querySelectorAll('.stat-number')[0];
        if (totalStat) totalStat.textContent = totalQuestions;
        
        // Update test count stat
        const testCountStat = document.querySelectorAll('.stat-number')[1];
        if (testCountStat) testCountStat.textContent = availableTests.length;
    }
    
    // Create buttons for each test
    availableTests.forEach(testKey => {
        const testNumber = parseInt(testKey.replace('test', ''));
        const questions = examQuestions[testKey] || [];
        const questionCount = questions.length;
        
        const testBtn = document.createElement('button');
        testBtn.className = 'test-btn';
        testBtn.onclick = () => selectTest(testNumber);
        testBtn.innerHTML = `
            <div class="test-btn-header">
                <h3>Test ${testNumber}</h3>
                <span class="test-count">${questionCount} Questions</span>
            </div>
            <p>Comprehensive practice exam covering all domains</p>
        `;
        
        // Insert before Review by Domain button
        const reviewBtn = testButtonsContainer.querySelector('button[onclick*="goToDomainReview"]');
        if (reviewBtn) {
            testButtonsContainer.insertBefore(testBtn, reviewBtn);
        } else {
            testButtonsContainer.appendChild(testBtn);
        }
    });
}

function selectTest(testNumber) {
    currentTest = testNumber;
    currentQuestions = getTestQuestions(testNumber);
    
    if (!currentQuestions || currentQuestions.length === 0) {
        alert('Questions not loaded. Please ensure questions.js is properly loaded.');
        return;
    }
    
    document.getElementById('test-selection').classList.add('hidden');
    document.getElementById('mode-selection').classList.remove('hidden');
}

// Allow direct access to domain review without selecting a test
function goToDomainReview() {
    document.getElementById('test-selection').classList.add('hidden');
    document.getElementById('domain-selection').classList.remove('hidden');
    currentTest = null; // No specific test selected
}

function goBackToTestSelection() {
    document.getElementById('mode-selection').classList.add('hidden');
    document.getElementById('domain-selection').classList.add('hidden');
    document.getElementById('test-selection').classList.remove('hidden');
    currentTest = null;
    selectedDomain = null;
}

function goBackToModeSelection() {
    document.getElementById('domain-selection').classList.add('hidden');
    document.getElementById('mode-selection').classList.remove('hidden');
    selectedDomain = null;
}

function selectMode(mode) {
    currentMode = mode;
    
    if (mode === 'review-domain') {
        // Show domain selection screen (no need to select test first)
        document.getElementById('mode-selection').classList.add('hidden');
        document.getElementById('domain-selection').classList.remove('hidden');
        return;
    }
    
    // For review-domain mode, we need a test selected, but we'll use both tests
    // So we can skip test selection requirement
    if (mode === 'review-domain') {
        return; // Already handled above
    }
    
    currentQuestionIndex = 0;
    userAnswers = {};
    markedQuestions = new Set();
    selectedDomain = null;
    
    // Check for saved progress
    if (mode === 'test' && savedProgress) {
        if (confirm('You have saved progress. Would you like to resume?')) {
            loadSavedProgress();
        } else {
            savedProgress = null;
            localStorage.removeItem('saa-c03-progress');
        }
    }
    
    if (mode === 'test') {
        testStartTime = Date.now();
        startTimer();
    }
    
    document.getElementById('mode-selection').classList.add('hidden');
    document.getElementById('domain-selection').classList.add('hidden');
    document.getElementById('question-screen').classList.remove('hidden');
    
    buildQuestionNavbar();
    loadQuestion();
    updateStats();
}

function selectDomainForReview(domain) {
    selectedDomain = domain;
    currentMode = 'review';
    currentQuestionIndex = 0;
    userAnswers = {};
    markedQuestions = new Set();
    
    // Get all questions from both tests and filter by domain
    const test1Questions = getTestQuestions(1);
    const test2Questions = getTestQuestions(2);
    const allQuestions = [...test1Questions, ...test2Questions];
    currentQuestions = allQuestions.filter(q => q.domain === domain);
    
    if (currentQuestions.length === 0) {
        alert(`No questions found for domain: ${domain}`);
        goBackToModeSelection();
        return;
    }
    
    // Set currentTest to null since we're using questions from both tests
    currentTest = null;
    
    document.getElementById('domain-selection').classList.add('hidden');
    document.getElementById('question-screen').classList.remove('hidden');
    
    buildQuestionNavbar();
    loadQuestion();
    updateStats();
}

function startTimer() {
    const timerElement = document.getElementById('timer');
    timerElement.classList.remove('hidden');
    
    testTimer = setInterval(() => {
        const elapsed = Date.now() - testStartTime;
        const remaining = TEST_DURATION - elapsed;
        
        if (remaining <= 0) {
            clearInterval(testTimer);
            submitTest();
            return;
        }
        
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        
        timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        if (remaining < 10 * 60 * 1000) { // Less than 10 minutes
            timerElement.classList.add('warning');
        }
    }, 1000);
}

function buildQuestionNavbar() {
    const questionGrid = document.getElementById('question-grid');
    questionGrid.innerHTML = '';
    
    currentQuestions.forEach((question, index) => {
        const navItem = document.createElement('div');
        navItem.className = 'question-nav-item';
        navItem.textContent = index + 1;
        navItem.onclick = () => jumpToQuestion(index);
        navItem.setAttribute('data-question-index', index);
        questionGrid.appendChild(navItem);
    });
    
    updateQuestionNavbar();
}

function updateQuestionNavbar() {
    const navItems = document.querySelectorAll('.question-nav-item');
    navItems.forEach((item, index) => {
        item.classList.remove('current', 'answered', 'marked');
        
        if (index === currentQuestionIndex) {
            item.classList.add('current');
        }
        
        const questionKey = currentQuestions[index].id.toString();
        if (userAnswers[questionKey] && userAnswers[questionKey].length > 0) {
            item.classList.add('answered');
        }
        
        if (markedQuestions.has(index)) {
            item.classList.add('marked');
        }
    });
}

function toggleMarkQuestion() {
    if (markedQuestions.has(currentQuestionIndex)) {
        markedQuestions.delete(currentQuestionIndex);
    } else {
        markedQuestions.add(currentQuestionIndex);
    }
    
    updateMarkButton();
    updateQuestionNavbar();
    updateStats();
}

function updateMarkButton() {
    const markBtn = document.getElementById('mark-btn');
    const markIcon = document.getElementById('mark-icon');
    
    if (markedQuestions.has(currentQuestionIndex)) {
        markBtn.classList.add('marked');
        markIcon.textContent = '★';
    } else {
        markBtn.classList.remove('marked');
        markIcon.textContent = '☆';
    }
}

function updateStats() {
    const answeredCount = Object.keys(userAnswers).filter(key => 
        userAnswers[key] && userAnswers[key].length > 0
    ).length;
    const remainingCount = currentQuestions.length - answeredCount;
    const markedCount = markedQuestions.size;
    
    document.getElementById('answered-count').textContent = answeredCount;
    document.getElementById('remaining-count').textContent = remainingCount;
    document.getElementById('marked-count').textContent = markedCount;
}

function jumpToQuestion(index) {
    if (index >= 0 && index < currentQuestions.length) {
        currentQuestionIndex = index;
        loadQuestion();
        // Scroll to top of question
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function toggleNavbar() {
    const questionGrid = document.getElementById('question-grid');
    questionGrid.classList.toggle('collapsed');
}

function handleKeyboardShortcuts(e) {
    // Only handle shortcuts when on question screen
    const questionScreen = document.getElementById('question-screen');
    if (questionScreen.classList.contains('hidden')) {
        return;
    }
    
    // Prevent shortcuts when typing in inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }
    
    switch(e.key) {
        case 'ArrowLeft':
            e.preventDefault();
            if (currentQuestionIndex > 0) {
                previousQuestion();
            }
            break;
        case 'ArrowRight':
            e.preventDefault();
            if (currentQuestionIndex < currentQuestions.length - 1) {
                nextQuestion();
            }
            break;
        case 'Enter':
            if (currentMode === 'review') {
                e.preventDefault();
                submitAnswer();
            }
            break;
    }
}

function loadQuestion() {
    if (currentQuestionIndex >= currentQuestions.length) {
        if (currentMode === 'test') {
            submitTest();
        } else {
            showResults();
        }
        return;
    }
    
    const question = currentQuestions[currentQuestionIndex];
    const questionNumber = currentQuestionIndex + 1;
    
    // Update progress
    const progress = (questionNumber / currentQuestions.length) * 100;
    document.getElementById('progress').style.width = progress + '%';
    
    // Update question number
    document.getElementById('question-number').textContent = `Question ${questionNumber}`;
    document.getElementById('question-count').textContent = `of ${currentQuestions.length}`;
    
    // Update domain badge
    const domainBadge = document.getElementById('question-domain');
    if (question.domain) {
        domainBadge.textContent = question.domain.replace('Design ', '');
        domainBadge.classList.remove('hidden');
    } else {
        domainBadge.classList.add('hidden');
    }
    
    // Update navbar
    updateQuestionNavbar();
    updateMarkButton();
    updateStats();
    
    // Set question text
    document.getElementById('question-text').textContent = question.text;
    
    // Clear and populate options
    const optionsContainer = document.getElementById('options');
    optionsContainer.innerHTML = '';
    
    const isMultipleChoice = question.correctAnswers && question.correctAnswers.length > 1;
    const inputType = isMultipleChoice ? 'checkbox' : 'radio';
    const inputName = `question-${question.id}`;
    
    question.options.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option';
        
        const input = document.createElement('input');
        input.type = inputType;
        input.name = inputName;
        input.value = option.id;
        input.id = `option-${question.id}-${option.id}`;
        
        const label = document.createElement('label');
        label.htmlFor = input.id;
        label.textContent = option.text;
        
        label.insertBefore(input, label.firstChild);
        optionDiv.appendChild(label);
        
        // Check if this option was previously selected
        const questionKey = question.id.toString();
        if (userAnswers[questionKey] && userAnswers[questionKey].includes(option.id)) {
            input.checked = true;
            optionDiv.classList.add('selected');
        }
        
        // Add click handler
        optionDiv.addEventListener('click', function(e) {
            if (e.target.tagName !== 'INPUT') {
                input.checked = !input.checked;
            }
            updateOptionSelection(question.id, option.id, input.checked, isMultipleChoice);
        });
        
        input.addEventListener('change', function() {
            updateOptionSelection(question.id, option.id, input.checked, isMultipleChoice);
        });
        
        optionsContainer.appendChild(optionDiv);
    });
    
    // Hide explanation initially
    const explanationDiv = document.getElementById('explanation');
    explanationDiv.classList.add('hidden');
    
    // Update navigation buttons
    const prevBtn = document.getElementById('prev-btn');
    const submitBtn = document.getElementById('submit-btn');
    const nextBtn = document.getElementById('next-btn');
    
    prevBtn.disabled = currentQuestionIndex === 0;
    
    if (currentMode === 'review') {
        submitBtn.textContent = 'Check Answer';
        nextBtn.classList.add('hidden');
        submitBtn.classList.remove('hidden');
    } else {
        submitBtn.textContent = currentQuestionIndex === currentQuestions.length - 1 ? 'Submit Test' : 'Next Question';
        nextBtn.classList.add('hidden');
        submitBtn.classList.remove('hidden');
    }
}

function updateOptionSelection(questionId, optionId, isSelected, isMultipleChoice) {
    const questionKey = questionId.toString();
    
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
    
    // Update visual selection
    const options = document.querySelectorAll(`.option`);
    options.forEach(opt => {
        const input = opt.querySelector('input');
        if (input && input.checked) {
            opt.classList.add('selected');
        } else {
            opt.classList.remove('selected');
        }
    });
    
    // Update navbar to show answered status
    updateQuestionNavbar();
    updateStats();
}

function submitAnswer() {
    const question = currentQuestions[currentQuestionIndex];
    const questionKey = question.id.toString();
    const selectedAnswers = userAnswers[questionKey] || [];
    
    if (currentMode === 'review') {
        // Show explanation and highlight correct/incorrect answers
        showAnswerFeedback(question, selectedAnswers);
        
        // Show next button
        document.getElementById('submit-btn').classList.add('hidden');
        document.getElementById('next-btn').classList.remove('hidden');
    } else {
        // Test mode - just move to next question
        nextQuestion();
    }
}

function showAnswerFeedback(question, selectedAnswers) {
    const options = document.querySelectorAll('.option');
    const correctOptions = [];
    const incorrectSelectedOptions = [];
    const incorrectOptions = [];
    
    options.forEach(opt => {
        const input = opt.querySelector('input');
        if (!input) return;
        
        const optionId = parseInt(input.value);
        const isCorrect = question.correctAnswers.includes(optionId);
        const isSelected = selectedAnswers.includes(optionId);
        
        opt.classList.remove('correct', 'incorrect', 'selected');
        
        if (isCorrect) {
            opt.classList.add('correct');
            correctOptions.push({
                text: question.options[optionId].text,
                id: optionId
            });
        } else if (isSelected && !isCorrect) {
            opt.classList.add('incorrect');
            incorrectSelectedOptions.push({
                text: question.options[optionId].text,
                id: optionId
            });
        } else if (!isCorrect) {
            incorrectOptions.push({
                text: question.options[optionId].text,
                id: optionId
            });
        }
        
        // Disable inputs
        input.disabled = true;
    });
    
    // Show detailed explanation
    const explanationDiv = document.getElementById('explanation');
    const correctExplanationDiv = document.getElementById('correct-explanation');
    const incorrectExplanationDiv = document.getElementById('incorrect-explanation');
    
    // Build correct answer explanation
    let correctHtml = '<div class="correct-explanation"><h4 class="explanation-title correct-title">✓ Correct Answer' + (correctOptions.length > 1 ? 's' : '') + ':</h4><ul class="explanation-list">';
    correctOptions.forEach(opt => {
        correctHtml += `<li><strong>${opt.text}</strong></li>`;
    });
    correctHtml += '</ul>';
    if (question.explanation) {
        correctHtml += `<p class="explanation-detail">${question.explanation}</p>`;
    } else {
        correctHtml += '<p class="explanation-detail">This is the correct answer because it best addresses all the requirements described in the scenario.</p>';
    }
    correctHtml += '</div>';
    correctExplanationDiv.innerHTML = correctHtml;
    
    // Build incorrect answer explanation
    if (incorrectSelectedOptions.length > 0 || incorrectOptions.length > 0) {
        let incorrectHtml = '<div class="incorrect-explanation"><h4 class="explanation-title incorrect-title">✗ Why Other Options Are Incorrect:</h4><ul class="explanation-list">';
        
        // Show why selected incorrect answers are wrong
        incorrectSelectedOptions.forEach(opt => {
            incorrectHtml += `<li><strong>${opt.text}</strong> - This option is incorrect because it does not fully address the requirements or may introduce issues not mentioned in the scenario.</li>`;
        });
        
        // Show why other incorrect options are wrong (if any were not selected)
        incorrectOptions.forEach(opt => {
            incorrectHtml += `<li><strong>${opt.text}</strong> - This option is incorrect because it does not meet the specific requirements outlined in the scenario.</li>`;
        });
        
        incorrectHtml += '</ul></div>';
        incorrectExplanationDiv.innerHTML = incorrectHtml;
    } else {
        incorrectExplanationDiv.innerHTML = '';
    }
    
    explanationDiv.classList.remove('hidden');
}

function nextQuestion() {
    currentQuestionIndex++;
    loadQuestion();
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        loadQuestion();
    }
}

function submitTest() {
    if (currentMode === 'test') {
        // Confirm submission
        if (currentQuestionIndex < currentQuestions.length - 1) {
            const unanswered = currentQuestions.length - Object.keys(userAnswers).length;
            if (unanswered > 0 && !confirm(`You have ${unanswered} unanswered questions. Are you sure you want to submit?`)) {
                return;
            }
        }
        
        clearInterval(testTimer);
        document.getElementById('timer').classList.add('hidden');
    }
    
    showResults();
}

function showResults() {
    document.getElementById('question-screen').classList.add('hidden');
    document.getElementById('results-screen').classList.remove('hidden');
    
    // Calculate scores
    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;
    const domainScores = {};
    
    DOMAINS.forEach(domain => {
        domainScores[domain] = { correct: 0, total: 0 };
    });
    
    currentQuestions.forEach(question => {
        const questionKey = question.id.toString();
        const selectedAnswers = userAnswers[questionKey] || [];
        const correctAnswers = question.correctAnswers || [];
        
        if (selectedAnswers.length === 0) {
            unanswered++;
        } else {
            // Check if answers match (order doesn't matter for multiple choice)
            const selectedSet = new Set(selectedAnswers.sort());
            const correctSet = new Set(correctAnswers.sort());
            
            const isCorrect = selectedSet.size === correctSet.size && 
                            [...selectedSet].every(id => correctSet.has(id));
            
            if (isCorrect) {
                correct++;
            } else {
                incorrect++;
            }
        }
        
        // Update domain scores
        const domain = question.domain || DOMAINS[0];
        if (!domainScores[domain]) {
            domainScores[domain] = { correct: 0, total: 0 };
        }
        domainScores[domain].total++;
        
        const questionKey2 = question.id.toString();
        const selectedAnswers2 = userAnswers[questionKey2] || [];
        const correctAnswers2 = question.correctAnswers || [];
        
        if (selectedAnswers2.length > 0) {
            const selectedSet2 = new Set(selectedAnswers2.sort());
            const correctSet2 = new Set(correctAnswers2.sort());
            const isCorrect2 = selectedSet2.size === correctSet2.size && 
                             [...selectedSet2].every(id => correctSet2.has(id));
            if (isCorrect2) {
                domainScores[domain].correct++;
            }
        }
    });
    
    const total = currentQuestions.length;
    const score = ((correct / total) * 100).toFixed(1);
    
    // Update score display
    document.getElementById('total-score').textContent = score + '%';
    document.getElementById('correct-count').textContent = correct;
    document.getElementById('incorrect-count').textContent = incorrect;
    document.getElementById('unanswered-count').textContent = unanswered;
    
    // Update domain breakdown
    const domainBreakdown = document.getElementById('domain-breakdown');
    domainBreakdown.innerHTML = '';
    
    DOMAINS.forEach(domain => {
        const domainData = domainScores[domain];
        if (domainData.total > 0) {
            const domainScore = ((domainData.correct / domainData.total) * 100).toFixed(1);
            
            const domainItem = document.createElement('div');
            domainItem.className = 'domain-item';
            domainItem.innerHTML = `
                <span class="domain-name">${domain}</span>
                <span class="domain-score">${domainScore}% (${domainData.correct}/${domainData.total})</span>
            `;
            domainBreakdown.appendChild(domainItem);
        }
    });
    
    // Show review questions
    showReviewQuestions();
}

function showReviewQuestions() {
    const reviewContainer = document.getElementById('review-questions');
    reviewContainer.innerHTML = '';
    
    currentQuestions.forEach((question, index) => {
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
            ? question.options.filter(opt => selectedAnswers.includes(opt.id)).map(opt => opt.text).join(', ')
            : 'Not answered';
        
        const correctText = question.options.filter(opt => correctAnswers.includes(opt.id)).map(opt => opt.text).join(', ');
        
        reviewItem.innerHTML = `
            <div class="review-question">Q${index + 1}: ${question.text.substring(0, 100)}...</div>
            <div class="review-answer"><strong>Your answer:</strong> ${selectedText}</div>
            <div class="review-answer"><strong>Correct answer:</strong> ${correctText}</div>
        `;
        
        reviewContainer.appendChild(reviewItem);
    });
}

function reviewAnswers() {
    // Scroll to review section
    document.getElementById('review-questions').scrollIntoView({ behavior: 'smooth' });
}

function showDashboardDialog() {
    document.getElementById('dashboard-dialog').classList.remove('hidden');
}

function closeDashboardDialog() {
    document.getElementById('dashboard-dialog').classList.add('hidden');
}

function saveAndReturnToDashboard() {
    // Save progress to localStorage
    const progress = {
        test: currentTest,
        mode: currentMode,
        questionIndex: currentQuestionIndex,
        answers: userAnswers,
        marked: Array.from(markedQuestions),
        startTime: testStartTime,
        selectedDomain: selectedDomain
    };
    
    localStorage.setItem('saa-c03-progress', JSON.stringify(progress));
    savedProgress = progress;
    
    if (testTimer) {
        clearInterval(testTimer);
        testTimer = null;
    }
    
    closeDashboardDialog();
    returnToDashboard();
}

function returnToDashboardWithoutSaving() {
    if (testTimer) {
        clearInterval(testTimer);
        testTimer = null;
    }
    
    // Clear saved progress
    savedProgress = null;
    localStorage.removeItem('saa-c03-progress');
    
    closeDashboardDialog();
    returnToDashboard();
}

function returnToDashboard() {
    // Hide all screens
    document.getElementById('question-screen').classList.add('hidden');
    document.getElementById('results-screen').classList.add('hidden');
    document.getElementById('mode-selection').classList.add('hidden');
    document.getElementById('domain-selection').classList.add('hidden');
    document.getElementById('timer').classList.add('hidden');
    
    // Show test selection
    document.getElementById('test-selection').classList.remove('hidden');
}

function loadSavedProgress() {
    const saved = localStorage.getItem('saa-c03-progress');
    if (!saved) return;
    
    try {
        const progress = JSON.parse(saved);
        savedProgress = progress;
        currentTest = progress.test;
        currentMode = progress.mode;
        currentQuestionIndex = progress.questionIndex || 0;
        userAnswers = progress.answers || {};
        markedQuestions = new Set(progress.marked || []);
        selectedDomain = progress.selectedDomain;
        testStartTime = progress.startTime ? new Date(progress.startTime) : Date.now();
        
        // Reload questions
        if (selectedDomain) {
            const allQuestions = getTestQuestions(currentTest);
            currentQuestions = allQuestions.filter(q => q.domain === selectedDomain);
        } else {
            currentQuestions = getTestQuestions(currentTest);
        }
        
        if (currentMode === 'test') {
            startTimer();
        }
        
        document.getElementById('mode-selection').classList.add('hidden');
        document.getElementById('domain-selection').classList.add('hidden');
        document.getElementById('question-screen').classList.remove('hidden');
        
        buildQuestionNavbar();
        loadQuestion();
        updateStats();
    } catch (e) {
        console.error('Error loading saved progress:', e);
    }
}

function restartTest() {
    // Reset everything
    currentTest = null;
    currentMode = null;
    currentQuestions = [];
    currentQuestionIndex = 0;
    userAnswers = {};
    markedQuestions = new Set();
    testStartTime = null;
    savedProgress = null;
    selectedDomain = null;
    
    if (testTimer) {
        clearInterval(testTimer);
        testTimer = null;
    }
    
    // Clear saved progress
    localStorage.removeItem('saa-c03-progress');
    
    // Show test selection
    document.getElementById('results-screen').classList.add('hidden');
    document.getElementById('test-selection').classList.remove('hidden');
    document.getElementById('timer').classList.add('hidden');
}
