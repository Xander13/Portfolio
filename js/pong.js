const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const balls = [
    { id: 'ball-black', colorIdx: 0, hex: '#000000', el: document.getElementById('ball-black') },
    { id: 'ball-darkgray', colorIdx: 1, hex: '#FFFFFF', el: document.getElementById('ball-darkgray') }
];

let width, height;
let gridSize = 80;
let cols, rows;
let matrix = [];
let offsetX = 0;
let offsetY = 0;

// Initialize ball physics
balls.forEach(ball => {
    ball.x = 0;
    ball.y = 0;
    ball.dx = (Math.random() > 0.5 ? 1 : -1) * (7 + Math.random() * 2);
    ball.dy = (Math.random() > 0.5 ? 1 : -1) * (7 + Math.random() * 2);
    ball.size = 60;
    ball.strength = 1.0;
});

// Hide unused balls
document.getElementById('ball-white').style.display = 'none';
document.getElementById('ball-gray').style.display = 'none';

function init() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;

    // Determine target grid size based on screen
    let targetGridSize = width < 768 ? 40 : 80;

    // Calculate how many blocks fit, ensuring even numbers for perfect split
    cols = Math.floor(width / targetGridSize);
    if (cols % 2 !== 0) cols--; // Make even

    rows = Math.floor(height / targetGridSize);
    if (rows % 2 !== 0) rows--; // Make even

    // Recalculate actual gridSize to perfectly fill the window
    gridSize = width / cols; // This will stretch blocks to fit perfectly horizontally

    // Update ball sizes proportionally
    balls.forEach(b => {
        b.size = width < 768 ? 40 : 60;
    });

    // No offsets needed - blocks fill edge to edge
    offsetX = 0;
    offsetY = 0;

    matrix = [];
    for (let x = 0; x < cols; x++) {
        matrix[x] = [];
        for (let y = 0; y < rows; y++) {
            // 50% Top Black (0), 50% Bottom White (1)
            matrix[x][y] = y < rows / 2 ? 0 : 1;
        }
    }

    // Random Winner Bias
    const winner = balls[Math.floor(Math.random() * balls.length)];
    balls.forEach((ball) => {
        ball.strength = (ball.id === winner.id) ? 1.06 : 0.96;

        if (ball.id === 'ball-black') {
            ball.x = width * 0.5;
            ball.y = height * 0.25;
        }
        if (ball.id === 'ball-darkgray') {
            ball.x = width * 0.5;
            ball.y = height * 0.75;
        }

        ball.el.style.width = ball.size + 'px';
        ball.el.style.height = ball.size + 'px';
        ball.el.style.position = 'absolute';
    });
}

const colorHexes = ['#000000', '#FFFFFF', '#A5A5A5', '#1a1a2e'];

function draw() {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // Calculate vertical grid size to fill height perfectly
    const gridSizeY = height / rows;

    for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
            const gx = x * gridSize;
            const gy = y * gridSizeY;
            const cIdx = matrix[x][y];

            ctx.fillStyle = colorHexes[cIdx];
            // Use gridSize for width, gridSizeY for height to fill perfectly
            ctx.fillRect(gx, gy, gridSize + 1, gridSizeY + 1);
        }
    }
}

function moveBall(ball) {
    ball.x += ball.dx;
    ball.y += ball.dy;

    const half = ball.size / 2;

    if (ball.x - half <= 0 || ball.x + half >= width) {
        ball.dx = -ball.dx;
        ball.x = Math.max(half, Math.min(width - half, ball.x));
    }
    if (ball.y - half <= 0 || ball.y + half >= height) {
        ball.dy = -ball.dy;
        ball.y = Math.max(half, Math.min(height - half, ball.y));
    }

    let gx = Math.floor((ball.x - offsetX) / gridSize);
    let gy = Math.floor((ball.y - offsetY) / (height / rows));

    if (gx >= 0 && gx < cols && gy >= 0 && gy < rows) {
        if (matrix[gx][gy] !== ball.colorIdx) {
            if (Math.random() < ball.strength) {
                matrix[gx][gy] = ball.colorIdx;
            }

            ball.dx = -ball.dx;
            ball.dy = -ball.dy;

            ball.dx += (Math.random() - 0.5) * 2;
            ball.dy += (Math.random() - 0.5) * 2;

            const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
            const targetSpeed = width < 768 ? 6.5 : 8.5;
            ball.dx = (ball.dx / speed) * targetSpeed;
            ball.dy = (ball.dy / speed) * targetSpeed;
        }
    }

    ball.el.style.left = (ball.x - ball.size / 2) + 'px';
    ball.el.style.top = (ball.y - ball.size / 2) + 'px';
}

function update() {
    balls.forEach(ball => moveBall(ball));
    draw();
    requestAnimationFrame(update);
}

window.addEventListener('resize', init);
init();
update();