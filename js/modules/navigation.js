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
        showMainScreen: async () => {
            Navigation.hideAllScreens();
            Navigation.showScreen('main-selection');
            
            // Sync all progress from Firestore first (for cross-device sync)
            if (typeof ProgressManager !== 'undefined' && ProgressManager.syncAllProgressFromFirestore) {
                try {
                    console.log('Syncing progress from Firestore before showing dashboard...');
                    await ProgressManager.syncAllProgressFromFirestore();
                } catch (error) {
                    console.error('Error syncing progress:', error);
                }
            }
            
            // Update stats after syncing (so they reflect synced data)
            if (typeof Stats !== 'undefined') {
                if (Stats.recalculateUserStats) {
                    Stats.recalculateUserStats(false);
                }
                if (Stats.updateDashboard) {
                    Stats.updateDashboard();
                }
            }
            
            // Load all tests on dashboard
            if (typeof TestManager !== 'undefined' && TestManager.loadAllTestsOnDashboard) {
                setTimeout(() => {
                    TestManager.loadAllTestsOnDashboard();
                }, 100);
            }
            
            // Display continue section
            if (typeof ResumeManager !== 'undefined' && ResumeManager.displayContinueSection) {
                setTimeout(() => {
                    ResumeManager.displayContinueSection();
                }, 100);
            }
            
            // Update insights after syncing (so they reflect synced data)
            if (typeof Insights !== 'undefined' && Insights.displayInsights) {
                setTimeout(() => {
                    Insights.displayInsights();
                }, 200);
            }
        },
        
        // Select practice mode (domain only - tests are now on dashboard)
        selectPracticeMode: (mode) => {
            if (mode === 'domain') {
                Navigation.hideScreen('main-selection');
                Navigation.showScreen('domain-selection');
            }
            // Test mode is now handled directly from dashboard via TestManager.startTest/resumeTest
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
        returnToDashboard: async (preserveState = false) => {
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
                // Sync progress from Firestore before showing dashboard
                if (typeof ProgressManager !== 'undefined' && ProgressManager.syncAllProgressFromFirestore) {
                    try {
                        console.log('Syncing progress from Firestore before returning to dashboard...');
                        await ProgressManager.syncAllProgressFromFirestore();
                    } catch (error) {
                        console.error('Error syncing progress:', error);
                    }
                }
                
                Navigation.showScreen('main-selection');
                if (typeof Stats !== 'undefined') {
                    Stats.recalculateUserStats(false);
                    Stats.updateDashboard();
                }
                
                // Load all tests on dashboard
                if (typeof TestManager !== 'undefined' && TestManager.loadAllTestsOnDashboard) {
                    setTimeout(() => {
                        TestManager.loadAllTestsOnDashboard();
                    }, 100);
                }
                
                // Display continue section
                if (typeof ResumeManager !== 'undefined' && ResumeManager.displayContinueSection) {
                    setTimeout(() => {
                        ResumeManager.displayContinueSection();
                    }, 100);
                }
                
                // Update insights when showing dashboard
                if (typeof Insights !== 'undefined' && Insights.displayInsights) {
                    // Small delay to ensure DOM is ready
                    setTimeout(() => {
                        Insights.displayInsights();
                    }, 200);
                }
            }
            
            // Only reset test state if not preserving it (e.g., after saving)
            if (!preserveState) {
                AppState.resetTestState();
            }
        },
        
        // Save and return to dashboard
        saveAndReturnToDashboard: () => {
            console.log('saveAndReturnToDashboard called');
            console.log('Current test:', AppState.getCurrentTest());
            console.log('Current mode:', AppState.getCurrentMode());
            console.log('User answers:', AppState.getUserAnswers());
            console.log('Selected domain:', AppState.getSelectedDomain());
            console.log('User email:', AppState.getCurrentUserEmail());
            
            // Save progress first - capture state before any resets
            const saveSuccess = ProgressManager.saveProgress();
            
            console.log('Save result:', saveSuccess);
            
            if (!saveSuccess) {
                console.warn('Progress save returned false - may not have saved');
                // Show user-friendly message
                alert('Warning: Progress may not have been saved. Please check your browser console for details.');
            } else {
                console.log('✓ Progress saved successfully');
            }
            
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
            
            // Reset state after saving is complete
            AppState.resetTestState();
            Navigation.returnToDashboard(true);
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
                ProgressManager.getSavedProgressForTest(currentTest).then(saved => {
                    if (saved) {
                        ProgressManager.loadSavedProgress(currentTest).then(() => {
                            if (typeof Stats !== 'undefined' && Stats.recalculateUserStats) {
                                Stats.recalculateUserStats(false);
                            }
                        });
                    } else {
                        AppState.resetTestState();
                        if (typeof Stats !== 'undefined' && Stats.recalculateUserStats) {
                            Stats.recalculateUserStats(false);
                        }
                    }
                });
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
    window.selectDomainForReviewInModal = TestManager.selectDomainForReviewInModal;
    window.nextQuestion = TestManager.nextQuestion;
    window.previousQuestion = TestManager.previousQuestion;
    window.submitAnswer = TestManager.submitAnswer;
    window.submitTest = TestManager.submitTest;
    window.toggleMarkQuestion = TestManager.toggleMarkQuestion;
}

