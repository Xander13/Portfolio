
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

    let isAdjusting = false;
    let isDrawerOpen = false;

    // Stabilize gap for mobile (vh units can jump when address bar hides/shows)
    let memoizedGap = null;
    const getGap = () => {
        if (!memoizedGap) {
            const style = window.getComputedStyle(gallery);
            memoizedGap = parseFloat(style.gap) || 0;
        }
        return memoizedGap;
    };

    const checkScroll = () => {
        if (isAdjusting || isDrawerOpen) return;

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

            requestAnimationFrame(() => {
                isAdjusting = false;
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

            requestAnimationFrame(() => {
                isAdjusting = false;
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
                requestAnimationFrame(() => {
                    isAdjusting = false;
                });
            }
        }
    }, 100);
});
