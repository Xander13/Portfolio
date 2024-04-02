//copy text to clipboard
let text = 'xanderkau13@gmail.com';

const changeText = document.querySelector("#change-text");

// Initial message
changeText.textContent = "Click to copy email to clipboard";

const copyContent = async () => {
  try {
    await navigator.clipboard.writeText(text);
    console.log('Content copied to clipboard');
    changeText.textContent = "Copied!";
    // Timeout to change the message
    setTimeout(() => {
      changeText.textContent = "Click to copy email to clipboard";
    }, 2000);
  } catch (err) {
    console.error('Failed to copy: ', err);
    changeText.textContent = "Failed to copy. Please try manually.";
  }
};

changeText.addEventListener("click", copyContent);


//Image flipper 
document.addEventListener("DOMContentLoaded", function () {
  const images = document.querySelectorAll("#video-container .image");
  let index = 0;

  function showImage() {
    images.forEach(image => {
      image.classList.remove("active");
    });
    images[index].classList.add("active");
    index = (index + 1) % images.length;
    setTimeout(showImage, 1200);
  }
  showImage();
});

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

  //Clickable drop down
  const drawers = document.querySelectorAll('.drawer');

  drawers.forEach(drawer => {
    drawer.addEventListener('click', function () {
      this.classList.toggle('opened');
    });
  });
});