window.goBackToMainSelection = Navigation.goBackToMainSelection;
window.goBackToSourceSelection = Navigation.goBackToSourceSelection;
window.goBackToTestSelection = Navigation.goBackToTestSelection;

// UI functions are already exposed in ui.js, no need to duplicate here

if (typeof UserManager !== 'undefined') {
    window.resetUserData = UserManager.resetUserData;
}

// Reset confirmation functions
window.confirmResetProgress = () => {
    const input = document.getElementById('reset-confirm-input');
    if (input && input.value === 'DELETE') {
        if (typeof UserManager !== 'undefined' && UserManager.performReset) {
            UserManager.performReset();
        }
        window.closeResetConfirmation();
    }
};

window.closeResetConfirmation = () => {
    const dialog = document.getElementById('reset-confirmation-dialog');
    const input = document.getElementById('reset-confirm-input');
    const confirmBtn = document.getElementById('reset-confirm-btn');
    
    if (dialog) {
        dialog.classList.add('hidden');
        if (input) input.value = '';
        if (confirmBtn) confirmBtn.disabled = true;
        
        // Return focus to reset button
        const resetBtn = document.querySelector('.danger-action-btn');
        if (resetBtn && typeof UI !== 'undefined') {
            UI.previousFocus = resetBtn;
        }
        
        if (typeof UI !== 'undefined' && UI.releaseFocus) {
            UI.releaseFocus();
        }
    }
};

// Export user data functions
if (typeof UserManager !== 'undefined') {
    window.exportUserData = UserManager.exportUserData;
    window.importUserData = UserManager.importUserData;
}

window.saveAndReturnToDashboard = Navigation.saveAndReturnToDashboard;
window.returnToDashboardWithoutSaving = Navigation.returnToDashboardWithoutSaving;

// Toast notification utility
window.showToast = function(message, type = 'info', duration = 5000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.setAttribute('role', 'alert');
    
    const icons = {
        error: '❌',
        success: '✅',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    toast.innerHTML = `
        <span class="toast-icon" aria-hidden="true">${icons[type] || icons.info}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" aria-label="Close notification" onclick="this.parentElement.remove()">×</button>
    `;
    
    container.appendChild(toast);
    
    // Auto-remove after duration
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }
    }, duration);
};

// Error handling utility
window.handleError = function(error, userMessage = null) {
    console.error('Error:', error);
    const message = userMessage || (error.message || 'An unexpected error occurred. Please try again.');
    window.showToast(message, 'error', 7000);
};

