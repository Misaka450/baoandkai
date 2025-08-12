import { Link, useLocation } from 'react-router-dom'
import { Heart, Clock, Image, BookOpen, Utensils, CheckSquare, Settings, Menu, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useState, useEffect } from 'react'

export default function Navigation() {
  const location = useLocation()
  const { isAdmin } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [scrollProgress, setScrollProgress] = useState(0)

  // 检测是否为移动设备
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 增强版滚动隐藏导航栏 - 带渐变动画
  useEffect(() => {
    let ticking = false
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY
          
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
          
          setLastScrollY(currentScrollY)
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  const navigation = [
    { name: '首页', href: '/', icon: Heart },
    { name: '时间轴', href: '/timeline', icon: Clock },
    { name: '相册', href: '/albums', icon: Image },
    { name: '待办', href: '/todos', icon: CheckSquare },
    { name: '美食', href: '/food', icon: Utensils },
    { name: '管理', href: '/admin', icon: Settings }
  ]

  // 计算导航栏的透明度和位置
  const getNavStyles = () => {
    if (isVisible) {
      return {
        transform: 'translateY(0)',
        opacity: 1,
        backdropFilter: `blur(${Math.max(12 - scrollProgress * 8, 4)}px)`,
        boxShadow: scrollProgress > 0.1 
          ? '0 10px 40px -10px rgba(0, 0, 0, 0.15)' 
          : '0 4px 20px -5px rgba(0, 0, 0, 0.1)'
      }
    } else {
      return {
        transform: 'translateY(-120%)', // 完全隐藏到屏幕外
        opacity: 0,
        backdropFilter: 'blur(4px)',
        boxShadow: '0 4px 20px -5px rgba(0, 0, 0, 0.1)'
      }
    }
  }

  // 计算汉堡按钮的透明度和位置
  const getHamburgerStyles = () => {
    if (isVisible) {
      return {
        transform: 'translateY(0) scale(1)',
        opacity: 1,
        boxShadow: '0 4px 20px -5px rgba(0, 0, 0, 0.15)'
      }
    } else {
      return {
        transform: 'translateY(-100px) scale(0.8)', // 向上滑出并缩小
        opacity: 0,
        boxShadow: '0 4px 20px -5px rgba(0, 0, 0, 0.1)'
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
        className="fixed top-4 right-4 z-50 p-2 bg-white rounded-lg shadow-lg md:hidden transition-all duration-500 ease-out"
      >
        {isMobileMenuOpen ? (
          <X className="h-6 w-6 text-gray-600 transition-transform duration-300 hover:rotate-90" />
        ) : (
          <Menu className="h-6 w-6 text-gray-600 transition-transform duration-300 hover:scale-110" />
        )}
      </button>

      {/* 移动端菜单 - 带淡入淡出动画 */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden transition-opacity duration-300 ease-in-out"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div 
            className="absolute top-16 right-4 bg-white rounded-lg shadow-xl p-4 w-48 transform transition-all duration-300 ease-out"
            style={{
              animation: isMobileMenuOpen ? 'slideIn 0.3s ease-out' : 'slideOut 0.3s ease-in'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-2">
              {currentNavigation.map((item, index) => {
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-300 ease-out ${
                      isActive
                        ? 'bg-pink-100 text-pink-600 scale-105'
                        : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50 hover:scale-105'
                    }`}
                    style={{
                      animation: isMobileMenuOpen ? `fadeInUp 0.4s ease-out ${index * 0.1}s both` : ''
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
      )}
    </>
  )

  // 桌面端导航 - 带弹性动画
  const DesktopNav = () => (
    <nav 
      style={getNavStyles()}
      className="glass-card fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 hidden md:block transition-all duration-500 ease-out"
    >
      <div className="flex items-center space-x-6 lg:space-x-8">
        {currentNavigation.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ease-out ${
                isActive
                  ? 'bg-pink-100 text-pink-600 scale-105 shadow-md'
                  : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50 hover:scale-105 hover:shadow-sm'
              }`}
            >
              <item.icon className="h-4 w-4 transition-transform duration-300 hover:rotate-12" />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )

  return (
    <>
      {/* 添加CSS动画 */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100px) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        @keyframes slideOut {
          from {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateX(100px) scale(0.8);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
      `}</style>
      
      <MobileMenu />
      <DesktopNav />
    </>
  )
}