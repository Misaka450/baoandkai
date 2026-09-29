import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
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
    const [isVisible, setIsVisible] = useState(true)
    // 使用 useRef 存储 lastScrollY，避免放入 useEffect 依赖数组导致重复注册事件
    const lastScrollYRef = useRef(0)
    const [isModalOpen, setIsModalOpen] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY
            const lastScrollY = lastScrollYRef.current

            if (currentScrollY < 50) {
                setIsVisible(true)
            }
            else if (currentScrollY < lastScrollY) {
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
        className={`hidden md:flex fixed top-6 left-0 right-0 z-50 justify-center px-4 transition-all duration-500 ${isVisible && !isModalOpen ? 'translate-y-0 opacity-100' : '-translate-y-32 opacity-0'
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
                className={`flex-shrink-0 flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 focus-visible:outline-2 focus-visible:outline-primary ${isActive
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

      {/* 移动端 (< 768px): 专享底部浮动 Dock */}
      <nav
        aria-label="全局主导航（移动端）"
        className={`md:hidden fixed bottom-3 inset-x-3 z-50 pb-[env(safe-area-inset-bottom)] transition-all duration-500 ${isVisible && !isModalOpen ? 'translate-y-0 opacity-100' : 'translate-y-32 opacity-0 pointer-events-none'
          }`}
      >
        <div className="glass-card bg-cream-50/85 backdrop-blur-xl border border-white/60 shadow-xl rounded-2xl p-1.5 flex items-center justify-between overflow-x-auto no-scrollbar gap-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                aria-label={`前往${item.name}`}
                aria-current={isActive ? 'page' : undefined}
                className={`flex-1 min-w-[3rem] py-1.5 px-1 rounded-xl flex flex-col items-center justify-center transition-all duration-300 focus-visible:outline-2 focus-visible:outline-primary ${isActive
                  ? 'bg-primary text-white shadow-md shadow-primary/25 scale-[1.02] font-semibold pointer-events-none'
                  : 'text-stone-500 hover:text-primary active:scale-95'
                  }`}
              >
                <Icon
                  name={item.icon}
                  size={19}
                  className={`transition-transform duration-200 ${isActive ? 'scale-110 mb-0.5' : 'mb-0.5'}`}
                />
                <span className={`text-[11px] leading-tight tracking-tight whitespace-nowrap ${isActive ? 'text-white' : 'text-stone-500'}`}>
                  {item.name}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}