function resetScroll() {
  const url = window.location.href;

  // Check if we are on https://alex-kauffman.com/ or https://alex-kauffman.com/index.html or the equivalent without protocol
  if (url === 'https://alex-kauffman.com/' || url === 'https://alex-kauffman.com/index.html' ||
    url === 'http://alex-kauffman.com/' || url === 'http://alex-kauffman.com/index.html' ||
    url === 'alex-kauffman.com/' || url === 'alex-kauffman.com/index.html') {
    window.scrollTo(0, 0);
  }
}

// Function to check if scrolling to the bottom
function checkScroll() {
  const url = window.location.href;

  // Check if we are on https://alex-kauffman.com/ or http://alex-kauffman.com/ or the equivalent without protocol
  if (url === 'https://alex-kauffman.com/' || url === 'http://alex-kauffman.com/' ||
    url === 'alex-kauffman.com/') {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
      resetScroll();
    }
  }
}

// Add event listener to check scroll position
window.addEventListener('scroll', checkScroll);

// Reset scroll on page load
resetScroll();


// Event listener for scrolling
window.addEventListener('scroll', checkScroll);

// Event listener for window resize
window.addEventListener('resize', checkScroll);

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

// Motion text and cursor
document.addEventListener('DOMContentLoaded', function () {
  const textLines = document.querySelectorAll('.line');
  let delay = 0;
  textLines.forEach(function (line) {
    line.style.animationDelay = delay + 's';
    delay += 0.5; // Increase delay for each line
  });

  const cursorRounded = document.querySelector('#arrow');
  const moveCursor = (e) => {
    const mouseY = e.clientY;
    const mouseX = e.clientX;
    cursorRounded.style.transform = `translate3d(${mouseX - 160}px, ${mouseY - 160}px, 0)`;
  }
  window.addEventListener('mousemove', moveCursor);
});

// Copy text to clipboard
function copyContent() {
  let text = 'xanderkau13@gmail.com';
  const changeText = document.querySelector("#change-text");

  try {
    navigator.clipboard.writeText(text)
      .then(() => {
        console.log('Content copied to clipboard');
        changeText.textContent = "Copied!";
        // Timeout to change the message
        setTimeout(() => {
          changeText.textContent = "Click to copy email to clipboard";
        }, 2000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        changeText.textContent = "Failed to copy. Please try manually.";
      });
  } catch (err) {
    console.error('Failed to copy: ', err);
    changeText.textContent = "Failed to copy. Please try manually.";
  }
}

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
  'face.svg',
  'AK_Emoji.png',
  'web.svg',
  'AK_IMG.png',
  'alogo.svg'
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

// This part keeps the rect moving with the scroll when not being dragged
document.addEventListener("scroll", function() {
    if (!isDragging) { // Only update the rect if not dragging
        let documentHeight = document.documentElement.scrollHeight;
        let scrollTop = document.documentElement.scrollTop;
        let windowHeight = window.innerHeight;

        let scrollPercent = scrollTop / (documentHeight - windowHeight);
        let newPosition = (180 - 12) * scrollPercent;

        rect.style.top = newPosition + "px";
    }
});

