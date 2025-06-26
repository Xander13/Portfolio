document.addEventListener('DOMContentLoaded', () => {
  const infoButton = document.getElementById("infoSlider");
  const infoBox = document.querySelector(".infoBox");
  const infoDoorTop = infoBox.querySelector(".doorTop");
  const infoDoorBottom = infoBox.querySelector(".doorBottom");
  const infoFade = infoBox.querySelector(".FadeInAssets");

  const indexBox = document.querySelector(".index");
  const indexButton = document.getElementById("index");
  const indexDoorTop = indexBox.querySelector(".doorTop");
  const indexDoorBottom = indexBox.querySelector(".doorBottom");
  const indexFade = indexBox.querySelector(".FadeInAssets");

  const readButton = document.getElementById("readSlider");
  const readBox = document.querySelector(".readsBox");
  const readDoorTop = readBox.querySelector(".doorTop");
  const readDoorBottom = readBox.querySelector(".doorBottom");
  const readFade = readBox.querySelector(".FadeInAssets");

  const workButton = document.querySelector(".flexBox a[href='#']:not(#infoSlider):not(#index):not(#readSlider):not(.branding)");

  let allNavLinks = Array.from(document.querySelectorAll(".flexBox a:not(.branding)"));
  if (!allNavLinks.includes(readButton)) allNavLinks.push(readButton);

  let infoOpen = false;
  let indexOpen = false;
  let readOpen = false;

  // === INFO / MX PANEL ===
  infoButton.addEventListener("click", function (e) {
    e.preventDefault();

    if (!infoOpen) {
      if (!indexOpen && !readOpen) {
        $(infoBox).fadeIn(0);
        setTimeout(() => {
          infoDoorTop.style.top = "0";
          infoDoorBottom.style.bottom = "0";
        }, 10);
      }

      infoBox.style.visibility = "visible";
      infoBox.style.opacity = "1";

      setTimeout(() => {
        infoFade.style.opacity = "1";
      }, 600);

      if (indexOpen) {
        indexFade.style.opacity = "0";
        setTimeout(() => {
          $(indexBox).fadeOut(0);
          indexOpen = false;
        }, 300);
      }

      if (readOpen) {
        readFade.style.opacity = "0";
        setTimeout(() => {
          $(readBox).fadeOut(0);
          readOpen = false;
        }, 300);
      }

      allNavLinks.forEach(link => link.classList.remove("activeState"));
      infoButton.classList.add("activeState");
      infoOpen = true;
    } else {
      infoFade.style.opacity = "0";

      setTimeout(() => {
        infoDoorTop.style.top = "-50%";
        infoDoorBottom.style.bottom = "-50%";
      }, 300);

      setTimeout(() => {
        infoBox.style.opacity = "0";
        infoBox.style.visibility = "hidden";
        infoOpen = false;
      }, 900);

      infoButton.classList.remove("activeState");
      workButton.classList.add("activeState");
    }
  });

  // === INDEX PANEL ===
  indexButton.addEventListener("click", function (e) {
    e.preventDefault();

    if (!indexOpen) {
      if (!infoOpen && !readOpen) {
        $(indexBox).fadeIn(0);
        setTimeout(() => {
          indexDoorTop.style.top = "0";
          indexDoorBottom.style.bottom = "0";
        }, 10);
      }

      if (infoOpen) {
        infoFade.style.opacity = "0";
        setTimeout(() => {
          infoBox.style.opacity = "0";
          infoBox.style.visibility = "hidden";
          infoOpen = false;

          $(indexBox).fadeIn(0);
          setTimeout(() => {
            indexDoorTop.style.top = "0";
            indexDoorBottom.style.bottom = "0";
          }, 10);
        }, 300);
      }

      if (readOpen) {
        readFade.style.opacity = "0";
        setTimeout(() => {
          $(readBox).fadeOut(0);
          readOpen = false;
        }, 300);
      }

      setTimeout(() => {
        indexFade.style.opacity = "1";
      }, 600);

      allNavLinks.forEach(link => link.classList.remove("activeState"));
      indexButton.classList.add("activeState");
      indexOpen = true;
    } else {
      indexFade.style.opacity = "0";

      setTimeout(() => {
        indexDoorTop.style.top = "-50%";
        indexDoorBottom.style.bottom = "-50%";
      }, 300);

      setTimeout(() => {
        $(indexBox).fadeOut(300);
        indexButton.classList.remove("activeState");
        workButton.classList.add("activeState");
        indexOpen = false;
      }, 900);
    }
  });

  // === READS PANEL ===
  readButton.addEventListener("click", function (e) {
    e.preventDefault();

    if (!readOpen) {
      if (!infoOpen && !indexOpen) {
        $(readBox).fadeIn(0);
        setTimeout(() => {
          readDoorTop.style.top = "0";
          readDoorBottom.style.bottom = "0";
        }, 10);
      }

      readBox.style.display = "block";
      readBox.style.visibility = "visible";
      readBox.style.opacity = "1";

      setTimeout(() => {
        readFade.style.opacity = "1";
      }, 600);

      if (infoOpen) {
        infoFade.style.opacity = "0";
        setTimeout(() => {
          $(infoBox).fadeOut(0);
          infoBox.style.opacity = "0";
          infoBox.style.visibility = "hidden";
          infoBox.style.display = "none";
          infoOpen = false;
        }, 300);
      }

      if (indexOpen) {
        indexFade.style.opacity = "0";
        setTimeout(() => {
          $(indexBox).fadeOut(0);
          indexBox.style.opacity = "0";
          indexBox.style.visibility = "hidden";
          indexBox.style.display = "none";
          indexOpen = false;
        }, 300);
      }

      allNavLinks.forEach(link => link.classList.remove("activeState"));
      readButton.classList.add("activeState");
      readOpen = true;
    } else {
      readFade.style.opacity = "0";

      setTimeout(() => {
        readDoorTop.style.top = "-50%";
        readDoorBottom.style.bottom = "-50%";
      }, 300);

      setTimeout(() => {
        readBox.style.opacity = "0";
        readBox.style.visibility = "hidden";
        readBox.style.display = "none";
        readOpen = false;
      }, 900);

      readButton.classList.remove("activeState");
      workButton.classList.add("activeState");
    }
  });

  // === WORK PANEL ===
  workButton.addEventListener("click", function (e) {
    e.preventDefault();

    if (infoOpen) {
      infoFade.style.opacity = "0";
      setTimeout(() => {
        infoDoorTop.style.top = "-50%";
        infoDoorBottom.style.bottom = "-50%";
      }, 300);
      setTimeout(() => {
        infoBox.style.opacity = "0";
        infoBox.style.visibility = "hidden";
        infoOpen = false;
      }, 900);
    }

    if (indexOpen) {
      indexFade.style.opacity = "0";
      setTimeout(() => {
        indexDoorTop.style.top = "-50%";
        indexDoorBottom.style.bottom = "-50%";
      }, 300);
      setTimeout(() => {
        $(indexBox).fadeOut(0);
        indexOpen = false;
      }, 900);
    }

    if (readOpen) {
      readFade.style.opacity = "0";
      setTimeout(() => {
        readDoorTop.style.top = "-50%";
        readDoorBottom.style.bottom = "-50%";
      }, 300);
      setTimeout(() => {
        readBox.style.opacity = "0";
        readBox.style.visibility = "hidden";
        readOpen = false;
      }, 900);
    }

    allNavLinks.forEach(link => link.classList.remove("activeState"));
    workButton.classList.add("activeState");
  });

  // === Active bar movement ===
  const activeBar = document.getElementById('activeBar');
  function moveActiveBarTo(el) {
    const rect = el.getBoundingClientRect();
    const parentRect = el.parentElement.getBoundingClientRect();
    activeBar.style.left = `${rect.left - parentRect.left}px`;
    activeBar.style.width = `${rect.width}px`;
  }

  moveActiveBarTo(workButton);

  allNavLinks.forEach(link => {
    link.addEventListener('mouseenter', () => moveActiveBarTo(link));
    link.addEventListener('mouseleave', () => {
      const activeLink = document.querySelector('.activeState');
      if (activeLink) moveActiveBarTo(activeLink);
    });

    link.addEventListener('click', () => {
      allNavLinks.forEach(l => l.classList.remove('activeState'));
      link.classList.add('activeState');
      moveActiveBarTo(link);
    });
  });
});

