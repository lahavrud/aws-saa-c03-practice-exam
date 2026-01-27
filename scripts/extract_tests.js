const fs = require('fs');
const path = require('path');

const questionsJsPath = path.join(__dirname, '..', 'questions.js');
const questionsDir = path.join(__dirname, '..', 'questions');

try {
    const content = fs.readFileSync(questionsJsPath, 'utf8');
    
    // Create a safe context for eval
    const examQuestions = {};
    eval(content);
    
    if (examQuestions.test1) {
        fs.writeFileSync(
            path.join(questionsDir, 'test1.json'),
            JSON.stringify(examQuestions.test1, null, 2)
        );
        console.log('✓ Restored test1.json with', examQuestions.test1.length, 'questions');
    } else {
        console.log('✗ test1 not found');
    }
    
    if (examQuestions.test4) {
        fs.writeFileSync(
            path.join(questionsDir, 'test4.json'),
            JSON.stringify(examQuestions.test4, null, 2)
        );
        console.log('✓ Restored test4.json with', examQuestions.test4.length, 'questions');
    } else {
        console.log('✗ test4 not found');
    }
    
    console.log('Available tests:', Object.keys(examQuestions).filter(k => k.startsWith('test')).join(', '));
} catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
}
