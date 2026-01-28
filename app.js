// AWS Lahavda - Practice Exam Application - Modular Architecture
// Main application orchestrator that coordinates all modules

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize the application using the initialization module
    if (typeof Initialization !== 'undefined' && Initialization.initialize) {
        await Initialization.initialize();
    } else {
        console.error('Initialization module not available');
    }
});