// Function to attach navbar toggle listener (prevents duplicate listeners)
function attachNavbarToggleListener() {
    const navbarToggle = document.getElementById('navbar-menu-toggle');
    const navbarMenu = document.getElementById('navbar-menu');
    const navbarBackdrop = document.getElementById('navbar-backdrop');
    
    if (navbarToggle && navbarMenu) {
        // Clone button to remove all existing listeners
        const newToggle = navbarToggle.cloneNode(true);
        navbarToggle.parentNode.replaceChild(newToggle, navbarToggle);
        
        // Remove onclick to avoid conflicts
        newToggle.removeAttribute('onclick');
        newToggle.type = 'button';
        
        // Attach single listener for main navigation menu
        newToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const menu = document.getElementById('navbar-menu');
            const backdrop = document.getElementById('navbar-backdrop');
            
            if (menu) {
                const isActive = menu.classList.contains('active');
                
                if (isActive) {
                    // Close menu
                    menu.classList.remove('active');
                    newToggle.classList.remove('active');
                    newToggle.setAttribute('aria-expanded', 'false');
                    if (backdrop) {
                        backdrop.classList.remove('active');
                        backdrop.setAttribute('aria-hidden', 'true');
                    }
                } else {
                    // Open menu
                    menu.classList.add('active');
                    newToggle.classList.add('active');
                    newToggle.setAttribute('aria-expanded', 'true');
                    if (backdrop) {
                        backdrop.classList.add('active');
                        backdrop.setAttribute('aria-hidden', 'false');
                    }
                }
            }
        });
        
        // Close menu function
        const closeMenu = () => {
            const menu = document.getElementById('navbar-menu');
            const toggle = document.getElementById('navbar-menu-toggle');
            const backdrop = document.getElementById('navbar-backdrop');
            if (menu && toggle) {
                menu.classList.remove('active');
                toggle.classList.remove('active');
                toggle.setAttribute('aria-expanded', 'false');
                if (backdrop) {
                    backdrop.classList.remove('active');
                    backdrop.setAttribute('aria-hidden', 'true');
                }
            }
        };
        
        // Close menu when clicking backdrop
        if (navbarBackdrop) {
            // Remove existing listeners by cloning
            const newBackdrop = navbarBackdrop.cloneNode(true);
            navbarBackdrop.parentNode.replaceChild(newBackdrop, navbarBackdrop);
            
            newBackdrop.addEventListener('click', closeMenu);
        }
        
        // Close menu when clicking outside (on document)
        document.addEventListener('click', function(e) {
            const menu = document.getElementById('navbar-menu');
            const toggle = document.getElementById('navbar-menu-toggle');
            if (menu && menu.classList.contains('active')) {
                // Check if click is outside menu and toggle button
                if (!menu.contains(e.target) && toggle && !toggle.contains(e.target)) {
                    closeMenu();
                }
            }
        });
        
        // Swipe gesture to close menu (touch devices)
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;
        
        if (navbarMenu) {
            navbarMenu.addEventListener('touchstart', function(e) {
                touchStartX = e.changedTouches[0].screenX;
                touchStartY = e.changedTouches[0].screenY;
            }, { passive: true });
            
            navbarMenu.addEventListener('touchend', function(e) {
                touchEndX = e.changedTouches[0].screenX;
                touchEndY = e.changedTouches[0].screenY;
                
                const deltaX = touchStartX - touchEndX;
                const deltaY = touchStartY - touchEndY;
                
                // Swipe left to close (more than 100px and horizontal movement is greater than vertical)
                if (deltaX > 100 && Math.abs(deltaX) > Math.abs(deltaY)) {
                    closeMenu();
                }
            }, { passive: true });
        }
        
        // Close menu when clicking on navigation links
        const navLinks = navbarMenu.querySelectorAll('.navbar-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                const menu = document.getElementById('navbar-menu');
                const toggle = document.getElementById('navbar-menu-toggle');
                const backdrop = document.getElementById('navbar-backdrop');
                if (menu && toggle) {
                    menu.classList.remove('active');
                    toggle.classList.remove('active');
                    toggle.setAttribute('aria-expanded', 'false');
                    if (backdrop) {
                        backdrop.classList.remove('active');
                        backdrop.setAttribute('aria-hidden', 'true');
                    }
                }
            });
        });
    }
}

