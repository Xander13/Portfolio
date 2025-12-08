// Mode Toggle Functionality for Portfolio
(function () {
    'use strict';

    let currentMode = 'work'; // Default mode is now work

    // Initialize on DOM load
    document.addEventListener('DOMContentLoaded', function () {
        // Start in work mode (default HTML state)
        initializePillAnimation();

        // Ensure Essence mode is hidden initially (just in case CSS doesn't cover it)
        const contentDiv = document.querySelector('.content');
        const responseBox = document.querySelector('.responseBox');
        const modesDiv = document.querySelector('.modes');
        const inputBox = document.querySelector('.inputBox');

        if (contentDiv) contentDiv.style.display = 'block';
        if (responseBox) responseBox.style.display = 'none';
        // modesDiv should stay visible - don't hide it
        if (inputBox) inputBox.style.display = 'none';

        // Check for URL query param
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('mode') === 'essence') {
            const essenceLink = document.querySelector('.nav-pill-link[data-mode="essence"]');
            if (essenceLink) {
                // Use setTimeout to ensure everything is ready and avoid transition issues on load
                setTimeout(() => essenceLink.click(), 100);
            }
        }
    });

    function initializePillAnimation() {
        // Underline animation logic
        const underline = document.querySelector('.nav-underline');
        const links = document.querySelectorAll('.nav-pill-link');

        function updateUnderline(targetLink) {
            if (!targetLink || !underline) return;

            // Target the specific text span if available, otherwise fallback to link
            const textSpan = targetLink.querySelector('.nav-text');
            const targetElement = textSpan || targetLink;

            // Get position relative to the container (.nav-center)
            const containerRect = document.querySelector('.nav-center').getBoundingClientRect();
            const targetRect = targetElement.getBoundingClientRect();

            const left = targetRect.left - containerRect.left;
            const width = targetRect.width;

            underline.style.width = `${width}px`;
            underline.style.transform = `translateX(${left}px)`;
        }

        // Initialize
        // Initialize
        const activeLink = document.querySelector('.nav-pill-link.active');
        if (activeLink) {
            // Small delay to ensure layout is settled
            setTimeout(() => updateUnderline(activeLink), 100);
        }

        links.forEach(link => {
            link.addEventListener('mouseenter', () => {
                updateUnderline(link);
            });

            link.addEventListener('mouseleave', () => {
                const currentActive = document.querySelector('.nav-pill-link.active');
                updateUnderline(currentActive);
            });

            link.addEventListener('click', function (e) {
                const mode = this.getAttribute('data-mode');

                // If it's a mode switch link
                if (mode) {
                    e.preventDefault();

                    // Update active class
                    links.forEach(l => l.classList.remove('active'));
                    this.classList.add('active');
                    updateUnderline(this);

                    // Switch mode
                    switchMode(mode);
                }
                // If no mode (like Resume), let the default link behavior happen
            });
        });

        // Update on resize
        window.addEventListener('resize', () => {
            const currentActive = document.querySelector('.nav-pill-link.active');
            updateUnderline(currentActive);
        });
    }

    function switchMode(mode) {
        if (currentMode === mode) return;

        currentMode = mode;

        const contentDiv = document.querySelector('.content');
        const responseBox = document.querySelector('.responseBox');
        const modesDiv = document.querySelector('.modes');
        const inputBox = document.querySelector('.inputBox');

        if (mode === 'essence') {
            // 1. Fade out Work elements
            contentDiv.classList.remove('fade-in');
            contentDiv.classList.add('fade-out');

            setTimeout(() => {
                // 2. Hide Work elements
                contentDiv.style.display = 'none';

                // 3. Prepare Essence elements (start hidden/transparent)
                responseBox.classList.remove('fade-in');
                responseBox.classList.add('fade-out'); // Ensure opacity 0
                responseBox.style.display = 'block';

                inputBox.classList.remove('fade-in');
                inputBox.classList.add('fade-out');
                inputBox.style.display = 'flex';

                modesDiv.style.display = 'block';

                document.body.classList.add('essence-mode');

                // 4. Force Reflow
                void responseBox.offsetWidth;
                void inputBox.offsetWidth;

                // 5. Fade in Essence elements
                responseBox.classList.remove('fade-out');
                responseBox.classList.add('fade-in');

                inputBox.classList.remove('fade-out');
                inputBox.classList.add('fade-in');

                // Initialize essence functionality
                initializeEssenceMode();
                const llmInput = document.getElementById('llmTxt');
                if (llmInput) llmInput.focus();

            }, 500);

        } else if (mode === 'work') {
            // 1. Fade out Essence elements
            responseBox.classList.remove('fade-in');
            responseBox.classList.add('fade-out');

            inputBox.classList.remove('fade-in');
            inputBox.classList.add('fade-out');

            setTimeout(() => {
                // 2. Hide Essence elements
                responseBox.style.display = 'none';
                inputBox.style.display = 'none';

                // 3. Prepare Work elements
                contentDiv.classList.remove('fade-in');
                contentDiv.classList.add('fade-out'); // Ensure opacity 0
                contentDiv.style.display = 'block';

                document.body.classList.remove('essence-mode');

                // 4. Force Reflow
                void contentDiv.offsetWidth;

                // 5. Fade in Work elements
                contentDiv.classList.remove('fade-out');
                contentDiv.classList.add('fade-in');

            }, 500);
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
