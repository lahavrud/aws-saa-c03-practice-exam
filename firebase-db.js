// Firebase Database Integration - Optimized for minimal reads/writes
// Database-first approach with intelligent caching and batching

// Suppress harmless Cross-Origin-Opener-Policy warnings from Firebase popup
// These warnings are harmless and appear in some browsers due to COOP headers
const originalWarn = console.warn;
const originalError = console.error;
const originalLog = console.log;

// Suppress COOP warnings from all console methods
function shouldSuppressCOOPWarning(message) {
    return message.includes('Cross-Origin-Opener-Policy') || 
           message.includes('COOP') ||
           message.includes('window.closed call') ||
           message.includes('popup.ts') ||
           (message.includes('policy would block') && message.includes('window'));
}

console.warn = function(...args) {
    const message = args.join(' ');
    if (shouldSuppressCOOPWarning(message)) {
        // Suppress harmless Firebase popup warnings
        return;
    }
    originalWarn.apply(console, args);
};

console.error = function(...args) {
    const message = args.join(' ');
    if (shouldSuppressCOOPWarning(message)) {
        // Suppress harmless Firebase popup warnings
        return;
    }
    originalError.apply(console, args);
};

// Also suppress from console.log for consistency
console.log = function(...args) {
    const message = args.join(' ');
    if (shouldSuppressCOOPWarning(message)) {
        // Suppress harmless Firebase popup warnings
        return;
    }
    originalLog.apply(console, args);
};

let firebaseInitialized = false;
let db = null;
let auth = null;
let currentUserId = null; // Keep for auth, but use username for data
// Note: currentUserName is declared in app.js - don't redeclare here

// Debouncing and batching
let saveQueue = new Map();
let saveTimeout = null;
const SAVE_DEBOUNCE_MS = 2000; // Batch saves every 2 seconds
let localCache = {
    users: null,
    userData: new Map(),
    progress: new Map(),
    lastSync: {}
};

// Initialize Firebase
function initFirebase() {
    if (firebaseInitialized) {
        return;
    }
    
    if (typeof firebaseConfig === 'undefined') {
        console.warn('Firebase config not found. Using localStorage only.');
        return;
    }
    
    if (typeof firebase === 'undefined') {
        console.warn('Firebase SDK not loaded. Using localStorage only.');
        return;
    }
    
    try {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        auth = firebase.auth();
        firebaseInitialized = true;
        
        console.log('✓ Firebase initialized');
        
        // Set up Google Sign-In provider
        const googleProvider = new firebase.auth.GoogleAuthProvider();
        window.googleProvider = googleProvider; // Make globally accessible
        
        // Listen for auth state changes
        auth.onAuthStateChanged(user => {
            if (user) {
                currentUserId = user.uid;
                const userEmail = user.email;
                console.log('✓ User authenticated:', userEmail);
                
                // Update current user email
                if (typeof window !== 'undefined') {
                    window.currentUserEmail = userEmail;
                }
                
                // Initialize user data for this email
                initializeUserForEmail(userEmail, user.displayName || userEmail.split('@')[0]);
                
                // One-time sync on auth
                syncLocalToFirestoreOnce();
            } else {
                currentUserId = null;
                if (typeof window !== 'undefined') {
                    window.currentUserEmail = null;
                }
                // Show sign-in screen when not authenticated
                showSignInScreen();
            }
        });
        
        // Handle redirect result if user came back from Google sign-in
        handleAuthRedirect();
        
        // Check initial auth state and show appropriate screen
        // Use a longer timeout to ensure DOM is ready on GitHub Pages
        setTimeout(() => {
            if (!auth.currentUser) {
                showSignInScreen();
            }
        }, 500);
    } catch (error) {
        console.error('Firebase initialization error:', error);
    }
}

