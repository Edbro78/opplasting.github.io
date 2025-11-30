// Game state
let config = null;
let selectedOperation = null;
let selectedSpeed = null;
let gameConfig = null;
let globalTimer = null;
let questionTimer = null;
let progressInterval = null;
let currentQuestion = null;
let correctAnswer = null;
let score = 0;
let totalQuestions = 0;
let correctAnswers = 0;
let maxPossibleQuestions = 0;
let gameActive = false;

// DOM elements (will be initialized after DOM loads)
let startScreen, gameScreen, gameOverScreen, startBtn, operationBtns, speedBtns;
let questionText, answerBtns, globalTimerDisplay, scoreDisplay;
let questionProgressBar, finalScoreDisplay, finalAccuracyDisplay;
let playAgainBtn, towerContainer;
let hourglassSand, warningMessage;

// Load config.json
async function loadConfig() {
    try {
        const response = await fetch('config.json');
        config = await response.json();
        gameConfig = config;
    } catch (error) {
        console.error('Error loading config:', error);
        // Fallback config
        config = {
            modes: {
                slow: 3000,
                medium: 2000,
                fast: 1000
            },
            gameDuration: 60
        };
    }
}

// Initialize game
async function init() {
    // Get DOM elements after page is loaded
    startScreen = document.getElementById('startScreen');
    gameScreen = document.getElementById('gameScreen');
    gameOverScreen = document.getElementById('gameOverScreen');
    startBtn = document.getElementById('startBtn');
    operationBtns = document.querySelectorAll('.operation-btn');
    speedBtns = document.querySelectorAll('.speed-btn');
    questionText = document.getElementById('questionText');
    answerBtns = document.querySelectorAll('.answer-btn');
    globalTimerDisplay = document.getElementById('globalTimer');
    scoreDisplay = document.getElementById('score');
    questionProgressBar = document.getElementById('questionProgressBar');
    finalScoreDisplay = document.getElementById('finalScore');
    finalAccuracyDisplay = document.getElementById('finalAccuracy');
    playAgainBtn = document.getElementById('playAgainBtn');
    towerContainer = document.getElementById('towerContainer');
    hourglassSand = document.getElementById('hourglassSand');
    warningMessage = document.getElementById('warningMessage');
    
    await loadConfig();
    setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    // Operation selection
    operationBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            operationBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedOperation = btn.dataset.operation;
            checkStartButton();
        });
    });

    // Speed selection
    speedBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            speedBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedSpeed = btn.dataset.speed;
            checkStartButton();
        });
    });

    // Start button
    startBtn.addEventListener('click', startGame);

    // Answer buttons
    answerBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (gameActive) {
                handleAnswer(parseInt(btn.dataset.index));
            }
        });
    });

    // Play again button
    playAgainBtn.addEventListener('click', () => {
        resetGame();
        showScreen('startScreen');
    });
}

