import { useEffect } from 'react';

/**
 * Hook to lock body scroll when a component is mounted
 * especially useful for modals and overlays.
 */
export const useBodyScrollLock = (isLocked: boolean) => {
    useEffect(() => {
        if (isLocked) {
            document.body.classList.add('overflow-hidden');
            return () => {
                document.body.classList.remove('overflow-hidden');
            };
        }
        return undefined;
    }, [isLocked]);
};