// Auto-initialize when DOM is ready
// Use multiple initialization strategies for GitHub Pages compatibility
function initializeFirebaseWhenReady() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initFirebase, 100);
        });
    } else {
        setTimeout(initFirebase, 100);
    }
    
    // Also try immediate initialization as fallback
    if (typeof firebase !== 'undefined' && typeof firebaseConfig !== 'undefined') {
        initFirebase();
    }
}

initializeFirebaseWhenReady();

// Additional fallback: show sign-in screen if Firebase fails to initialize
setTimeout(() => {
    if (!firebaseInitialized && typeof firebaseConfig !== 'undefined') {
        console.warn('Firebase initialization may have failed, showing sign-in screen');
        showSignInScreen();
    } else if (!firebaseInitialized) {
        // No Firebase config, show sign-in screen anyway
        console.log('No Firebase config found, showing sign-in screen');
        showSignInScreen();
    }
}, 1000);

// One-time sync: Check Firestore first, only sync FROM Firestore TO localStorage
// This keeps Firestore as source of truth and prevents localStorage from overwriting clean Firestore
async function syncLocalToFirestoreOnce() {
    if (!auth.currentUser || localCache.lastSync.initial) return;
    
    // Wait for modules to be available
    if (typeof UserManager === 'undefined' || typeof UserManager.getAllUsers === 'undefined') {
        return;
    }
    
    try {
        // With email-based auth, sync current user's data from Firestore
        const userEmail = auth.currentUser.email;
        if (!userEmail) {
            localCache.lastSync.initial = true;
            return;
        }
        
        // Get user data from Firestore using email as key
        const userKey = userEmail.toLowerCase().replace(/[^a-z0-9@.-]/g, '-');
        const userDoc = await db.collection('users').doc(userKey).get();
        
        if (userDoc.exists) {
            const firestoreUserData = userDoc.data();
            
            // Convert arrays to Sets for runtime
            if (Array.isArray(firestoreUserData.stats?.domainsPracticed)) {
                firestoreUserData.stats.domainsPracticed = new Set(firestoreUserData.stats.domainsPracticed);
            }
            if (Array.isArray(firestoreUserData.stats?.questionsAnswered)) {
                firestoreUserData.stats.questionsAnswered = new Set(firestoreUserData.stats.questionsAnswered);
            }
            
            // Update localStorage with Firestore data
            localStorage.setItem(`saa-c03-user-${userKey}`, JSON.stringify({
                ...firestoreUserData,
                stats: {
                    ...firestoreUserData.stats,
                    domainsPracticed: Array.from(firestoreUserData.stats.domainsPracticed || []),
                    questionsAnswered: Array.from(firestoreUserData.stats.questionsAnswered || [])
                }
            }));
            
            localCache.lastSync.initial = true;
            console.log('✓ Synced user data from Firestore');
        } else {
            // No Firestore data yet - will be created when user saves data
            localCache.lastSync.initial = true;
        }
        
    } catch (error) {
        // Handle permissions errors gracefully (expected for disabled collections)
        if (error.code === 'permission-denied' || error.message?.includes('permissions')) {
            // This is expected - userList collection is disabled, which is fine
            localCache.lastSync.initial = true;
        } else {
            console.error('Error in sync check:', error);
            localCache.lastSync.initial = true; // Mark as attempted to prevent retries
        }
    }
}

// Legacy function removed - userList collection is disabled with email-based auth

// Optimized: Load single user with caching
async function loadUserFromFirestore(userName) {
    if (!isFirebaseAvailable()) return null;
    
    // Update current username (use window to access app.js variable)
    if (typeof window !== 'undefined') {
        window.currentUserName = userName;
    }
    
    const userKey = getUserKey(userName);
    
    // Return cached if recent (within 1 minute)
    if (localCache.userData.has(userKey)) {
        const cached = localCache.userData.get(userKey);
        if (Date.now() - cached.timestamp < 60000) {
            return cached.data;
        }
    }
    
    try {
        const doc = await db.collection('users').doc(userKey).get();
        if (doc.exists) {
            const data = doc.data();
            // Convert arrays to Sets
            if (data.stats) {
                if (Array.isArray(data.stats.domainsPracticed)) {
                    data.stats.domainsPracticed = new Set(data.stats.domainsPracticed);
                }
                if (Array.isArray(data.stats.questionsAnswered)) {
                    data.stats.questionsAnswered = new Set(data.stats.questionsAnswered);
                }
            }
            
            // Cache it
            localCache.userData.set(userKey, {
                data: data,
                timestamp: Date.now()
            });
            
            return data;
        }
    } catch (error) {
        console.error('Error loading user from Firestore:', error);
    }
    
    return null;
}

