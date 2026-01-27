// AWS SAA-C03 Practice Exam Application - Modular Architecture
// Main application orchestrator that coordinates all modules

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Initializing AWS SAA-C03 Practice Exam Application...');
    
    // Ensure sign-in screen is visible by default if no user is authenticated
    // This is important for GitHub Pages where Firebase might load slowly
    const signInScreen = document.getElementById('sign-in-screen');
    if (signInScreen) {
        // Check if user is already authenticated (from localStorage or Firebase)
        const currentUserEmail = AppState.getCurrentUserEmail();
        if (!currentUserEmail) {
            // No user authenticated, ensure sign-in screen is visible
            signInScreen.classList.remove('hidden');
            // Hide other screens
            document.querySelectorAll('.screen').forEach(screen => {
                if (screen.id !== 'sign-in-screen') {
                    screen.classList.add('hidden');
                }
            });
        }
    }
    
    // Wait for Firebase to initialize (if available)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Initialize user system
    UserManager.initUserSystem();
    
    // Set up Google Sign-In button event listener
    const googleSignInBtn = document.getElementById('google-sign-in-btn');
    if (googleSignInBtn) {
        // Remove any existing listeners
        const newBtn = googleSignInBtn.cloneNode(true);
        googleSignInBtn.parentNode.replaceChild(newBtn, googleSignInBtn);
        
        newBtn.addEventListener('click', function() {
            if (typeof signInWithGoogle === 'function') {
                signInWithGoogle();
    } else {
                console.error('signInWithGoogle function not available');
                alert('Google Sign-In is not available. Please check Firebase configuration.');
            }
        });
        console.log('✓ Google Sign-In button event listener attached');
    }
    
    // Set up sign-out button
    const signOutBtn = document.getElementById('sign-out-btn');
    if (signOutBtn) {
        signOutBtn.addEventListener('click', function() {
            if (typeof signOut === 'function') {
                signOut();
            }
        });
    }
    
    // Auto-load questions
    if (typeof autoLoadQuestions === 'function') {
        autoLoadQuestions();
    }
    
    // Expose state to window for backward compatibility
    AppState.exposeToWindow();
    
    // Attach event listeners to question screen buttons
    // This ensures buttons work even if onclick handlers fail
    setTimeout(() => {
        // Previous button
        const prevBtn = document.getElementById('prev-btn');
        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (typeof window.previousQuestion === 'function') {
                    window.previousQuestion();
                } else if (typeof TestManager !== 'undefined' && TestManager.previousQuestion) {
                    TestManager.previousQuestion();
                }
            });
        }
        
        // Submit/Next button
        const submitBtn = document.getElementById('submit-btn');
        if (submitBtn) {
            submitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (typeof window.submitAnswer === 'function') {
                    window.submitAnswer();
                } else if (typeof TestManager !== 'undefined' && TestManager.submitAnswer) {
                    TestManager.submitAnswer();
                }
            });
        }
        
        // Next button (shown after answer in review mode)
        const nextBtn = document.getElementById('next-btn');
        if (nextBtn) {
            // Remove onclick attribute to prevent double-firing
            nextBtn.removeAttribute('onclick');
            nextBtn.type = 'button';
            
            // Remove existing listeners by cloning
            const newNextBtn = nextBtn.cloneNode(true);
            nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
            
            newNextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Next button clicked');
                if (typeof window.nextQuestion === 'function') {
                    window.nextQuestion();
                } else if (typeof TestManager !== 'undefined' && TestManager.nextQuestion) {
                    TestManager.nextQuestion();
                }
            });
        }

        // Mark question button
    const markBtn = document.getElementById('mark-btn');
        if (markBtn) {
            markBtn.addEventListener('click', (e) => {
            e.preventDefault();
                if (typeof window.toggleMarkQuestion === 'function') {
                    window.toggleMarkQuestion();
                } else if (typeof TestManager !== 'undefined' && TestManager.toggleMarkQuestion) {
                    TestManager.toggleMarkQuestion();
                }
            });
        }
        
        // Dashboard button
        const dashboardBtn = document.querySelector('.dashboard-btn');
        if (dashboardBtn) {
            dashboardBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (typeof window.showDashboardDialog === 'function') {
                    window.showDashboardDialog();
                } else if (typeof UI !== 'undefined' && UI.showDashboardDialog) {
                    UI.showDashboardDialog();
                }
            });
        }
        
        // Navbar toggle button - use event delegation to catch clicks
        const handleNavbarToggleClick = (e) => {
            const target = e.target;
            const toggleBtn = target.closest('#navbar-toggle');
            if (toggleBtn || target.id === 'navbar-toggle') {
                e.preventDefault();
                e.stopPropagation();
                console.log('Navbar toggle clicked (event delegation)');
                if (typeof window.toggleNavbar === 'function') {
                    window.toggleNavbar();
    } else {
                    console.error('toggleNavbar function not available');
                }
            }
        };
        
        // Use event delegation on document (catches dynamically added elements)
        document.addEventListener('click', handleNavbarToggleClick, true); // Use capture phase
        
        // Also try direct attachment if button exists
        const attachNavbarToggle = () => {
            const navbarToggle = document.getElementById('navbar-toggle');
            if (navbarToggle) {
                // Remove any existing listeners by cloning
                const newToggle = navbarToggle.cloneNode(true);
                navbarToggle.parentNode.replaceChild(newToggle, navbarToggle);
                
                // Remove onclick to avoid conflicts
                newToggle.removeAttribute('onclick');
                newToggle.type = 'button';
                
                newToggle.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Navbar toggle clicked (direct listener)');
                    if (typeof window.toggleNavbar === 'function') {
                        window.toggleNavbar();
    } else {
                        console.error('toggleNavbar function not available');
                    }
                });
                console.log('✓ Navbar toggle button event listener attached');
                return true;
            }
            return false;
        };
        
        if (!attachNavbarToggle()) {
            console.warn('Navbar toggle button not found on initial load (will use event delegation)');
            // Retry after a delay
            setTimeout(() => {
                attachNavbarToggle();
            }, 500);
        }
        
        console.log('✓ Question screen button event listeners attached');
    }, 100);
    
    // Final check: if still no user after Firebase init, show sign-in screen
    setTimeout(() => {
        const currentUser = AppState.getCurrentUser();
        const currentUserEmail = AppState.getCurrentUserEmail();
        if (!currentUser && !currentUserEmail) {
            if (typeof showSignInScreen === 'function') {
                showSignInScreen();
            } else if (signInScreen) {
                signInScreen.classList.remove('hidden');
            }
        }
    }, 1000);
    
    console.log('✓ Application initialized');
});

