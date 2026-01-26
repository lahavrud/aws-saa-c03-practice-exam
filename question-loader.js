// Question Loader - Extracts questions from various sources
// This can be extended to load from PDF, text files, or JSON files

async function loadQuestionsFromFile(filePath) {
    // This function can be extended to load questions from files
    // For now, it's a placeholder for future functionality
    console.log('Loading questions from:', filePath);
    
    // If it's a JSON file
    if (filePath.endsWith('.json')) {
        try {
            const response = await fetch(filePath);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error loading JSON file:', error);
            return null;
        }
    }
    
    // If it's a text file, parse it
    if (filePath.endsWith('.txt')) {
        try {
            const response = await fetch(filePath);
            const text = await response.text();
            return parseQuestionsFromText(text);
        } catch (error) {
            console.error('Error loading text file:', error);
            return null;
        }
    }
    
    return null;
}

function parseQuestionsFromText(text) {
    // Parse questions from text format (Q1:, Q2:, etc.)
    const questions = [];
    const lines = text.split('\n');
    
    let currentQuestion = null;
    let currentTest = 'test1';
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Detect test separation
        if (line.includes('Test 2:') || (line.includes('Exam Questions Export') && i > 100)) {
            currentTest = 'test2';
            continue;
        }
        
        // Match question start
        const qMatch = line.match(/^Q(\d+):\s*(.+)/);
        if (qMatch) {
            if (currentQuestion) {
                questions.push(currentQuestion);
            }
            
            currentQuestion = {
                id: parseInt(qMatch[1]),
                text: qMatch[2],
                options: [],
                correctAnswers: [],
                explanation: '',
                domain: 'Design High-Performing Architectures'
            };
            continue;
        }
        
        // Parse options
        if (currentQuestion && line.startsWith('[')) {
            const isCorrect = line.includes('[CORRECT]');
            const optionText = line.replace(/^\[.*?\]\s*/, '').trim();
            
            const optionId = currentQuestion.options.length;
            currentQuestion.options.push({
                id: optionId,
                text: optionText,
                correct: isCorrect
            });
            
            if (isCorrect) {
                currentQuestion.correctAnswers.push(optionId);
            }
        }
    }
    
    if (currentQuestion) {
        questions.push(currentQuestion);
    }
    
    return { [currentTest]: questions };
}

// Auto-detect and load questions from questions directory
async function autoLoadQuestions() {
    // Try to load from questions.js first (default)
    if (typeof examQuestions !== 'undefined') {
        return examQuestions;
    }
    
    // Try to load from JSON files in questions directory
    const jsonFiles = [
        'questions/test1.json',
        'questions/test2.json',
        'questions/questions.json'
    ];
    
    for (const file of jsonFiles) {
        try {
            const data = await loadQuestionsFromFile(file);
            if (data) {
                return data;
            }
        } catch (error) {
            // Continue to next file
        }
    }
    
    // Try to load from text files
    const textFiles = [
        'questions/test1.txt',
        'questions/test2.txt',
        'questions/questions.txt'
    ];
    
    for (const file of textFiles) {
        try {
            const data = await loadQuestionsFromFile(file);
            if (data) {
                return data;
            }
        } catch (error) {
            // Continue to next file
        }
    }
    
    return null;
}

// Export for use in app.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { loadQuestionsFromFile, parseQuestionsFromText, autoLoadQuestions };
}
