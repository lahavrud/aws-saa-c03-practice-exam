// UI Rendering Module
const UI = (function() {
    'use strict';
    
    return {
        // Update stats display
        updateStats: () => {
            const currentQuestions = AppState.getCurrentQuestions();
            const userAnswers = AppState.getUserAnswers();
            const currentQuestionIndex = AppState.getCurrentQuestionIndex();
            
            if (!currentQuestions || currentQuestions.length === 0) return;
            
            let answered = 0;
            let correct = 0;
            
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
                    }
                }
            });
            
            const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;
            
            const answeredEl = document.getElementById('answered-count');
            const correctEl = document.getElementById('correct-count');
            const accuracyEl = document.getElementById('accuracy-percent');
            
            if (answeredEl) answeredEl.textContent = answered;
            if (correctEl) correctEl.textContent = correct;
            if (accuracyEl) accuracyEl.textContent = `${accuracy}%`;
            
            // Update remaining and marked counts
            const remainingEl = document.getElementById('remaining-count');
            const markedEl = document.getElementById('marked-count');
            const markedQuestions = AppState.getMarkedQuestions();
            
            if (remainingEl) {
                remainingEl.textContent = currentQuestions.length - answered;
            }
            if (markedEl) {
                markedEl.textContent = markedQuestions.size;
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