function checkStartButton() {
    if (selectedOperation && selectedSpeed) {
        startBtn.disabled = false;
    } else {
        startBtn.disabled = true;
    }
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function startGame() {
    // Reset game state
    score = 0;
    totalQuestions = 0;
    correctAnswers = 0;
    gameActive = true;

    // Calculate max possible questions based on speed mode
    const questionTime = config.modes[selectedSpeed];
    maxPossibleQuestions = Math.floor(config.gameDuration / (questionTime / 1000));

    // Show game screen
    showScreen('gameScreen');

    // Start global timer with hourglass animation
    let timeRemaining = config.gameDuration;
    const totalTime = config.gameDuration;
    globalTimerDisplay.textContent = timeRemaining;
    
    // Reset hourglass
    if (hourglassSand) {
        hourglassSand.style.height = '100%';
    }
    
    // Reset warning message
    if (warningMessage) {
        warningMessage.classList.remove('show', 'dramatic');
        warningMessage.textContent = '';
    }

    globalTimer = setInterval(() => {
        timeRemaining--;
        globalTimerDisplay.textContent = timeRemaining;
        
        // Update hourglass sand level
        if (hourglassSand) {
            const sandHeight = (timeRemaining / totalTime) * 100;
            hourglassSand.style.height = sandHeight + '%';
        }
        
        // Show warning at 30 seconds (halfway)
        if (timeRemaining === 30) {
            showWarning('Halvveis!', false);
        }
        
        // Show dramatic warning at 10 seconds
        if (timeRemaining === 10) {
            showWarning('10 SEKUND IGJEN!', true);
        }
        
        // Update timer color when low
        if (timeRemaining <= 10) {
            globalTimerDisplay.style.color = '#ff0000';
            globalTimerDisplay.style.textShadow = '0 0 10px rgba(255, 0, 0, 0.8)';
        } else if (timeRemaining <= 30) {
            globalTimerDisplay.style.color = '#ff8800';
        } else {
            globalTimerDisplay.style.color = '#ffd700';
            globalTimerDisplay.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.3)';
        }

        if (timeRemaining <= 0) {
            endGame();
        }
    }, 1000);

    // Start first question
    generateQuestion();
}

function generateQuestion() {
    if (!gameActive) return;

    const questionTime = config.modes[selectedSpeed];
    let num1, num2, answer, question;

    // Generate question based on operation
    switch (selectedOperation) {
        case 'addition':
            // Ensure sum never exceeds 10 (even easier)
            num1 = Math.floor(Math.random() * 10) + 1;
            num2 = Math.floor(Math.random() * (10 - num1)) + 1;
            answer = num1 + num2;
            question = `${num1} + ${num2}`;
            break;

        case 'subtraction':
            // Ensure result never exceeds 10 (even easier)
            answer = Math.floor(Math.random() * 10) + 1;
            num2 = Math.floor(Math.random() * 8) + 1;
            num1 = num2 + answer;
            question = `${num1} - ${num2}`;
            break;

        case 'multiplication':
            num1 = Math.floor(Math.random() * 9) + 1;
            num2 = Math.floor(Math.random() * 9) + 1;
            answer = num1 * num2;
            question = `${num1} × ${num2}`;
            break;

        case 'division':
            // Ensure whole number result and dividend <= 20 (even easier)
            num2 = Math.floor(Math.random() * 5) + 1;
            answer = Math.floor(Math.random() * Math.floor(20 / num2)) + 1;
            num1 = num2 * answer;
            question = `${num1} ÷ ${num2}`;
            break;
    }

    currentQuestion = { question, answer };
    correctAnswer = answer;
    totalQuestions++;

    // Display question
    questionText.textContent = question;

    // Generate answer options
    generateAnswers(answer);

    // Clear any existing progress interval
    if (progressInterval) {
        clearInterval(progressInterval);
    }

    // Reset progress bar
    questionProgressBar.style.width = '100%';
    questionProgressBar.style.transition = 'none';

    // Start question timer with smooth animation
    const startTime = Date.now();
    
    progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, questionTime - elapsed);
        const percentage = (remaining / questionTime) * 100;
        
        // Use transform for smoother animation
        questionProgressBar.style.transition = 'width 0.1s linear';
        questionProgressBar.style.width = percentage + '%';

        if (remaining <= 0) {
            clearInterval(progressInterval);
            progressInterval = null;
        }
    }, 16); // ~60fps for smoother animation

    questionTimer = setTimeout(() => {
        if (gameActive) {
            // Auto-skip: mark as wrong and move to next question
            handleAnswer(-1);
        }
    }, questionTime);
}