// Helper: Extract userKey from progressKey format
function getUserKeyFromProgressKey(progressKey) {
    // Format: saa-c03-progress-{userKey}-test{num} or saa-c03-progress-{userKey}-domain-{domain}
    const match = progressKey.match(/saa-c03-progress-([^-]+(?:-[^-]+)*?)-(?:test|domain)/);
    return match ? match[1] : null;
}

// Helper: Get userKey from userName (uses app.js function if available)
// Note: This is a wrapper - actual function is in app.js
function getUserKey(userName) {
    // Use UserManager if available, otherwise fallback
    if (typeof UserManager !== 'undefined' && typeof UserManager.getUserKey === 'function') {
        return UserManager.getUserKey(userName);
    }
    // Fallback if modules not loaded yet
    return userName.toLowerCase().replace(/[^a-z0-9]/g, '-');
}

// Optimized: Debounced batch save
function queueSave(collection, docId, data, userName = null) {
    if (!isFirebaseAvailable()) return;
    
    const key = `${collection}/${docId}`;
    saveQueue.set(key, { collection, docId, data, userName });
    
    // Clear existing timeout
    if (saveTimeout) {
        clearTimeout(saveTimeout);
    }
    
    // Set new timeout for batch save
    saveTimeout = setTimeout(() => {
        flushSaveQueue();
    }, SAVE_DEBOUNCE_MS);
}