// Make global functions available for backward compatibility
// These are also set in navigation.js, but we ensure they're available here too
window.exportUserData = UserManager.exportUserData;
window.importUserData = UserManager.importUserData;

// Ensure question screen functions are available
if (typeof TestManager !== 'undefined') {
    window.submitAnswer = TestManager.submitAnswer;
    window.nextQuestion = TestManager.nextQuestion;
    window.previousQuestion = TestManager.previousQuestion;
    window.toggleMarkQuestion = TestManager.toggleMarkQuestion;
    window.submitTest = TestManager.submitTest;
}

if (typeof UI !== 'undefined') {
    window.showDashboardDialog = UI.showDashboardDialog;
    window.closeDashboardDialog = UI.closeDashboardDialog;
}

if (typeof Navigation !== 'undefined') {
    window.saveAndReturnToDashboard = Navigation.saveAndReturnToDashboard;
    window.returnToDashboardWithoutSaving = Navigation.returnToDashboardWithoutSaving;
}

if (typeof QuestionHandler !== 'undefined') {
    window.loadQuestion = QuestionHandler.loadQuestion;
}

if (typeof UI !== 'undefined') {
    window.updateStats = UI.updateStats;
}

if (typeof QuestionHandler !== 'undefined') {
    window.buildQuestionNavbar = QuestionHandler.buildQuestionNavbar;
}

// Ensure toggleNavbar is available
if (typeof window.toggleNavbar === 'undefined') {
    window.toggleNavbar = function() {
        console.log('toggleNavbar called (fallback)');
        const questionGrid = document.getElementById('question-grid');
        if (questionGrid) {
            questionGrid.classList.toggle('collapsed');
            console.log('✓ Toggled question grid, collapsed:', questionGrid.classList.contains('collapsed'));
        } else {
            console.error('question-grid element not found');
        }
    };
}