// Additional utility functions
window.toggleNavbar = function() {
    const questionGrid = document.getElementById('question-grid');
    const questionScreen = document.getElementById('question-screen');
    const navbarToggle = document.getElementById('navbar-toggle');
    
    // Check if question screen is visible
    if (questionScreen && questionScreen.classList.contains('hidden')) {
        console.warn('Question screen is hidden, cannot toggle navbar');
        return false;
    }
    
    if (questionGrid) {
        const wasCollapsed = questionGrid.classList.contains('collapsed');
        questionGrid.classList.toggle('collapsed');
        const isCollapsed = questionGrid.classList.contains('collapsed');
        
        // Update toggle button icons
        if (navbarToggle) {
            const arrowIcon = navbarToggle.querySelector('.navbar-toggle-arrow');
            const closeIcon = navbarToggle.querySelector('.navbar-toggle-close');
            const isExpanded = !isCollapsed;
            
            navbarToggle.setAttribute('aria-expanded', isExpanded);
            
            if (arrowIcon && closeIcon) {
                if (isExpanded) {
                    // Grid is open - show X icon
                    arrowIcon.classList.add('hidden');
                    closeIcon.classList.remove('hidden');
                } else {
                    // Grid is closed - show arrow icon
                    arrowIcon.classList.remove('hidden');
                    closeIcon.classList.add('hidden');
                }
            }
        }
        
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

// Question handler and UI functions are already exposed in their respective modules

// Keyboard shortcuts handler
function handleKeyboardShortcuts(e) {
    // Only handle if on question screen
    const questionScreen = document.getElementById('question-screen');
    if (!questionScreen || questionScreen.classList.contains('hidden')) {
        return;
    }
    
    // Escape key for dashboard (only if not typing in an input)
    if (e.key === 'Escape' && !e.ctrlKey && !e.metaKey) {
        const activeElement = document.activeElement;
        const isInputFocused = activeElement && (
            activeElement.tagName === 'INPUT' || 
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.isContentEditable
        );
        
        if (!isInputFocused) {
            e.preventDefault();
            if (typeof UI !== 'undefined' && UI.showDashboardDialog) {
                UI.showDashboardDialog();
            } else if (typeof window.showDashboardDialog === 'function') {
                window.showDashboardDialog();
            }
        }
    }
    // Arrow keys for navigation
    else if (e.key === 'ArrowLeft' && !e.ctrlKey && !e.metaKey) {
        const activeElement = document.activeElement;
        const isInputFocused = activeElement && (
            activeElement.tagName === 'INPUT' || 
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.isContentEditable
        );
        
        if (!isInputFocused) {
            e.preventDefault();
            if (typeof TestManager !== 'undefined' && TestManager.previousQuestion) {
                TestManager.previousQuestion();
            }
        }
    } else if (e.key === 'ArrowRight' && !e.ctrlKey && !e.metaKey) {
        const activeElement = document.activeElement;
        const isInputFocused = activeElement && (
            activeElement.tagName === 'INPUT' || 
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.isContentEditable
        );
        
        if (!isInputFocused) {
            e.preventDefault();
            if (typeof TestManager !== 'undefined' && TestManager.nextQuestion) {
                TestManager.nextQuestion();
            }
        }
    }
}

document.addEventListener('keydown', handleKeyboardShortcuts);

// Swipe gesture handler for question navigation (mobile only)
function initSwipeGestures() {
    const questionScreen = document.getElementById('question-screen');
    if (!questionScreen) return;
    
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    let isScrolling = false;
    let scrollStartY = 0;
    
    // Minimum swipe distance (50px)
    const SWIPE_THRESHOLD = 50;
    // Maximum vertical movement to consider it a swipe (not scroll)
    const MAX_VERTICAL_MOVEMENT = 30;
    
    questionScreen.addEventListener('touchstart', function(e) {
        // Only handle if question screen is visible
        if (questionScreen.classList.contains('hidden')) return;
        
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
        scrollStartY = window.scrollY || document.documentElement.scrollTop;
        isScrolling = false;
    }, { passive: true });
    
    questionScreen.addEventListener('touchmove', function(e) {
        if (questionScreen.classList.contains('hidden')) return;
        
        const currentY = e.changedTouches[0].screenY;
        const deltaY = Math.abs(currentY - touchStartY);
        
        // If vertical movement is significant, it's a scroll, not a swipe
        if (deltaY > MAX_VERTICAL_MOVEMENT) {
            isScrolling = true;
        }
    }, { passive: true });
    
    questionScreen.addEventListener('touchend', function(e) {
        if (questionScreen.classList.contains('hidden')) return;
        
        // Don't handle swipe if user was scrolling
        if (isScrolling) return;
        
        // Don't handle swipe if user scrolled the page
        const currentScrollY = window.scrollY || document.documentElement.scrollTop;
        if (Math.abs(currentScrollY - scrollStartY) > 10) return;
        
        // Don't handle swipe if touching interactive elements
        const target = e.target;
        if (target && (
            target.tagName === 'BUTTON' ||
            target.tagName === 'INPUT' ||
            target.tagName === 'A' ||
            target.closest('button') ||
            target.closest('a') ||
            target.closest('.option')
        )) {
            return;
        }
        
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        
        const deltaX = touchStartX - touchEndX;
        const deltaY = Math.abs(touchStartY - touchEndY);
        
        // Only handle horizontal swipes (horizontal movement > vertical movement)
        if (Math.abs(deltaX) > deltaY && Math.abs(deltaX) > SWIPE_THRESHOLD) {
            e.preventDefault();
            
            if (deltaX > 0) {
                // Swipe left - go to next question
                if (typeof TestManager !== 'undefined' && TestManager.nextQuestion) {
                    TestManager.nextQuestion();
                }
            } else {
                // Swipe right - go to previous question
                if (typeof TestManager !== 'undefined' && TestManager.previousQuestion) {
                    TestManager.previousQuestion();
                }
            }
        }
    }, { passive: false });
}

// Initialize swipe gestures for question grid (vertical swipe to toggle)
function initQuestionGridSwipe() {
    const questionGrid = document.getElementById('question-grid');
    const questionNavbar = document.getElementById('question-navbar');
    
    if (!questionGrid || !questionNavbar) return;
    
    let touchStartY = 0;
    let touchEndY = 0;
    let touchStartTime = 0;
    const SWIPE_THRESHOLD = 50; // Minimum distance for swipe
    const SWIPE_TIME_THRESHOLD = 300; // Maximum time for swipe (ms)
    
    // Add touch event listeners to the navbar header (where users would naturally swipe)
    questionNavbar.addEventListener('touchstart', function(e) {
        touchStartY = e.changedTouches[0].screenY;
        touchStartTime = Date.now();
    }, { passive: true });
    
    questionNavbar.addEventListener('touchend', function(e) {
        touchEndY = e.changedTouches[0].screenY;
        const touchDuration = Date.now() - touchStartTime;
        const deltaY = touchStartY - touchEndY;
        const absDeltaY = Math.abs(deltaY);
        
        // Only handle vertical swipes if they're significant enough
        if (absDeltaY > SWIPE_THRESHOLD && touchDuration < SWIPE_TIME_THRESHOLD) {
            const isCollapsed = questionGrid.classList.contains('collapsed');
            
            if (deltaY > 0) {
                // Swipe up - open the grid if it's closed
                if (isCollapsed && typeof window.toggleNavbar === 'function') {
                    window.toggleNavbar();
                }
            } else {
                // Swipe down - close the grid if it's open
                if (!isCollapsed && typeof window.toggleNavbar === 'function') {
                    window.toggleNavbar();
                }
            }
        }
    }, { passive: true });
}

// Initialize swipe gestures when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            initSwipeGestures();
            initQuestionGridSwipe();
        }, 100);
    });
} else {
    setTimeout(() => {
        initSwipeGestures();
        initQuestionGridSwipe();
    }, 100);
}

