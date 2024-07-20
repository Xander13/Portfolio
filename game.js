let circles = [];
let maxCircles = 10;
let mousePressedTime;
let spike;
let canvasArea;
let coveredArea = 0;
let growingCircle = null; // Track the currently growing circle

class Circle {
    constructor(x, y, initialSize) {
        this.x = x;
        this.y = y;
        this.size = initialSize;
        this.finalSize = initialSize; // Track the final size of the circle
        this.growing = true; // Flag to track if the circle is still growing
        this.velocity = 0; // Initialize velocity for falling
    }

    update() {
        if (this.growing) {
            // Update position to follow mouse
            this.x = mouseX;
            this.y = mouseY;

            // Increase size while the mouse is pressed
            let duration = millis() - mousePressedTime;
            this.finalSize = map(duration, 0, 1000, 100, 800); // Adjust final size based on duration
            this.size = constrain(this.size + 0.5, 100, this.finalSize); // Gradually increase size

            // Check for collision with spike while growing
            if (spike.isTouching(this)) {
                circles.splice(circles.indexOf(this), 1); // Remove the circle if it pops
                return; // Exit update if circle pops
            }

            if (this.size >= this.finalSize) {
                this.growing = false; // Stop growing when target size is reached
            }
        } else {
            // Apply gravity if not growing
            this.velocity += 0.1; // Gravity force
            this.y += this.velocity;

            // Stop falling if hitting the bottom
            if (this.y + this.size / 2 > height) {
                this.y = height - this.size / 2;
                this.velocity = 0; // Stop movement after hitting the bottom
            }
        }
    }

    display() {
        noFill();
        stroke(0); // Black color for stroke
        strokeWeight(4); // 4px thick stroke
        fill(255); // White color for fill
        ellipse(this.x, this.y, this.size);
    }

    isTouching(other) {
        let distance = dist(this.x, this.y, other.x, other.y);
        return distance < (this.size + other.size) / 2 + 6; // 6px gap
    }

    moveAwayFrom(other) {
        let distance = dist(this.x, this.y, other.x, other.y);
        let minDistance = (this.size + other.size) / 2 + 6; // Minimum distance to maintain

        if (distance < minDistance) {
            let overlap = minDistance - distance;
            let angle = atan2(this.y - other.y, this.x - other.x);
            let moveX = cos(angle) * overlap / 2;
            let moveY = sin(angle) * overlap / 2;

            this.x += moveX;
            this.y += moveY;
            other.x -= moveX;
            other.y -= moveY;
        }
    }

    keepInBounds() {
        this.x = constrain(this.x, this.size / 2 + 6, width - this.size / 2 - 6);
        this.y = constrain(this.y, this.size / 2 + 6, height - this.size / 2 - 6);
    }

    area() {
        return PI * (this.size / 2) ** 2;
    }
}

class Spike {
    constructor() {
        this.x = width / 2;
        this.y = height / 2;
        this.size = 20;
        this.speed = 3;
        this.direction = 1; // 1 for right, -1 for left
        this.avoidanceRadius = 100;
    }

    update() {
        this.x += this.speed * this.direction;

        // Bounce off the edges of the canvas
        if (this.x > width - this.size / 2 || this.x < this.size / 2) {
            this.direction *= -1;
        }
    }

    display() {
        noStroke();
        fill(255, 0, 0); // Red color for the spike
        triangle(
            this.x, this.y - this.size / 2,
            this.x - this.size / 2, this.y + this.size / 2,
            this.x + this.size / 2, this.y + this.size / 2
        );
    }

    avoidCircles(circles) {
        for (let circle of circles) {
            let distance = dist(this.x, this.y, circle.x, circle.y);
            if (distance < this.avoidanceRadius) {
                let angle = atan2(circle.y - this.y, circle.x - this.x);
                this.x -= cos(angle) * this.speed;
                this.y -= sin(angle) * this.speed;
            }
        }
    }

    isTouching(circle) {
        let distance = dist(this.x, this.y, circle.x, circle.y);
        return distance < (this.size + circle.size) / 2;
    }
}

function setup() {
    let canvas = createCanvas(windowWidth, windowHeight);
    canvas.class('gameCanvas'); // Set the class to 'gameCanvas'
    spike = new Spike();
    canvasArea = width * height;
}

function draw() {
    clear();
    spike.update();
    spike.display();

    coveredArea = 0;
    for (let i = circles.length - 1; i >= 0; i--) {
        let circle = circles[i];
        if (circle) {
            circle.update();
            circle.keepInBounds();
            circle.display();
            coveredArea += circle.area();

            // Ensure no circles are overlapping
            for (let j = 0; j < circles.length; j++) {
                if (i !== j) {
                    let otherCircle = circles[j];
                    circle.moveAwayFrom(otherCircle);
                }
            }
        }
    }

    if (!mouseIsPressed) {
        spike.avoidCircles(circles);
    }

    // Display score
    displayScore();
}

function displayScore() {
    let uncoveredArea = canvasArea - coveredArea;
    let percentage = max(0, min(100, (coveredArea / canvasArea) * 100)); // Ensure percentage is within 0-100%
    fill(255); // White color for text
    noStroke();
    textSize(16);
    textAlign(RIGHT, BOTTOM);
    text(`Score: ${Math.round(percentage)}%`, width - 10, height - 10);
}

function mousePressed() {
    if (circles.length >= maxCircles) {
        return; // Prevent creating new circles if the limit is reached
    }

    mousePressedTime = millis();
    let newCircle = new Circle(mouseX, mouseY, 100); // Start with minimum size of 100
    growingCircle = newCircle; // Set the newly created circle as active
    circles.push(newCircle);

    // Check for collisions with existing circles
    for (let circle of circles) {
        if (newCircle.isTouching(circle) && circle !== growingCircle) {
            // If touching, remove the circle and set growingCircle to null
            circles.splice(circles.indexOf(circle), 1);
            break;
        }
    }
}

function mouseReleased() {
    if (growingCircle) {
        // Compute the final size based on the time mouse was pressed
        let duration = millis() - mousePressedTime;
        let finalSize = map(duration, 0, 1000, 100, 800); // Map duration to size range
        growingCircle.size = finalSize;
        growingCircle.finalSize = finalSize; // Set final size
        growingCircle.growing = false; // Stop growing and start falling
        growingCircle = null; // Clear the active circle
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    canvasArea = width * height;
    // Ensure spike stays within canvas bounds
    spike.x = constrain(spike.x, spike.size / 2, width - spike.size / 2);
    spike.y = constrain(spike.y, spike.size / 2, height - spike.size / 2);
}
