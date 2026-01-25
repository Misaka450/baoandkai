import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Icon, { IconName } from './icons/Icons'

interface NavItem {
  name: string
  href: string
  icon: IconName
}

export default function Navigation() {
  const location = useLocation()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const navigation: NavItem[] = [
    { name: '首页', href: '/', icon: 'home' },
    { name: '时间轴', href: '/timeline', icon: 'schedule' },
    { name: '相册', href: '/albums', icon: 'photo_library' },
    { name: '待办', href: '/todos', icon: 'checklist' },
    { name: '美食', href: '/food', icon: 'restaurant' },
    { name: '管理', href: '/admin', icon: 'settings' }
  ]

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // 在顶部时始终显示
      if (currentScrollY < 50) {
        setIsVisible(true)
      }
      // 向上滚动显示，向下滚动隐藏
      else if (currentScrollY < lastScrollY) {
        setIsVisible(true)
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
      }

      setLastScrollY(currentScrollY)
    }

    // 检测图片模态框是否打开
    const checkModal = () => {
      const modal = document.getElementById('premium-image-modal')
      setIsModalOpen(!!modal)
    }

    const observer = new MutationObserver(checkModal)
    observer.observe(document.body, { childList: true, subtree: true })

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      observer.disconnect()
    }
  }, [lastScrollY])

  return (
    <nav
      className={`fixed top-6 left-0 right-0 z-50 flex justify-center px-4 transition-all duration-500 ${isVisible && !isModalOpen ? 'translate-y-0 opacity-100' : '-translate-y-32 opacity-0'
        }`}
    >
      <div className="glass-card soft-shadow px-4 md:px-6 py-2 md:py-3 rounded-full flex items-center space-x-2 md:space-x-4 border border-white/50">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center space-x-1 md:space-x-2 px-2 md:px-4 py-2 rounded-full transition-all duration-300 ${isActive
                ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105 pointer-events-none'
                : 'text-gray-500 hover:text-primary hover:bg-primary/5'
                }`}
            >
              <Icon name={item.icon} size={20} />
              <span className={`font-medium text-xs md:text-sm tracking-wide ${isActive ? 'block' : 'hidden md:block'}`}>
                {item.name}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}