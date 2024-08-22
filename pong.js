// Define the dimensions and other constants
const paddleWidth = 10; // Width of the paddles
const paddleHeight = 100; // Height of the paddles
const ballWidth = 115;  // Width of the ball
const ballHeight = 145; // Height of the ball
const baseSpeed = 4; // Base speed for ball movement
const speedVariance = 1; // Variance in ball speed
const weakCpuSpeeds = [1, 2, 3, 4, 5]; // Possible speeds for weaker AI paddle movement

// Initialize scores
let playerScore = 0;
let opponentScore = 0;

// Get the paddle and ball elements from the DOM
const paddle1 = document.getElementById('paddle1');
const paddle2 = document.getElementById('paddle2');
const ball = document.getElementById('ball');
const scoreElement = document.getElementById('score');

// Initialize ball position and velocity
let ballX, ballY, ballDX, ballDY;

// Randomly assigned AI speeds
let paddle1Speed, paddle2Speed;

function initializeGame() {
    // Randomly assign strengths to paddle1 and paddle2 from the weakCpuSpeeds array
    paddle1Speed = weakCpuSpeeds[Math.floor(Math.random() * weakCpuSpeeds.length)];
    paddle2Speed = weakCpuSpeeds[Math.floor(Math.random() * weakCpuSpeeds.length)];

    // Position paddles at the center of the screen
    paddle1.style.top = (window.innerHeight - paddleHeight) / 2 + 'px';
    paddle2.style.top = (window.innerHeight - paddleHeight) / 2 + 'px';

    resetBall();
}

function resetBall() {
    const adjustedSpeed = baseSpeed * speedAdjustment();
    ballX = window.innerWidth / 2;
    ballY = window.innerHeight / 2;
    ballDX = adjustedSpeed * (Math.random() > 0.5 ? 1 : -1);
    ballDY = adjustedSpeed * (Math.random() > 0.5 ? 1 : -1);
    updateBallPosition();
}

function updateBallPosition() {
    ball.style.left = ballX + 'px';
    ball.style.top = ballY + 'px';
}

function moveAI(paddle, speed) {
    const paddleCenterY = paddle.offsetTop + paddleHeight / 2;
    const ballCenterY = ballY + ballHeight / 2;

    const distance = Math.abs(paddleCenterY - ballCenterY);
    const speedFactor = 1 - Math.min(distance / window.innerHeight, 0.8);
    const adjustedSpeed = speed * (1 + speedFactor);

    if (ballCenterY > paddleCenterY) {
        paddle.style.top = Math.min(window.innerHeight - paddleHeight, paddle.offsetTop + adjustedSpeed) + 'px';
    } else if (ballCenterY < paddleCenterY) {
        paddle.style.top = Math.max(0, paddle.offsetTop - adjustedSpeed) + 'px';
    }
}

function checkRoundEnd() {
    if (playerScore >= 5 || opponentScore >= 5) {
        playerScore = 0;
        opponentScore = 0;
    }
}

function update() {
    ballX += ballDX;
    ballY += ballDY;

    // Ball collision with the top and bottom edges of the viewport
    if (ballY <= 0 || ballY + ballHeight >= window.innerHeight) {
        ballDY = -ballDY;
    }

    // Collision detection with the left paddle (paddle1)
    if (ballX <= paddleWidth) {
        const paddle1Y = parseFloat(paddle1.style.top);
        if (ballY + ballHeight >= paddle1Y && ballY <= paddle1Y + paddleHeight) {
            ballDX = Math.abs(ballDX); // Ensure the ball moves to the right
            ballDX += (Math.random() - 0.5) * speedVariance; // Add some variation in speed
            ballDY += (Math.random() - 0.5) * speedVariance; // Add some variation in direction
        } else {
            opponentScore++;
            checkRoundEnd();
            resetBall();
        }
    }

    // Collision detection with the right paddle (paddle2)
    if (ballX + ballWidth >= window.innerWidth - paddleWidth) {
        const paddle2Y = parseFloat(paddle2.style.top);
        if (ballY + ballHeight >= paddle2Y && ballY <= paddle2Y + paddleHeight) {
            ballDX = -Math.abs(ballDX); // Ensure the ball moves to the left
            ballDX += (Math.random() - 0.5) * speedVariance; // Add some variation in speed
            ballDY += (Math.random() - 0.5) * speedVariance; // Add some variation in direction
        } else {
            playerScore++;
            checkRoundEnd();
            resetBall();
        }
    }

    // Move AI paddles with their respective speeds
    moveAI(paddle2, paddle2Speed);
    moveAI(paddle1, paddle1Speed);

    updateBallPosition();
    scoreElement.innerHTML = `${playerScore}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${opponentScore}`;

    requestAnimationFrame(update);
}

window.addEventListener('resize', initializeGame);
initializeGame();
update();

// Toggle light and dark mode
const toggleButton = document.getElementById('toggle-button');
if (toggleButton) {
    toggleButton.addEventListener('click', () => {
        document.body.classList.toggle('lightMode');
        const navDot = document.querySelector('.navDot');

        if (navDot) {
            navDot.classList.toggle('lightMode');
        }
    });
}