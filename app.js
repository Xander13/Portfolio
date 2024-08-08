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

// Scroll arrow
const scrollArrow = document.getElementById('scrollArrow');
if (scrollArrow) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 200) {
      scrollArrow.innerHTML = '&#x2191;';
    } else {
      scrollArrow.innerHTML = '&#8595;';
    }
  });

  scrollArrow.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

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

//set bg color based on clipping hover
// Function to change body background color and text color on hover
document.querySelectorAll('.clipping').forEach(function (clipping) {
  clipping.addEventListener('mouseover', function () {
    document.body.style.backgroundColor = clipping.getAttribute('data-color');
    document.body.style.color = clipping.getAttribute('data-text-color');
  });

  clipping.addEventListener('mouseout', function () {
    document.body.style.backgroundColor = '';  // Reset to default background color
    document.body.style.color = '';  // Reset to default text color
  });
});


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
  'FigmaSticker.svg',
  'heart.svg',
  'AK_Emoji.png'
];
const rotations = [30, 0, -30];
let currentStickerIndex = 0;

document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.canvas').forEach(canvas => {
        canvas.addEventListener('click', handleEvent);
        canvas.addEventListener('touchstart', handleEvent);
    });
});

function handleEvent(event) {
    event.preventDefault();
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
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
    sticker.style.left = `${x - 150}px`; // Center the sticker on the click
    sticker.style.top = `${y - 150}px`; // Center the sticker on the click
    sticker.style.transform = `rotate(${rotation}deg)`; /* Apply rotation */
    canvas.appendChild(sticker);
}