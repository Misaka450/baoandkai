import { useEffect } from 'react';
import { openModal, closeModal } from '../utils/modalState';

/**
 * Hook to lock body scroll when a component is mounted
 * especially useful for modals and overlays.
 * 自动接入全局模态框状态管理，仅在所有嵌套弹窗都关闭（modalCount === 0）时解锁滚动。
 */
export const useBodyScrollLock = (isLocked: boolean) => {
    useEffect(() => {
        if (!isLocked) return;

        document.body.classList.add('overflow-hidden');
        openModal();

        return () => {
            const remaining = closeModal();
            if (remaining === 0) {
                document.body.classList.remove('overflow-hidden');
            }
        };
    }, [isLocked]);
};