//image gallary view:
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let width = window.innerWidth;
let height = window.innerHeight;
canvas.width = width;
canvas.height = height;

window.addEventListener("resize", () => {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
});

const sources = [
  "bookCovers/CapsLock.jpg",
  "bookCovers/DieterRams.jpg",
  "bookCovers/thecreativeAct.jpg",
  "bookCovers/ADBook.jpg",
  "bookCovers/KHbook.jpg",
  "bookCovers/mismatch.jpg",
  "bookCovers/UXDesign.jpg",
  "bookCovers/Pentagram.jpg",
  "bookCovers/monogram.jpg"
];

const images = [];
let loadedCount = 0;

for (let i = 0; i < sources.length; i++) {
  const img = new Image();
  img.src = sources[i];
  img.onload = () => {
    loadedCount++;
    if (loadedCount === sources.length) {
      requestAnimationFrame(draw);
    }
  };
  images.push(img);
}

const imageHeight = 300;
const verticalPadding = 60;
const tileHeight = imageHeight + verticalPadding;

let offsetX = 0, offsetY = 0;
let velocityX = 0, velocityY = 0;
let dragging = false;
let lastX = 0, lastY = 0;

canvas.addEventListener("mousedown", e => {
  dragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
});

canvas.addEventListener("mousemove", e => {
  if (dragging) {
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    offsetX += dx;
    offsetY += dy;
    velocityX = dx;
    velocityY = dy;
    lastX = e.clientX;
    lastY = e.clientY;
  }
});

