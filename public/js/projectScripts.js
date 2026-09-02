//toggle drawers for projects what I learned sections
document.addEventListener("DOMContentLoaded", function () {
    const drawers = document.querySelectorAll('.drawers');
    const plusBars1 = document.querySelectorAll('.plusBar1');
    const plusBars2 = document.querySelectorAll('.plusBar2');

    // Check if drawers exist before proceeding
    if (drawers.length > 0) {
        // Set the first drawer as expanded by default
        let expandedDrawer = drawers[0];
        expandedDrawer.classList.add('expanded');
        expandedDrawer.querySelector('.expandContent').style.display = 'block'; // Show first content
        plusBars2[0].style.opacity = 0; // Hide the plusBar1 for the first drawer

        // Function to update the opacity of the plusBars1
        function updatePlusBars() {
            plusBars2.forEach((bar, index) => {
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
    }
});


//Asign Color styles to each css colorBlcok
// Get all elements with the class 'colorBlock'
const colorBlocks = document.querySelectorAll('.colorBlock');

// Iterate through each element
colorBlocks.forEach(function (block) {
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
            cover.style.marginLeft = isMobile ? '16px' : '56px';
            cover.style.marginRight = isMobile ? '16px' : '56px';
            cover.style.transition = 'all 0.5s ease';
        } else {
            cover.style.marginLeft = '0';
            cover.style.marginRight = '0';
            cover.style.transition = 'all 0.5s ease';
        }
    });
}

// Menu Toggle Logic
document.addEventListener('DOMContentLoaded', function () {
    const menuDot = document.querySelector('.menuDot');
    const menu = document.querySelector('.menu');

    if (menuDot && menu) {
        menuDot.addEventListener('click', () => {
            menu.classList.toggle('active');
        });
    }
});



// Floating Menu Toggle
document.addEventListener('DOMContentLoaded', function () {
    const menuBars = document.querySelector('.menuBars');
    const floatingMenu = document.querySelector('.floatingMenu');

    if (menuBars && floatingMenu) {
        menuBars.addEventListener('click', () => {
            floatingMenu.classList.toggle('active');
        });
    }
});

// -------- Load Related Projects --------
window.loadRelatedProjects = async function (currentProjectName) {
    try {
        const response = await fetch('js/knowledgeTree.json');
        const data = await response.json();
        const projectsList = data.projects; // The array of projects for the grid

        // Filter out current project
        const availableProjects = projectsList.filter(p => p.title !== currentProjectName && p.title !== "Essence Mode");

        // Shuffle and pick 2
        const shuffled = availableProjects.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 2);

        const container = document.getElementById('related-projects');
        if (!container) return;

        container.innerHTML = ''; // Clear existing

        const flexBox = document.createElement('div');
        flexBox.className = 'flexBox';
        flexBox.style.gap = '32px';
        flexBox.style.alignItems = 'start';

        selected.forEach(project => {
            const wrapper = document.createElement('div');
            wrapper.className = 'w-50';

            // Try to find the link in the root object using the title
            let projectLink = "#";
            if (data[project.title] && data[project.title].link) {
                projectLink = data[project.title].link;
            }

            const link = document.createElement('a');
            link.href = projectLink;

            const clipping = document.createElement('div');
            clipping.className = 'clipping';

            // Handle media (image or video)
            if (project.media.endsWith('.mp4') || project.media.endsWith('.mov')) {
                const video = document.createElement('video');
                video.src = project.media;
                video.autoplay = true;
                video.loop = true;
                video.muted = true;
                video.playsInline = true;
                video.style.width = "100%";
                clipping.appendChild(video);
            } else {
                const img = document.createElement('img');
                img.src = project.media;
                img.width = "100%";
                img.alt = project.title;
                clipping.appendChild(img);
            }

            const title = document.createElement('h3');
            title.className = 'xSmTxt';
            title.style.paddingTop = '16px';
            title.style.color = 'gray';

            // Try to get category/chips from detailed object, fallback to generic
            let category = "Case Study";
            if (data[project.title] && data[project.title].chips) {
                category = data[project.title].chips;
            } else if (data[project.title] && data[project.title].role) {
                category = data[project.title].role;
            }

            title.textContent = category;

            link.appendChild(clipping);
            link.appendChild(title);
            wrapper.appendChild(link);
            flexBox.appendChild(wrapper);
        });

        container.appendChild(flexBox);

    } catch (error) {
        console.error('Error loading related projects:', error);
    }
};

