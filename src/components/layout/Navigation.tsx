import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation } from 'react-router-dom'
import Icon, { IconName } from '../icons/Icons'
import { subscribeModalState } from '../../utils/modalState'
import { hapticFeedback } from '../../utils/haptics'

interface MainNavItem {
    name: string
    href: string
    icon: IconName
    badgeDesc: string
    subRoutes: string[]
}

const mainNavItems: MainNavItem[] = [
    {
        name: '小窝',
        href: '/',
        icon: 'home',
        badgeDesc: '甜蜜主页',
        subRoutes: ['/']
    },
    {
        name: '时光',
        href: '/timeline',
        icon: 'schedule',
        badgeDesc: '恋爱编年史',
        subRoutes: ['/timeline']
    },
    {
        name: '回忆',
        href: '/albums',
        icon: 'photo_library',
        badgeDesc: '相册与足迹地图',
        subRoutes: ['/albums', '/map']
    },
    {
        name: '我们',
        href: '/couple',
        icon: 'favorite',
        badgeDesc: '纪念日 · 心愿 · 美食',
        subRoutes: ['/couple', '/todos', '/food']
    }
]

export default function Navigation() {
    const location = useLocation()
    const [mounted, setMounted] = useState(false)
    const [isVisible, setIsVisible] = useState(true)
    const [isOpen, setIsOpen] = useState(false)
    const lastScrollYRef = useRef(0)
    const [isModalOpen, setIsModalOpen] = useState(false)

    // 客户端挂载标记
    useEffect(() => {
        setMounted(true)
    }, [])

    // 路由切换时自动关闭抽屉
    useEffect(() => {
        setIsOpen(false)
    }, [location.pathname])

    // 打开抽屉时仅锁定底层滚动，避免触发全局模态状态自死锁与重绘
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [isOpen])

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY
            const lastScrollY = lastScrollYRef.current

            if (currentScrollY < 50) {
                setIsVisible(true)
            } else if (currentScrollY < lastScrollY) {
                setIsVisible(true)
            } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
                setIsVisible(false)
            }

            lastScrollYRef.current = currentScrollY
        }

        // 订阅模态框状态，替代 MutationObserver
        const unsubscribe = subscribeModalState(setIsModalOpen)

        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => {
            window.removeEventListener('scroll', handleScroll)
            unsubscribe()
        }
    }, [])

    // 智能匹配高亮规则
    const isItemActive = (item: MainNavItem) => {
        if (item.href === '/') {
            return location.pathname === '/'
        }
        return item.subRoutes.some(route => location.pathname === route || location.pathname.startsWith(`${route}/`))
    }

    const isAdminActive = location.pathname.startsWith('/admin')

    return (
        <>
            {/* 桌面端 (md及以上): 保持顶部浮动胶囊导航 (4个主入口 + 1个低调设置) */}
            <nav
                aria-label="全局主导航（桌面端）"
                className={`hidden md:flex fixed top-6 left-0 right-0 z-50 justify-center px-4 transition-all duration-500 ${
                    isVisible && !isModalOpen ? 'translate-y-0 opacity-100' : '-translate-y-32 opacity-0'
                }`}
            >
                <div className="glass-card soft-shadow px-4 py-2.5 rounded-full flex items-center space-x-2 border border-white/60 backdrop-blur-xl shadow-lg shadow-pink-900/5">
                    {/* 4 个核心心智导航 */}
                    {mainNavItems.map((item) => {
                        const active = isItemActive(item)
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                aria-label={`前往${item.name}`}
                                aria-current={active ? 'page' : undefined}
                                className={`flex-shrink-0 flex items-center space-x-2 px-5 py-2 rounded-full transition-all duration-300 focus-visible:outline-2 focus-visible:outline-primary ${
                                    active
                                        ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-105 font-medium'
                                        : 'text-stone-600 hover:text-primary hover:bg-primary/5 active:scale-95'
                                }`}
                            >
                                <Icon name={item.icon} size={18} className="w-4 h-4" />
                                <span className="text-sm tracking-wider">
                                    {item.name}
                                </span>
                            </Link>
                        )
                    })}

                    {/* 分隔微细线 */}
                    <div className="w-[1px] h-4 bg-stone-300/50 mx-1" />

                    {/* 1 个低调设置（桌面端小巧图标按钮） */}
                    <Link
                        to="/admin"
                        aria-label="管理后台与小窝设置"
                        title="小窝设置"
                        aria-current={isAdminActive ? 'page' : undefined}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 focus-visible:outline-2 focus-visible:outline-primary ${
                            isAdminActive
                                ? 'bg-stone-800 text-white shadow-md shadow-stone-800/20 scale-105'
                                : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100/80 active:scale-95'
                        }`}
                    >
                        <Icon name="settings" size={17} />
                    </Link>
                </div>
            </nav>

            {/* 移动端 (< 768px): 传送门渲染至 document.body，避免受 ancestor transform: translateZ(0) 影响 */}
            {mounted && typeof document !== 'undefined' && createPortal(
                <>
                    {/* 移动端 (< 768px): 左上角汉堡按钮 */}
                    <button
                        type="button"
                        onClick={() => {
                            hapticFeedback('light')
                            setIsOpen(!isOpen)
                        }}
                        aria-label={isOpen ? '关闭导航菜单' : '打开导航菜单'}
                        aria-expanded={isOpen}
                        className={`fixed top-[calc(1rem+env(safe-area-inset-top))] left-4 z-50 md:hidden w-11 h-11 rounded-full glass-card border border-white/70 shadow-md flex items-center justify-center text-slate-700 active:scale-90 transition-all ${
                            isModalOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
                        }`}
                    >
                        <Icon name={isOpen ? 'close' : 'menu'} size={22} />
                    </button>

                    {/* 移动端 (< 768px): 莫兰迪滑动抽屉遮罩背景 (纯净GPU淡入淡出，彻底移除backdrop-blur-sm开销) */}
                    <div
                        onClick={() => setIsOpen(false)}
                        aria-hidden="true"
                        className={`fixed inset-0 bg-stone-900/35 z-50 md:hidden transition-opacity duration-250 ease-out will-change-opacity ${
                            isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                        }`}
                    />

                    {/* 移动端 (< 768px): 莫兰迪精简抽屉面板 (纯色莫兰迪温润背景 + 独立GPU合成层 will-change-transform，0模糊开销，120fps丝滑) */}
                    <aside
                        aria-label="移动端侧边导航"
                        aria-hidden={!isOpen}
                        style={{
                            transform: isOpen ? 'translate3d(0, 0, 0)' : 'translate3d(-100%, 0, 0)',
                            willChange: 'transform',
                        }}
                        className="fixed top-0 bottom-0 left-0 w-80 max-w-[85vw] bg-[#FAF7F2] p-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl z-50 flex flex-col border-r border-stone-200/80 md:hidden transition-transform duration-250 ease-out"
                    >
                        {/* Drawer Header: 头部品牌区与关闭按钮 */}
                        <div className="flex items-center justify-between pb-5 border-b border-stone-200/60">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-300 to-amber-200 flex items-center justify-center shadow-inner border border-white/80">
                                    <span className="text-lg">💖</span>
                                </div>
                                <div>
                                    <h2 className="font-semibold text-stone-800 text-sm tracking-wide">
                                        包包和恺恺的小窝
                                    </h2>
                                    <p className="text-[11px] text-stone-400">Sweet Memory Space</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    hapticFeedback('light')
                                    setIsOpen(false)
                                }}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-stone-500 hover:text-stone-800 hover:bg-stone-200/50 active:scale-90 transition-all"
                                aria-label="关闭导航栏"
                            >
                                <Icon name="close" size={20} />
                            </button>
                        </div>

                        {/* Nav Items List: 4个精致大卡片项 */}
                        <nav className="flex-1 py-6 space-y-3.5 overflow-y-auto no-scrollbar" aria-label="移动端侧边导航项">
                            {mainNavItems.map((item) => {
                                const active = isItemActive(item)
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        onClick={() => {
                                            hapticFeedback('light')
                                            setIsOpen(false)
                                        }}
                                        aria-label={`前往${item.name}`}
                                        aria-current={active ? 'page' : undefined}
                                        className={`group flex items-center justify-between p-4 rounded-2xl transition-all duration-200 border ${
                                            active
                                                ? 'bg-primary text-white border-primary/20 shadow-md shadow-primary/25 font-semibold'
                                                : 'bg-white/70 text-stone-700 border-white/80 hover:bg-white hover:text-primary active:scale-[0.98] shadow-sm'
                                        }`}
                                    >
                                        <div className="flex items-center space-x-3.5">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                                                active ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600 group-hover:text-primary group-hover:bg-primary/10'
                                            }`}>
                                                <Icon name={item.icon} size={22} />
                                            </div>
                                            <div className="text-left">
                                                <div className="text-base tracking-wide leading-tight">{item.name}</div>
                                                <div className={`text-xs mt-1 transition-colors ${
                                                    active ? 'text-white/80' : 'text-stone-400'
                                                }`}>
                                                    {item.badgeDesc}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`text-xs opacity-60 ${active ? 'text-white' : 'text-stone-400'}`}>
                                            ➔
                                        </div>
                                    </Link>
                                )
                            })}
                        </nav>

                        {/* 抽屉底部区域：低调设置入口 + 浪漫寄语 */}
                        <div className="pt-4 border-t border-stone-200/60 space-y-3">
                            <Link
                                to="/admin"
                                onClick={() => setIsOpen(false)}
                                className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs transition-colors ${
                                    isAdminActive
                                        ? 'bg-stone-200/80 text-stone-800 font-semibold'
                                        : 'text-stone-400 hover:text-stone-700 hover:bg-white/50 active:scale-95'
                                }`}
                            >
                                <Icon name="settings" size={16} />
                                <span>小窝设置与管理</span>
                            </Link>

                            <div className="flex items-center justify-between text-[11px] text-stone-400 px-1 pt-1">
                                <span>遇见你，是银河赠予我的糖</span>
                                <span>💕</span>
                            </div>
                        </div>
                    </aside>
                </>,
                document.body
            )}
        </>
    )
}
