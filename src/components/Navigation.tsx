import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Icon, { IconName } from './icons/Icons'
import { subscribeModalState } from '../utils/modalState'

interface NavItem {
    name: string
    href: string
    icon: IconName
}

// 导航项提取为模块级常量，避免每次渲染重新创建
const navigation: NavItem[] = [
    { name: '首页', href: '/', icon: 'home' },
    { name: '时间轴', href: '/timeline', icon: 'schedule' },
    { name: '相册', href: '/albums', icon: 'photo_library' },
    { name: '情侣', href: '/couple', icon: 'favorite' },
    { name: '待办', href: '/todos', icon: 'checklist' },
    { name: '美食', href: '/food', icon: 'restaurant' },
    { name: '足迹', href: '/map', icon: 'map' },
    { name: '管理', href: '/admin', icon: 'settings' }
]

export default function Navigation() {
    const location = useLocation()
    const [mounted, setMounted] = useState(false)
    const [isVisible, setIsVisible] = useState(true)
    const [isOpen, setIsOpen] = useState(false)
    // 使用 useRef 存储 lastScrollY，避免放入 useEffect 依赖数组导致重复注册事件
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

    // 打开抽屉时禁止底层滚动
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

    return (
        <>
            {/* 桌面端 (md及以上): 保持顶部浮动胶囊导航 */}
            <nav
                aria-label="全局主导航（桌面端）"
                className={`hidden md:flex fixed top-6 left-0 right-0 z-50 justify-center px-4 transition-all duration-500 ${
                    isVisible && !isModalOpen ? 'translate-y-0 opacity-100' : '-translate-y-32 opacity-0'
                }`}
            >
                <div className="glass-card soft-shadow px-6 py-3 rounded-full flex items-center space-x-4 border border-white/50 backdrop-blur-xl">
                    {navigation.map((item) => {
                        const isActive = location.pathname === item.href
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                aria-label={`前往${item.name}`}
                                aria-current={isActive ? 'page' : undefined}
                                className={`flex-shrink-0 flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 focus-visible:outline-2 focus-visible:outline-primary ${
                                    isActive
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105 pointer-events-none'
                                        : 'text-gray-500 hover:text-primary hover:bg-primary/5 active:scale-95'
                                }`}
                            >
                                <Icon name={item.icon} size={20} className="w-5 h-5" />
                                <span className="font-medium text-sm tracking-wide">
                                    {item.name}
                                </span>
                            </Link>
                        )
                    })}
                </div>
            </nav>

            {/* 移动端 (< 768px): 传送门渲染至 document.body，避免受 ancestor transform: translateZ(0) 影响 */}
            {mounted && typeof document !== 'undefined' && createPortal(
                <>
                    {/* 移动端 (< 768px): 左上角汉堡按钮 */}
                    <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        aria-label={isOpen ? '关闭导航菜单' : '打开导航菜单'}
                        aria-expanded={isOpen}
                        className={`fixed top-4 left-4 z-50 md:hidden w-11 h-11 rounded-full glass-card border border-white/70 shadow-md flex items-center justify-center text-slate-700 active:scale-90 transition-all ${
                            isModalOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
                        }`}
                    >
                        <Icon name={isOpen ? 'close' : 'menu'} size={22} />
                    </button>

                    {/* 移动端 (< 768px): 莫兰迪滑动抽屉导航 */}
                    <AnimatePresence>
                        {isOpen && (
                            <motion.div
                                key="drawer-backdrop"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                onClick={() => setIsOpen(false)}
                                className="fixed inset-0 bg-stone-900/30 backdrop-blur-sm z-50 md:hidden"
                                aria-hidden="true"
                            />
                        )}
                        {isOpen && (
                            <motion.div
                                key="drawer-panel"
                                initial={{ x: '-100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '-100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                                className="fixed top-0 bottom-0 left-0 w-72 max-w-[85vw] bg-cream-50/95 backdrop-blur-2xl p-6 shadow-2xl z-50 flex flex-col border-r border-white/60 md:hidden"
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
                                        onClick={() => setIsOpen(false)}
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-stone-500 hover:text-stone-800 hover:bg-stone-200/50 active:scale-90 transition-all"
                                        aria-label="关闭导航栏"
                                    >
                                        <Icon name="close" size={20} />
                                    </button>
                                </div>

                                {/* Nav Items List: 8个项目垂直列表 */}
                                <nav className="flex-1 py-4 space-y-1.5 overflow-y-auto no-scrollbar" aria-label="移动端侧边导航">
                                    {navigation.map((item) => {
                                        const isActive = location.pathname === item.href
                                        return (
                                            <Link
                                                key={item.name}
                                                to={item.href}
                                                onClick={() => setIsOpen(false)}
                                                aria-label={`前往${item.name}`}
                                                aria-current={isActive ? 'page' : undefined}
                                                className={`flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${
                                                    isActive
                                                        ? 'bg-primary text-white shadow-md shadow-primary/25 font-semibold'
                                                        : 'text-stone-600 hover:text-primary hover:bg-primary/5 active:scale-95'
                                                }`}
                                            >
                                                <Icon
                                                    name={item.icon}
                                                    size={20}
                                                    className={isActive ? 'text-white' : 'text-stone-500'}
                                                />
                                                <span className="tracking-wide">{item.name}</span>
                                            </Link>
                                        )
                                    })}
                                </nav>

                                {/* 抽屉底部装饰信息 */}
                                <div className="pt-4 border-t border-stone-200/60 flex items-center justify-between text-[11px] text-stone-400">
                                    <span>遇见你，是银河赠予我的糖</span>
                                    <span>💕</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>,
                document.body
            )}
        </>
    )
}
