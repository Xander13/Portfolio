// Mode Toggle Functionality for Portfolio
(function () {
    'use strict';

    let currentMode = 'essence'; // Default mode is now essence

    // Initialize on DOM load
    document.addEventListener('DOMContentLoaded', function () {
        // Add essence-mode class to body since we start in essence mode
        document.body.classList.add('essence-mode');
        initializePillAnimation();

        // Show welcome message on initial load since we start in essence mode
        setTimeout(() => {
            initializeEssenceMode();
        }, 500);
    });

    function initializePillAnimation() {
        const pillBackground = document.querySelector('.pill-background');
        const navLinks = document.querySelectorAll('.nav-pill-link');

        if (!pillBackground || navLinks.length === 0) return;

        // Set initial position based on active link
        const activeLink = document.querySelector('.nav-pill-link.active');
        if (activeLink) {
            // Use setTimeout to ensure DOM is fully rendered
            setTimeout(() => {
                updatePillPosition(activeLink, pillBackground);
            }, 100);
        }

        // Add click handlers to nav links
        navLinks.forEach(link => {
            link.addEventListener('click', function (e) {
                e.preventDefault();

                const mode = this.getAttribute('data-mode');

                // Update active state
                navLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');

                // Animate pill
                updatePillPosition(this, pillBackground);

                // Switch mode
                switchMode(mode);
            });
        });
    }

    function updatePillPosition(activeLink, pillBackground) {
        const linkRect = activeLink.getBoundingClientRect();
        const containerRect = activeLink.parentElement.getBoundingClientRect();

        const left = linkRect.left - containerRect.left;
        const width = linkRect.width;

        pillBackground.style.left = `${left}px`;
        pillBackground.style.width = `${width}px`;
    }

    function switchMode(mode) {
        if (currentMode === mode) return;

        currentMode = mode;

        const contentDiv = document.querySelector('.content');
        const responseBox = document.querySelector('.responseBox');
        const modesDiv = document.querySelector('.modes');
        const gallery = document.querySelector('.gallery');
        const inputBox = document.querySelector('.inputBox');

        if (mode === 'essence') {
            // Switch to AI chat mode

            // Fade out portfolio content
            contentDiv.classList.add('fade-out');

            setTimeout(() => {
                // Hide portfolio, show AI elements
                contentDiv.style.display = 'none';
                responseBox.style.display = 'block';
                modesDiv.style.display = 'block';
                gallery.style.display = 'block';
                inputBox.style.display = 'flex';

                // Add essence mode class to body
                document.body.classList.add('essence-mode');

                // Fade in AI elements
                setTimeout(() => {
                    responseBox.classList.add('fade-in');
                    modesDiv.classList.add('fade-in');
                    gallery.classList.add('fade-in');
                    inputBox.classList.add('fade-in');
                }, 50);

                // Initialize essence functionality if not already initialized
                initializeEssenceMode();

                // Focus on input
                const llmInput = document.getElementById('llmTxt');
                if (llmInput) {
                    llmInput.focus();
                }
            }, 500); // Wait for fade out

        } else if (mode === 'work') {
            // Switch to portfolio mode

            // Fade out AI elements
            responseBox.classList.remove('fade-in');
            modesDiv.classList.remove('fade-in');
            gallery.classList.remove('fade-in');
            inputBox.classList.remove('fade-in');

            responseBox.classList.add('fade-out');
            modesDiv.classList.add('fade-out');
            gallery.classList.add('fade-out');
            inputBox.classList.add('fade-out');

            setTimeout(() => {
                // Hide AI elements, show portfolio
                responseBox.style.display = 'none';
                modesDiv.style.display = 'none';
                gallery.style.display = 'none';
                inputBox.style.display = 'none';

                contentDiv.style.display = 'block';

                // Remove essence mode class from body
                document.body.classList.remove('essence-mode');

                // Fade in portfolio
                contentDiv.classList.remove('fade-out');
                contentDiv.classList.add('fade-in');

                // Clean up fade classes
                setTimeout(() => {
                    responseBox.classList.remove('fade-out');
                    modesDiv.classList.remove('fade-out');
                    gallery.classList.remove('fade-out');
                    inputBox.classList.remove('fade-out');
                }, 100);
            }, 500); // Wait for fade out
        }
    }

    let essenceInitialized = false;

    function initializeEssenceMode() {
        // Only initialize once
        if (essenceInitialized) return;

        essenceInitialized = true;

        // Check if the essence.js functions are available
        if (typeof window.showWelcomeMessage === 'function') {
            window.showWelcomeMessage();
        } else if (typeof showWelcomeMessage === 'function') {
            showWelcomeMessage();
        } else {
            // If showWelcomeMessage is not globally available, we need to wait for essence.js to load
            // and then manually trigger it
            console.log('Waiting for essence.js to load...');

            // Try again after a short delay
            setTimeout(() => {
                if (typeof window.showWelcomeMessage === 'function') {
                    window.showWelcomeMessage();
                } else if (typeof showWelcomeMessage === 'function') {
                    showWelcomeMessage();
                }
            }, 500);
        }
    }

    // Expose switchMode globally if needed by other scripts
    window.portfolioModeToggle = {
        switchMode: switchMode,
        getCurrentMode: () => currentMode
    };

})();
