// Navigation Module
const Navigation = (function() {
    'use strict';
    
    return {
        // Show a specific screen
        showScreen: (screenId) => {
            const screen = document.getElementById(screenId);
            if (screen) {
                screen.classList.remove('hidden');
            }
        },
        
        // Hide a specific screen
        hideScreen: (screenId) => {
            const screen = document.getElementById(screenId);
            if (screen) {
                screen.classList.add('hidden');
            }
        },
        
        // Hide all screens
        hideAllScreens: () => {
            document.querySelectorAll('.screen').forEach(screen => {
                screen.classList.add('hidden');
            });
        },
        
        // Show main selection screen
        showMainScreen: () => {
            Navigation.hideAllScreens();
            Navigation.showScreen('main-selection');
        },
        
        // Select practice mode (domain or test)
        selectPracticeMode: (mode) => {
            if (mode === 'domain') {
                Navigation.hideScreen('main-selection');
                Navigation.showScreen('domain-selection');
            } else if (mode === 'test') {
                Navigation.hideScreen('main-selection');
                Navigation.showScreen('source-selection');
            }
        },
        
        // Select source (Stephane, Dojo, or Sergey)
        selectSource: (source) => {
            console.log('Navigation.selectSource called with:', source);
            AppState.setSelectedSource(source);
            
            Navigation.hideScreen('source-selection');
            Navigation.showScreen('test-selection');
            
            // Small delay to ensure screen is visible before loading tests
            setTimeout(() => {
                TestManager.loadAvailableTests();
            }, 100);
        },
        
        // Go back to main selection
        goBackToMainSelection: () => {
            Navigation.showScreen('main-selection');
            Navigation.hideScreen('source-selection');
            Navigation.hideScreen('test-selection');
            Navigation.hideScreen('domain-selection');
            Navigation.hideScreen('mode-selection');
            
            AppState.setCurrentTest(null);
            AppState.setSelectedDomain(null);
            AppState.setSelectedSource(null);
        },
        
        // Go back to source selection
        goBackToSourceSelection: () => {
            Navigation.showScreen('source-selection');
            Navigation.hideScreen('test-selection');
            AppState.setCurrentTest(null);
        },
        
        // Go back to test selection
        goBackToTestSelection: () => {
            Navigation.hideScreen('mode-selection');
            Navigation.showScreen('test-selection');
            AppState.setCurrentTest(null);
        },
        
        // Return to dashboard
        returnToDashboard: () => {
            Navigation.hideScreen('question-screen');
            Navigation.hideScreen('results-screen');
            Navigation.hideScreen('mode-selection');
            Navigation.hideScreen('domain-selection');
            Navigation.hideScreen('source-selection');
            Navigation.hideScreen('test-selection');
            Navigation.hideScreen('timer');
            
            const currentUser = AppState.getCurrentUser();
            const currentUserName = AppState.getCurrentUserName();
            
            if (currentUser && currentUserName) {
                Navigation.showScreen('main-selection');
                Stats.recalculateUserStats(false);
                Stats.updateDashboard();
            }
            
            AppState.resetTestState();
        },
        
        // Save and return to dashboard
        saveAndReturnToDashboard: () => {
            ProgressManager.saveProgress();
            
            const testTimer = AppState.getTestTimer();
            if (testTimer) {
                Timer.stop();
            }
            
            Stats.recalculateUserStats(true);
            UI.closeDashboardDialog();
            Navigation.returnToDashboard();
        },
        
        // Return to dashboard without saving
        returnToDashboardWithoutSaving: () => {
            const testTimer = AppState.getTestTimer();
            if (testTimer) {
                Timer.stop();
            }
            
            // Restore to last saved progress
            const currentTest = AppState.getCurrentTest();
            if (currentTest) {
                const saved = ProgressManager.getSavedProgressForTest(currentTest);
                if (saved) {
                    ProgressManager.loadSavedProgress(currentTest);
                    Stats.recalculateUserStats(false);
                } else {
                    AppState.resetTestState();
                    Stats.recalculateUserStats(false);
                }
            } else {
                AppState.resetTestState();
                Stats.recalculateUserStats(false);
            }
            
            UI.closeDashboardDialog();
            Navigation.returnToDashboard();
        }
    };
})();

// Make functions globally accessible
window.selectSource = Navigation.selectSource;
window.selectPracticeMode = Navigation.selectPracticeMode;
window.selectMode = TestManager.selectMode;
window.selectTest = TestManager.selectTest;
window.selectDomainForReview = TestManager.selectDomainForReview;
window.goBackToMainSelection = Navigation.goBackToMainSelection;
window.goBackToSourceSelection = Navigation.goBackToSourceSelection;
window.goBackToTestSelection = Navigation.goBackToTestSelection;
window.showUserSettings = UI.showUserSettings;
window.closeUserSettings = UI.closeUserSettings;
window.saveUserSettings = UI.saveUserSettings;
window.resetUserData = UserManager.resetUserData;
window.exportUserData = UserManager.exportUserData;
window.importUserData = UserManager.importUserData;
window.showDashboardDialog = UI.showDashboardDialog;
window.closeDashboardDialog = UI.closeDashboardDialog;
window.saveAndReturnToDashboard = Navigation.saveAndReturnToDashboard;
window.returnToDashboardWithoutSaving = Navigation.returnToDashboardWithoutSaving;
window.nextQuestion = TestManager.nextQuestion;
window.previousQuestion = TestManager.previousQuestion;
window.submitAnswer = TestManager.submitAnswer;
window.submitTest = TestManager.submitTest;
window.toggleMarkQuestion = TestManager.toggleMarkQuestion;

// Additional utility functions
window.toggleNavbar = function() {
    console.log('toggleNavbar called');
    const questionGrid = document.getElementById('question-grid');
    if (questionGrid) {
        questionGrid.classList.toggle('collapsed');
        const isCollapsed = questionGrid.classList.contains('collapsed');
        console.log('✓ Toggled question grid, collapsed:', isCollapsed);
        return isCollapsed;
    } else {
        console.error('question-grid element not found');
        return false;
    }
};

window.restartTest = () => {
    AppState.resetTestState();
    Timer.stop();
    Navigation.hideScreen('results-screen');
    Navigation.showScreen('test-selection');
    if (AppState.getSelectedSource()) {
        TestManager.loadAvailableTests();
    }
};

window.reviewAnswers = () => {
    const reviewContainer = document.getElementById('review-questions');
    if (reviewContainer) {
        reviewContainer.scrollIntoView({ behavior: 'smooth' });
    }
};

// Make question handler functions globally accessible
window.loadQuestion = QuestionHandler.loadQuestion;
window.updateStats = UI.updateStats;
window.buildQuestionNavbar = QuestionHandler.buildQuestionNavbar;

// Keyboard shortcuts handler
function handleKeyboardShortcuts(e) {
    // Only handle if on question screen
    const questionScreen = document.getElementById('question-screen');
    if (!questionScreen || questionScreen.classList.contains('hidden')) {
        return;
    }
    
    // Arrow keys for navigation
    if (e.key === 'ArrowLeft' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        TestManager.previousQuestion();
    } else if (e.key === 'ArrowRight' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        TestManager.nextQuestion();
    }
}

document.addEventListener('keydown', handleKeyboardShortcuts);
