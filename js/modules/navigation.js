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
                if (typeof TestManager !== 'undefined' && TestManager.loadAvailableTests) {
                    TestManager.loadAvailableTests();
                } else {
                    console.error('TestManager not available');
                }
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
                if (typeof Stats !== 'undefined') {
                    Stats.recalculateUserStats(false);
                    Stats.updateDashboard();
                }
            }
            
            AppState.resetTestState();
        },
        
        // Save and return to dashboard
        saveAndReturnToDashboard: () => {
            ProgressManager.saveProgress();
            
            const testTimer = AppState.getTestTimer();
            if (testTimer && typeof Timer !== 'undefined' && Timer.stop) {
                Timer.stop();
            }
            
            if (typeof Stats !== 'undefined' && Stats.recalculateUserStats) {
                Stats.recalculateUserStats(true);
            }
            if (typeof UI !== 'undefined' && UI.closeDashboardDialog) {
                UI.closeDashboardDialog();
            }
            Navigation.returnToDashboard();
        },
        
        // Return to dashboard without saving
        returnToDashboardWithoutSaving: () => {
            const testTimer = AppState.getTestTimer();
            if (testTimer && typeof Timer !== 'undefined' && Timer.stop) {
                Timer.stop();
            }
            
            // Restore to last saved progress
            const currentTest = AppState.getCurrentTest();
            if (currentTest) {
                    const saved = ProgressManager.getSavedProgressForTest(currentTest);
                    if (saved) {
                        ProgressManager.loadSavedProgress(currentTest);
                        if (typeof Stats !== 'undefined' && Stats.recalculateUserStats) {
                            Stats.recalculateUserStats(false);
                        }
                    } else {
                        AppState.resetTestState();
                        if (typeof Stats !== 'undefined' && Stats.recalculateUserStats) {
                            Stats.recalculateUserStats(false);
                        }
                    }
                } else {
                    AppState.resetTestState();
                    if (typeof Stats !== 'undefined' && Stats.recalculateUserStats) {
                        Stats.recalculateUserStats(false);
                    }
                }
            
            UI.closeDashboardDialog();
            Navigation.returnToDashboard();
        }
    };
})();

// Make functions globally accessible
window.selectSource = Navigation.selectSource;
window.selectPracticeMode = Navigation.selectPracticeMode;

// Safely assign TestManager functions (may not be loaded yet)
if (typeof TestManager !== 'undefined') {
    window.selectMode = TestManager.selectMode;
    window.selectTest = TestManager.selectTest;
    window.selectDomainForReview = TestManager.selectDomainForReview;
    window.nextQuestion = TestManager.nextQuestion;
    window.previousQuestion = TestManager.previousQuestion;
    window.submitAnswer = TestManager.submitAnswer;
    window.submitTest = TestManager.submitTest;
    window.toggleMarkQuestion = TestManager.toggleMarkQuestion;
}

window.goBackToMainSelection = Navigation.goBackToMainSelection;
window.goBackToSourceSelection = Navigation.goBackToSourceSelection;
window.goBackToTestSelection = Navigation.goBackToTestSelection;

if (typeof UI !== 'undefined') {
    window.showUserSettings = UI.showUserSettings;
    window.closeUserSettings = UI.closeUserSettings;
    window.saveUserSettings = UI.saveUserSettings;
    window.showDashboardDialog = UI.showDashboardDialog;
    window.closeDashboardDialog = UI.closeDashboardDialog;
}

if (typeof UserManager !== 'undefined') {
    window.resetUserData = UserManager.resetUserData;
    window.exportUserData = UserManager.exportUserData;
    window.importUserData = UserManager.importUserData;
}

window.saveAndReturnToDashboard = Navigation.saveAndReturnToDashboard;
window.returnToDashboardWithoutSaving = Navigation.returnToDashboardWithoutSaving;

// Additional utility functions
// Function to attach navbar toggle listener (prevents duplicate listeners)
function attachNavbarToggleListener() {
    const navbarToggle = document.getElementById('navbar-toggle');
    if (navbarToggle) {
        // Clone button to remove all existing listeners
        const newToggle = navbarToggle.cloneNode(true);
        navbarToggle.parentNode.replaceChild(newToggle, navbarToggle);
        
        // Remove onclick to avoid conflicts
        newToggle.removeAttribute('onclick');
        newToggle.type = 'button';
        
        // Attach single listener
        newToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (typeof window.toggleNavbar === 'function') {
                window.toggleNavbar();
            }
        });
    }
}

// Additional utility functions
window.toggleNavbar = function() {
    const questionGrid = document.getElementById('question-grid');
    const questionScreen = document.getElementById('question-screen');
    
    // Check if question screen is visible
    if (questionScreen && questionScreen.classList.contains('hidden')) {
        console.warn('Question screen is hidden, cannot toggle navbar');
        return false;
    }
    
    if (questionGrid) {
        const wasCollapsed = questionGrid.classList.contains('collapsed');
        questionGrid.classList.toggle('collapsed');
        const isCollapsed = questionGrid.classList.contains('collapsed');
        
        // Force a reflow to ensure the change is visible
        void questionGrid.offsetHeight;
        
        // Dispatch a custom event for any listeners
        questionGrid.dispatchEvent(new CustomEvent('gridToggled', { 
            detail: { collapsed: isCollapsed } 
        }));
        
        return isCollapsed;
    } else {
        console.error('question-grid element not found');
        // Try to find it again after a short delay (in case DOM isn't ready)
        setTimeout(() => {
            const retryGrid = document.getElementById('question-grid');
            if (retryGrid) {
                console.log('Found question-grid on retry, toggling...');
                retryGrid.classList.toggle('collapsed');
            } else {
                console.error('question-grid still not found after retry');
            }
        }, 100);
        return false;
    }
};

// Expose attach function
window.attachNavbarToggleListener = attachNavbarToggleListener;

window.restartTest = () => {
    AppState.resetTestState();
    if (typeof Timer !== 'undefined' && Timer.stop) {
        Timer.stop();
    }
    Navigation.hideScreen('results-screen');
    Navigation.showScreen('test-selection');
    if (AppState.getSelectedSource()) {
        if (typeof TestManager !== 'undefined' && TestManager.loadAvailableTests) {
            TestManager.loadAvailableTests();
        }
    }
};

window.reviewAnswers = () => {
    const reviewContainer = document.getElementById('review-questions');
    if (reviewContainer) {
        reviewContainer.scrollIntoView({ behavior: 'smooth' });
    }
};

// Make question handler functions globally accessible
if (typeof QuestionHandler !== 'undefined') {
    window.loadQuestion = QuestionHandler.loadQuestion;
    window.buildQuestionNavbar = QuestionHandler.buildQuestionNavbar;
}

if (typeof UI !== 'undefined') {
    window.updateStats = UI.updateStats;
}

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
        if (typeof TestManager !== 'undefined' && TestManager.previousQuestion) {
            TestManager.previousQuestion();
        }
    } else if (e.key === 'ArrowRight' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (typeof TestManager !== 'undefined' && TestManager.nextQuestion) {
            TestManager.nextQuestion();
        }
    }
}

document.addEventListener('keydown', handleKeyboardShortcuts);
