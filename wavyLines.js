// Color variables
let frontColor = [255, 255, 255]; // White (front/top)
let backColor = [0, 0, 0]; // Black (back/bottom)
let typingColor = [100, 200, 255]; // Light blue
let bgColor = [0, 0, 0]; // Black background

let noodles = [];
let numNoodles = 200;
let isTyping = false;

function setup() {
    const gallery = document.querySelector('.gallery');
    const canvas = createCanvas(gallery.offsetWidth, gallery.offsetHeight);
    canvas.parent('gallery');

    // Create noodles distributed across the screen (top view)
    for (let i = 0; i < numNoodles; i++) {
        noodles.push(new Noodle());
    }

    // Sort by depth so we draw back to front
    noodles.sort((a, b) => a.depth - b.depth);
}

function draw() {
    background(bgColor);

    // Draw all noodles
    for (let noodle of noodles) {
        noodle.update();
        noodle.display();
    }
}

class Noodle {
    constructor() {
        // Random position on screen (top view distribution)
        this.x = random(width);
        this.y = random(height);

        // Depth factor (0 = bottom/back, 1 = top/front)
        this.depth = random(1);

        // Noodle properties
        this.length = random(50, 150);
        this.segments = 15;
        this.angle = random(TWO_PI); // Random orientation
        this.points = [];

        // Motion properties
        this.noiseOffset = random(1000);
        this.swaySpeed = random(0.005, 0.015);

        // Initialize segments
        for (let i = 0; i < this.segments; i++) {
            this.points.push({ x: this.x, y: this.y });
        }
    }

    update() {
        let time = millis() * 0.001;

        // Calculate shape based on noise and mouse interaction
        let currentX = this.x;
        let currentY = this.y;

        this.points[0] = { x: currentX, y: currentY }; // Anchor point

        for (let i = 1; i < this.segments; i++) {
            // Natural swaying motion using noise
            let n = noise(this.noiseOffset + i * 0.1, time * 0.5);
            let swayAngle = map(n, 0, 1, -1, 1) + this.angle;

            // Segment length
            let segLen = this.length / this.segments;

            // Calculate next point position
            let nextX = currentX + cos(swayAngle) * segLen;
            let nextY = currentY + sin(swayAngle) * segLen;

            // Mouse interaction (repel)
            let d = dist(mouseX, mouseY, nextX, nextY);
            if (d < 100) {
                let repelForce = map(d, 0, 100, 20, 0);
                let repelAngle = atan2(nextY - mouseY, nextX - mouseX);
                nextX += cos(repelAngle) * repelForce;
                nextY += sin(repelAngle) * repelForce;
            }

            this.points[i] = { x: nextX, y: nextY };
            currentX = nextX;
            currentY = nextY;
        }
    }

    display() {
        let c;
        if (isTyping) {
            c = [
                lerp(backColor[0], typingColor[0], this.depth),
                lerp(backColor[1], typingColor[1], this.depth),
                lerp(backColor[2], typingColor[2], this.depth)
            ];
        } else {
            c = [
                lerp(backColor[0], frontColor[0], this.depth),
                lerp(backColor[1], frontColor[1], this.depth),
                lerp(backColor[2], frontColor[2], this.depth)
            ];
        }

        // Add glow to the top/front noodles
        if (this.depth > 0.7) {
            drawingContext.shadowBlur = 10 * this.depth;
            drawingContext.shadowColor = `rgba(${c[0]}, ${c[1]}, ${c[2]}, 0.6)`;
        } else {
            drawingContext.shadowBlur = 0;
        }

        noFill();
        stroke(c[0], c[1], c[2]);
        strokeWeight(5); // Constant 5px width
        strokeCap(ROUND); // Rounded ends like noodles

        beginShape();
        for (let p of this.points) {
            curveVertex(p.x, p.y);
        }
        endShape();

        drawingContext.shadowBlur = 0;
    }
}

function setTypingState(typing) {
    isTyping = typing;
}

function windowResized() {
    const gallery = document.querySelector('.gallery');
    if (gallery) {
        resizeCanvas(gallery.offsetWidth, gallery.offsetHeight);
        // Re-distribute noodles on resize
        noodles = [];
        for (let i = 0; i < numNoodles; i++) {
            noodles.push(new Noodle());
        }
        noodles.sort((a, b) => a.depth - b.depth);
    }
}