// Re-initialize swipe gestures when question screen is shown
const originalShowScreen = Navigation.showScreen;
Navigation.showScreen = function(screenId) {
    originalShowScreen.call(this, screenId);
    if (screenId === 'question-screen') {
        setTimeout(() => {
            initSwipeGestures();
            initQuestionGridSwipe();
        }, 100);
        initMobileBottomNav();
    } else {
        hideMobileBottomNav();
    }
};

// Initialize mobile bottom navigation
function initMobileBottomNav() {
    const mobileBottomNav = document.getElementById('mobile-bottom-nav');
    if (!mobileBottomNav) return;
    
    const questionScreen = document.getElementById('question-screen');
    if (!questionScreen || questionScreen.classList.contains('hidden')) {
        mobileBottomNav.classList.add('hidden');
        return;
    }
    
    mobileBottomNav.classList.remove('hidden');
    
    // Wire up button handlers
    const mobilePrevBtn = document.getElementById('mobile-prev-btn');
    const mobileNextBtn = document.getElementById('mobile-next-btn');
    const mobileMarkBtn = document.getElementById('mobile-mark-btn');
    const mobileDashboardBtn = document.getElementById('mobile-dashboard-btn');
    const prevBtn = document.getElementById('prev-btn');
    const desktopNextBtn = document.getElementById('next-btn');
    const markBtn = document.getElementById('mark-btn');
    
    if (mobilePrevBtn && prevBtn) {
        mobilePrevBtn.onclick = () => prevBtn.click();
    }
    
    if (mobileNextBtn) {
        // Mobile next button always goes to next question (not check)
        const updateMobileNextBtn = () => {
            const nextBtn = document.getElementById('next-btn');
            if (nextBtn) {
                // If next button is visible, use it
                if (!nextBtn.classList.contains('hidden')) {
                    mobileNextBtn.onclick = () => nextBtn.click();
                    mobileNextBtn.querySelector('span').textContent = 'Next';
                } else {
                    // If next button is hidden, still allow going to next (will show submit button)
                    mobileNextBtn.onclick = () => {
                        // Try to click next, if not available, do nothing
                        if (nextBtn && typeof TestManager !== 'undefined' && TestManager.nextQuestion) {
                            TestManager.nextQuestion();
                        }
                    };
                    mobileNextBtn.querySelector('span').textContent = 'Next';
                }
            }
        };
        
        // Observe button state changes
        const submitBtn = document.getElementById('submit-btn');
        const nextBtn = document.getElementById('next-btn');
        if (submitBtn) {
            const submitObserver = new MutationObserver(updateMobileNextBtn);
            submitObserver.observe(submitBtn, { attributes: true, attributeFilter: ['class'] });
        }
        if (nextBtn) {
            const nextObserver = new MutationObserver(updateMobileNextBtn);
            nextObserver.observe(nextBtn, { attributes: true, attributeFilter: ['class'] });
        }
        updateMobileNextBtn();
    }
    
    if (mobileMarkBtn && markBtn) {
        mobileMarkBtn.onclick = () => markBtn.click();
        // Sync mark state
        const updateMarkState = () => {
            if (markBtn.classList.contains('marked')) {
                mobileMarkBtn.classList.add('marked');
            } else {
                mobileMarkBtn.classList.remove('marked');
            }
        };
        // Observe mark button changes
        const observer = new MutationObserver(updateMarkState);
        observer.observe(markBtn, { attributes: true, attributeFilter: ['class'] });
        updateMarkState();
    }
    
    if (mobileDashboardBtn) {
        mobileDashboardBtn.onclick = () => {
            if (typeof UI !== 'undefined' && UI.showDashboardDialog) {
                UI.showDashboardDialog();
            } else if (typeof window.showDashboardDialog === 'function') {
                window.showDashboardDialog();
            }
        };
    }
}

