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
      // Show doors only if other panels are not open
      if (!infoOpen && !indexOpen) {
        readDoorTop.style.top = "0";
        readDoorBottom.style.bottom = "0";
      }

      // Fully show readBox
      readBox.style.display = "block";
      readBox.style.visibility = "visible";
      readBox.style.opacity = "1";

      setTimeout(() => {
        readFade.style.opacity = "1";
      }, 600);

      // Hide other panels if open
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
      // Hide read panel
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
});
