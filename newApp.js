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

  // Include readButton in nav links array
  let allNavLinks = Array.from(document.querySelectorAll(".flexBox a:not(.branding)"));
  if (!allNavLinks.includes(readButton)) {
    allNavLinks.push(readButton);
  }

  let infoOpen = false;
  let indexOpen = false;
  let readOpen = false;

  // === ABOUT PANEL ===
  infoButton.addEventListener("click", function (e) {
    e.preventDefault();

    if (!infoOpen) {
      if (!indexOpen && !readOpen) {
        infoDoorTop.style.top = "0";
        infoDoorBottom.style.bottom = "0";
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
        readDoorTop.style.top = "0";
        readDoorBottom.style.bottom = "0";
      }

      readBox.style.visibility = "visible";
      readBox.style.opacity = "1";

      setTimeout(() => {
        readFade.style.opacity = "1";
      }, 600);

      if (infoOpen) {
        infoFade.style.opacity = "0";
        setTimeout(() => {
          $(infoBox).fadeOut(0);
          infoOpen = false;
        }, 300);
      }

      if (indexOpen) {
        indexFade.style.opacity = "0";
        setTimeout(() => {
          $(indexBox).fadeOut(0);
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

  // Active bar moving script
  const activeBar = document.getElementById('activeBar');

  function moveActiveBarTo(el) {
    const rect = el.getBoundingClientRect();
    const parentRect = el.parentElement.getBoundingClientRect();

    activeBar.style.left = `${rect.left - parentRect.left}px`;
    activeBar.style.width = `${rect.width}px`;
  }

  // Set initial position (work)
  moveActiveBarTo(workButton);

  // Move on hover
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

  // Simple cursor follow only, no scaling, no pixelation
  const cursor = document.getElementById('cursor');
  if (!cursor) {
    console.warn('No #cursor element found in DOM!');
    return;
  }

  let mouseX = 0;
  let mouseY = 0;
  let currentX = 0;
  let currentY = 0;
  const speed = 0.2; // easing speed

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function animateCursor() {
    currentX += (mouseX - currentX) * speed;
    currentY += (mouseY - currentY) * speed;

    cursor.style.left = currentX + 'px';
    cursor.style.top = currentY + 'px';

    requestAnimationFrame(animateCursor);
  }
  animateCursor();
});