function hideMobileBottomNav() {
    const mobileBottomNav = document.getElementById('mobile-bottom-nav');
    if (mobileBottomNav) {
        mobileBottomNav.classList.add('hidden');
    }
}

// Initialize swipe-down to close modals on mobile
function initModalSwipeToClose() {
    const modals = document.querySelectorAll('.modal:not(.hidden)');
    
    modals.forEach(modal => {
        const modalContent = modal.querySelector('.modal-content');
        if (!modalContent) return;
        
        let touchStartY = 0;
        let touchStartTime = 0;
        let isDragging = false;
        
        modalContent.addEventListener('touchstart', function(e) {
            // Only allow swipe from top of modal
            if (e.touches[0].clientY - modalContent.getBoundingClientRect().top > 60) {
                return;
            }
            touchStartY = e.touches[0].clientY;
            touchStartTime = Date.now();
            isDragging = false;
        }, { passive: true });
        
        modalContent.addEventListener('touchmove', function(e) {
            if (!touchStartY) return;
            
            const currentY = e.touches[0].clientY;
            const deltaY = currentY - touchStartY;
            
            // Only allow downward swipe
            if (deltaY > 0) {
                isDragging = true;
                // Add visual feedback
                modalContent.style.transform = `translateY(${Math.min(deltaY, 100)}px)`;
                modalContent.style.opacity = Math.max(0.7, 1 - (deltaY / 300));
            }
        }, { passive: true });
        
        modalContent.addEventListener('touchend', function(e) {
            if (!touchStartY || !isDragging) {
                touchStartY = 0;
                return;
            }
            
            const touchEndY = e.changedTouches[0].clientY;
            const deltaY = touchEndY - touchStartY;
            const deltaTime = Date.now() - touchStartTime;
            const velocity = deltaY / deltaTime;
            
            // Reset transform
            modalContent.style.transform = '';
            modalContent.style.opacity = '';
            
            // Close if swiped down more than 100px or fast swipe
            if (deltaY > 100 || (deltaY > 50 && velocity > 0.3)) {
                // Close the appropriate modal
                if (modal.id === 'user-settings-dialog') {
                    if (typeof UI !== 'undefined' && UI.closeUserSettings) {
                        UI.closeUserSettings();
                    }
                } else if (modal.id === 'dashboard-dialog') {
                    if (typeof UI !== 'undefined' && UI.closeDashboardDialog) {
                        UI.closeDashboardDialog();
                    }
                } else if (modal.id === 'reset-confirmation-dialog') {
                    if (typeof window.closeResetConfirmation === 'function') {
                        window.closeResetConfirmation();
                    }
                } else if (modal.id === 'about-us-modal') {
                    if (typeof window.closeAboutUs === 'function') {
                        window.closeAboutUs();
                    }
                } else {
                    modal.classList.add('hidden');
                }
            }
            
            touchStartY = 0;
            isDragging = false;
        }, { passive: true });
    });
}

