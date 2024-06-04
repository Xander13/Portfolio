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
  