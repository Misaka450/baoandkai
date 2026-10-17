/**
 * CSS 类名常量
 * 统一管理常用的 CSS 类名和样式组合
 */

// ==================== 设计 Token ====================
// 统一前后台的设计规范，减少"每页一个设计"的问题

export const DESIGN_TOKENS = {
    borderRadius: {
        card: '1.5rem',
        button: '0.75rem',
        input: '0.75rem',
        badge: '9999px',
        modal: '1.5rem',
    },
    shadow: {
        card: '0 4px 24px rgba(0,0,0,0.06)',
        hover: '0 8px 32px rgba(0,0,0,0.1)',
        modal: '0 24px 48px rgba(0,0,0,0.12)',
        button: '0 2px 8px rgba(0,0,0,0.08)',
    },
    border: {
        light: '1px solid rgba(0,0,0,0.04)',
        medium: '1px solid rgba(0,0,0,0.08)',
        focus: '2px solid rgba(var(--color-primary), 0.3)',
    },
    spacing: {
        cardPadding: '1.5rem',
        sectionGap: '2rem',
    },
    typography: {
        // 前台标题层级
        frontTitle: 'text-2xl font-black',
        frontSubtitle: 'text-lg font-bold',
        // 后台标题层级
        adminTitle: 'text-lg font-bold',
        adminSubtitle: 'text-sm font-semibold',
    },
} as const

// ==================== 卡片变体 ====================
// 按内容类型区分卡片风格，减少同质化

export const CARD_VARIANTS = {
    // 纪念内容：更柔和、更多留白、浅粉底
    memory: {
        container: 'rounded-[1.5rem] bg-gradient-to-br from-rose-50/80 to-pink-50/40 border border-rose-100/50 shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-6',
        hover: 'hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:-translate-y-0.5',
        title: 'text-lg font-black text-slate-800',
        subtitle: 'text-xs font-medium text-rose-400',
    },
    // 数据统计：更克制、规整网格、浅灰底
    data: {
        container: 'rounded-[1.5rem] bg-gradient-to-br from-slate-50 to-gray-50/50 border border-slate-100/80 shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-5',
        hover: 'hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:-translate-y-0.5',
        title: 'text-sm font-bold text-slate-700',
        subtitle: 'text-[10px] font-bold text-slate-400 uppercase tracking-widest',
    },
    // 地图探索：更轻、半透明、强调图层感
    map: {
        container: 'rounded-[1.5rem] bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-5',
        hover: 'hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:bg-white/80',
        title: 'text-base font-black text-slate-800',
        subtitle: 'text-[10px] font-bold text-primary uppercase tracking-widest',
    },
} as const

// 卡片变体类型
export type CardVariant = keyof typeof CARD_VARIANTS

// ==================== 常用按钮与网格布局常量 ====================

/** 主按钮样式 */
export const PRIMARY_BUTTON = 'px-8 py-3 bg-primary text-white rounded-full shadow-lg shadow-primary/20 hover:scale-105 transition-transform'

/** 次要按钮样式 */
export const SECONDARY_BUTTON = 'px-6 py-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors'

/** 响应式网格布局 */
export const RESPONSIVE_GRID = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'