// Observe modals being shown/hidden
const modalObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            const modal = mutation.target;
            if (modal.classList.contains('modal')) {
                if (!modal.classList.contains('hidden')) {
                    setTimeout(initModalSwipeToClose, 100);
                }
            }
        }
    });
});

// Observe all modals
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.modal').forEach(modal => {
        modalObserver.observe(modal, { attributes: true });
    });
});

// Utility function to close mobile menu
const closeMobileMenu = () => {
    const menu = document.getElementById('navbar-menu');
    const toggle = document.getElementById('navbar-menu-toggle');
    if (menu && toggle) {
        menu.classList.remove('active');
        toggle.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
    }
};

// Helper function to show sign-in screen (for HTML onclick handlers)
window.showSignInScreen = () => {
    if (typeof Navigation !== 'undefined' && Navigation.showScreen) {
        Navigation.hideAllScreens();
        Navigation.showScreen('sign-in-screen');
    } else if (typeof showSignInScreen === 'function') {
        // Fallback to firebase-db.js function if Navigation not available
        showSignInScreen();
    }
};

// Show main screen function
window.showMainScreen = () => {
    if (typeof Navigation !== 'undefined' && Navigation.showMainScreen) {
        Navigation.showMainScreen();
    }
    closeMobileMenu();
};

