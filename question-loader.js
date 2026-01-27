// Question Loader - Extracts questions from various sources
// This can be extended to load from PDF, text files, or JSON files

async function loadQuestionsFromFile(filePath) {
    // Ensure path is relative (works for both local dev and GitHub Pages)
    // Remove leading slash if present to ensure relative path
    const normalizedPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    
    // If it's a JSON file
    if (normalizedPath.endsWith('.json')) {
        try {
            const response = await fetch(normalizedPath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error loading JSON file:', error);
            return null;
        }
    }
    
    // If it's a text file, parse it
    if (normalizedPath.endsWith('.txt')) {
        try {
            const response = await fetch(normalizedPath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
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
    // Wait a bit for questions.js to load (important for GitHub Pages)
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Try to load from questions.js first (for backward compatibility)
    // Check both window.examQuestions and global examQuestions
    const existingQuestions = window.examQuestions || (typeof examQuestions !== 'undefined' ? examQuestions : undefined);
    if (existingQuestions) {
        // Ensure it's on window for module access
        window.examQuestions = existingQuestions;
        return existingQuestions;
    }
    
    // Try to load from combined JSON file first
    try {
        const combinedData = await loadQuestionsFromFile('questions/all_tests.json');
        if (combinedData && typeof combinedData === 'object') {
            // Assign to global examQuestions
            window.examQuestions = combinedData;
            return combinedData;
        }
    } catch (error) {
        // Silently continue to try individual files
    }
    
    // Try to load individual test JSON files
    const loadedTests = {};
    let foundAny = false;
    
    // Try to load test1.json, test2.json, etc. up to test26.json (extend range)
    for (let i = 1; i <= 26; i++) {
        const testFile = `questions/test${i}.json`;
        try {
            const data = await loadQuestionsFromFile(testFile);
            if (data && Array.isArray(data)) {
                loadedTests[`test${i}`] = data;
                foundAny = true;
            }
        } catch (error) {
            // Continue to next file
        }
    }
    
    if (foundAny) {
        // Assign to global examQuestions
        window.examQuestions = loadedTests;
        return loadedTests;
    }
    
    // Fallback: Try to load from text files
    const textFiles = [
        'questions/test1.txt',
        'questions/test2.txt',
        'questions/questions.txt'
    ];
    
    for (const file of textFiles) {
        try {
            const data = await loadQuestionsFromFile(file);
            if (data) {
                // Assign to global examQuestions
                window.examQuestions = data;
                return data;
            }
        } catch (error) {
            // Continue to next file
        }
    }
    
    console.error('No questions loaded from any source. Please ensure questions.js exists or JSON files are available.');
    return null;
}

// Export for use in app.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { loadQuestionsFromFile, parseQuestionsFromText, autoLoadQuestions };
}
