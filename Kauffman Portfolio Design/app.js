const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.style.backgroundColor = "#151515";

const svgImage = new Image();
svgImage.src = "face.svg";
svgImage.onload = function () {
    update();
};

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const circles = [];
for (let i = 0; i < 7; i++) {
    circles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * (100 / 9) + 20 + (i * (90 / 12)),
        dx: Math.random() * 1.5 - 1,
        dy: Math.random() * 1.5 - 1
    });
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Function to check for circle collisions with other circles
function checkCollisions(circle) {
    for (let i = 0; i < circles.length; i++) {
        if (circles[i] !== circle) {
            const dx = circle.x - circles[i].x;
            const dy = circle.y - circles[i].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = circle.radius + circles[i].radius;

            if (distance < minDistance) {
                // calculate the amount of overlap
                const overlap = minDistance - distance;

                // move the circles away from each other
                const moveX = dx / distance * overlap * 0.5;
                const moveY = dy / distance * overlap * 0.5;
                circle.x += moveX;
                circle.y += moveY;
                circles[i].x -= moveX;
                circles[i].y -= moveY;

                // reverse the velocity of both circles
                circle.dx = -circle.dx;
                circle.dy = -circle.dy;
                circles[i].dx = -circles[i].dx;
                circles[i].dy = -circles[i].dy;
            }
        }
    }
}


function drawCircles() {
    for (let i = 0; i < circles.length; i++) {
        const circle = circles[i];
        const pathColor = getRandomColor(); // generate a random color
        ctx.fillStyle = pathColor;
        ctx.strokeStyle = pathColor;
        ctx.drawImage(svgImage, circle.x - circle.radius, circle.y - circle.radius, circle.radius * 2, circle.radius * 2);
    }
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < circles.length; i++) {
        const circle = circles[i];

        circle.x += circle.dx;
        circle.y += circle.dy;

        checkCollisions(circle);

        drawCircles();

        if (circle.x - circle.radius < 0) {
            circle.x = circle.radius;
            circle.dx = -circle.dx;
        } else if (circle.x + circle.radius > canvas.width) {
            circle.x = canvas.width - circle.radius;
            circle.dx = -circle.dx;
        }
        if (circle.y - circle.radius < 0) {
            circle.y = circle.radius;
            circle.dy = -circle.dy;
        } else if (circle.y + circle.radius > canvas.height) {
            circle.y = canvas.height - circle.radius;
            circle.dy = -circle.dy;
        }

        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
    }

    requestAnimationFrame(update);
}

window.addEventListener("resize", resizeCanvas);

update();
