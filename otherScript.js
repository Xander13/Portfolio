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

//Card Magic
document.addEventListener('DOMContentLoaded', () => {
  const canvases = document.querySelectorAll('.canvas');
  const canvas1 = canvases[0];
  const canvas2 = canvases[1];
  const cards1 = canvas1.querySelectorAll('.card');
  const cards2 = canvas2.querySelectorAll('.card');
  let activeCard = null;
  let activeCardIndex = null;
  let offsetX, offsetY;

  // Function to randomize initial card positions and rotations around the perimeter
  function randomizeCardPositions(cards, canvas) {
      cards.forEach(card => {
          let x, y;
          const edgePosition = Math.random();
          if (edgePosition < 0.25) {
              // Left edge
              x = 0;
              y = Math.random() * canvas.clientHeight;
          } else if (edgePosition < 0.5) {
              // Top edge
              x = Math.random() * canvas.clientWidth;
              y = 0;
          } else if (edgePosition < 0.75) {
              // Right edge
              x = canvas.clientWidth - card.clientWidth;
              y = Math.random() * canvas.clientHeight;
          } else {
              // Bottom edge
              x = Math.random() * canvas.clientWidth;
              y = canvas.clientHeight - card.clientHeight;
          }
          const rotation = (Math.random() * 48) - 24; // Rotation between -16 and 16 degrees
          card.style.left = `${x}px`;
          card.style.top = `${y}px`;
          card.style.transform = `rotate(${rotation}deg)`;
      });
  }

  // Function to synchronize positions and rotations between canvases
  function synchronizeCardPositions() {
      const cardPositions = [];
      const cardRotations = [];

      // Randomize card positions for the first canvas and store them
      randomizeCardPositions(cards1, canvas1);
      cards1.forEach(card => {
          cardPositions.push({ left: card.style.left, top: card.style.top });
          cardRotations.push(card.style.transform);
      });

      // Apply the stored positions and rotations to the second canvas
      cards2.forEach((card, index) => {
          card.style.left = cardPositions[index].left;
          card.style.top = cardPositions[index].top;
          card.style.transform = cardRotations[index];
      });
  }

  synchronizeCardPositions();

  const handleMouseDown = (e, card, index) => {
      activeCard = card;
      activeCardIndex = index;
      offsetX = e.clientX - card.getBoundingClientRect().left;
      offsetY = e.clientY - card.getBoundingClientRect().top;
      card.style.zIndex = 1000; // bring to front
  };

  const handleMouseMove = (e, canvas) => {
      if (activeCard) {
          const x = e.clientX - offsetX;
          const y = e.clientY - offsetY;

          // Constrain within the canvas boundaries
          const canvasRect = canvas.getBoundingClientRect();
          if (x >= 0 && x <= canvasRect.width - activeCard.clientWidth && y >= 0 && y <= canvasRect.height - activeCard.clientHeight) {
              activeCard.style.left = `${x}px`;
              activeCard.style.top = `${y}px`;

              // Synchronize the position with the corresponding card in the other canvas
              if (canvas === canvas1) {
                  cards2[activeCardIndex].style.left = `${x}px`;
                  cards2[activeCardIndex].style.top = `${y}px`;
              } else {
                  cards1[activeCardIndex].style.left = `${x}px`;
                  cards1[activeCardIndex].style.top = `${y}px`;
              }
          }
      }
  };

  const handleMouseUp = () => {
      if (activeCard) {
          activeCard.style.zIndex = ''; // reset z-index
          activeCard = null;
          activeCardIndex = null;
      }
  };

  cards1.forEach((card, index) => {
      card.addEventListener('mousedown', (e) => handleMouseDown(e, card, index));
  });

  cards2.forEach((card, index) => {
      card.addEventListener('mousedown', (e) => handleMouseDown(e, card, index));
  });

  document.addEventListener('mousemove', (e) => handleMouseMove(e, canvas1));
  document.addEventListener('mousemove', (e) => handleMouseMove(e, canvas2));
  document.addEventListener('mouseup', handleMouseUp);
});