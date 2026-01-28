// AWS Lahavda - Practice Exam Application - Modular Architecture
// Main application orchestrator that coordinates all modules

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Initializing AWS Lahavda Application...');
    
    // Hide initial loader when app is ready
    const hideInitialLoader = () => {
        const loader = document.getElementById('initial-loader');
        if (loader) {
            loader.classList.add('hidden');
            setTimeout(() => {
                loader.style.display = 'none';
            }, 300);
        }
    };
    
    // Show error state
    const showErrorState = (message, retryCallback) => {
        hideInitialLoader();
        const container = document.getElementById('main-content');
        if (container) {
            const errorHTML = `
                <div class="error-state">
                    <div class="error-state-icon">⚠️</div>
                    <h3>Something went wrong</h3>
                    <p>${message}</p>
                    <div class="error-state-actions">
                        ${retryCallback ? `<button class="error-state-btn" onclick="location.reload()">Retry</button>` : ''}
                        <button class="error-state-btn secondary" onclick="window.showOfflineMode()">Continue Offline</button>
                    </div>
                </div>
            `;
            container.innerHTML = errorHTML;
        }
    };
    
    // Offline detection
    const setupOfflineDetection = () => {
        const offlineIndicator = document.createElement('div');
        offlineIndicator.className = 'offline-indicator';
        offlineIndicator.innerHTML = '<strong>⚠️</strong> You are currently offline. Some features may be limited.';
        document.body.appendChild(offlineIndicator);
        
        const updateOfflineStatus = () => {
            if (!navigator.onLine) {
                offlineIndicator.classList.add('show');
            } else {
                offlineIndicator.classList.remove('show');
            }
        };
        
        window.addEventListener('online', updateOfflineStatus);
        window.addEventListener('offline', updateOfflineStatus);
        updateOfflineStatus();
    };
    
    setupOfflineDetection();
    
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
    
    // Wait for Firebase to initialize (if available) with error handling
    try {
        await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
        console.error('Error during initialization:', error);
        // Continue anyway - app can work offline
    }
    
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
                // Show loading state
                newBtn.classList.add('loading');
                newBtn.disabled = true;
                
                signInWithGoogle().catch(error => {
                    newBtn.classList.remove('loading');
                    newBtn.disabled = false;
                    if (typeof window.handleError === 'function') {
                        window.handleError(error, 'Failed to sign in. Please try again.');
                    } else {
                        alert('Failed to sign in. Please check your connection and try again.');
                    }
                });
            } else {
                console.error('signInWithGoogle function not available');
                if (typeof window.handleError === 'function') {
                    window.handleError(new Error('Google Sign-In not available'), 'Google Sign-In is not available. Please check Firebase configuration.');
                } else {
                    alert('Google Sign-In is not available. Please check Firebase configuration.');
                }
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
    
    // Auto-load questions and ensure examQuestions is set
    // Wait a bit longer for questions.js to load (important for GitHub Pages)
    setTimeout(async () => {
        if (typeof autoLoadQuestions === 'function') {
            try {
                const loadedQuestions = await autoLoadQuestions();
                if (loadedQuestions) {
                    window.examQuestions = loadedQuestions;
                    hideInitialLoader();
                } else if (typeof examQuestions === 'undefined') {
                    console.error('Failed to load questions. Please check that questions.js exists or JSON files are available.');
                    // Try to load from cache/localStorage
                    const cachedQuestions = localStorage.getItem('cached-questions');
                    if (cachedQuestions) {
                        try {
                            window.examQuestions = JSON.parse(cachedQuestions);
                            hideInitialLoader();
                            if (typeof window.showToast === 'function') {
                                window.showToast('Loaded questions from cache. Some features may be limited.', 'info');
                            }
                        } catch (e) {
                            console.error('Error loading cached questions:', e);
                            showErrorState('Failed to load questions. Please check your connection and refresh the page.', () => location.reload());
                        }
                    } else {
                        showErrorState('Failed to load questions. Please check your connection and refresh the page.', () => location.reload());
                    }
                } else {
                    hideInitialLoader();
                }
            } catch (error) {
                console.error('Error loading questions:', error);
                // Try to continue with cached questions
                const cachedQuestions = localStorage.getItem('cached-questions');
                if (cachedQuestions) {
                    try {
                        window.examQuestions = JSON.parse(cachedQuestions);
                        hideInitialLoader();
                        if (typeof window.showToast === 'function') {
                            window.showToast('Loaded questions from cache due to connection error.', 'warning');
                        }
                    } catch (e) {
                        showErrorState('Failed to load questions. Please check your connection and refresh the page.', () => location.reload());
                    }
                } else {
                    showErrorState('Failed to load questions: ' + error.message, () => location.reload());
                }
            }
        } else {
            console.error('autoLoadQuestions function not available');
            // Hide loader anyway after a delay
            setTimeout(hideInitialLoader, 1000);
        }
    }, 200);
    
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

        // Mark question button - use event delegation to handle dynamically updated buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('#mark-btn')) {
                e.preventDefault();
                e.stopPropagation();
                const markBtn = e.target.closest('#mark-btn');
                // Remove onclick to prevent double-firing
                markBtn.removeAttribute('onclick');
                
                if (typeof window.toggleMarkQuestion === 'function') {
                    window.toggleMarkQuestion();
                } else if (typeof TestManager !== 'undefined' && TestManager.toggleMarkQuestion) {
                    TestManager.toggleMarkQuestion();
                }
            }
        });
        
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
        
        // Navbar toggle button - direct attachment only (no event delegation to prevent double calls)
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
                    console.log('Navbar toggle clicked');
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
            console.warn('Navbar toggle button not found on initial load, will retry');
            // Retry after a delay
            setTimeout(() => {
                attachNavbarToggle();
            }, 500);
        }
        
        // Stats bar toggle
        const statsBarToggle = document.getElementById('stats-bar-toggle');
        const statsBarContainer = document.getElementById('stats-bar-container');
        const statsBarContent = document.getElementById('stats-bar-content');
        
        if (statsBarToggle && statsBarContainer) {
            // Set initial state based on screen size
            const isMobile = window.innerWidth <= 768;
            if (isMobile) {
                statsBarContainer.setAttribute('aria-expanded', 'false');
                statsBarToggle.setAttribute('aria-expanded', 'false');
            }
            
            statsBarToggle.addEventListener('click', function() {
                const isExpanded = statsBarContainer.getAttribute('aria-expanded') === 'true';
                statsBarContainer.setAttribute('aria-expanded', !isExpanded);
                statsBarToggle.setAttribute('aria-expanded', !isExpanded);
            });
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
        // Hide loader if still showing
        hideInitialLoader();
    }, 1000);
    
    // Global offline mode function
    window.showOfflineMode = () => {
        hideInitialLoader();
        const signInScreen = document.getElementById('sign-in-screen');
        if (signInScreen) {
            signInScreen.classList.remove('hidden');
            if (typeof window.showToast === 'function') {
                window.showToast('Running in offline mode. Some features may be limited.', 'info', 7000);
            }
        }
    };
    
    console.log('✓ Application initialized');
});

// Global functions are already exposed in their respective modules:
// - UserManager functions: navigation.js
// - TestManager functions: navigation.js
// - UI functions: ui.js
// - Navigation functions: navigation.js
// - QuestionHandler functions: navigation.js
// No need to duplicate assignments here

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
