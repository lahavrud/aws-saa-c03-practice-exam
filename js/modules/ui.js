// UI Rendering Module
const UI = (function() {
    'use strict';
    
    return {
        // Update stats display
        updateStats: () => {
            const currentQuestions = AppState.getCurrentQuestions();
            const userAnswers = AppState.getUserAnswers();
            const currentQuestionIndex = AppState.getCurrentQuestionIndex();
            const selectedDomain = AppState.getSelectedDomain();
            const currentMode = AppState.getCurrentMode();
            
            if (!currentQuestions || currentQuestions.length === 0) return;
            
            let answered = 0;
            let correct = 0;
            let incorrect = 0;
            
            currentQuestions.forEach(question => {
                // Use uniqueId for retrieving answers
                const questionKey = (question.uniqueId || question.id).toString();
                const selectedAnswers = userAnswers[questionKey] || [];
                
                if (selectedAnswers.length > 0) {
                    answered++;
                    
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
            
            const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;
            
            // Check if we're in domain practice mode
            const isDomainMode = selectedDomain && !AppState.getCurrentTest();
            
            if (isDomainMode) {
                // Show domain-specific stats (Correct, Incorrect, Accuracy)
                const statItem1 = document.getElementById('stat-item-1');
                const statItem2 = document.getElementById('stat-item-2');
                const statItem3 = document.getElementById('stat-item-3');
                const domainCorrect = document.getElementById('domain-stat-correct');
                const domainIncorrect = document.getElementById('domain-stat-incorrect');
                const domainAccuracy = document.getElementById('domain-stat-accuracy');
                const domainCorrectCount = document.getElementById('domain-correct-count');
                const domainIncorrectCount = document.getElementById('domain-incorrect-count');
                const domainAccuracyPercent = document.getElementById('domain-accuracy-percent');
                
                // Hide test mode stats
                if (statItem1) statItem1.style.display = 'none';
                if (statItem2) statItem2.style.display = 'none';
                if (statItem3) statItem3.style.display = 'none';
                
                // Show domain mode stats
                if (domainCorrect) domainCorrect.style.display = '';
                if (domainIncorrect) domainIncorrect.style.display = '';
                if (domainAccuracy) domainAccuracy.style.display = '';
                
                // Update domain stats values
                if (domainCorrectCount) domainCorrectCount.textContent = correct;
                if (domainIncorrectCount) domainIncorrectCount.textContent = incorrect;
                if (domainAccuracyPercent) domainAccuracyPercent.textContent = `${accuracy}%`;
            } else {
                // Show test mode stats (Answered, Remaining, Marked)
                const statItem1 = document.getElementById('stat-item-1');
                const statItem2 = document.getElementById('stat-item-2');
                const statItem3 = document.getElementById('stat-item-3');
                const domainCorrect = document.getElementById('domain-stat-correct');
                const domainIncorrect = document.getElementById('domain-stat-incorrect');
                const domainAccuracy = document.getElementById('domain-stat-accuracy');
                
                // Show test mode stats
                if (statItem1) statItem1.style.display = '';
                if (statItem2) statItem2.style.display = '';
                if (statItem3) statItem3.style.display = '';
                
                // Hide domain mode stats
                if (domainCorrect) domainCorrect.style.display = 'none';
                if (domainIncorrect) domainIncorrect.style.display = 'none';
                if (domainAccuracy) domainAccuracy.style.display = 'none';
                
                // Update test mode stats
                const answeredEl = document.getElementById('answered-count');
                const remainingEl = document.getElementById('remaining-count');
                const markedEl = document.getElementById('marked-count');
                const markedQuestions = AppState.getMarkedQuestions();
                
                if (answeredEl) answeredEl.textContent = answered;
                if (remainingEl) {
                    remainingEl.textContent = currentQuestions.length - answered;
                }
                if (markedEl) {
                    markedEl.textContent = markedQuestions.size;
                }
            }
        },
        
        // Show user settings dialog
        showUserSettings: () => {
            const currentUser = AppState.getCurrentUser();
            if (!currentUser) return;
            
            const dialog = document.getElementById('user-settings-dialog');
            const nameInput = document.getElementById('user-name-input');
            const questionsAnswered = document.getElementById('settings-questions-answered');
            const accuracy = document.getElementById('settings-accuracy');
            const testsCompleted = document.getElementById('settings-tests-completed');
            const domainsPracticed = document.getElementById('settings-domains-practiced');
            
            if (nameInput) nameInput.value = currentUser.name || '';
            if (questionsAnswered) questionsAnswered.textContent = currentUser.stats.totalQuestionsAnswered;
            
            const acc = currentUser.stats.totalQuestionsAnswered > 0
                ? Math.round((currentUser.stats.totalCorrectAnswers / currentUser.stats.totalQuestionsAnswered) * 100)
                : 0;
            
            if (accuracy) accuracy.textContent = `${acc}%`;
            if (testsCompleted) testsCompleted.textContent = currentUser.stats.testsCompleted;
            if (domainsPracticed) domainsPracticed.textContent = currentUser.stats.domainsPracticed.size || 0;
            
            if (dialog) dialog.classList.remove('hidden');
        },
        
        // Close user settings dialog
        closeUserSettings: () => {
            const dialog = document.getElementById('user-settings-dialog');
            if (dialog) dialog.classList.add('hidden');
        },
        
        // Save user settings
        saveUserSettings: () => {
            const nameInput = document.getElementById('user-name-input');
            if (!nameInput) return;
            
            const newName = nameInput.value.trim();
            const currentUser = AppState.getCurrentUser();
            
            if (newName && newName !== currentUser.name) {
                currentUser.name = newName;
                UserManager.saveUser();
                Stats.updateDashboard();
            }
            
            UI.closeUserSettings();
        },
        
        // Show dashboard dialog
        showDashboardDialog: () => {
            const dialog = document.getElementById('dashboard-dialog');
            if (dialog) dialog.classList.remove('hidden');
        },
        
        // Close dashboard dialog
        closeDashboardDialog: () => {
            const dialog = document.getElementById('dashboard-dialog');
            if (dialog) dialog.classList.add('hidden');
        }
    };
})();

// Immediately expose functions to window for onclick handlers
if (typeof window !== 'undefined' && typeof UI !== 'undefined') {
    window.showDashboardDialog = UI.showDashboardDialog;
    window.closeDashboardDialog = UI.closeDashboardDialog;
    window.showUserSettings = UI.showUserSettings;
    window.closeUserSettings = UI.closeUserSettings;
    window.saveUserSettings = UI.saveUserSettings;
    window.updateStats = UI.updateStats;
}
