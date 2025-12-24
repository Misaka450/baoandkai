import { Link, useLocation } from 'react-router-dom'
import { Heart, Clock, Image, BookOpen, Utensils, CheckSquare, Settings, Menu, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useState, useEffect, useRef } from 'react'

// 定义导航项接口
interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
}

// 导航栏样式使用 React.CSSProperties 类型

export default function Navigation() {
  const location = useLocation()
  const { isAdmin } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const lastScrollYRef = useRef(0)
  const [scrollProgress, setScrollProgress] = useState(0)

  const navigation: NavItem[] = [
    { name: '首页', href: '/', icon: Heart },
    { name: '时间轴', href: '/timeline', icon: Clock },
    { name: '相册', href: '/albums', icon: Image },
    { name: '待办', href: '/todos', icon: CheckSquare },
    { name: '美食', href: '/food', icon: Utensils },
    { name: '管理', href: '/admin', icon: Settings }
  ]

  // 增强版滚动隐藏导航栏 - 使用 useRef 优化性能
  useEffect(() => {
    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY
          const lastScrollY = lastScrollYRef.current

          // 计算滚动进度用于渐变效果
          const progress = Math.min(currentScrollY / 100, 1)
          setScrollProgress(progress)

          // 更智能的隐藏逻辑 - 考虑滚动距离和方向
          if (currentScrollY > lastScrollY && currentScrollY > 80) {
            // 向下滚动超过80px才开始隐藏
            setIsVisible(false)
          } else if (currentScrollY < lastScrollY || currentScrollY <= 80) {
            // 向上滚动或回到顶部时显示
            setIsVisible(true)
          }

          lastScrollYRef.current = currentScrollY
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, []) // 空依赖数组 - 事件监听器只创建一次

  // 计算导航栏的透明度和位置 - 完美居中
  const getNavStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      position: 'fixed',
      top: '1rem',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 100,
      transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      borderRadius: '1rem',
      padding: '0.75rem 1.5rem',
      boxShadow: '0 8px 32px -8px rgba(0, 0, 0, 0.08)'
    }

    if (isVisible) {
      return {
        ...baseStyles,
        transform: 'translateX(-50%) translateY(0) scale(1)',
        opacity: 1,
        backdropFilter: `blur(${Math.max(16 - scrollProgress * 12, 8)}px)`,
        boxShadow: scrollProgress > 0.1
          ? '0 20px 40px -12px rgba(0, 0, 0, 0.15)'
          : '0 8px 32px -8px rgba(0, 0, 0, 0.08)'
      }
    } else {
      return {
        ...baseStyles,
        transform: 'translateX(-50%) translateY(-150%) scale(0.9)',
        backdropFilter: 'blur(8px)'
      }
    }
  }

  // 计算汉堡按钮的透明度和位置
  const getHamburgerStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      position: 'fixed',
      top: '1rem',
      right: '1rem',
      transform: 'translateY(0)',
      zIndex: 100,
      transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      borderRadius: '0.75rem',
      padding: '0.75rem',
      boxShadow: '0 8px 32px -8px rgba(0, 0, 0, 0.15)'
    }

    if (isVisible) {
      return {
        ...baseStyles,
        transform: 'translateY(0) scale(1)',
        opacity: 1
      }
    } else {
      return {
        ...baseStyles,
        transform: 'translateY(-150px) scale(0.8)',
        opacity: 0
      }
    }
  }

  // 移动端汉堡菜单
  const MobileMenu = () => (
    <>
      {/* 汉堡按钮 */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        style={getHamburgerStyles()}
        className="md:hidden"
      >
        <div className="relative w-6 h-6">
          <span className={`absolute inset-0 w-full h-0.5 bg-gray-600 transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'rotate-45 translate-y-2.5' : ''}`}></span>
          <span className={`absolute inset-0 w-full h-0.5 bg-gray-600 transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
          <span className={`absolute inset-0 w-full h-0.5 bg-gray-600 transition-all duration-300 ease-in-out ${isMobileMenuOpen ? '-rotate-45 -translate-y-2.5' : ''}`}></span>
        </div>
      </button>

      {/* 移动端菜单 - 带淡入淡出动画 */}
      <div
        className={`fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm transition-all duration-500 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <div
          className={`absolute top-16 right-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-4 w-56 transform transition-all duration-500 ease-out ${isMobileMenuOpen ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-4 opacity-0 scale-95'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-1">
            {navigation.map((item, index) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ease-out transform hover:scale-105 ${isActive
                    ? 'bg-gradient-to-r from-pink-100 to-rose-100 text-pink-600 shadow-md'
                    : 'text-gray-600 hover:text-pink-600 hover:bg-gradient-to-r hover:from-pink-50 hover:to-rose-50 hover:shadow-sm'
                    }`}
                  style={{
                    animationDelay: `${index * 0.08}s`
                  }}
                >
                  <item.icon className="h-5 w-5 transition-transform duration-300 hover:rotate-12" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )

  // 桌面端导航 - 完美居中
  const DesktopNav = () => (
    <nav style={getNavStyles()} className="hidden md:block">
      <div className="flex items-center space-x-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all duration-500 ease-out transform hover:scale-110 ${isActive
                ? 'bg-gradient-to-r from-pink-100 to-rose-100 text-pink-600 scale-110 shadow-lg ring-2 ring-pink-200/50'
                : 'text-gray-600 hover:text-pink-600 hover:bg-gradient-to-r hover:from-pink-50 hover:to-rose-50 hover:scale-110 hover:shadow-md'
                }`}
            >
              <item.icon className="h-5 w-5 transition-transform duration-500 hover:rotate-12" />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )

  return (
    <>
      <DesktopNav />
      <MobileMenu />
    </>
  )
}