// User Management Module
const UserManager = (function() {
    'use strict';
    
    // Dependencies
    const getUserKey = (userName) => {
        return userName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    };
    
    return {
        // Get user key from email or username
        getUserKeyFromEmail: (email) => {
            return email.toLowerCase().replace(/[^a-z0-9@.-]/g, '-');
        },
        
        getUserKey: getUserKey,
        
        // Get all users (legacy compatibility)
        getAllUsers: () => {
            const usersJson = localStorage.getItem(Config.STORAGE_KEYS.USERS_LIST);
            return usersJson ? JSON.parse(usersJson) : [];
        },
        
        // Get user data
        getUserData: (userName) => {
            const userKey = getUserKey(userName);
            const savedUser = localStorage.getItem(`${Config.STORAGE_KEYS.USER_PREFIX}${userKey}`);
            return savedUser ? JSON.parse(savedUser) : null;
        },
        
        // Save user
        saveUser: () => {
            const currentUser = AppState.getCurrentUser();
            const currentUserName = AppState.getCurrentUserName();
            const currentUserEmail = AppState.getCurrentUserEmail();
            
            if (!currentUser || !currentUserEmail) return;
            
            // Convert Sets to Arrays for JSON storage
            const userToSave = {
                ...currentUser,
                stats: {
                    ...currentUser.stats,
                    domainsPracticed: Array.from(currentUser.stats.domainsPracticed || []),
                    questionsAnswered: Array.from(currentUser.stats.questionsAnswered || [])
                }
            };
            
            const userKey = currentUserEmail.toLowerCase().replace(/[^a-z0-9@.-]/g, '-');
            
            // Save to localStorage (always, as backup)
            localStorage.setItem(`${Config.STORAGE_KEYS.USER_PREFIX}${userKey}`, JSON.stringify(userToSave));
            
            // Save to Firestore if available
            if (typeof saveUserToFirestore === 'function' && typeof isFirebaseAvailable === 'function' && isFirebaseAvailable()) {
                saveUserToFirestore(userToSave, currentUserEmail);
            }
        },
        
        // Set current user (called from firebase-db.js)
        setCurrentUser: (userData, email) => {
            console.log('setCurrentUser called with:', { email, userData });
            
            AppState.setCurrentUser(userData);
            AppState.setCurrentUserEmail(email);
            const userName = userData.name || userData.displayName || email.split('@')[0];
            AppState.setCurrentUserName(userName);
            
            // Update global window variables for backward compatibility
            window.currentUserName = userName;
            window.currentUserEmail = email;
            
            // Ensure stats exist
            if (!userData.stats) {
                userData.stats = {
                    totalQuestionsAnswered: 0,
                    totalCorrectAnswers: 0,
                    testsCompleted: 0,
                    domainsPracticed: new Set(),
                    questionsAnswered: new Set(),
                    lastActivity: new Date().toISOString()
                };
            }
            
            // Show main screen
            Navigation.showMainScreen();
            if (typeof Stats !== 'undefined' && Stats.updateDashboard) {
                Stats.updateDashboard();
            }
        },
        
        // Initialize user system
        initUserSystem: () => {
            if (typeof isFirebaseInitialized === 'function' && isFirebaseInitialized()) {
                console.log('Firebase initialized - using Google Sign-In');
            }
        },
        
        // Reset user data
        resetUserData: () => {
            // Show confirmation modal
            const dialog = document.getElementById('reset-confirmation-dialog');
            const input = document.getElementById('reset-confirm-input');
            const confirmBtn = document.getElementById('reset-confirm-btn');
            
            if (dialog && input && confirmBtn) {
                dialog.classList.remove('hidden');
                input.value = '';
                confirmBtn.disabled = true;
                
                // Focus on input
                setTimeout(() => {
                    input.focus();
                }, 100);
                
                // Enable/disable confirm button based on input
                input.addEventListener('input', function() {
                    confirmBtn.disabled = input.value !== 'DELETE';
                });
                
                // Handle Enter key
                input.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter' && input.value === 'DELETE') {
                        confirmResetProgress();
                    }
                });
                
                // Store trigger element
                if (typeof UI !== 'undefined') {
                    UI.previousFocus = document.activeElement;
                }
                
                // Trap focus
                if (typeof UI !== 'undefined' && UI.trapFocus) {
                    UI.trapFocus(dialog);
                }
            } else {
                // Fallback to prompt if modal not found
                const confirmText = 'DELETE';
                const userInput = prompt(`⚠️ WARNING: This will permanently delete ALL your progress data.\n\nThis action cannot be undone.\n\nType "${confirmText}" to confirm:`);
                
                if (userInput !== confirmText) {
                    if (userInput !== null) {
                        if (typeof window.showToast === 'function') {
                            window.showToast('Reset cancelled. Progress data was not deleted.', 'warning');
                        } else {
                            alert('Reset cancelled. Progress data was not deleted.');
                        }
                    }
                    return;
                }
                
                // Continue with reset if confirmed
                UserManager.performReset();
            }
        },
        
        // Perform the actual reset (called after confirmation)
        performReset: () => {
            const currentUser = AppState.getCurrentUser();
            const currentUserEmail = AppState.getCurrentUserEmail();
            
            if (!currentUser || !currentUserEmail) return;
            
            const userName = currentUser.name;
            const resetUser = {
                name: userName,
                createdAt: new Date().toISOString(),
                stats: {
                    totalQuestionsAnswered: 0,
                    totalCorrectAnswers: 0,
                    testsCompleted: 0,
                    domainsPracticed: new Set(),
                    questionsAnswered: new Set(),
                    lastActivity: new Date().toISOString()
                }
            };
            
            AppState.setCurrentUser(resetUser);
            UserManager.saveUser();
            Stats.updateDashboard();
            UI.closeUserSettings();
            
            // Clear all saved progress for current user
            const userKey = UserManager.getUserKeyFromEmail(currentUserEmail);
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (
                    key.startsWith(`${Config.STORAGE_KEYS.PROGRESS_PREFIX}${userKey}-test`) ||
                    key.startsWith(`${Config.STORAGE_KEYS.PROGRESS_PREFIX}${userKey}-domain-`) ||
                    key === `${Config.STORAGE_KEYS.CURRENT_PROGRESS_PREFIX}${userKey}`
                )) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
            
            // Reset current state
            AppState.resetTestState();
            
            // Show success message
            if (typeof window.showToast === 'function') {
                window.showToast('All progress data has been reset successfully.', 'success');
            } else {
                alert('All progress data has been reset successfully.');
            }
            
            // Reload test buttons if on test selection screen
            if (AppState.getSelectedSource()) {
                TestManager.loadAvailableTests();
            }
        },
        
        // Mark test as completed
        markTestCompleted: () => {
            const currentUser = AppState.getCurrentUser();
            if (!currentUser) return;
            currentUser.stats.testsCompleted++;
            UserManager.saveUser();
            Stats.updateDashboard();
        },
        
        // Export user data
        exportUserData: () => {
            try {
                const exportData = {
                    version: '1.0',
                    exportDate: new Date().toISOString(),
                    users: [],
                    userData: {},
                    progress: {}
                };
                
                const users = UserManager.getAllUsers();
                exportData.users = users;
                
                users.forEach(userName => {
                    const userKey = UserManager.getUserKey(userName);
                    const userData = UserManager.getUserData(userName);
                    
                    if (userData) {
                        exportData.userData[userName] = {
                            ...userData,
                            stats: {
                                ...userData.stats,
                                domainsPracticed: Array.from(userData.stats.domainsPracticed || []),
                                questionsAnswered: Array.from(userData.stats.questionsAnswered || [])
                            }
                        };
                    }
                    
                    exportData.progress[userName] = {};
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key && (
                            key.startsWith(`${Config.STORAGE_KEYS.PROGRESS_PREFIX}${userKey}-test`) ||
                            key.startsWith(`${Config.STORAGE_KEYS.PROGRESS_PREFIX}${userKey}-domain-`) ||
                            key === `${Config.STORAGE_KEYS.CURRENT_PROGRESS_PREFIX}${userKey}`
                        )) {
                            const value = localStorage.getItem(key);
                            if (value) {
                                exportData.progress[userName][key] = value;
                            }
                        }
                    }
                });
                
                const dataStr = JSON.stringify(exportData, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `aws-saa-c03-backup-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                
                alert('User data exported successfully! Save this file to sync across browsers.');
            } catch (error) {
                console.error('Error exporting user data:', error);
                alert('Error exporting user data: ' + error.message);
            }
        },
        
        // Import user data
        importUserData: () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            
            input.onchange = function(e) {
                const file = e.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        const importData = JSON.parse(e.target.result);
                        
                        if (!importData.version || !importData.users || !importData.userData) {
                            throw new Error('Invalid backup file format');
                        }
                        
                        const userCount = importData.users.length;
                        if (!confirm(`This will import ${userCount} user(s) and their progress. Existing data will be merged. Continue?`)) {
                            return;
                        }
                        
                        const existingUsers = UserManager.getAllUsers();
                        const newUsers = importData.users.filter(u => !existingUsers.includes(u));
                        if (newUsers.length > 0) {
                            existingUsers.push(...newUsers);
                            window.saveUsersList(existingUsers);
                        }
                        
                        Object.keys(importData.userData).forEach(userName => {
                            const userData = importData.userData[userName];
                            const userKey = UserManager.getUserKey(userName);
                            
                            if (userData.stats) {
                                if (Array.isArray(userData.stats.domainsPracticed)) {
                                    userData.stats.domainsPracticed = new Set(userData.stats.domainsPracticed);
                                }
                                if (Array.isArray(userData.stats.questionsAnswered)) {
                                    userData.stats.questionsAnswered = new Set(userData.stats.questionsAnswered);
                                }
                            }
                            
                            localStorage.setItem(`${Config.STORAGE_KEYS.USER_PREFIX}${userKey}`, JSON.stringify({
                                ...userData,
                                stats: {
                                    ...userData.stats,
                                    domainsPracticed: Array.from(userData.stats.domainsPracticed || []),
                                    questionsAnswered: Array.from(userData.stats.questionsAnswered || [])
                                }
                            }));
                        });
                        
                        Object.keys(importData.progress).forEach(userName => {
                            const userProgress = importData.progress[userName];
                            Object.keys(userProgress).forEach(key => {
                                localStorage.setItem(key, userProgress[key]);
                            });
                        });
                        
                        alert(`Successfully imported ${userCount} user(s)! Please refresh the page to see your data.`);
                        location.reload();
                    } catch (error) {
                        console.error('Error importing user data:', error);
                        alert('Error importing user data: ' + error.message);
                    }
                };
                
                reader.readAsText(file);
            };
            
            input.click();
        }
    };
})();

// Make functions globally accessible for backward compatibility
window.getAllUsers = UserManager.getAllUsers;
window.getUserKey = UserManager.getUserKey;
window.getUserData = UserManager.getUserData;
window.setCurrentUser = UserManager.setCurrentUser;
