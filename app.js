//Detroit time baby
function updateDetroitTime() {
  const timeEl = document.querySelector(".time");
  if (!timeEl) return;

  // Detroit is always in America/Detroit timezone (Eastern)
  const now = new Date();
  const options = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Detroit"
  };

  const timeString = new Intl.DateTimeFormat("en-US", options).format(now);
  timeEl.textContent = `Detroit ${timeString}`;
}

//Image flip gallery mode:
function initImageFlip(container, interval = 1000) {
  const files = [
    { type: "img", src: "Google_Braille.svg" },
    { type: "video", src: "Google_Braile.mp4" },
    { type: "img", src: "HookMenu.gif" },
    { type: "video", src: "Hood.mp4" },
    { type: "video", src: "AppleMusicCoverFlow.MP4" }
  ];

  container.innerHTML = "";

  const elements = files.map((file, i) => {
    let el;

    if (file.type === "video") {
      el = document.createElement("video");
      el.src = file.src;
      el.muted = true;
      el.loop = true;
      el.playsInline = true;
    } else {
      el = document.createElement("img");
      el.src = file.src;
    }

    el.style.display = i === 0 ? "block" : "none";
    el.style.zIndex = files.length - i;

    container.appendChild(el);
    return el;
  });

  let index = 0;

  setInterval(() => {
    const current = elements[index];
    current.style.display = "none";

    if (current.tagName === "VIDEO") {
      current.pause();
      current.currentTime = 0; // reset video to start
    }

    index = (index + 1) % elements.length;

    const next = elements[index];
    next.style.display = "block";
    next.style.zIndex = files.length + 1;

    if (next.tagName === "VIDEO") {
      next.currentTime = 0; // ensure video starts from beginning
      next.play();
    }
  }, interval);
}

document.querySelectorAll(".imageFLip").forEach(flip => {
  initImageFlip(flip, 3000);
});


// Initial load
updateDetroitTime();

// Optional: Update every minute
setInterval(updateDetroitTime, 60000);

//bar
document.addEventListener("DOMContentLoaded", function () {
  const canvases = document.querySelectorAll('.canvas');

  const createBars = () => {
    canvases.forEach(canvas => {
      // Remove existing bars
      while (canvas.firstChild) {
        canvas.removeChild(canvas.firstChild);
      }

      // Calculate the number of bars based on the window height
      const barHeight = 20; // Height of each bar in pixels
      const windowHeight = window.innerHeight;
      const numberOfBars = Math.floor(windowHeight / barHeight);

      // Create and append bars
      for (let i = 0; i < numberOfBars; i++) {
        const bar = document.createElement('div');
        bar.className = 'bar';
        canvas.appendChild(bar);
      }
    });
  };

  // Initial creation of bars
  createBars();

  // Update bars on window resize
  window.addEventListener('resize', createBars);
});

//stickers
const stickers = [
  'ux.svg',
  'AK_Emoji.png',
  'web.svg',
  'aklogo.svg',
  'IconDark.png'
];

const rotations = [30, 0, -30];
let currentStickerIndex = 0;
let isTouch = false; // Flag to track if a touch event was used
let isScrolling = false; // Flag to track if the user is scrolling

document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.stickerBoard').forEach(board => {
    let touchTimeout;

    board.addEventListener('touchstart', function (event) {
      isTouch = true; // Touch event detected
      isScrolling = false;

      // Store the board reference
      const currentBoard = board;

      // Clear any existing timeout
      clearTimeout(touchTimeout);

      // Start a timeout to check if this is a tap or a scroll
      touchTimeout = setTimeout(() => {
        if (!isScrolling) {
          handleEvent(event, currentBoard);
        }
      }, 100); // 100ms delay to distinguish between scroll and tap
    });

    board.addEventListener('touchmove', function () {
      isScrolling = true; // Detect touch movement as scrolling
    });

    board.addEventListener('click', function (event) {
      if (!isTouch) { // Only handle click if no touch event was detected
        handleEvent(event, board);
      }
      isTouch = false; // Reset the touch flag after the click event
    });
  });
});

