//toggle drawers for projects what I learned sections
document.addEventListener("DOMContentLoaded", function () {
    const drawers = document.querySelectorAll('.drawers');
    const plusBars1 = document.querySelectorAll('.plusBar1');
    const plusBars2 = document.querySelectorAll('.plusBar2');

    // Set the first drawer as expanded by default
    let expandedDrawer = drawers[0];
    expandedDrawer.classList.add('expanded');
    expandedDrawer.querySelector('.expandContent').style.display = 'block'; // Show first content
    plusBars1[0].style.opacity = 0; // Hide the plusBar1 for the first drawer

    // Function to update the opacity of the plusBars1
    function updatePlusBars() {
        plusBars1.forEach((bar, index) => {
            if (drawers[index] === expandedDrawer) {
                bar.style.opacity = 0; // Hide plusBar1 for the expanded drawer
            } else {
                bar.style.opacity = 1; // Show plusBars1 for collapsed drawers
            }
        });
    }

    // Initially update the plusBars
    updatePlusBars();

    // Add event listeners to each drawer header
    drawers.forEach((drawer, index) => {
        drawer.addEventListener('click', function () {
            // If the clicked drawer is already expanded, do nothing
            if (drawer === expandedDrawer) return;

            // Collapse the currently expanded drawer
            if (expandedDrawer) {
                expandedDrawer.classList.remove('expanded');
                expandedDrawer.querySelector('.expandContent').style.display = 'none'; // Hide content
            }

            // Expand the clicked drawer
            drawer.classList.add('expanded');
            drawer.querySelector('.expandContent').style.display = 'block'; // Show content

            // Update the reference to the expanded drawer
            expandedDrawer = drawer;

            // Update the plusBars' opacity
            updatePlusBars();
        });
    });
});

//Stickerboards Mini
document.addEventListener("DOMContentLoaded", function () {
    const canvases = document.querySelectorAll('.canvasProject'); // Updated to match your HTML

    const createBars = () => {
        canvases.forEach(canvas => {
            // Remove existing bars
            while (canvas.firstChild) {
                canvas.removeChild(canvas.firstChild);
            }

            // Set a fixed number of bars to match div height
            const barHeight = 4; // Match the height defined in CSS
            const canvasHeight = canvas.clientHeight; // Get the height of the canvas div
            const numberOfBars = Math.floor(canvasHeight / (barHeight + 16)); // Adjust to account for 16px margin-top

            // Create and append bars
            for (let i = 0; i < numberOfBars; i++) {
                const bar = document.createElement('div');
                bar.className = 'bar';
                canvas.appendChild(bar);
            }
        });
    };

    // Initial creation of bars
    createBars();
});


// Stickers functionality
const stickers = [
    'ux.svg',
    'face.svg',
    'AK_Emoji.png',
    'web.svg',
    'alogo.svg'
  ];

const rotations = [30, 0, -30];
let currentStickerIndex = 0;
let isTouch = false; // Flag to track if a touch event was used
let isScrolling = false; // Flag to track if the user is scrolling

document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.stickerBoardProject').forEach(board => {
        let touchTimeout;

        board.addEventListener('touchstart', function (event) {
            isTouch = true; // Touch event detected
            isScrolling = false;

            // Store the board reference
            const currentBoard = board;

            // Clear any existing timeout
            clearTimeout(touchTimeout);

            // Start a timeout to check if this is a tap or a scroll
            touchTimeout = setTimeout(() => {
                if (!isScrolling) {
                    handleEvent(event, currentBoard);
                }
            }, 100); // 100ms delay to distinguish between scroll and tap
        });

        board.addEventListener('touchmove', function () {
            isScrolling = true; // Detect touch movement as scrolling
        });

        board.addEventListener('click', function (event) {
            if (!isTouch) { // Only handle click if no touch event was detected
                handleEvent(event, board);
            }
            isTouch = false; // Reset the touch flag after the click event
        });
    });
});

