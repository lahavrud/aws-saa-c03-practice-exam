// Timer Management Module
const Timer = (function() {
    'use strict';
    
    let timerInterval = null;
    
    return {
        // Start test timer
        start: () => {
            const timerElement = document.getElementById('timer');
            if (!timerElement) return;
            
            timerElement.classList.remove('hidden');
            AppState.setTestStartTime(Date.now());
            
            timerInterval = setInterval(() => {
                const startTime = AppState.getTestStartTime();
                if (!startTime) {
                    Timer.stop();
                    return;
                }
                
                const elapsed = Date.now() - startTime;
                const remaining = Config.TEST_DURATION - elapsed;
                
                if (remaining <= 0) {
                    Timer.stop();
                    TestManager.submitTest();
                    return;
                }
                
                const minutes = Math.floor(remaining / 60000);
                const seconds = Math.floor((remaining % 60000) / 1000);
                
                timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                
                if (remaining < 10 * 60 * 1000) { // Less than 10 minutes
                    timerElement.classList.add('warning');
                }
            }, 1000);
            
            AppState.setTestTimer(timerInterval);
        },
        
        // Stop timer
        stop: () => {
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
                AppState.setTestTimer(null);
            }
            
            const timerElement = document.getElementById('timer');
            if (timerElement) {
                timerElement.classList.add('hidden');
                timerElement.classList.remove('warning');
            }
        },
        
        // Get remaining time in milliseconds
        getRemainingTime: () => {
            const startTime = AppState.getTestStartTime();
            if (!startTime) return Config.TEST_DURATION;
            
            const elapsed = Date.now() - startTime;
            return Math.max(0, Config.TEST_DURATION - elapsed);
        }
    };
})();
