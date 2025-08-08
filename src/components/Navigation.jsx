import { Link, useLocation } from 'react-router-dom'
import { Heart, Settings } from 'lucide-react'

const navigation = [
  { name: '首页', href: '/', icon: Heart },
  { name: '管理', href: '/admin', icon: Settings },
]

export default function Navigation() {
  const location = useLocation()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-white/20 shadow-lg">
      <div className="container-modern">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Heart className="h-8 w-8 text-gradient animate-pulse" />
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
            </div>
            <span className="text-xl font-bold text-gradient">
              情侣时光
            </span>
          </div>
          
          <div className="hidden md:flex items-center space-x-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href || 
                (item.href !== '/' && location.pathname.startsWith(item.href))
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'text-white bg-gradient-to-r from-pink-500 to-purple-500 shadow-lg shadow-purple-500/25'
                      : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50/50'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.name}
                </Link>
              )
            })}
          </div>

          {/* 移动端菜单按钮 */}
          <div className="md:hidden">
            <button className="p-2 rounded-2xl text-gray-600 hover:text-pink-600 hover:bg-pink-50/50 transition-all duration-300">
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