import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon, { IconName } from '../icons/Icons';

// Toast 提示类型
export type ToastType = 'success' | 'error' | 'warning' | 'info';

// 单条 Toast 数据结构
export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

// Toast 上下文接口
interface ToastContextType {
  toast: {
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
  };
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

// 适配网站“包包和恺恺的小窝”莫兰迪温暖色调的主题配置
const TOAST_THEME: Record<
  ToastType,
  {
    icon: IconName;
    badgeBg: string;
    badgeText: string;
    cardBg: string;
    border: string;
    textColor: string;
    shadow: string;
  }
> = {
  success: {
    icon: 'check_circle',
    badgeBg: 'bg-emerald-100 text-emerald-700',
    badgeText: 'text-emerald-700',
    cardBg: 'bg-white/90 backdrop-blur-md',
    border: 'border-emerald-200/80',
    textColor: 'text-stone-700',
    shadow: 'shadow-[0_10px_30px_-10px_rgba(183,183,164,0.4)]',
  },
  error: {
    icon: 'error',
    badgeBg: 'bg-rose-100 text-rose-600',
    badgeText: 'text-rose-600',
    cardBg: 'bg-white/90 backdrop-blur-md',
    border: 'border-rose-200/80',
    textColor: 'text-stone-700',
    shadow: 'shadow-[0_10px_30px_-10px_rgba(222,179,173,0.45)]',
  },
  warning: {
    icon: 'warning',
    badgeBg: 'bg-amber-100 text-amber-700',
    badgeText: 'text-amber-700',
    cardBg: 'bg-white/90 backdrop-blur-md',
    border: 'border-amber-200/80',
    textColor: 'text-stone-700',
    shadow: 'shadow-[0_10px_30px_-10px_rgba(214,207,199,0.5)]',
  },
  info: {
    icon: 'favorite',
    badgeBg: 'bg-primary/20 text-primary',
    badgeText: 'text-primary',
    cardBg: 'bg-white/90 backdrop-blur-md',
    border: 'border-primary/40',
    textColor: 'text-stone-700',
    shadow: 'shadow-[0_10px_30px_-10px_rgba(201,173,167,0.45)]',
  },
};

/**
 * 全局 Toast 提示提供器
 * 风格：莫兰迪毛玻璃质感、圆润胶囊、温馨动效
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // 移除指定 Toast
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // 添加 Toast
  const addToast = useCallback(
    (type: ToastType, message: string, duration: number = 3200) => {
      const id = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newToast: ToastItem = { id, type, message, duration };

      setToasts((prev) => [...prev.slice(-3), newToast]); // 保持最多 4 条叠加

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const toast = {
    success: (msg: string, duration?: number) => addToast('success', msg, duration),
    error: (msg: string, duration?: number) => addToast('error', msg, duration),
    warning: (msg: string, duration?: number) => addToast('warning', msg, duration),
    info: (msg: string, duration?: number) => addToast('info', msg, duration),
  };

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}

      {/* 提示消息悬浮容器 - 顶部居中定位 */}
      <div
        className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2.5 pointer-events-none w-full max-w-sm px-4"
        aria-live="polite"
        role="status"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((item) => {
            const theme = TOAST_THEME[item.type];
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: -25, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85, y: -15, transition: { duration: 0.18 } }}
                transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.6}
                onDragEnd={(_, info) => {
                  if (Math.abs(info.offset.x) > 60) {
                    removeToast(item.id);
                  }
                }}
                className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-full border ${theme.cardBg} ${theme.border} ${theme.shadow} border-white/60 select-none cursor-grab active:cursor-grabbing w-full`}
              >
                {/* 状态图标圆徽章 */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${theme.badgeBg}`}
                >
                  <Icon name={theme.icon} size={16} />
                </div>

                {/* 提示内容 */}
                <span className={`text-xs sm:text-sm font-semibold tracking-wide flex-1 break-words leading-relaxed ${theme.textColor}`}>
                  {item.message}
                </span>

                {/* 手动关闭按钮 */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeToast(item.id);
                  }}
                  aria-label="关闭提示"
                  className="p-1 rounded-full text-stone-400 hover:text-stone-600 transition-colors flex-shrink-0"
                >
                  <Icon name="close" size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

/**
 * 方便调用的 Toast Hook
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast 必须在 ToastProvider 内部使用');
  }
  return context.toast;
}
