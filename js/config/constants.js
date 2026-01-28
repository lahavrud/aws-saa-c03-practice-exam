/**
 * Application Constants
 * Centralized location for all magic numbers, strings, and configuration values
 */

const Constants = (function() {
    'use strict';
    
    return {
        // Timing constants
        TIMING: {
            TEST_DURATION_MS: 130 * 60 * 1000, // 130 minutes in milliseconds
            SAVE_DEBOUNCE_MS: 2000, // Batch saves every 2 seconds
            CACHE_DURATION_MS: 24 * 60 * 60 * 1000, // 24 hours
            LOADER_MESSAGE_INTERVAL_MS: 2000, // Rotate loader messages every 2 seconds
            FIREBASE_INIT_DELAY_MS: 500, // Delay for Firebase initialization
            QUESTION_LOAD_DELAY_MS: 200, // Delay for question loading
            BUTTON_SETUP_DELAY_MS: 100, // Delay for button event listener setup
            FINAL_INIT_CHECK_DELAY_MS: 1000, // Final initialization check delay
            RETRY_DELAY_MS: 1000, // Base retry delay for operations
            CACHE_TIMEOUT_MS: 60000, // 1 minute cache timeout
        },
        
        // UI Constants
        UI: {
            MOBILE_BREAKPOINT_PX: 768, // Mobile breakpoint in pixels
            TOAST_DURATION_DEFAULT_MS: 5000, // Default toast duration
            TOAST_DURATION_ERROR_MS: 7000, // Error toast duration
            TOAST_DURATION_INFO_MS: 5000, // Info toast duration
            TOAST_DURATION_WARNING_MS: 5000, // Warning toast duration
        },
        
        // Storage keys (kept for backward compatibility, but prefer Config.STORAGE_KEYS)
        STORAGE_KEYS: {
            USERS_LIST: 'saa-c03-users',
            USER_PREFIX: 'saa-c03-user-',
            PROGRESS_PREFIX: 'saa-c03-progress-',
            CURRENT_PROGRESS_PREFIX: 'saa-c03-current-progress-',
            SUBMITTED_TESTS_PREFIX: 'saa-c03-submitted-tests-',
            CACHED_QUESTIONS: 'cached-questions',
            CACHED_QUESTIONS_TIMESTAMP: 'cached-questions-timestamp',
        },
        
        // Firebase constants
        FIREBASE: {
            BATCH_SIZE: 500, // Firestore batch limit
            MAX_RETRIES: 3, // Maximum retry attempts
            RETRY_BASE_DELAY_MS: 1000, // Base delay for exponential backoff
        },
        
        // Question constants
        QUESTIONS: {
            MAX_TEST_FILES: 26, // Maximum number of test files to check
        },
        
        // Error messages (moved to Messages.errors, kept here for backward compatibility)
        ERROR_MESSAGES: {
            QUESTIONS_LOAD_FAILED: 'Failed to load questions. Please check your connection and refresh the page.',
            QUESTIONS_LOAD_FROM_CACHE: 'Loaded questions from cache. Some features may be limited.',
            QUESTIONS_LOAD_FROM_CACHE_ERROR: 'Loaded questions from cache due to connection error.',
            SIGN_IN_FAILED: 'Failed to sign in. Please check your connection and try again.',
            SIGN_IN_NOT_AVAILABLE: 'Google Sign-In is not available. Please check Firebase configuration.',
            OFFLINE_MODE: 'Running in offline mode. Some features may be limited.',
            FIREBASE_NOT_AVAILABLE: 'Firebase is not available. Please check your connection.',
            UNEXPECTED_ERROR: 'An unexpected error occurred. Please try again.',
        }
    };
})();

// Expose to window for global access
if (typeof window !== 'undefined') {
    window.Constants = Constants;
}