canvas.addEventListener("mouseup", () => dragging = false);
canvas.addEventListener("mouseleave", () => dragging = false);

canvas.addEventListener("touchstart", e => {
  dragging = true;
  const touch = e.touches[0];
  lastX = touch.clientX;
  lastY = touch.clientY;
}, { passive: true });

canvas.addEventListener("touchmove", e => {
  if (dragging) {
    const touch = e.touches[0];
    const dx = touch.clientX - lastX;
    const dy = touch.clientY - lastY;
    offsetX += dx;
    offsetY += dy;
    velocityX = dx;
    velocityY = dy;
    lastX = touch.clientX;
    lastY = touch.clientY;
  }
}, { passive: true });

canvas.addEventListener("touchend", () => dragging = false);

function draw() {
  ctx.clearRect(0, 0, width, height);

  const cols = Math.ceil(width / 440) + 4; // flexible width grid
  const rows = Math.ceil(height / tileHeight) + 4;

  const baseX = -offsetX % 440;
  const baseY = -offsetY % tileHeight;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const img = images[(row * cols + col) % images.length];
      const aspect = img.width / img.height;
      const imageWidth = imageHeight * aspect;

      const drawX = baseX + col * 440 + (440 - imageWidth) / 2;
      const drawY = baseY + row * tileHeight + verticalPadding / 2;

      ctx.drawImage(img, drawX, drawY, imageWidth, imageHeight);
    }
  }

  if (!dragging) {
    offsetX += velocityX;
    offsetY += velocityY;
    velocityX *= 0.9;
    velocityY *= 0.9;
    if (Math.abs(velocityX) < 0.01) velocityX = 0;
    if (Math.abs(velocityY) < 0.01) velocityY = 0;
  }

  requestAnimationFrame(draw);
}