// Auto-trigger related projects if container exists
document.addEventListener("DOMContentLoaded", function () {
    const relatedContainer = document.getElementById('related-projects');
    if (relatedContainer) {
        const currentProject = relatedContainer.getAttribute('data-project');
        if (currentProject && typeof window.loadRelatedProjects === "function") {
            window.loadRelatedProjects(currentProject);
        }
    }
});


// -------------------------------------------------
// Data Color Highlighter mode
// -------------------------------------------------
document.querySelectorAll('.highlight').forEach(el => {
    const color = el.dataset.color;
    if (color) {
        el.style.setProperty('--hl-color', color);
    }
});


// -------------------------------------------------
// Carousel with Prev and Next Button Effects
// -------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    const carousel = document.querySelector(".carousel");
    const track = document.querySelector(".carousel-track");
    const nextBtn = document.querySelector(".next");
    const prevBtn = document.querySelector(".prev");

    if (!carousel || !track || !nextBtn || !prevBtn) return;

    const cards = Array.from(track.children);
    if (cards.length === 0) return;

    let index = 0;
    let isDragging = false;
    let startX = 0;
    let scrollStart = 0;

    // =========================
    // CARD WIDTH CALCULATOR
    // =========================
    function getCardWidth() {
        const gap = parseInt(getComputedStyle(track).gap) || 24;
        return cards[0].offsetWidth + gap;
    }

    function updateCarousel() {
        const cardWidth = getCardWidth();
        track.style.transform = `translateX(${-index * cardWidth}px)`;
    }

    // =========================
    // MOUSE-FOLLOW BUTTON LOGIC
    // (Desktop only)
    // =========================
    function enableCursorButtons() {
        carousel.addEventListener("mouseenter", () => {
            nextBtn.style.opacity = "1";
            prevBtn.style.opacity = "1";
        });

        carousel.addEventListener("mouseleave", () => {
            nextBtn.style.opacity = "0";
            prevBtn.style.opacity = "0";
        });

        carousel.addEventListener("mousemove", (e) => {
            const rect = carousel.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            prevBtn.style.top = `${y}px`;
            nextBtn.style.top = `${y}px`;

            // Center the button on the cursor
            prevBtn.style.transform = "translate(-50%, -50%)";
            nextBtn.style.transform = "translate(-50%, -50%)";

            const showNext = x > rect.width / 2;

            if (showNext) {
                nextBtn.style.left = `${x}px`;
                nextBtn.style.display = "flex";
                prevBtn.style.display = "none";
            } else {
                prevBtn.style.left = `${x}px`;
                prevBtn.style.display = "flex";
                nextBtn.style.display = "none";
            }
        });
    }

    // Desktop = pointer:fine
    if (window.matchMedia("(pointer:fine)").matches) {
        enableCursorButtons();
    } else {
        // Mobile: hide cursor buttons + remove hover behavior completely
        nextBtn.style.display = "none";
        prevBtn.style.display = "none";
        nextBtn.style.opacity = "0";
        prevBtn.style.opacity = "0";
    }

    // =========================
    // NEXT / PREV BUTTON LOGIC
    // =========================
    function goNext() {
        if (index < cards.length - 1) {
            index++;
            updateCarousel();
        }
    }

    function goPrev() {
        if (index > 0) {
            index--;
            updateCarousel();
        }
    }

    nextBtn.addEventListener("click", goNext);
    prevBtn.addEventListener("click", goPrev);

    // =========================
    // DRAG / SWIPE SUPPORT
    // =========================
    function startDrag(e) {
        isDragging = true;

        // NEW: shrink buttons + hide text while dragging
        nextBtn.classList.add("dragging");
        prevBtn.classList.add("dragging");

        startX = e.pageX || e.touches?.[0].pageX;
        scrollStart = track.style.transform;
    }

    function onDrag(e) {
        if (!isDragging) return;

        const x = e.pageX || e.touches?.[0].pageX;
        const dx = x - startX;

        track.style.transform = `translateX(calc(${scrollStart} + ${dx}px))`;
    }

    function endDrag(e) {
        if (!isDragging) return;
        isDragging = false;

        // restore button size
        nextBtn.classList.remove("dragging");
        prevBtn.classList.remove("dragging");

        const x = e.pageX || e.changedTouches?.[0].pageX;
        const dx = x - startX;

        const threshold = cards[0].offsetWidth / 3;

        if (dx < -threshold && index < cards.length - 1) goNext();
        else if (dx > threshold && index > 0) goPrev();
        else updateCarousel();
    }

    track.addEventListener("mousedown", startDrag);
    track.addEventListener("mousemove", onDrag);
    track.addEventListener("mouseup", endDrag);
    track.addEventListener("mouseleave", endDrag);

    track.addEventListener("touchstart", startDrag, { passive: true });
    track.addEventListener("touchmove", onDrag, { passive: true });
    track.addEventListener("touchend", endDrag);

    // =========================
    // INITIALIZE
    // =========================
    window.addEventListener("resize", updateCarousel);
    setTimeout(updateCarousel, 100);
});

