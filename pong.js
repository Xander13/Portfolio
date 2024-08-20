// Define the dimensions and other constants
const paddleWidth = 10; // Width of the paddles
const paddleHeight = 100; // Height of the paddles
const ballWidth = 115;  // Width of the ball
const ballHeight = 145; // Height of the ball
const baseSpeed = 1; // Further reduced base speed for ball movement at 30 fps
const speedVariance = 0.05; // Reduced variance in ball speed
const cpuSpeed = 0.5; // Further reduced speed of strong AI paddle movement
const weakCpuSpeed = 0.25; // Further reduced speed of weaker AI paddle movement

// Initialize scores
let playerScore = 0;
let opponentScore = 0;

// Get the paddle and ball elements from the DOM
const paddle1 = document.getElementById('paddle1');
const paddle2 = document.getElementById('paddle2');
const ball = document.getElementById('ball');
const scoreElement = document.getElementById('score');

// Function to determine speed adjustment based on window width
function speedAdjustment() {
    return window.innerWidth < 920 ? 0.5 : 1; // Reduce speed to 50% for smaller screens
}

// Initialize ball position and velocity
let ballX, ballY, ballDX, ballDY;

function initializeGame() {
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

function moveAI(paddle, isWeakAI = false) {
    const baseSpeed = isWeakAI ? weakCpuSpeed : cpuSpeed;
    const paddleCenterY = paddle.offsetTop + paddleHeight / 2;
    const ballCenterY = ballY + ballHeight / 2;
    
    // Calculate the distance between the paddle center and the ball center
    const distance = Math.abs(paddleCenterY - ballCenterY);

    // Adjust speed based on distance; closer means faster, farther means slower
    const speedFactor = 1 - Math.min(distance / window.innerHeight, 0.8); // 0.8 ensures there's always some movement
    const adjustedSpeed = baseSpeed * (1 + speedFactor);

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

    moveAI(paddle2, false);
    moveAI(paddle1, true);

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
