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

const workButton = document.querySelector(".flexBox a[href='#']:not(#infoSlider):not(#index):not(.branding)");

const allNavLinks = document.querySelectorAll(".flexBox a:not(.branding)");

let infoOpen = false;
let indexOpen = false;

// === ABOUT PANEL ===
infoButton.addEventListener("click", function (e) {
  e.preventDefault();

  if (!infoOpen) {
    // If coming from Work, close doors in first
    if (!indexOpen) {
      infoDoorTop.style.top = "0";
      infoDoorBottom.style.bottom = "0";
    }

    infoBox.style.visibility = "visible";
    infoBox.style.opacity = "1";

    setTimeout(() => {
      infoFade.style.opacity = "1";
    }, 600);

    // If coming from Index
    if (indexOpen) {
      indexFade.style.opacity = "0";
      setTimeout(() => {
        $(indexBox).fadeOut(0);
        indexOpen = false;
      }, 300);
    }

    allNavLinks.forEach(link => link.classList.remove("activeState"));
    infoButton.classList.add("activeState");

    infoOpen = true;
  } else {
    // Close About
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
    if (!infoOpen) {
      // FROM WORK → Do door animation after showing container
      $(indexBox).fadeIn(0);

      // Small delay so doors animate AFTER .index is visible
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

    setTimeout(() => {
      indexFade.style.opacity = "1";
    }, 600);

    allNavLinks.forEach(link => link.classList.remove("activeState"));
    indexButton.classList.add("activeState");

    indexOpen = true;
  } else {
    // Close Index logic stays the same
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

// === WORK PANEL ===
workButton.addEventListener("click", function (e) {
  e.preventDefault();

  // If About is open
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

  // If Index is open
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

  allNavLinks.forEach(link => link.classList.remove("activeState"));
  workButton.classList.add("activeState");
});


//active bar moving script:
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

  // On click, set active and snap bar
  link.addEventListener('click', () => {
    allNavLinks.forEach(l => l.classList.remove('activeState'));
    link.classList.add('activeState');
    moveActiveBarTo(link);
  });
});