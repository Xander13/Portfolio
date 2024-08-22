// Define the dimensions and other constants
const paddleWidth = 10; // Width of the paddles
const paddleHeight = 100; // Height of the paddles
const ballWidth = 115;  // Width of the ball
const ballHeight = 145; // Height of the ball
const baseSpeed = 4; // Base speed for ball movement
const speedVariance = 1; // Variance in ball speed

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
    return window.innerWidth < 920 ? 0.2 : 0.5; // Further reduce speed for smaller screens
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

    // Fixed directions for ball movement
    ballDX = adjustedSpeed; // Move to the right
    ballDY = adjustedSpeed; // Move downwards

    updateBallPosition();
}

function updateBallPosition() {
    ball.style.left = ballX + 'px';
    ball.style.top = ballY + 'px';
}

function movePaddleOnCollision(paddle) {
    const paddleCenterY = paddle.offsetTop + paddleHeight / 2;
    const ballCenterY = ballY + ballHeight / 2;

    // Determine the proximity value based on screen size
    const proximity = window.innerWidth < 920 ? 150 : 300; // 150px for mobile, 300px for desktop

    // Move the paddle to center the ball when it gets close
    if (Math.abs(ballX - paddle.offsetLeft) < proximity) {
        if (ballCenterY > paddleCenterY) {
            paddle.style.top = Math.min(window.innerHeight - paddleHeight, paddle.offsetTop + 4) + 'px';
        } else if (ballCenterY < paddleCenterY) {
            paddle.style.top = Math.max(0, paddle.offsetTop - 4) + 'px';
        }
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

    // Move paddles on collision
    movePaddleOnCollision(paddle1);
    movePaddleOnCollision(paddle2);

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