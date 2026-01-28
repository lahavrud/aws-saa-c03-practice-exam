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
            
            // Update progress bar
            const progressBar = document.getElementById('progress');
            const progressPercentage = document.getElementById('progress-percentage');
            const progressBarContainer = document.querySelector('.progress-bar');
            if (progressBar && currentQuestions.length > 0) {
                const progressPercent = Math.round((answered / currentQuestions.length) * 100);
                progressBar.style.width = `${progressPercent}%`;
                if (progressBarContainer) {
                    progressBarContainer.setAttribute('aria-valuenow', progressPercent);
                }
                if (progressPercentage) {
                    progressPercentage.textContent = `${progressPercent}%`;
                    progressPercentage.setAttribute('aria-label', `Progress: ${progressPercent} percent complete`);
                }
            }
            
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
                if (domainCorrectCount) {
                    domainCorrectCount.textContent = correct;
                    domainCorrectCount.setAttribute('aria-label', `${correct} correct answers`);
                }
                if (domainIncorrectCount) {
                    domainIncorrectCount.textContent = incorrect;
                    domainIncorrectCount.setAttribute('aria-label', `${incorrect} incorrect answers`);
                }
                if (domainAccuracyPercent) {
                    domainAccuracyPercent.textContent = `${accuracy}%`;
                    domainAccuracyPercent.setAttribute('aria-label', `Accuracy: ${accuracy} percent`);
                }
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
                
                if (answeredEl) {
                    answeredEl.textContent = answered;
                    answeredEl.setAttribute('aria-label', `${answered} questions answered`);
                }
                if (remainingEl) {
                    const remaining = currentQuestions.length - answered;
                    remainingEl.textContent = remaining;
                    remainingEl.setAttribute('aria-label', `${remaining} questions remaining`);
                }
                if (markedEl) {
                    markedEl.textContent = markedQuestions.size;
                    markedEl.setAttribute('aria-label', `${markedQuestions.size} questions marked for review`);
                }
            }
        },
        
        // Show user settings dialog
        showUserSettings: () => {
            const currentUser = AppState.getCurrentUser();
            if (!currentUser) return;
            
            // Store trigger element before opening modal
            UI.previousFocus = document.activeElement;
            
            const dialog = document.getElementById('user-settings-dialog');
            const nameInput = document.getElementById('user-name-input');
            const questionsAnswered = document.getElementById('settings-questions-answered');
            const accuracy = document.getElementById('settings-accuracy');
            const testsCompleted = document.getElementById('settings-tests-completed');
            const domainsPracticed = document.getElementById('settings-domains-practiced');
            
            if (nameInput) {
                nameInput.value = currentUser.name || '';
                // Set up real-time validation
                UI.setupNameInputValidation(nameInput);
            }
            if (questionsAnswered) questionsAnswered.textContent = currentUser.stats.totalQuestionsAnswered;
            
            const acc = currentUser.stats.totalQuestionsAnswered > 0
                ? Math.round((currentUser.stats.totalCorrectAnswers / currentUser.stats.totalQuestionsAnswered) * 100)
                : 0;
            
            if (accuracy) accuracy.textContent = `${acc}%`;
            if (testsCompleted) testsCompleted.textContent = currentUser.stats.testsCompleted;
            if (domainsPracticed) domainsPracticed.textContent = currentUser.stats.domainsPracticed.size || 0;
            
            if (dialog) {
                dialog.classList.remove('hidden');
                // Focus management
                UI.trapFocus(dialog);
                // Move focus to first focusable element
                setTimeout(() => {
                    const firstFocusable = dialog.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                    if (firstFocusable) firstFocusable.focus();
                }, 100);
            }
        },
        
        // Set up real-time validation for name input
        setupNameInputValidation: (input) => {
            if (!input) return;
            
            const formGroup = input.closest('.form-group');
            const errorMsg = document.getElementById('user-name-error');
            const successMsg = document.getElementById('user-name-success');
            
            // Remove existing listeners by cloning
            const newInput = input.cloneNode(true);
            input.parentNode.replaceChild(newInput, input);
            
            // Validation function
            const validate = () => {
                const value = newInput.value.trim();
                const isValid = value.length >= 1 && value.length <= 50;
                
                if (formGroup) {
                    formGroup.classList.remove('has-error', 'has-success');
                    if (newInput.value.length > 0) {
                        if (isValid) {
                            formGroup.classList.add('has-success');
                            if (errorMsg) errorMsg.style.display = 'none';
                            if (successMsg) successMsg.style.display = 'block';
                        } else {
                            formGroup.classList.add('has-error');
                            if (errorMsg) errorMsg.style.display = 'block';
                            if (successMsg) successMsg.style.display = 'none';
                        }
                    } else {
                        if (errorMsg) errorMsg.style.display = 'none';
                        if (successMsg) successMsg.style.display = 'none';
                    }
                }
                
                return isValid;
            };
            
            // Validate on blur
            newInput.addEventListener('blur', validate);
            
            // Validate on input (real-time)
            newInput.addEventListener('input', () => {
                if (newInput.value.trim().length > 0) {
                    validate();
                } else {
                    if (formGroup) {
                        formGroup.classList.remove('has-error', 'has-success');
                    }
                    if (errorMsg) errorMsg.style.display = 'none';
                    if (successMsg) successMsg.style.display = 'none';
                }
            });
            
            // Update global reference
            window.userNameInput = newInput;
        },
        
        // Close user settings dialog
        closeUserSettings: () => {
            const dialog = document.getElementById('user-settings-dialog');
            if (dialog) {
                dialog.classList.add('hidden');
                // Return focus to settings button
                const settingsBtn = document.querySelector('.user-settings-btn');
                if (settingsBtn) {
                    UI.previousFocus = settingsBtn;
                }
                UI.releaseFocus();
            }
        },
        
        // Focus trap for modals
        trapFocus: (modal) => {
            const focusableElements = modal.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const firstFocusable = focusableElements[0];
            const lastFocusable = focusableElements[focusableElements.length - 1];
            
            // Store previous focus (the element that opened the modal)
            if (!UI.previousFocus) {
                UI.previousFocus = document.activeElement;
            }
            
            // Store modal reference for cleanup
            if (!UI.activeModal) {
                UI.activeModal = modal;
            }
            
            // Handle Tab key
            const trapHandler = function(e) {
                if (e.key !== 'Tab') return;
                
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusable) {
                        e.preventDefault();
                        lastFocusable.focus();
                    }
                } else {
                    if (document.activeElement === lastFocusable) {
                        e.preventDefault();
                        firstFocusable.focus();
                    }
                }
            };
            
            modal.addEventListener('keydown', trapHandler);
            
            // Store handler for cleanup
            modal._trapHandler = trapHandler;
            
            // Handle ESC key
            const escHandler = function(e) {
                if (e.key === 'Escape') {
                    if (modal.id === 'user-settings-dialog') {
                        UI.closeUserSettings();
                    } else if (modal.id === 'dashboard-dialog') {
                        UI.closeDashboardDialog();
                    } else if (modal.id === 'reset-confirmation-dialog') {
                        if (typeof window.closeResetConfirmation === 'function') {
                            window.closeResetConfirmation();
                        }
                    } else if (modal.id === 'about-us-modal') {
                        if (typeof window.closeAboutUs === 'function') {
                            window.closeAboutUs();
                        }
                    }
                }
            };
            
            modal.addEventListener('keydown', escHandler);
            modal._escHandler = escHandler;
        },
        
        // Release focus trap and return focus
        releaseFocus: () => {
            // Remove event listeners from modal
            if (UI.activeModal) {
                if (UI.activeModal._trapHandler) {
                    UI.activeModal.removeEventListener('keydown', UI.activeModal._trapHandler);
                    delete UI.activeModal._trapHandler;
                }
                if (UI.activeModal._escHandler) {
                    UI.activeModal.removeEventListener('keydown', UI.activeModal._escHandler);
                    delete UI.activeModal._escHandler;
                }
                UI.activeModal = null;
            }
            
            // Return focus to previous element
            if (UI.previousFocus && typeof UI.previousFocus.focus === 'function') {
                // Use setTimeout to ensure modal is fully closed
                setTimeout(() => {
                    try {
                        UI.previousFocus.focus();
                    } catch (e) {
                        // Element may no longer be in DOM, focus body instead
                        document.body.focus();
                    }
                }, 100);
            }
            UI.previousFocus = null;
        },
        
        // Save user settings
        saveUserSettings: () => {
            // Use global reference if available, otherwise get by ID
            const nameInput = window.userNameInput || document.getElementById('user-name-input');
            if (!nameInput) return;
            
            const newName = nameInput.value.trim();
            const currentUser = AppState.getCurrentUser();
            
            // Validate name
            const formGroup = nameInput.closest('.form-group');
            if (!newName || newName.length < 1 || newName.length > 50) {
                if (formGroup) {
                    formGroup.classList.add('has-error');
                    formGroup.classList.remove('has-success');
                }
                const errorMsg = document.getElementById('user-name-error');
                const successMsg = document.getElementById('user-name-success');
                if (errorMsg) errorMsg.style.display = 'block';
                if (successMsg) successMsg.style.display = 'none';
                
                // Focus on input
                nameInput.focus();
                
                if (typeof window.showToast === 'function') {
                    window.showToast('Please enter a valid name (1-50 characters).', 'error');
                } else {
                    alert('Please enter a valid name (1-50 characters).');
                }
                return;
            }
            
            if (formGroup) {
                formGroup.classList.remove('has-error');
                formGroup.classList.add('has-success');
            }
            
            const errorMsg = document.getElementById('user-name-error');
            const successMsg = document.getElementById('user-name-success');
            if (errorMsg) errorMsg.style.display = 'none';
            if (successMsg) successMsg.style.display = 'block';
            
            if (newName && newName !== currentUser.name) {
                currentUser.name = newName;
                UserManager.saveUser();
                Stats.updateDashboard();
                
                if (typeof window.showToast === 'function') {
                    window.showToast('Settings saved successfully!', 'success');
                }
            } else {
                if (typeof window.showToast === 'function') {
                    window.showToast('No changes to save.', 'info');
                }
            }
            
            // Clear success state after a delay
            setTimeout(() => {
                if (formGroup) {
                    formGroup.classList.remove('has-success');
                }
                if (successMsg) successMsg.style.display = 'none';
            }, 3000);
            
            UI.closeUserSettings();
        },
        
        // Show dashboard dialog
        showDashboardDialog: () => {
            // Store trigger element before opening modal
            UI.previousFocus = document.activeElement;
            
            const dialog = document.getElementById('dashboard-dialog');
            if (dialog) {
                dialog.classList.remove('hidden');
                UI.trapFocus(dialog);
                setTimeout(() => {
                    const firstFocusable = dialog.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                    if (firstFocusable) firstFocusable.focus();
                }, 100);
            }
        },
        
        // Close dashboard dialog
        closeDashboardDialog: () => {
            const dialog = document.getElementById('dashboard-dialog');
            if (dialog) {
                dialog.classList.add('hidden');
                // Return focus to dashboard button
                const dashboardBtn = document.querySelector('.dashboard-btn');
                if (dashboardBtn) {
                    UI.previousFocus = dashboardBtn;
                }
                UI.releaseFocus();
            }
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
