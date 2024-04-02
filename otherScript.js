// Function to reset the scroll position to the top
function resetScroll() {
    window.scrollTo(0, 0);
  }
  
  // Event listener for scrolling
  window.addEventListener('scroll', function () {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
      resetScroll();
    }
  });