import { Link, useLocation } from 'react-router-dom'
import { Heart, Clock, Image, BookOpen, Utensils, Settings } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Navigation() {
  const location = useLocation()
  const { isAdmin } = useAuth()

  const navigation = [
    { name: '首页', href: '/', icon: Heart },
    { name: '时间轴', href: '/timeline', icon: Clock },
    { name: '相册', href: '/albums', icon: Image },
    { name: '美食', href: '/food', icon: Utensils },
  ]

  // 管理员额外导航
  const adminNavigation = [
    ...navigation,
    { name: '管理', href: '/admin', icon: Settings }
  ]

  const currentNavigation = isAdmin ? adminNavigation : navigation

  return (
    <nav className="glass-card fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3">
      <div className="flex items-center space-x-8">
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
}