// Function to reset the scroll position to the top
function resetScroll() {
  window.scrollTo(0, 0);
}

// Function to check if scrolling to the bottom
function checkScroll() {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
      resetScroll();
  }
}

// Event listener for scrolling
window.addEventListener('scroll', checkScroll);

// Event listener for window resize
window.addEventListener('resize', checkScroll);
  

//toogle light and dark mode
const toggleButton = document.getElementById('toggle-button');
toggleButton.addEventListener('click', () => {
  document.body.classList.toggle('lightMode');
});


document.addEventListener('DOMContentLoaded', function () {
  //motion text
  const textLines = document.querySelectorAll('.line');
  let delay = 0;

  textLines.forEach(function (line) {
    line.style.animationDelay = delay + 's';
    delay += 0.5; // Increase delay for each line
  });

  //cursor
  const cursorRounded = document.querySelector('#arrow');

  const moveCursor = (e) => {
    const mouseY = e.clientY;
    const mouseX = e.clientX;
    cursorRounded.style.transform = `translate3d(${mouseX - 160}px, ${mouseY - 160}px, 0)`;
  }

  window.addEventListener('mousemove', moveCursor);
});


//arrow funcction
// Get the scroll arrow element
const scrollArrow = document.getElementById('scrollArrow');

// Add a scroll event listener to the window
window.addEventListener('scroll', () => {
    if (window.scrollY > 200) {
        scrollArrow.innerHTML = '&#x2191;';
    } else {
        scrollArrow.innerHTML = '&#8595;';
    }
});

// Add a click event listener to the arrow to scroll to the top
scrollArrow.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

//loop roles
let looper = ["Visual Design", "Brand Design", "UI Design"];
                    let index = 0;
                    const looperElement = document.getElementById('looper');

                    function updateText() {
                        looperElement.textContent = looper[index];
                        index = (index + 1) % looper.length; // Increment index and wrap around
                    }

                    // Initial call
                    updateText();

                    // Update text every 4 seconds
                    setInterval(updateText, 4000);