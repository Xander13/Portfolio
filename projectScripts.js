 // Function to check if the bottom of .project touches the bottom of the screen
 function isAtBottomOfScreen(element) {
    const rect = element.getBoundingClientRect();
    return rect.bottom <= window.innerHeight; // Bottom of .project touches bottom of the screen
}

// Function to fade out .contents
function fadeContents() {
    const contents = document.querySelector('.contents');
    const project = document.querySelector('.project');

    // Check if the bottom of .project touches the bottom of the screen
    if (isAtBottomOfScreen(project)) {
        console.log('project bottom has touched the bottom of the screen');  // Debugging log
        
        contents.style.opacity = '0'; // Fade out
    } else {
        contents.style.opacity = '1'; // Reset to fully visible
    }
}

// Function to detect if the device is desktop
function isDesktop() {
    return window.innerWidth >= 1024; // Consider screen width >= 1024px as desktop
}

// Apply different behaviors based on the device type
function applyBehavior() {
    const contents = document.querySelector('.contents');

    if (isDesktop()) {
        // If desktop, listen for scroll events and run fade-out script
        window.addEventListener('scroll', fadeContents);
        document.addEventListener('DOMContentLoaded', fadeContents);
        contents.style.display = 'block'; // Ensure .contents is visible
    } else {
        // If mobile, hide .contents
        contents.style.display = 'none';
    }
}

// Run the behavior detection on load and on window resize
window.addEventListener('resize', applyBehavior);
document.addEventListener('DOMContentLoaded', applyBehavior);

// Copy text to clipboard
function copyContent() {
    let text = 'xanderkau13@gmail.com';
    const changeText = document.querySelector("#change-text");

    try {
        navigator.clipboard.writeText(text)
            .then(() => {
                console.log('Content copied to clipboard');
                changeText.textContent = "Copied!";
                // Timeout to change the message
                setTimeout(() => {
                    changeText.textContent = "Click to copy email to clipboard";
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
                changeText.textContent = "Failed to copy. Please try manually.";
            });
    } catch (err) {
        console.error('Failed to copy: ', err);
        changeText.textContent = "Failed to copy. Please try manually.";
    }
}