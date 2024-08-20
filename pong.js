const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');

// Constants for paddle, ball, and additional elements
const paddleWidth = 10;
const paddleHeight = 100;
const ballWidth = 115;  // Half of 290
const ballHeight = 145; // Half of 369
const baseSpeed = 4; // Base speed for ball movement
const speedVariance = 1; // Variance in ball speed
const cpuSpeed = 5; // Speed of strong AI paddle movement
const weakCpuSpeed = 3; // Speed of weaker AI paddle movement

let playerPaddle, opponentPaddle, ball;
let playerScore = 0;
let opponentScore = 0;

// Load the ball image
const ballImage = new Image();
ballImage.src = 'ball.png'; // Path to your ball image

// Initialize game state
function initializeGame() {
    playerPaddle = { x: 0, y: canvas.height / 2 - paddleHeight / 2 }; // Left paddle
    opponentPaddle = { x: canvas.width - paddleWidth, y: canvas.height / 2 - paddleHeight / 2 }; // Right paddle
    ball = { x: canvas.width / 2, y: canvas.height / 2, dx: 0, dy: 0 }; // Initialize ball with placeholder values
    resetBall(); // Initialize ball with random speed
}

// Resize canvas to match window width and height
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight; // Full height of the viewport
    initializeGame(); // Reinitialize game state
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw paddles
    ctx.fillStyle = 'white'; // Use CSS variable for color
    ctx.fillRect(playerPaddle.x, playerPaddle.y, paddleWidth, paddleHeight);
    ctx.fillRect(opponentPaddle.x, opponentPaddle.y, paddleWidth, paddleHeight);

    // Draw ball image
    ctx.drawImage(ballImage, ball.x - ballWidth / 2, ball.y - ballHeight / 2, ballWidth, ballHeight);

    // Draw middle dashed line
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 15]); // Pattern of dashes and gaps
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash pattern

    // Move ball
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Ball collision with top and bottom
    if (ball.y - ballHeight / 2 < 0 || ball.y + ballHeight / 2 > canvas.height) {
        ball.dy = -ball.dy;
    }

    // Ball collision with paddles
    if (
        (ball.x - ballWidth / 2 < playerPaddle.x + paddleWidth && ball.y > playerPaddle.y && ball.y < playerPaddle.y + paddleHeight) ||
        (ball.x + ballWidth / 2 > opponentPaddle.x && ball.y > opponentPaddle.y && ball.y < opponentPaddle.y + paddleHeight)
    ) {
        ball.dx = -ball.dx;
        // Increase speed slightly upon collision
        ball.dx += (Math.random() - 0.5) * speedVariance;
        ball.dy += (Math.random() - 0.5) * speedVariance;
    }

    // Ball out of bounds
    if (ball.x - ballWidth / 2 < 0) {
        opponentScore++;
        checkRoundEnd();
        resetBall();
    } else if (ball.x + ballWidth / 2 > canvas.width) {
        playerScore++;
        checkRoundEnd();
        resetBall();
    }

    // Move paddles (AI)
    moveAI(opponentPaddle, false); // Stronger AI on the right
    moveAI(playerPaddle, true); // Weaker AI on the left

    // Ensure paddles remain within the canvas
    playerPaddle.y = Math.max(0, Math.min(canvas.height - paddleHeight, playerPaddle.y));
    opponentPaddle.y = Math.max(0, Math.min(canvas.height - paddleHeight, opponentPaddle.y));

    // Update score display
    scoreElement.innerHTML = `${playerScore}&nbsp;${opponentScore}`;

    requestAnimationFrame(draw);
}

function moveAI(paddle, isWeakAI = false) {
    const speed = isWeakAI ? weakCpuSpeed : cpuSpeed; // Different speeds for variety

    // Move AI paddle based on the ball's position
    if (ball.y > paddle.y + paddleHeight / 2) {
        paddle.y += speed;
    } else if (ball.y < paddle.y + paddleHeight / 2) {
        paddle.y -= speed;
    }
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = baseSpeed * (Math.random() > 0.5 ? 1 : -1);
    ball.dy = baseSpeed * (Math.random() > 0.5 ? 1 : -1);
}

// Check for end of round and reset if needed
function checkRoundEnd() {
    if (playerScore >= 5 || opponentScore >= 5) {
        playerScore = 0;
        opponentScore = 0;
    }
}

// Start the game with two AI paddles
initializeGame();
draw();
