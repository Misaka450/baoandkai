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

  // 检测是否为移动设备
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 滚动隐藏导航栏
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // 向下滚动超过50px时隐藏，向上滚动时显示
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll)
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

  // 所有用户都显示管理入口
  const currentNavigation = navigation

  // 移动端汉堡菜单
  const MobileMenu = () => (
    <>
      {/* 汉堡按钮 */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className={`fixed top-4 right-4 z-50 p-2 bg-white rounded-lg shadow-lg md:hidden transition-transform duration-300 ${
          isVisible ? 'translate-y-0' : '-translate-y-20'
        }`}
      >
        {isMobileMenuOpen ? (
          <X className="h-6 w-6 text-gray-600" />
        ) : (
          <Menu className="h-6 w-6 text-gray-600" />
        )}
      </button>

      {/* 移动端菜单 */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="absolute top-16 right-4 bg-white rounded-lg shadow-xl p-4 w-48">
            <div className="space-y-2">
              {currentNavigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-pink-100 text-pink-600'
                        : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
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

  // 桌面端导航
  const DesktopNav = () => (
    <nav className={`glass-card fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 hidden md:block transition-transform duration-300 ${
      isVisible ? 'translate-y-0' : '-translate-y-20'
    }`}>
      <div className="flex items-center space-x-6 lg:space-x-8">
        {currentNavigation.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-pink-100 text-pink-600'
                  : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )

  return (
    <>
      <MobileMenu />
      <DesktopNav />
    </>
  )
}