// FAQ Page Functions
window.showFAQ = () => {
    if (typeof Navigation !== 'undefined') {
        Navigation.hideAllScreens();
        Navigation.showScreen('faq-screen');
    }
    closeMobileMenu();
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Initialize FAQ toggles
    initFAQToggles();
};

// Initialize FAQ toggle functionality
function initFAQToggles() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    // Expand all functionality
    const expandAllBtn = document.getElementById('expand-all-faq');
    if (expandAllBtn) {
        expandAllBtn.addEventListener('click', () => {
            faqItems.forEach(item => {
                const answer = item.querySelector('.faq-answer');
                const toggle = item.querySelector('.faq-toggle');
                if (answer && toggle) {
                    item.classList.add('active');
                    answer.style.maxHeight = answer.scrollHeight + 'px';
                    toggle.setAttribute('aria-expanded', 'true');
                }
            });
        });
    }
    
    // Collapse all functionality
    const collapseAllBtn = document.getElementById('collapse-all-faq');
    if (collapseAllBtn) {
        collapseAllBtn.addEventListener('click', () => {
            faqItems.forEach(item => {
                const answer = item.querySelector('.faq-answer');
                const toggle = item.querySelector('.faq-toggle');
                if (answer && toggle) {
                    item.classList.remove('active');
                    answer.style.maxHeight = null;
                    toggle.setAttribute('aria-expanded', 'false');
                }
            });
        });
    }
    
    faqItems.forEach(item => {
        const toggle = item.querySelector('.faq-toggle');
        const answer = item.querySelector('.faq-answer');
        const question = item.querySelector('.faq-question');
        
        if (toggle && answer) {
            // Set initial state
            answer.style.maxHeight = null;
            item.classList.remove('active');
            
            // Add click handler to both toggle button and question
            const handleClick = () => {
                const isActive = item.classList.contains('active');
                
                // Close all other items (optional - remove if you want multiple open)
                faqItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                        const otherAnswer = otherItem.querySelector('.faq-answer');
                        if (otherAnswer) {
                            otherAnswer.style.maxHeight = null;
                        }
                    }
                });
                
                // Toggle current item
                if (isActive) {
                    item.classList.remove('active');
                    answer.style.maxHeight = null;
                    toggle.setAttribute('aria-expanded', 'false');
                } else {
                    item.classList.add('active');
                    answer.style.maxHeight = answer.scrollHeight + 'px';
                    toggle.setAttribute('aria-expanded', 'true');
                }
            };
            
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                handleClick();
            });
            
            if (question) {
                question.addEventListener('click', handleClick);
            }
        }
    });
}

// Initialize FAQ toggles when DOM is ready (in case FAQ screen is shown initially)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initFAQToggles, 100);
    });
} else {
    setTimeout(initFAQToggles, 100);
}

// Study Guide Page Functions
window.showStudyGuide = () => {
    if (typeof Navigation !== 'undefined') {
        Navigation.hideAllScreens();
        Navigation.showScreen('study-guide-screen');
    }
    closeMobileMenu();
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// About Us Page Functions
window.showAboutUsPage = () => {
    if (typeof Navigation !== 'undefined') {
        Navigation.hideAllScreens();
        Navigation.showScreen('about-us-screen');
    }
    closeMobileMenu();
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// About Us Modal Functions (for quick access)
window.showAboutUs = () => {
    const modal = document.getElementById('about-us-modal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
    closeMobileMenu();
};

window.closeAboutUs = () => {
    const modal = document.getElementById('about-us-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
};

// Close About Us modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('about-us-modal');
    if (modal && !modal.classList.contains('hidden')) {
        if (e.target === modal) {
            closeAboutUs();
        }
    }
});

// Initialize mobile menu when DOM is ready
// Use attachNavbarToggleListener which properly handles backdrop and menu toggle
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        attachNavbarToggleListener();
    });
} else {
    attachNavbarToggleListener();
}
