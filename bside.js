
document.addEventListener('DOMContentLoaded', () => {
    // --- INFINITE SCROLL LOGIC ---
    const gallery = document.querySelector('.autoScrollGallery');
    if (!gallery) return;

    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }

    gallery.style.overflowAnchor = 'none';
    const html = document.documentElement;
    html.style.scrollBehavior = 'auto';

    const getGap = () => {
        const style = window.getComputedStyle(gallery);
        return parseFloat(style.gap) || 0;
    };

    let isAdjusting = false;
    let isDrawerOpen = false;

    const checkScroll = () => {
        if (isAdjusting || isDrawerOpen) {
            isAdjusting = false;
            return;
        }

        const children = gallery.children;
        if (children.length < 2) return;

        const gap = getGap();
        const scrollY = window.scrollY;

        // Check Top
        if (scrollY <= 50) {
            const lastItem = children[children.length - 1];
            const height = lastItem.getBoundingClientRect().height;

            isAdjusting = true;
            gallery.prepend(lastItem);

            window.scrollBy({
                top: height + gap,
                behavior: 'instant'
            });
            return;
        }

        // Check Bottom
        const secondItem = children[1];
        const secondRect = secondItem.getBoundingClientRect();

        if (secondRect.top <= -50) {
            const firstItem = children[0];
            const height = firstItem.getBoundingClientRect().height;

            isAdjusting = true;
            gallery.appendChild(firstItem);

            window.scrollBy({
                top: -(height + gap),
                behavior: 'instant'
            });
        }
    };

    setTimeout(() => {
        window.addEventListener('scroll', checkScroll, { passive: true });
        if (window.scrollY < 50) {
            const children = gallery.children;
            if (children.length > 0) {
                const lastItem = children[children.length - 1];
                const height = lastItem.getBoundingClientRect().height;
                const gap = getGap();
                isAdjusting = true;
                gallery.prepend(lastItem);
                window.scrollBy({ top: height + gap, behavior: 'instant' });
            }
        }
    }, 100);
});
