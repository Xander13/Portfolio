let particles = [];
let img;
let resizeTimeout;

function preload() {
    img = loadImage('Image_AK_Alt.png');
}

function setup() {
    const gallery = document.querySelector('.gallery');
    const canvas = createCanvas(gallery.offsetWidth, gallery.offsetHeight);
    canvas.parent('gallery');
    clear(); // sets transparent background once

    // Object fit: COVER
    let scaleW = width / img.width;
    let scaleH = height / img.height;
    let scaleFactor = min(scaleW, scaleH);  // contain

    let finalW = img.width * scaleFactor;
    let finalH = img.height * scaleFactor;

    // Center the image
    let offsetX = (width - finalW) / 2;
    let offsetY = height - finalH;   // sits flush at the bottom

    img.loadPixels();

    let step = 5;
    let imageTargets = [];

    for (let y = 0; y < img.height; y += step) {
        for (let x = 0; x < img.width; x += step) {
            let index = (x + y * img.width) * 4;
            let r = img.pixels[index];
            let g = img.pixels[index + 1];
            let b = img.pixels[index + 2];
            let a = img.pixels[index + 3];

            if (a > 50 && (r + g + b) / 3 > 20) {
                imageTargets.push({
                    x: (x * scaleFactor) + offsetX,
                    y: (y * scaleFactor) + offsetY,
                    c: [r, g, b]
                });
            }
        }
    }

    particles = [];
    for (let i = 0; i < imageTargets.length; i++) {
        particles.push(new Particle(imageTargets[i]));
    }
}

function draw() {
    clear();

    strokeWeight(2);

    for (let p of particles) {
        p.update();
        p.display();
    }
}

class Particle {
    constructor(target) {
        this.baseX = target.x;
        this.baseY = target.y;
        this.x = this.baseX;
        this.y = this.baseY;
        this.c = target.c;
        this.size = 2; // Initialize size
        this.vx = 0;
        this.vy = 0;
        this.alpha = 255; // Add alpha for fading
    }

    update() {
        if (isScattered) {
            // Move and fade out
            this.x += this.vx;
            this.y += this.vy;
            this.vx *= 0.98;
            this.vy *= 0.98;
            this.alpha = Math.max(0, this.alpha - 2); // Fade out
            return;
        }

        // Spring back to original position
        let dx = this.baseX - this.x;
        let dy = this.baseY - this.y;
        this.vx += dx * 0.05;
        this.vy += dy * 0.05;

        // Subtle "Swiggle" (Perlin Noise)
        // Uses frameCount and position to create unique, smooth motion for each dot
        let noiseScale = 0.01;
        let timeScale = 0.005;
        let nX = noise(this.baseX * noiseScale, this.baseY * noiseScale, frameCount * timeScale);
        let nY = noise(this.baseX * noiseScale + 1000, this.baseY * noiseScale + 1000, frameCount * timeScale);

        // Map noise (0-1) to a small range (-0.5 to 0.5)
        this.vx += map(nX, 0, 1, -0.05, 0.05);
        this.vy += map(nY, 0, 1, -0.05, 0.05);

        // Mouse Repel
        let d = dist(mouseX, mouseY, this.x, this.y);
        if (d < 100) {
            let angle = atan2(this.y - mouseY, this.x - mouseX);
            let force = map(d, 0, 100, 20, 0);
            this.vx += cos(angle) * force;
            this.vy += sin(angle) * force;
        }

        // Pulse Effect (triggered by chat)
        if (pulseStrength > 0) {
            let dCenter = dist(pulseCenterX, pulseCenterY, this.x, this.y);
            // Wave moves outward from center
            let wave = sin(dCenter * 0.05 - frameCount * pulseSpeed);
            let force = wave * pulseStrength * 2;

            // Add some random jitter for "energy" feel
            this.vx += random(-1, 1) * pulseStrength * 0.5;
            this.vy += random(-1, 1) * pulseStrength * 0.5;

            this.x += force;
            this.y += force;
        }

        // Continuous Pulse Loop (AI Typing)
        if (isPulseLooping) {
            // Throb pulseStrength using sine wave
            pulseStrength = map(sin(frameCount * 0.1), -1, 1, 2, 8);
            // Slowly move center
            pulseCenterX = width / 2 + sin(frameCount * 0.02) * 50;
            pulseCenterY = height / 2 + cos(frameCount * 0.03) * 50;
        }

        // Physics
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.9; // Damping
        this.vy *= 0.9;
    }

    display() {
        // Boost colors for higher contrast
        let boost = 1.4;
        let r = min(255, this.c[0] * boost);
        let g = min(255, this.c[1] * boost);
        let b = min(255, this.c[2] * boost);

        stroke(r, g, b, this.alpha); // Use dynamic alpha
        strokeWeight(this.size);
        point(this.x, this.y);
    }
}

// Global pulse variables
let pulseStrength = 0;
let pulseCenterX = 0;
let pulseCenterY = 0;
let pulseSpeed = 0.05;
let isScattered = false;
let isPulseLooping = false;

// Function to trigger a single pulse
window.triggerPulse = function () {
    if (isScattered || isPulseLooping) return; // Don't interrupt scatter or loop

    pulseStrength = random(4, 12);
    pulseCenterX = width / 2 + random(-100, 100);
    pulseCenterY = height / 2 + random(-100, 100);
    pulseSpeed = random(0.02, 0.1);

    let interval = setInterval(() => {
        if (isPulseLooping) { clearInterval(interval); return; } // Stop decaying if looping starts
        pulseStrength *= 0.9;
        if (pulseStrength < 0.1) {
            pulseStrength = 0;
            clearInterval(interval);
        }
    }, 50);
};

// Continuous Pulse Control
window.startPulseLoop = function () {
    if (isScattered) return;
    isPulseLooping = true;
    pulseSpeed = 0.05;
};

window.stopPulseLoop = function () {
    isPulseLooping = false;
    // Decay remaining strength
    let interval = setInterval(() => {
        pulseStrength *= 0.9;
        if (pulseStrength < 0.1) {
            pulseStrength = 0;
            clearInterval(interval);
        }
    }, 50);
};

// Function to scatter particles (End Game)
window.scatterParticles = function () {
    isScattered = true;
    isPulseLooping = false;
    for (let p of particles) {
        p.vx = random(-20, 20);
        p.vy = random(-20, 20);
    }
};

function windowResized() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        const gallery = document.querySelector('.gallery');
        if (gallery) {
            resizeCanvas(gallery.offsetWidth, gallery.offsetHeight);
            setup();
        }
    }, 200);
}