// Flush all queued saves in a single batch
async function flushSaveQueue() {
    if (saveQueue.size === 0 || !isFirebaseAvailable()) return;
    
    try {
        const batch = db.batch();
        const updates = [];
        
        for (const [key, { collection, docId, data, userName }] of saveQueue.entries()) {
            const ref = db.collection(collection).doc(docId);
            // Use email as identifier for Google Sign-In (for security rules)
            const userEmail = auth.currentUser?.email || data.email || data.userEmail || window.currentUserEmail;
            
            // Ensure email is in data for security rules
            const dataWithEmail = {
                ...data,
                email: userEmail || data.email,
                userEmail: userEmail || data.userEmail,
                syncedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            batch.set(ref, dataWithEmail, { merge: true });
            updates.push(key);
        }
        
        await batch.commit();
        saveQueue.clear();
        saveTimeout = null;
        
        // Update cache
        updates.forEach(key => {
            const [collection, docId] = key.split('/');
            if (collection === 'users') {
                localCache.userData.delete(docId);
            } else if (collection === 'progress') {
                localCache.progress.delete(docId);
            }
        });
        
        console.log(`✓ Batched ${updates.length} writes to Firestore`);
    } catch (error) {
        console.error('Error flushing save queue:', error);
        saveQueue.clear();
        saveTimeout = null;
    }
}

// Optimized: Save user data (debounced)
function saveUserToFirestore(userData, userName) {
    if (!isFirebaseAvailable()) return;
    
    // Update current username for cross-browser sync (use window to access app.js variable)
    if (typeof window !== 'undefined') {
        window.currentUserName = userName;
    }
    
    const userKey = getUserKey(userName);
    const dataToSave = {
        ...userData,
        userName: userName, // Store username in data for reference
        stats: {
            ...userData.stats,
            domainsPracticed: Array.from(userData.stats.domainsPracticed || []),
            questionsAnswered: Array.from(userData.stats.questionsAnswered || [])
        }
    };
    
    // Queue for batch save with userName
    queueSave('users', userKey, dataToSave, userName);
    
    // Invalidate cache
    localCache.userData.delete(userKey);
}

// Optimized: Save progress (debounced)
function saveProgressToFirestore(progress, progressKey, userName = null) {
    if (!isFirebaseAvailable()) return;
    
    // Use email as identifier for Google Sign-In
    const userEmail = auth.currentUser?.email || window.currentUserEmail;
    if (!userEmail) {
        console.warn('No user email available for saving progress');
        return;
    }
    
    // Add userEmail to progress data for cross-browser sync and security rules
    const progressWithUser = {
        ...progress,
        userEmail: userEmail, // Use email for security rules
        userName: userName || userEmail.split('@')[0] // Keep userName for compatibility
    };
    
    // Queue for batch save with email
    queueSave('progress', progressKey, progressWithUser, userEmail);
    
    // Invalidate cache
    localCache.progress.delete(progressKey);
}

// Optimized: Load progress with caching
async function loadProgressFromFirestore(progressKey) {
    if (!isFirebaseAvailable()) return null;
    
    // Return cached if recent (within 1 minute)
    if (localCache.progress.has(progressKey)) {
        const cached = localCache.progress.get(progressKey);
        if (Date.now() - cached.timestamp < 60000) {
            return cached.data;
        }
    }
    
    try {
        const doc = await db.collection('progress').doc(progressKey).get();
        if (doc.exists) {
            const data = doc.data();
            // Cache it
            localCache.progress.set(progressKey, {
                data: data,
                timestamp: Date.now()
            });
            return data;
        }
    } catch (error) {
        console.error('Error loading progress:', error);
    }
    
    return null;
}

// Optimized: Calculate stats using Firestore query (database-side logic)
async function calculateUserStatsFromFirestore(userName) {
    if (!isFirebaseAvailable()) return null;
    
    try {
        const userKey = getUserKey(userName);
        // Use username-based identifier instead of auth.uid for cross-browser sync
        const userIdentifier = userKey;
        
        // Query only progress for this user (database-side filtering by username)
        const progressSnapshot = await db.collection('progress')
            .where('userId', '==', userIdentifier)
            .get();
        
        if (progressSnapshot.empty) {
            return null;
        }
        
        // Aggregate stats from progress documents (database-side aggregation)
        let totalQuestionsAnswered = 0;
        let totalCorrectAnswers = 0;
        const questionsAnsweredSet = new Set();
        const domainsPracticedSet = new Set();
        
        progressSnapshot.forEach(doc => {
            const progress = doc.data();
            
            // Count answered questions from progress
            if (progress.answers) {
                const answeredCount = Object.keys(progress.answers).filter(
                    key => progress.answers[key] && progress.answers[key].length > 0
                ).length;
                totalQuestionsAnswered += answeredCount;
                
                // Extract question IDs and domains from progress
                // Note: We'd need to cross-reference with questions to get correctness
                // For now, we'll use the user document's stats which are updated on save
            }
            
            if (progress.domain) {
                domainsPracticedSet.add(progress.domain);
            }
        });
        
        // Get user document for accurate stats
        const userDoc = await db.collection('users').doc(userKey).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            return {
                totalQuestionsAnswered: userData.stats?.totalQuestionsAnswered || totalQuestionsAnswered,
                totalCorrectAnswers: userData.stats?.totalCorrectAnswers || 0,
                domainsPracticed: new Set(userData.stats?.domainsPracticed || Array.from(domainsPracticedSet)),
                questionsAnswered: new Set(userData.stats?.questionsAnswered || [])
            };
        }
        
        return {
            totalQuestionsAnswered,
            totalCorrectAnswers: 0,
            domainsPracticed: domainsPracticedSet,
            questionsAnswered: new Set()
        };
    } catch (error) {
        console.error('Error calculating stats from Firestore:', error);
        return null;
    }
}

