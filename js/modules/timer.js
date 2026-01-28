// Timer Management Module
const Timer = (function() {
    'use strict';
    
    let timerInterval = null;
    let audioAlertPlayed = false;
    
    // Create audio context for alerts (if supported)
    let audioContext = null;
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.log('Audio context not supported');
    }
    
    // Play alert sound
    const playAlert = (frequency = 800, duration = 200) => {
        if (!audioContext) return;
        
        try {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration / 1000);
        } catch (e) {
            console.log('Could not play alert sound:', e);
        }
    };
    
    return {
        // Start test timer
        start: () => {
            const timerElement = document.getElementById('timer');
            if (!timerElement) return;
            
            timerElement.classList.remove('hidden');
            timerElement.setAttribute('aria-live', 'polite');
            AppState.setTestStartTime(Date.now());
            audioAlertPlayed = false;
            
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
                
                const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                timerElement.textContent = timeString;
                
                // Update aria-label for screen readers
                const timeText = minutes === 1 ? '1 minute' : `${minutes} minutes`;
                timerElement.setAttribute('aria-label', `${timeText} ${seconds} seconds remaining`);
                
                // 10 minutes warning
                if (remaining < 10 * 60 * 1000 && remaining >= 9 * 60 * 1000) {
                    timerElement.classList.add('warning');
                    timerElement.classList.remove('critical');
                    if (!audioAlertPlayed) {
                        playAlert(600, 300);
                        audioAlertPlayed = true;
                        // Announce to screen readers
                        const announcement = document.createElement('div');
                        announcement.setAttribute('role', 'alert');
                        announcement.setAttribute('aria-live', 'assertive');
                        announcement.className = 'sr-only';
                        announcement.textContent = `Warning: 10 minutes remaining`;
                        document.body.appendChild(announcement);
                        setTimeout(() => announcement.remove(), 1000);
                    }
                }
                
                // 5 minutes critical warning
                if (remaining < 5 * 60 * 1000) {
                    timerElement.classList.add('critical');
                    timerElement.classList.remove('warning');
                    // Play alert every minute when under 5 minutes
                    if (seconds === 0 && minutes > 0 && minutes <= 5) {
                        playAlert(800, 400);
                    }
                }
                
                // Final minute - play alert every 10 seconds
                if (remaining < 60 * 1000 && seconds % 10 === 0) {
                    playAlert(1000, 200);
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
                // Only hide if not in test mode
                const currentMode = AppState.getCurrentMode();
                if (currentMode !== Config.MODES.TEST) {
                    timerElement.classList.add('hidden');
                }
                timerElement.classList.remove('warning', 'critical');
                audioAlertPlayed = false;
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
