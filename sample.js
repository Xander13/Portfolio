document.addEventListener("DOMContentLoaded", () => {
    const scrollContent = document.getElementById("scrollContent");
    const contentWrapper = document.getElementById("contentWrapper");

    // Ensure scrollContent exists before proceeding
    if (scrollContent && contentWrapper) {
        // Clone the main content
        const clonedContent = scrollContent.cloneNode(true);
        clonedContent.id = "clonedContent"; // Unique ID for the clone
        contentWrapper.appendChild(clonedContent);

        // Update the scroll event listener
        window.addEventListener("scroll", () => {
            const scrollableHeight = scrollContent.offsetHeight;

            // Reset scroll when reaching the top of the cloned content
            if (window.scrollY >= scrollableHeight) {
                window.scrollTo(0, 0);
            }
        });
    } else {
        console.error("Required elements not found in the DOM.");
    }
});
