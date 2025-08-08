import { Link, useLocation } from 'react-router-dom'
import { Heart, Clock, Image, BookOpen, Utensils, Settings } from 'lucide-react'

const navigation = [
  { name: '首页', href: '/', icon: Heart },
  { name: '时间轴', href: '/timeline', icon: Clock },
  { name: '相册', href: '/albums', icon: Image },
  { name: '美食', href: '/food', icon: Utensils },
  { name: '管理', href: '/admin', icon: Settings },
]

export default function Navigation() {
  const location = useLocation()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-pink-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Heart className="h-8 w-8 text-pink-500" />
            <span className="ml-2 text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
              情侣时光
            </span>
          </div>
          
          <div className="hidden md:flex space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href || 
                (item.href !== '/' && location.pathname.startsWith(item.href))
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-pink-600 bg-pink-50'
                      : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-1" />
                  {item.name}
                </Link>
              )
            })}
          </div>

          {/* 移动端菜单按钮 */}
          <div className="md:hidden">
            <button className="text-gray-600 hover:text-pink-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}