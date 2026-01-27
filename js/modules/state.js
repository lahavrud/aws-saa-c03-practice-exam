// Application State Management
const AppState = (function() {
    // Private state
    let state = {
        currentTest: null,
        currentMode: null,
        currentQuestions: [],
        currentQuestionIndex: 0,
        userAnswers: {},
        markedQuestions: new Set(),
        testStartTime: null,
        testTimer: null,
        savedProgress: null,
        selectedDomain: null,
        selectedSource: null, // 'stephane', 'dojo', or 'sergey'
        currentTestDisplayNumber: null,
        currentUser: null,
        currentUserName: null,
        currentUserEmail: null,
        previousAnswers: {}
    };
    
    // Public API
    return {
        // Getters
        getCurrentTest: () => state.currentTest,
        getCurrentMode: () => state.currentMode,
        getCurrentQuestions: () => state.currentQuestions,
        getCurrentQuestionIndex: () => state.currentQuestionIndex,
        getUserAnswers: () => state.userAnswers,
        getMarkedQuestions: () => state.markedQuestions,
        getTestStartTime: () => state.testStartTime,
        getTestTimer: () => state.testTimer,
        getSavedProgress: () => state.savedProgress,
        getSelectedDomain: () => state.selectedDomain,
        getSelectedSource: () => state.selectedSource,
        getCurrentTestDisplayNumber: () => state.currentTestDisplayNumber,
        getCurrentUser: () => state.currentUser,
        getCurrentUserName: () => state.currentUserName,
        getCurrentUserEmail: () => state.currentUserEmail,
        getPreviousAnswers: () => state.previousAnswers,
        
        // Setters
        setCurrentTest: (value) => { state.currentTest = value; },
        setCurrentMode: (value) => { state.currentMode = value; },
        setCurrentQuestions: (value) => { state.currentQuestions = value; },
        setCurrentQuestionIndex: (value) => { state.currentQuestionIndex = value; },
        setUserAnswers: (value) => { state.userAnswers = value; },
        setMarkedQuestions: (value) => { state.markedQuestions = value; },
        setTestStartTime: (value) => { state.testStartTime = value; },
        setTestTimer: (value) => { state.testTimer = value; },
        setSavedProgress: (value) => { state.savedProgress = value; },
        setSelectedDomain: (value) => { state.selectedDomain = value; },
        setSelectedSource: (value) => { state.selectedSource = value; },
        setCurrentTestDisplayNumber: (value) => { state.currentTestDisplayNumber = value; },
        setCurrentUser: (value) => { state.currentUser = value; },
        setCurrentUserName: (value) => { state.currentUserName = value; },
        setCurrentUserEmail: (value) => { state.currentUserEmail = value; },
        setPreviousAnswers: (value) => { state.previousAnswers = value; },
        
        // Complex setters
        addUserAnswer: (questionId, answerIds) => {
            state.userAnswers[questionId] = answerIds;
        },
        
        removeUserAnswer: (questionId) => {
            delete state.userAnswers[questionId];
        },
        
        toggleMarkedQuestion: (questionId) => {
            if (state.markedQuestions.has(questionId)) {
                state.markedQuestions.delete(questionId);
            } else {
                state.markedQuestions.add(questionId);
            }
        },
        
        incrementQuestionIndex: () => {
            state.currentQuestionIndex++;
        },
        
        decrementQuestionIndex: () => {
            if (state.currentQuestionIndex > 0) {
                state.currentQuestionIndex--;
            }
        },
        
        resetTestState: () => {
            state.currentTest = null;
            state.currentMode = null;
            state.currentQuestions = [];
            state.currentQuestionIndex = 0;
            state.userAnswers = {};
            state.markedQuestions = new Set();
            state.testStartTime = null;
            state.testTimer = null;
            state.savedProgress = null;
            state.selectedDomain = null;
            state.selectedSource = null;
            state.currentTestDisplayNumber = null;
            state.previousAnswers = {};
        },
        
        // Make state accessible globally for backward compatibility
        exposeToWindow: () => {
            window.AppState = {
                getCurrentUser: () => state.currentUser,
                getCurrentUserEmail: () => state.currentUserEmail,
                getCurrentUserName: () => state.currentUserName
            };
        }
    };
})();
