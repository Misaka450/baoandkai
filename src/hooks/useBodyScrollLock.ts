import { useEffect } from 'react';

/**
 * Hook to lock body scroll when a component is mounted
 * especially useful for modals and overlays.
 */
export const useBodyScrollLock = (isLocked: boolean) => {
    useEffect(() => {
        if (isLocked) {
            // Save current scroll position
            const scrollY = window.scrollY;

            // Add class and styles
            document.body.classList.add('overflow-hidden');
            document.body.style.top = `-${scrollY}px`;

            return () => {
                // Remove class and restore scroll position
                const savedScrollY = parseInt(document.body.style.top || '0') * -1;
                document.body.classList.remove('overflow-hidden');
                document.body.style.top = '';
                window.scrollTo(0, savedScrollY);
            };
        }
        return undefined;
    }, [isLocked]);
};