// -------------------------------------------------
// Speech Mode Implementation
// -------------------------------------------------
document.addEventListener("DOMContentLoaded", function () {
    const speechBtn = document.querySelector('.modes');
    if (!speechBtn) return;

    let isSpeechActive = false;
    let synthesis = window.speechSynthesis;
    let readableElements = [];
    let currentElementIndex = 0;
    const bgAudioVolume = 0.3;

    // Background Audio
    const bgAudio = new Audio('audio/nature-music-vkroxstarsinger-226067.mp3');
    bgAudio.loop = true;
    bgAudio.volume = bgAudioVolume;

    function setBgAudioVolume(nextVolume) {
        bgAudio.volume = Math.max(0, Math.min(1, nextVolume));
    }

    // Expose global API
    window.speechMode = {
        isActive: () => isSpeechActive,
        jumpToNewMessage: (messageElement) => {
            if (!isSpeechActive) return;

            // Find this element in readableElements
            const newIndex = readableElements.findIndex(el => el === messageElement || messageElement.contains(el));

            if (newIndex !== -1) {
                // Cancel current speech
                synthesis.cancel();
                isSpeaking = false;

                // Clear highlights
                document.querySelectorAll('.word-highlight').forEach(el => el.classList.remove('word-highlight'));

                // Jump to new message
                currentElementIndex = newIndex;
                speakNext();
            }
        },
        speak: (el, onComplete) => speakElement(el, onComplete)
    };

    speechBtn.addEventListener('click', toggleSpeechMode);

    function toggleSpeechMode() {
        isSpeechActive = !isSpeechActive;
        speechBtn.classList.toggle('active', isSpeechActive);
        document.body.classList.toggle('reading-mode', isSpeechActive);

        if (isSpeechActive) {
            // Start audio quietly so it sits behind speech
            bgAudio.currentTime = 0;
            setBgAudioVolume(bgAudioVolume);
            bgAudio.play().catch(e => console.log("Audio play failed:", e));

            // Start pulse loop for particle wave effect
            if (typeof window.startPulseLoop === 'function') {
                window.startPulseLoop();
            }

            // Wait a moment for transition
            setTimeout(startSpeech, 300);
        } else {
            stopSpeech();

            // Stop pulse loop
            if (typeof window.stopPulseLoop === 'function') {
                window.stopPulseLoop();
            }
        }
    }

    function stopSpeech() {
        scrollListenerActive = false; // Disable scroll listener
        isSpeaking = false; // Reset speaking flag
        synthesis.cancel();
        bgAudio.pause();
        setBgAudioVolume(bgAudioVolume);
        document.querySelectorAll('.word-highlight').forEach(el => el.classList.remove('word-highlight'));
        // Also remove element highlights
        readableElements.forEach(el => el.classList.remove('word-highlight'));
    }

    function startSpeech() {
        if (!isSpeechActive) return;

        console.log("Starting speech mode...");

        // Find all readable text blocks
        const selectors = 'h1, h2, h3, h4, p, .mdTxt, .lgTxt, .smTxt, .xSmTxt, li';
        readableElements = Array.from(document.querySelectorAll(selectors)).filter(el => {
            // Basic visibility check and exclude nav/UI
            return el.offsetParent !== null && !el.closest('.nav') && !el.closest('.modes') && !el.closest('.topNav');
        });

        // Preserve document order by default; authors can override individual elements.
        readableElements.forEach((el, index) => {
            if (!el.hasAttribute('data-read-order')) {
                el.dataset.readOrder = String((index + 1) * 10);
            }
        });

        // Sort by explicit or generated data-read-order.
        readableElements.sort((a, b) => {
            const orderA = parseInt(a.getAttribute('data-read-order'));
            const orderB = parseInt(b.getAttribute('data-read-order'));
            return orderA - orderB;
        });

        // Find first element currently in viewport
        currentElementIndex = readableElements.findIndex(el => {
            const rect = el.getBoundingClientRect();
            // Check if top of element is visible or if element covers the middle of screen
            return (rect.top >= 0 && rect.top < window.innerHeight) ||
                (rect.top < 0 && rect.bottom > window.innerHeight / 2);
        });

        if (currentElementIndex === -1) currentElementIndex = 0;

        speakNext();
    }

    // Scroll listener to jump to visible content
    let scrollTimeout;
    let scrollListenerActive = false;
    let isAutoScrolling = false; // Flag to prevent scroll listener from triggering during auto-scroll

    window.addEventListener('scroll', () => {
        if (!isSpeechActive || !scrollListenerActive || isAutoScrolling) return;

        // Debounce scroll events (increased to 1200ms for less sensitivity)
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            // Find first visible element
            const visibleIndex = readableElements.findIndex(el => {
                const rect = el.getBoundingClientRect();
                return (rect.top >= 0 && rect.top < window.innerHeight) ||
                    (rect.top < 0 && rect.bottom > window.innerHeight / 2);
            });

            // If we found a visible element and it's different from current
            if (visibleIndex !== -1 && visibleIndex !== currentElementIndex) {
                // Cancel current speech
                synthesis.cancel();
                isSpeaking = false; // Reset flag so new speech can start

                // Clear all highlights
                document.querySelectorAll('.word-highlight').forEach(el => el.classList.remove('word-highlight'));

                // Jump to new position
                currentElementIndex = visibleIndex;
                speakNext();
            }
        }, 1200); // Increased from 500ms to 1200ms
    });

    let isSpeaking = false; // Guard against multiple simultaneous speaks

    function speakNext() {
        // console.log("speakNext called. Index:", currentElementIndex);
        if (!isSpeechActive) return;
        if (isSpeaking) return; // Don't start new speech if already speaking
        if (currentElementIndex >= readableElements.length) {
            // Done reading page, but keep Speech Mode active (don't toggle off)
            speechBtn.classList.remove('speaking');
            return;
        }

        const el = readableElements[currentElementIndex];
        const rect = el.getBoundingClientRect();

        if (rect.bottom < 0 || rect.top > window.innerHeight) {
            currentElementIndex++;
            speakNext();
            return;
        }

        isSpeaking = true; // Set flag before speaking
        speakElement(el, () => {
            isSpeaking = false; // Clear flag when done
            currentElementIndex++;
            speakNext();
        });
    }

    function wrapWords(element) {
        if (element.dataset.processed) return;

        const walk = (node) => {
            if (node.nodeType === 3) { // Text node
                const text = node.nodeValue;
                if (text.trim().length === 0) return;

                const words = text.split(/(\s+)/);
                const fragment = document.createDocumentFragment();

                words.forEach(w => {
                    if (w.trim().length > 0) {
                        const span = document.createElement('span');
                        span.className = 'word-span'; // Changed from speech-word to word-span
                        span.textContent = w;
                        fragment.appendChild(span);
                    } else {
                        fragment.appendChild(document.createTextNode(w));
                    }
                });

                node.parentNode.replaceChild(fragment, node);
            } else if (node.nodeType === 1 && !node.classList.contains('word-span')) { // Changed from speech-word to word-span
                // Recurse
                Array.from(node.childNodes).forEach(walk);
            }
        };

        walk(element);
        element.dataset.processed = "true";
    }

    function speakElement(el, onComplete) {
        if (!isSpeechActive) return;

        // Auto-scroll element into view
        isAutoScrolling = true;
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => { isAutoScrolling = false; }, 800); // Reset flag after scroll animation

        // Clear ALL previous highlights across the entire page
        document.querySelectorAll('.word-highlight').forEach(s => s.classList.remove('word-highlight'));

        // Use robust wrapping
        wrapWords(el);

        const text = el.innerText;
        if (!text || text.trim().length === 0) {
            if (onComplete) onComplete();
            return;
        }

        // Remove emojis from text before speaking
        const textWithoutEmojis = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FAB0}-\u{1FABF}\u{1FAC0}-\u{1FAFF}\u{1F004}\u{1F0CF}\u{1F18E}\u{1F191}-\u{1F19A}\u{1F201}\u{1F21A}\u{1F22F}\u{1F232}-\u{1F236}\u{1F238}-\u{1F23A}\u{1F250}\u{1F251}\u{1F300}-\u{1F320}\u{1F32D}-\u{1F335}\u{1F337}-\u{1F37C}\u{1F37E}-\u{1F393}\u{1F3A0}-\u{1F3CA}\u{1F3CF}-\u{1F3D3}\u{1F3E0}-\u{1F3F0}\u{1F3F4}\u{1F3F8}-\u{1F43E}\u{1F440}\u{1F442}-\u{1F4FC}\u{1F4FF}-\u{1F53D}\u{1F54B}-\u{1F54E}\u{1F550}-\u{1F567}\u{1F57A}\u{1F595}\u{1F596}\u{1F5A4}\u{1F5FB}-\u{1F64F}\u{1F680}-\u{1F6C5}\u{1F6CC}\u{1F6D0}-\u{1F6D2}\u{1F6D5}-\u{1F6D7}\u{1F6EB}\u{1F6EC}\u{1F6F4}-\u{1F6FC}\u{1F7E0}-\u{1F7EB}]/gu, '');

        const utterance = new SpeechSynthesisUtterance(textWithoutEmojis);

        // Ensure voices are loaded
        let voices = synthesis.getVoices();
        if (voices.length > 0) {
            // Prioritize male voices
            const preferredVoice = voices.find(v =>
                v.name === 'David' ||
                v.name === 'Daniel' ||
                v.name.includes('Google') && v.name.includes('Male') ||
                v.name.includes('Male')
            );

            if (preferredVoice) {
                utterance.voice = preferredVoice;
                console.log("Using voice:", preferredVoice.name);
            } else {
                console.log("Using default voice");
            }
        }

        utterance.onstart = () => {
            speechBtn.classList.add('speaking');
            scrollListenerActive = true; // Enable scroll listener after first utterance starts
            setBgAudioVolume(bgAudioVolume);
            if (bgAudio.paused) bgAudio.play().catch(e => console.log("Audio play failed:", e));
        };

        utterance.onend = () => {
            // Remove highlights
            const spans = el.querySelectorAll('.word-highlight');
            spans.forEach(s => s.classList.remove('word-highlight'));
            if (onComplete) onComplete();
        };

        utterance.onerror = (e) => {
            console.error("Speech error:", e);
            isSpeaking = false; // Clear flag on error
            // If error occurs, try to move to next
            if (onComplete) onComplete();
        };

        utterance.onboundary = (event) => {
            if (event.name === 'word') {
                const spans = el.querySelectorAll('.word-span');
                // Remove highlight from all
                spans.forEach(s => s.classList.remove('word-highlight'));

                // Highlight current word based on charIndex
                // This is an approximation as mapping charIndex to span is tricky with nested tags
                // But since we wrapped words flatly, we can try to find the span that matches

                let charCount = 0;
                for (let span of spans) {
                    const spanLen = span.innerText.length;
                    // Check if event.charIndex falls within this span's range
                    // Note: event.charIndex is relative to the utterance text
                    if (charCount <= event.charIndex && (charCount + spanLen + 1) > event.charIndex) {
                        span.classList.add('word-highlight');
                        break;
                    }
                    charCount += spanLen + 1; // +1 for space
                }
            }
        };

        // Force resume if paused
        if (synthesis.paused) synthesis.resume();

        synthesis.speak(utterance);
    }
});

// -------------------------------------------------
// Page Transition Logic
// -------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    // Fade in on load
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 50);

    // Handle links for smooth fade out
    document.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            const target = link.getAttribute('target');

            // Ignore special links
            if (!href ||
                href === '#' ||
                href.startsWith('#') ||
                target === '_blank' ||
                href.startsWith('mailto:') ||
                href.startsWith('tel:') ||
                href.startsWith('javascript:')) {
                return;
            }

            // Proceed with fade out navigation
            e.preventDefault();
            document.body.classList.remove('loaded');

            setTimeout(() => {
                window.location.href = href;
            }, 500); // Match CSS transition time
        });
    });
});

// Handle back/forward cache (bfcache)
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        document.body.classList.add('loaded');
    }
});
