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
                if (typeof Stats !== 'undefined' && Stats.updateDashboard) {
                Stats.updateDashboard();
            }
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
        performReset: async () => {
            const currentUser = AppState.getCurrentUser();
            const currentUserEmail = AppState.getCurrentUserEmail();
            
            if (!currentUser || !currentUserEmail) return;
            
            // Get userName, ensuring it's not undefined
            const userName = currentUser.name || currentUser.displayName || currentUserEmail.split('@')[0] || 'User';
            const resetUser = {
                name: userName,
                displayName: currentUser.displayName || userName,
                email: currentUserEmail,
                createdAt: currentUser.createdAt || new Date().toISOString(),
                stats: {
                    totalQuestionsAnswered: 0,
                    totalCorrectAnswers: 0,
                    testsCompleted: 0,
                    domainsPracticed: new Set(),
                    questionsAnswered: new Set(),
                    lastActivity: new Date().toISOString()
                }
            };
            
            // Set the reset flag FIRST to prevent any syncing during the reset process
            if (typeof AppState !== 'undefined' && AppState.setResetJustPerformed) {
                AppState.setResetJustPerformed(true);
                console.log('Reset flag set - preventing progress sync during reset');
            }
            
            // Clear all saved progress for current user from localStorage FIRST
            // Need to clear both old format keys and Firestore-synced keys (which use document IDs)
            const userKey = UserManager.getUserKeyFromEmail(currentUserEmail);
            const keysToRemove = [];
            
            // First, get all progress keys that might exist (old format and Firestore format)
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (!key) continue;
                
                // Old format: saa-c03-progress-{userKey}-test{num} or saa-c03-progress-{userKey}-domain-{domain}
                if (key.startsWith(`${Config.STORAGE_KEYS.PROGRESS_PREFIX}${userKey}-test`) ||
                    key.startsWith(`${Config.STORAGE_KEYS.PROGRESS_PREFIX}${userKey}-domain-`) ||
                    key === `${Config.STORAGE_KEYS.CURRENT_PROGRESS_PREFIX}${userKey}`) {
                    keysToRemove.push(key);
                }
                
                // Firestore format: document IDs that contain userEmail
                // Check if this key contains progress data for this user
                try {
                    const value = localStorage.getItem(key);
                    if (value) {
                        const parsed = JSON.parse(value);
                        // If it has userEmail matching current user, or if it's a progress document
                        if ((parsed.userEmail === currentUserEmail) || 
                            (parsed.test && parsed.userEmail === currentUserEmail) ||
                            (parsed.selectedDomain && parsed.userEmail === currentUserEmail) ||
                            (key.includes('progress') && parsed.userEmail === currentUserEmail)) {
                            keysToRemove.push(key);
                        }
                    }
                } catch (e) {
                    // Not JSON, skip
                }
            }
            
            // Remove duplicates
            const uniqueKeys = [...new Set(keysToRemove)];
            uniqueKeys.forEach(key => localStorage.removeItem(key));
            console.log(`✓ Cleared ${uniqueKeys.length} progress items from localStorage`);
            
            // Update user data - ensure Sets are properly initialized
            const resetUserWithSets = {
                ...resetUser,
                stats: {
                    ...resetUser.stats,
                    domainsPracticed: new Set(),
                    questionsAnswered: new Set()
                }
            };
            AppState.setCurrentUser(resetUserWithSets);
            
            // Save the reset user data to localStorage FIRST (before Firestore operations)
            const userKeyForStorage = currentUserEmail.toLowerCase().replace(/[^a-z0-9@.-]/g, '-');
            const userToSave = {
                ...resetUserWithSets,
                stats: {
                    ...resetUserWithSets.stats,
                    domainsPracticed: Array.from(resetUserWithSets.stats.domainsPracticed || []),
                    questionsAnswered: Array.from(resetUserWithSets.stats.questionsAnswered || [])
                }
            };
            localStorage.setItem(`${Config.STORAGE_KEYS.USER_PREFIX}${userKeyForStorage}`, JSON.stringify(userToSave));
            
            // Delete from Firestore and reset user data there
            // IMPORTANT: Do this BEFORE any dashboard navigation to ensure deletion completes
            if (typeof window.deleteAllProgressFromFirestore === 'function' && 
                typeof window.isFirebaseAvailable === 'function' && 
                window.isFirebaseAvailable()) {
                try {
                    console.log('Deleting all progress from Firestore...');
                    const deleteResult = await window.deleteAllProgressFromFirestore(currentUserEmail);
                    if (deleteResult) {
                        console.log('✓ Successfully deleted all progress from Firestore');
                    } else {
                        console.warn('⚠ Failed to delete progress from Firestore');
                    }
                } catch (error) {
                    console.error('Error deleting progress from Firestore:', error);
                    // Continue even if Firestore fails
                }
            }
            
            if (typeof window.deleteUserDataFromFirestore === 'function' && 
                typeof window.isFirebaseAvailable === 'function' && 
                window.isFirebaseAvailable()) {
                try {
                    console.log('Resetting user data in Firestore...');
                    const resetResult = await window.deleteUserDataFromFirestore(currentUserEmail);
                    if (resetResult) {
                        console.log('✓ Successfully reset user data in Firestore');
                    } else {
                        console.warn('⚠ Failed to reset user data in Firestore');
                    }
                } catch (error) {
                    console.error('Error resetting user data in Firestore:', error);
                    // Continue even if Firestore fails
                }
            }
            
            // Save the reset user data to Firestore immediately (not queued)
            // This ensures Firestore has the reset stats before any sync happens
            // IMPORTANT: Save AFTER deletion to ensure reset stats are saved
            // Use deleteUserDataFromFirestore which already resets the stats, then we don't need to save again
            // But we'll also save via the normal path to ensure consistency
            
            // deleteUserDataFromFirestore already resets the user stats in Firestore
            // So we just need to make sure it completed, then save via normal path as backup
            if (typeof saveUserToFirestore === 'function' && typeof isFirebaseAvailable === 'function' && isFirebaseAvailable()) {
                try {
                    // Save the reset user data (this will queue it, but we'll flush immediately)
                    saveUserToFirestore(userToSave, currentUserEmail);
                    // Wait a bit for the queue to populate, then flush
                    await new Promise(resolve => setTimeout(resolve, 300));
                    // Try to flush the queue if available
                    if (typeof window.flushSaveQueue === 'function') {
                        await window.flushSaveQueue();
                        console.log('✓ Reset user data saved to Firestore');
                    }
                } catch (error) {
                    console.error('Error saving reset user data to Firestore:', error);
                }
            }
            
            // Also use UserManager.saveUser() to ensure it's saved via the normal path
            UserManager.saveUser();
            
            // Verify deletion worked by checking Firestore
            if (typeof window.db !== 'undefined' && typeof isFirebaseAvailable === 'function' && isFirebaseAvailable()) {
                try {
                    await new Promise(resolve => setTimeout(resolve, 500)); // Wait a bit for deletion to propagate
                    const verifySnapshot = await window.db.collection('progress')
                        .where('userEmail', '==', currentUserEmail)
                        .limit(1)
                        .get();
                    if (verifySnapshot.empty) {
                        console.log('✓ Verification: No progress documents found in Firestore (deletion successful)');
                    } else {
                        console.warn(`⚠ Verification: Found ${verifySnapshot.size} progress document(s) still in Firestore after deletion`);
                        // Try to delete again if found
                        if (typeof window.deleteAllProgressFromFirestore === 'function') {
                            console.log('Retrying deletion of remaining progress...');
                            await window.deleteAllProgressFromFirestore(currentUserEmail);
                        }
                    }
                } catch (error) {
                    console.warn('Could not verify deletion:', error);
                }
            }
            
            // Keep the reset flag set for 10 seconds to ensure dashboard loads without syncing
            // Clear the flag after enough time for the dashboard to fully load
            setTimeout(() => {
                if (AppState.setResetJustPerformed) {
                    AppState.setResetJustPerformed(false);
                    console.log('Reset flag cleared - future syncs will proceed normally');
                }
            }, 10000);
            
            // Force update dashboard without recalculating (to show reset stats)
            // DO NOT call recalculateUserStats() - it would recalculate from saved progress
            // We want to keep the reset values (all zeros)
            if (typeof Stats !== 'undefined' && Stats.updateDashboard) {
                if (typeof Stats !== 'undefined' && Stats.updateDashboard) {
                Stats.updateDashboard();
            }
            }
            
            UI.closeUserSettings();
            
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
            
            // Reload dashboard if on main screen (but don't sync progress - we just deleted it)
            if (typeof Navigation !== 'undefined' && Navigation.showMainScreen) {
                // Refresh the dashboard to show updated state
                // Note: We don't sync progress here because we just deleted it
                setTimeout(() => {
                    if (typeof ResumeManager !== 'undefined' && ResumeManager.loadDashboardContent) {
                        ResumeManager.loadDashboardContent();
                    }
                    if (typeof TestManager !== 'undefined' && TestManager.loadAllTestsOnDashboard) {
                        TestManager.loadAllTestsOnDashboard();
                    }
                    if (typeof Insights !== 'undefined' && Insights.displayInsights) {
                        Insights.displayInsights();
                    }
                }, 500);
            }
        },
        
        // Mark test as completed
        markTestCompleted: () => {
            const currentUser = AppState.getCurrentUser();
            if (!currentUser) return;
            currentUser.stats.testsCompleted++;
            UserManager.saveUser();
            if (typeof Stats !== 'undefined' && Stats.updateDashboard) {
                Stats.updateDashboard();
            }
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