function generateAnswers(correctAnswer) {
    const answers = [correctAnswer];
    
    // Generate 3 distractors
    while (answers.length < 4) {
        let distractor;
        if (selectedOperation === 'division') {
            // For division, keep distractors close but different
            distractor = correctAnswer + Math.floor(Math.random() * 10) - 5;
            if (distractor < 1) distractor = correctAnswer + Math.floor(Math.random() * 5) + 1;
        } else {
            // For other operations, generate close distractors
            const offset = Math.floor(Math.random() * 10) - 5;
            distractor = correctAnswer + offset;
        }
        
        // Ensure distractor is different and positive
        if (distractor !== correctAnswer && distractor > 0 && !answers.includes(distractor)) {
            answers.push(distractor);
        }
    }

    // Shuffle answers
    for (let i = answers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [answers[i], answers[j]] = [answers[j], answers[i]];
    }

    // Display answers
    answerBtns.forEach((btn, index) => {
        btn.textContent = answers[index];
        btn.classList.remove('correct', 'wrong');
        btn.disabled = false;
    });
}

function handleAnswer(selectedIndex) {
    if (!gameActive) return;

    clearTimeout(questionTimer);

    // Disable all buttons
    answerBtns.forEach(btn => {
        btn.disabled = true;
    });

    let isCorrect = false;

    if (selectedIndex === -1) {
        // Auto-skip (timeout)
        isCorrect = false;
    } else {
        const selectedAnswer = parseInt(answerBtns[selectedIndex].textContent);
        isCorrect = selectedAnswer === correctAnswer;

        // Visual feedback
        if (isCorrect) {
            answerBtns[selectedIndex].classList.add('correct');
            score += 1;
            correctAnswers++;
            addTowerBlock();
        } else {
            answerBtns[selectedIndex].classList.add('wrong');
            // Highlight correct answer
            answerBtns.forEach((btn, index) => {
                if (parseInt(btn.textContent) === correctAnswer) {
                    btn.classList.add('correct');
                }
            });
        }
    }

    scoreDisplay.textContent = score;

    // Move to next question after short delay
    setTimeout(() => {
        if (gameActive) {
            generateQuestion();
        }
    }, 1000);
}

function showWarning(message, isDramatic) {
    if (!warningMessage) return;
    
    warningMessage.textContent = message;
    warningMessage.classList.add('show');
    
    if (isDramatic) {
        warningMessage.classList.add('dramatic');
    } else {
        warningMessage.classList.remove('dramatic');
    }
    
    // Hide warning after 2 seconds
    setTimeout(() => {
        if (warningMessage) {
            warningMessage.classList.remove('show');
        }
    }, 2000);
}

function addTowerBlock() {
    const block = document.createElement('div');
    block.className = 'tower-block';
    block.style.animation = 'towerGrow 0.3s ease-out';
    towerContainer.appendChild(block);
}

function endGame() {
    gameActive = false;
    clearInterval(globalTimer);
    clearTimeout(questionTimer);
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }

    // Calculate accuracy as percentage of actual questions answered
    const accuracy = totalQuestions > 0 
        ? Math.round((correctAnswers / totalQuestions) * 100) 
        : 0;

    // Display results
    finalScoreDisplay.textContent = score;
    finalAccuracyDisplay.textContent = `${correctAnswers} av ${totalQuestions} (${accuracy}%)`;

    // Show game over screen
    setTimeout(() => {
        showScreen('gameOverScreen');
    }, 500);
}

function resetGame() {
    gameActive = false;
    clearInterval(globalTimer);
    clearTimeout(questionTimer);
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }
    
    selectedOperation = null;
    selectedSpeed = null;
    score = 0;
    totalQuestions = 0;
    correctAnswers = 0;
    maxPossibleQuestions = 0;

    // Reset UI
    operationBtns.forEach(btn => btn.classList.remove('selected'));
    speedBtns.forEach(btn => btn.classList.remove('selected'));
    startBtn.disabled = true;
    answerBtns.forEach(btn => {
        btn.classList.remove('correct', 'wrong');
        btn.disabled = false;
    });
    
    // Clear tower
    if (towerContainer) {
        towerContainer.innerHTML = '';
    }
}

// Initialize when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
