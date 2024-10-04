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
// Reset scroll on page load
resetScroll();

// Event listener for scrolling
window.addEventListener('scroll', checkScroll);


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


//fade in the page
document.addEventListener("DOMContentLoaded", function() {
  // Initial fade-in after page load
  setTimeout(() => {
      document.body.classList.remove("fade-out"); // Remove fade-out class
      document.body.classList.add("fade-in"); // Add fade-in class
  }, 1000); // 1 second delay for the initial fade-in

  // Fade out on link click
  const links = document.querySelectorAll('.fade-link');
  links.forEach(link => {
      link.addEventListener('click', function(event) {
          event.preventDefault(); // Prevent default link behavior
          const targetUrl = this.href; // Store the target URL

          // Add fade-out class to body
          document.body.classList.remove("fade-in");
          document.body.classList.add("fade-out");

          // Immediately redirect to the new page
          window.location.href = targetUrl; // Redirect to the new page
      });
  });

  // Debounce function to limit how often a function can be called
  function debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
          const later = () => {
              clearTimeout(timeout);
              func(...args);
          };
          clearTimeout(timeout);
          timeout = setTimeout(later, wait);
      };
  }

  // Use the debounce function for the resize event
  window.addEventListener('resize', debounce(function() {
      if (window.innerWidth === 980) { // Check if the window width is 980px
          document.body.classList.remove("fade-out"); // Remove fade-out class if present
          document.body.classList.add("fade-in"); // Add fade-in class
      }
  }, 300)); // Adjust the wait time as needed
});
