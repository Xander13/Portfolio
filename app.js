// Function to reset the scroll position to the top
function resetScroll() {
  // Check if we are on https://alex-kauffman.com/index.html or https://alex-kauffman.com/
  if (window.location.href === 'https://alex-kauffman.com/' || window.location.href === 'https://alex-kauffman.com/index.html') {
    window.scrollTo(0, 0);
  }
}

// Function to check if scrolling to the bottom
function checkScroll() {
  // Check if we are on https://alex-kauffman.com/
  if (window.location.href === 'https://alex-kauffman.com/') {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
      resetScroll();
    }
  }
}


// Event listener for scrolling
window.addEventListener('scroll', checkScroll);

// Event listener for window resize
window.addEventListener('resize', checkScroll);

// Toggle light and dark mode
const toggleButton = document.getElementById('toggle-button');
if (toggleButton) {
  toggleButton.addEventListener('click', () => {
    document.body.classList.toggle('lightMode');
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
