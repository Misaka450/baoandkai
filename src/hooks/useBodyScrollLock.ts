import { useEffect } from 'react';
import { openModal, closeModal } from '../utils/modalState';

/**
 * Hook to lock body scroll when a component is mounted
 * especially useful for modals and overlays.
 * 自动接入全局模态框状态管理，同步广播弹窗打开/关闭状态。
 */
export const useBodyScrollLock = (isLocked: boolean) => {
    useEffect(() => {
        if (isLocked) {
            document.body.classList.add('overflow-hidden');
            openModal();
        } else {
            document.body.classList.remove('overflow-hidden');
        }
        return () => {
            document.body.classList.remove('overflow-hidden');
            if (isLocked) {
                closeModal();
            }
        };
    }, [isLocked]);
};