// Optimized: Add user to list (batched)
async function addUserToFirestoreList(userName) {
    if (!isFirebaseAvailable()) return;
    
    // Update current username (use window to access app.js variable)
    if (typeof window !== 'undefined') {
        window.currentUserName = userName;
    }
    
    try {
        // Use transaction to ensure atomic update
        await db.runTransaction(async (transaction) => {
            const userListRef = db.collection('userList').doc('list');
            const userListDoc = await transaction.get(userListRef);
            
            let users = [];
            if (userListDoc.exists) {
                users = userListDoc.data().users || [];
            }
            
            if (!users.includes(userName)) {
                users.push(userName);
                transaction.set(userListRef, {
                    users: users,
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            }
        });
        
        // Invalidate cache
        localCache.users = null;
        console.log('✓ User added to Firestore list');
    } catch (error) {
        console.error('Error adding user to list:', error);
    }
}

// Legacy function removed - userList collection is disabled with email-based auth

// Force flush queue (call before page unload)
function flushSaveQueueSync() {
    if (saveQueue.size > 0) {
        // Convert to sync version or use sendBeacon
        flushSaveQueue();
    }
}

// Flush on page unload
window.addEventListener('beforeunload', flushSaveQueueSync);

// Sign in with Google
async function signInWithGoogle() {
    if (!isFirebaseInitialized()) {
        console.error('Firebase not initialized');
        return;
    }
    
    try {
        const provider = window.googleProvider || new firebase.auth.GoogleAuthProvider();
        
        // Try popup first (better UX), fallback to redirect if popup is blocked
        try {
            await auth.signInWithPopup(provider);
            // Success - auth state change will handle the rest
        } catch (popupError) {
            // If popup is blocked or fails due to COOP, use redirect
            if (popupError.code === 'auth/popup-blocked' || 
                popupError.code === 'auth/popup-closed-by-user' ||
                popupError.message?.includes('popup') ||
                popupError.message?.includes('blocked')) {
                
                // Use redirect method as fallback (no COOP issues)
                await auth.signInWithRedirect(provider);
                // Page will redirect, so we don't need to do anything else
                return;
            } else {
                // Re-throw other errors
                throw popupError;
            }
        }
    } catch (error) {
        console.error('Google Sign-In error:', error);
        if (error.code === 'auth/popup-closed-by-user') {
            // User closed popup - not an error
            return;
        } else {
            alert('Sign-in failed: ' + error.message);
        }
    }
}

// Handle redirect result (called after redirect back from Google)
function handleAuthRedirect() {
    if (!isFirebaseInitialized()) return;
    
    auth.getRedirectResult().then((result) => {
        if (result.user) {
            // User signed in via redirect
            const userEmail = result.user.email;
            initializeUserForEmail(userEmail, result.user.displayName || userEmail.split('@')[0]);
        }
    }).catch((error) => {
        if (error.code !== 'auth/popup-closed-by-user') {
            console.error('Redirect sign-in error:', error);
        }
    });
}

// Sign out
async function signOut() {
    try {
        await auth.signOut();
        console.log('✓ Signed out');
        // Clear local user data
        if (typeof window !== 'undefined') {
            window.currentUserEmail = null;
            window.currentUserName = null;
        }
    } catch (error) {
        console.error('Sign-out error:', error);
    }
}

// Initialize user data for email (create if doesn't exist)
async function initializeUserForEmail(email, displayName) {
    if (!isFirebaseAvailable()) return;
    
    try {
        const userKey = email.toLowerCase().replace(/[^a-z0-9@.-]/g, '-');
        const userRef = db.collection('users').doc(userKey);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
            // Create new user document
            await userRef.set({
                email: email,
                displayName: displayName,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                stats: {
                    totalQuestionsAnswered: 0,
                    totalCorrectAnswers: 0,
                    testsCompleted: 0,
                    domainsPracticed: [],
                    questionsAnswered: [],
                    lastActivity: new Date().toISOString()
                }
            });
            console.log('✓ Created user document for:', email);
        } else {
            // Update last activity
            await userRef.update({
                lastActivity: new Date().toISOString()
            });
        }
        
        // Load user data (re-fetch if we just created it)
        let userData;
        if (!userDoc.exists) {
            // We just created it, fetch it again
            const newUserDoc = await userRef.get();
            userData = newUserDoc.exists ? newUserDoc.data() : {
                email: email,
                name: displayName,
                displayName: displayName,
                stats: {
                    totalQuestionsAnswered: 0,
                    totalCorrectAnswers: 0,
                    testsCompleted: 0,
                    domainsPracticed: [],
                    questionsAnswered: []
                }
            };
        } else {
            userData = userDoc.data();
        }
        
        // Ensure required fields
        if (!userData.name && !userData.displayName) {
            userData.name = displayName;
            userData.displayName = displayName;
        }
        if (!userData.email) {
            userData.email = email;
        }
        
        // Convert arrays to Sets for runtime
        if (Array.isArray(userData.stats?.domainsPracticed)) {
            userData.stats.domainsPracticed = new Set(userData.stats.domainsPracticed);
        } else if (!userData.stats?.domainsPracticed) {
            userData.stats.domainsPracticed = new Set();
        }
        
        if (Array.isArray(userData.stats?.questionsAnswered)) {
            userData.stats.questionsAnswered = new Set(userData.stats.questionsAnswered);
        } else if (!userData.stats?.questionsAnswered) {
            userData.stats.questionsAnswered = new Set();
        }
        
        // Store in app.js currentUser and show main screen
        if (typeof window !== 'undefined' && typeof window.setCurrentUser === 'function') {
            window.setCurrentUser(userData, email);
            console.log('✓ User initialized and main screen should be shown');
        } else {
            console.warn('setCurrentUser function not available');
        }
        
    } catch (error) {
        console.error('Error initializing user:', error);
    }
}

// Show sign-in screen
function showSignInScreen() {
    console.log('showSignInScreen called');
    
    // Ensure DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showSignInScreen);
        return;
    }
    
    // Hide all screens
    const allScreens = document.querySelectorAll('.screen');
    console.log('Found screens:', allScreens.length);
    allScreens.forEach(screen => {
        screen.classList.add('hidden');
        console.log('Hiding screen:', screen.id);
    });
    
    // Show sign-in screen
    const signInScreen = document.getElementById('sign-in-screen');
    if (signInScreen) {
        signInScreen.classList.remove('hidden');
        console.log('✓ Showing sign-in screen');
        
        // Ensure button is set up
        const googleSignInBtn = document.getElementById('google-sign-in-btn');
        if (googleSignInBtn && !googleSignInBtn.hasAttribute('data-listener-attached')) {
            googleSignInBtn.addEventListener('click', function() {
                if (typeof signInWithGoogle === 'function') {
                    signInWithGoogle();
                } else {
                    console.error('signInWithGoogle function not available');
                    alert('Google Sign-In is not available. Please check Firebase configuration.');
                }
            });
            googleSignInBtn.setAttribute('data-listener-attached', 'true');
        }
    } else {
        console.error('Sign-in screen not found in DOM');
        // Try to find it again after a delay
        setTimeout(() => {
            const retryScreen = document.getElementById('sign-in-screen');
            if (retryScreen) {
                retryScreen.classList.remove('hidden');
                console.log('✓ Sign-in screen found on retry');
            } else {
                console.error('Sign-in screen still not found after retry');
            }
        }, 500);
    }
}

// Check if Firebase is initialized (without requiring auth)
function isFirebaseInitialized() {
    return firebaseInitialized && auth && db;
}

// Check if Firebase is available (requires auth)
function isFirebaseAvailable() {
    return firebaseInitialized && auth && auth.currentUser && db;
}

// Make functions globally accessible
window.isFirebaseInitialized = isFirebaseInitialized;
window.isFirebaseAvailable = isFirebaseAvailable;

// Make functions globally accessible
window.signInWithGoogle = signInWithGoogle;
window.signOut = signOut;
