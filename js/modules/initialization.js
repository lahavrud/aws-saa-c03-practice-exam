/**
 * Application Initialization Module
 * Handles all initialization logic for the application
 */

const Initialization = (function() {
    'use strict';
    
    let messageInterval = null;
    
    /**
     * Initialize easter egg loader messages
     */
    function initLoaderMessages() {
        const loaderText = document.getElementById('loader-message');
        if (!loaderText || !Messages.easterEggMessages.length) {
            return;
        }
        
        let currentMessageIndex = Math.floor(Math.random() * Messages.easterEggMessages.length);
        loaderText.textContent = Messages.easterEggMessages[currentMessageIndex];
        currentMessageIndex = (currentMessageIndex + 1) % Messages.easterEggMessages.length;
        
        const updateLoaderMessage = () => {
            const loaderTextEl = document.getElementById('loader-message');
            if (loaderTextEl && Messages.easterEggMessages.length > 0) {
                loaderTextEl.textContent = Messages.easterEggMessages[currentMessageIndex];
                currentMessageIndex = (currentMessageIndex + 1) % Messages.easterEggMessages.length;
            }
        };
        
        // Start rotating messages every 2 seconds
        messageInterval = setInterval(updateLoaderMessage, 2000);
    }
    
    /**
     * Hide the initial loader
     */
    function hideInitialLoader() {
        if (messageInterval) {
            clearInterval(messageInterval);
            messageInterval = null;
        }
        const loader = document.getElementById('initial-loader');
        if (loader) {
            loader.classList.add('hidden');
            setTimeout(() => {
                loader.style.display = 'none';
            }, 300);
        }
    }
    
    /**
     * Show error state
     */
    function showErrorState(message, retryCallback) {
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
    }
    
    /**
     * Setup offline detection
     */
    function setupOfflineDetection() {
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
    }
    
    /**
     * Initialize sign-in screen visibility
     */
    function initSignInScreen() {
        const signInScreen = document.getElementById('sign-in-screen');
        if (signInScreen) {
            const currentUserEmail = AppState.getCurrentUserEmail();
            if (!currentUserEmail) {
                signInScreen.classList.remove('hidden');
                document.querySelectorAll('.screen').forEach(screen => {
                    if (screen.id !== 'sign-in-screen') {
                        screen.classList.add('hidden');
                    }
                });
            }
        }
    }
    
    /**
     * Setup Google Sign-In button
     */
    function setupGoogleSignIn() {
        const googleSignInBtn = document.getElementById('google-sign-in-btn');
        if (!googleSignInBtn) return;
        
        // Remove any existing listeners
        const newBtn = googleSignInBtn.cloneNode(true);
        if (googleSignInBtn.parentNode) {
            googleSignInBtn.parentNode.replaceChild(newBtn, googleSignInBtn);
        } else {
            console.error('Google Sign-In button has no parent node');
            return;
        }
        
        newBtn.addEventListener('click', function() {
            if (typeof signInWithGoogle === 'function') {
                newBtn.classList.add('loading');
                newBtn.disabled = true;
                
                signInWithGoogle().catch(error => {
                    newBtn.classList.remove('loading');
                    newBtn.disabled = false;
                    if (typeof window.handleError === 'function') {
                        window.handleError(error, Messages.errors.signInFailed);
                    } else {
                        alert(Messages.errors.signInFailed);
                    }
                });
            } else {
                console.error('signInWithGoogle function not available');
                if (typeof window.handleError === 'function') {
                    window.handleError(new Error('Google Sign-In not available'), Messages.errors.signInNotAvailable);
                } else {
                    alert(Messages.errors.signInNotAvailable);
                }
            }
        });
        console.log('✓ Google Sign-In button event listener attached');
    }
    
    /**
     * Setup sign-out button
     */
    function setupSignOut() {
        const signOutBtn = document.getElementById('sign-out-btn');
        if (signOutBtn) {
            signOutBtn.addEventListener('click', function() {
                if (typeof signOut === 'function') {
                    signOut();
                }
            });
        }
    }
    
    /**
     * Load questions and handle errors
     */
    async function loadQuestions() {
        return new Promise((resolve) => {
            setTimeout(async () => {
                if (typeof autoLoadQuestions === 'function') {
                    try {
                        const loadedQuestions = await autoLoadQuestions();
                        if (loadedQuestions) {
                            window.examQuestions = loadedQuestions;
                            resolve(true);
                        } else if (typeof examQuestions === 'undefined') {
                            console.error('Failed to load questions. Please check that questions.js exists or JSON files are available.');
                            const cachedQuestions = localStorage.getItem('cached-questions');
                            if (cachedQuestions) {
                                try {
                                    window.examQuestions = JSON.parse(cachedQuestions);
                                    if (typeof window.showToast === 'function') {
                                        window.showToast(Messages.errors.questionsLoadFromCache, 'info');
                                    }
                                    resolve(true);
                                } catch (e) {
                                    console.error('Error loading cached questions:', e);
                                    resolve(false);
                                }
                            } else {
                                resolve(false);
                            }
                        } else {
                            resolve(true);
                        }
                    } catch (error) {
                        console.error('Error loading questions:', error);
                        const cachedQuestions = localStorage.getItem('cached-questions');
                        if (cachedQuestions) {
                            try {
                                window.examQuestions = JSON.parse(cachedQuestions);
                                if (typeof window.showToast === 'function') {
                                    window.showToast(Messages.errors.questionsLoadFromCacheError, 'warning');
                                }
                                resolve(true);
                            } catch (e) {
                                resolve(false);
                            }
                        } else {
                            resolve(false);
                        }
                    }
                } else {
                    console.error('autoLoadQuestions function not available');
                    setTimeout(() => resolve(true), 1000);
                }
            }, 200);
        });
    }
    
    /**
     * Setup question screen button event listeners
     */
    function setupQuestionScreenButtons() {
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
            
            // Next button
            const nextBtn = document.getElementById('next-btn');
            if (nextBtn) {
                nextBtn.removeAttribute('onclick');
                nextBtn.type = 'button';
                const newNextBtn = nextBtn.cloneNode(true);
                if (nextBtn.parentNode) {
                    nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
                } else {
                    console.error('Next button has no parent node');
                    return;
                }
                
                newNextBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof window.nextQuestion === 'function') {
                        window.nextQuestion();
                    } else if (typeof TestManager !== 'undefined' && TestManager.nextQuestion) {
                        TestManager.nextQuestion();
                    }
                });
            }
            
            // Mark question button
            document.addEventListener('click', (e) => {
                if (e.target.closest('#mark-btn')) {
                    e.preventDefault();
                    e.stopPropagation();
                    const markBtn = e.target.closest('#mark-btn');
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
            
            // Navbar toggle
            attachNavbarToggle();
            
            // Stats bar toggle
            const statsBarToggle = document.getElementById('stats-bar-toggle');
            const statsBarContainer = document.getElementById('stats-bar-container');
            
            if (statsBarToggle && statsBarContainer) {
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
    }
    
    /**
     * Attach navbar toggle listener
     */
    function attachNavbarToggle() {
        const navbarToggle = document.getElementById('navbar-toggle');
        if (!navbarToggle) {
            console.warn('Navbar toggle button not found on initial load, will retry');
            setTimeout(attachNavbarToggle, 500);
            return;
        }
        
        const newToggle = navbarToggle.cloneNode(true);
        if (navbarToggle.parentNode) {
            navbarToggle.parentNode.replaceChild(newToggle, navbarToggle);
        } else {
            console.error('Navbar toggle has no parent node');
            return;
        }
        newToggle.removeAttribute('onclick');
        newToggle.type = 'button';
        
        newToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (typeof window.toggleNavbar === 'function') {
                window.toggleNavbar();
            } else {
                console.error('toggleNavbar function not available');
            }
        });
        
        // Initialize icon state
        const questionGrid = document.getElementById('question-grid');
        if (questionGrid && newToggle) {
            const isCollapsed = questionGrid.classList.contains('collapsed');
            const arrowIcon = newToggle.querySelector('.navbar-toggle-arrow');
            const closeIcon = newToggle.querySelector('.navbar-toggle-close');
            
            if (arrowIcon && closeIcon) {
                if (isCollapsed) {
                    arrowIcon.classList.remove('hidden');
                    closeIcon.classList.add('hidden');
                } else {
                    arrowIcon.classList.add('hidden');
                    closeIcon.classList.remove('hidden');
                }
                newToggle.setAttribute('aria-expanded', !isCollapsed);
            }
        }
        
        console.log('✓ Navbar toggle button event listener attached');
    }
    
    /**
     * Final initialization checks
     */
    function finalizeInitialization() {
        setTimeout(() => {
            const currentUser = AppState.getCurrentUser();
            const currentUserEmail = AppState.getCurrentUserEmail();
            if (!currentUser && !currentUserEmail) {
                if (typeof showSignInScreen === 'function') {
                    showSignInScreen();
                } else {
                    const signInScreen = document.getElementById('sign-in-screen');
                    if (signInScreen) {
                        signInScreen.classList.remove('hidden');
                    }
                }
            }
            hideInitialLoader();
        }, 1000);
    }
    
    /**
     * Initialize the entire application
     */
    async function initialize() {
        console.log('🚀 Initializing AWS Lahavda Application...');
        
        // Initialize loader messages
        initLoaderMessages();
        
        // Setup offline detection
        setupOfflineDetection();
        
        // Initialize sign-in screen
        initSignInScreen();
        
        // Wait for Firebase initialization
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error('Error during initialization:', error);
        }
        
        // Initialize user system
        if (typeof UserManager !== 'undefined') {
            UserManager.initUserSystem();
        }
        
        // Setup authentication buttons
        setupGoogleSignIn();
        setupSignOut();
        
        // Load questions
        const questionsLoaded = await loadQuestions();
        if (!questionsLoaded) {
            showErrorState(Messages.errors.questionsLoadFailed, () => location.reload());
            return;
        }
        
        hideInitialLoader();
        
        // Expose state to window
        if (typeof AppState !== 'undefined' && AppState.exposeToWindow) {
            AppState.exposeToWindow();
        }
        
        // Setup question screen buttons
        setupQuestionScreenButtons();
        
        // Finalize
        finalizeInitialization();
        
        // Global offline mode function
        window.showOfflineMode = () => {
            hideInitialLoader();
            const signInScreen = document.getElementById('sign-in-screen');
            if (signInScreen) {
                signInScreen.classList.remove('hidden');
                if (typeof window.showToast === 'function') {
                    window.showToast(Messages.errors.offlineMode, 'info', 7000);
                }
            }
        };
        
        // Ensure toggleNavbar is available
        if (typeof window.toggleNavbar === 'undefined') {
            window.toggleNavbar = function() {
                const questionGrid = document.getElementById('question-grid');
                if (questionGrid) {
                    questionGrid.classList.toggle('collapsed');
                }
            };
        }
        
        console.log('✓ Application initialized');
    }
    
    return {
        initialize,
        hideInitialLoader,
        showErrorState
    };
})();
