/**
 * Centralized Error Handling Module
 * Provides consistent error handling and logging across the application
 */

const ErrorHandler = (function() {
    'use strict';
    
    /**
     * Handle an error with user-friendly messaging
     * @param {Error|string} error - The error object or error message
     * @param {string|null} userMessage - Optional user-friendly message
     * @param {boolean} logToConsole - Whether to log to console (default: true)
     */
    function handleError(error, userMessage = null, logToConsole = true) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : null;
        
        // Log to console
        if (logToConsole) {
            console.error('Error:', errorMessage);
            if (errorStack) {
                console.error('Stack:', errorStack);
            }
        }
        
        // Show user-friendly message
        const displayMessage = userMessage || errorMessage || 'An unexpected error occurred. Please try again.';
        
        if (typeof window.showToast === 'function') {
            window.showToast(displayMessage, 'error', 7000);
        } else {
            // Fallback to alert if toast is not available
            alert(displayMessage);
        }
        
        // Return error info for potential further processing
        return {
            message: errorMessage,
            stack: errorStack,
            userMessage: displayMessage
        };
    }
    
    /**
     * Handle a warning
     * @param {string} message - Warning message
     * @param {boolean} logToConsole - Whether to log to console (default: true)
     */
    function handleWarning(message, logToConsole = true) {
        if (logToConsole) {
            console.warn('Warning:', message);
        }
        
        if (typeof window.showToast === 'function') {
            window.showToast(message, 'warning', 5000);
        }
    }
    
    /**
     * Handle an info message
     * @param {string} message - Info message
     * @param {boolean} logToConsole - Whether to log to console (default: false)
     */
    function handleInfo(message, logToConsole = false) {
        if (logToConsole) {
            console.info('Info:', message);
        }
        
        if (typeof window.showToast === 'function') {
            window.showToast(message, 'info', 5000);
        }
    }
    
    /**
     * Wrap an async function with error handling
     * @param {Function} fn - Async function to wrap
     * @param {string|null} errorMessage - Optional error message
     * @returns {Function} Wrapped function
     */
    function wrapAsync(fn, errorMessage = null) {
        return async function(...args) {
            try {
                return await fn.apply(this, args);
            } catch (error) {
                handleError(error, errorMessage);
                throw error; // Re-throw for caller to handle if needed
            }
        };
    }
    
    /**
     * Wrap a sync function with error handling
     * @param {Function} fn - Function to wrap
     * @param {string|null} errorMessage - Optional error message
     * @returns {Function} Wrapped function
     */
    function wrapSync(fn, errorMessage = null) {
        return function(...args) {
            try {
                return fn.apply(this, args);
            } catch (error) {
                handleError(error, errorMessage);
                throw error; // Re-throw for caller to handle if needed
            }
        };
    }
    
    return {
        handleError,
        handleWarning,
        handleInfo,
        wrapAsync,
        wrapSync
    };
})();

// Expose to window for global access
if (typeof window !== 'undefined') {
    // Only expose if handleError doesn't already exist or replace it
    if (!window.handleError || window.handleError === window.handleError) {
        window.handleError = ErrorHandler.handleError;
    }
    window.ErrorHandler = ErrorHandler;
}