function handleEvent(event, board) {
    if (event.cancelable) {
        event.preventDefault(); // Prevent default only if the event is cancelable
    }

    const rect = board.getBoundingClientRect(); // Use the passed board reference
    const x = (event.touches ? event.touches[0].clientX : event.clientX) - rect.left;
    const y = (event.touches ? event.touches[0].clientY : event.clientY) - rect.top;

    const stickerSrc = stickers[currentStickerIndex];
    const rotation = rotations[Math.floor(Math.random() * rotations.length)];

    placeSticker(document.getElementById('canvasProject'), stickerSrc, x, y, rotation); // Updated to canvasProject

    currentStickerIndex = (currentStickerIndex + 1) % stickers.length; // Move to the next sticker
}

function placeSticker(canvas, src, x, y, rotation) {
    const sticker = document.createElement('img');
    sticker.src = src;
    sticker.className = 'sticker';
    sticker.style.position = 'absolute';

    // Make the sticker non-draggable
    sticker.draggable = false;

    // Determine screen width
    const screenWidth = window.innerWidth;

    let stickerSize;
    if (screenWidth <= 768) { // Mobile devices (768px and below)
        stickerSize = 280; // 280px minimum size for mobile
    } else if (screenWidth <= 1024) { // Tablets (769px - 1024px)
        stickerSize = 340; // 500px for tablets
    } else if (screenWidth <= 1800) { // Tablets (769px - 1024px)
        stickerSize = 400; // 500px for tablets
    } else { // Desktop (1025px and above)
        stickerSize = 500; // 800px for desktops
    }

    // Set the sticker size and position
    sticker.style.height = `${stickerSize}px`;
    sticker.style.width = 'auto'; // Maintain aspect ratio
    sticker.style.left = `${x - (stickerSize / 2)}px`; // Center the sticker on the click
    sticker.style.top = `${y - (stickerSize / 2)}px`; // Center the sticker on the click

    // Apply rotation
    sticker.style.transform = `rotate(${rotation}deg)`;

    canvas.appendChild(sticker);
}

//Asign Color styles to each css colorBlcok
// Get all elements with the class 'colorBlock'
const colorBlocks = document.querySelectorAll('.colorBlock');

// Iterate through each element
colorBlocks.forEach(function(block) {
  // Get the value of the 'data-color' attribute
  const color = block.getAttribute('data-color');
  
  // Assign the color to the background-color style
  block.style.backgroundColor = color;
});

//image slider gallery
const sliders = document.querySelectorAll('.image-slider');

// Iterate over each slider to apply drag and center initialization
sliders.forEach(slider => {
    const track = slider.querySelector('.image-track');
    let isDragging = false;
    let startX, scrollLeft;

    // Mouse Down: Start dragging
    track.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.pageX - track.offsetLeft;
        scrollLeft = track.scrollLeft;
        track.classList.add('grabbing'); // Show hand cursor
    });

    // Mouse Leave or Up: Stop dragging
    const stopDragging = () => {
        isDragging = false;
        track.classList.remove('grabbing'); // Revert cursor
    };

    track.addEventListener('mouseleave', stopDragging);
    track.addEventListener('mouseup', stopDragging);

    // Mouse Move: Drag the content and move the custom cursor
    track.addEventListener('mousemove', (e) => {
        if (!isDragging) return; // Stop function if not dragging
        e.preventDefault();
        const x = e.pageX - track.offsetLeft;
        const walk = (x - startX) * 3; // Scroll speed
        track.scrollLeft = scrollLeft - walk;
    });
});

//make cover padding when scroll
window.addEventListener('scroll', adjustCoverSize);
window.addEventListener('resize', adjustCoverSize); // Trigger on resize to handle dynamic screen width

function adjustCoverSize() {
    const covers = document.querySelectorAll('.cover');
    const scrollTop = window.scrollY || document.documentElement.scrollTop; // Use scrollY as the preferred method
    const isMobile = window.innerWidth <= 930; // Check if screen width is 930px or smaller

    covers.forEach(cover => {
        if (scrollTop > 100) { // Adjust when scrolled beyond 100px
            cover.style.marginLeft = isMobile ? '16px' : '96px'; // 32px for mobile, 48px for larger screens
            cover.style.marginRight = isMobile ? '16px' : '96px';
        } else {
            cover.style.marginLeft = '0';
            cover.style.marginRight = '0';
        }
    });
}