function handleEvent(event, board) {
  if (event.cancelable) {
    event.preventDefault(); // Prevent default only if the event is cancelable
  }

  const rect = board.getBoundingClientRect(); // Use the passed board reference
  const x = (event.touches ? event.touches[0].clientX : event.clientX) - rect.left;
  const y = (event.touches ? event.touches[0].clientY : event.clientY) - rect.top;

  const stickerSrc = stickers[currentStickerIndex];
  const rotation = rotations[Math.floor(Math.random() * rotations.length)];

  placeSticker(document.getElementById('canvas1'), stickerSrc, x, y, rotation);
  placeSticker(document.getElementById('canvas2'), stickerSrc, x, y, rotation);

  currentStickerIndex = (currentStickerIndex + 1) % stickers.length; // Move to the next sticker
}

function placeSticker(canvas, src, x, y, rotation) {
  const sticker = document.createElement('img');
  sticker.src = src;
  sticker.className = 'sticker';
  sticker.style.position = 'absolute';

  // Make the sticker non-draggable
  sticker.draggable = false;

  // Determine screen width
  const screenWidth = window.innerWidth;

  let stickerSize;
  if (screenWidth <= 768) { // Mobile devices (768px and below)
    stickerSize = 280; // 280px minimum size for mobile
  } else if (screenWidth <= 1024) { // Tablets (769px - 1024px)
    stickerSize = 340; // 500px for tablets
  } else if (screenWidth <= 1800) { // Tablets (769px - 1024px)
    stickerSize = 400; // 500px for tablets
  } else { // Desktop (1025px and above)
    stickerSize = 500; // 800px for desktops
  }

  // Set the sticker size and position
  sticker.style.height = `${stickerSize}px`;
  sticker.style.width = 'auto'; // Maintain aspect ratio
  sticker.style.left = `${x - (stickerSize / 2)}px`; // Center the sticker on the click
  sticker.style.top = `${y - (stickerSize / 2)}px`; // Center the sticker on the click

  // Apply rotation
  sticker.style.transform = `rotate(${rotation}deg)`;

  canvas.appendChild(sticker);
}

//moving chips:
//moving chips:
const MsIcon = [
  "Github_Code_logo.png",
  "Github_Copilet_logo.png",
  "Github_Test_logo.png"
];

const appleIcon = [
  'AppleIconAccessiblity.png'
];

const NUM_TOKENS = 56;
const TOKEN_SIZE = 96;

const container = document.getElementById("container");

if (container) {
  const screenW = window.innerWidth;
  const screenH = window.innerHeight;

  // Detect which site you're on (update this condition based on your actual site detection)
  const isAppleSite = window.location.href.includes('apple'); // or however you detect Apple site

  // Choose the right icon set
  const iconSet = isAppleSite ? appleIcon : MsIcon;

  const images = [];

  // Only create ONE set of icons based on the current site
  for (let i = 0; i < NUM_TOKENS; i++) {
    const img = document.createElement("img");
    img.src = iconSet[i % iconSet.length];
    img.alt = `Token ${i}`;

    // Style the image
    img.style.width = `${TOKEN_SIZE}px`;
    img.style.height = "auto";
    img.style.position = "absolute";
    img.style.pointerEvents = "none";
    container.appendChild(img);

    // Push image data to animate array
    images.push({
      el: img,
      x: Math.random() * (screenW - TOKEN_SIZE),
      y: Math.random() * -screenH,
      speedY: 0.6 + Math.random() * 0.8,
      drift: Math.random() * 0.6 - 0.3,
      angle: Math.random() * 360,
      spinSpeed: 0.1 + Math.random() * 0.2
    });
  }

  function animate() {
    for (let img of images) {
      img.y += img.speedY;
      img.x += img.drift;
      img.angle += img.spinSpeed;

      // Wrap to top
      if (img.y > screenH + TOKEN_SIZE) {
        img.y = -TOKEN_SIZE;
        img.x = Math.random() * (screenW - TOKEN_SIZE);
      }

      // Bounce horizontally
      if (img.x < 0 || img.x > screenW - TOKEN_SIZE) {
        img.drift *= -1;
      }

      // Apply styles
      img.el.style.left = `${img.x}px`;
      img.el.style.top = `${img.y}px`;
      img.el.style.transform = `rotate(${img.angle}deg)`;
    }

    requestAnimationFrame(animate);
  }

  animate();
}