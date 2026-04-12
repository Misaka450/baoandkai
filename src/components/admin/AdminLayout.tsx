import { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Icon from '../icons/Icons'

interface AdminLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
}

interface NavItem {
  name: string
  href: string
  icon: string
}

const navigation: NavItem[] = [
  { name: '小窝设置', href: '/admin/settings', icon: 'settings' },
  { name: '时间轴', href: '/admin/timeline', icon: 'schedule' },
  { name: '相册', href: '/admin/albums', icon: 'photo_library' },
  { name: '待办', href: '/admin/todos', icon: 'checklist' },
  { name: '美食', href: '/admin/food', icon: 'restaurant' },
  { name: '足迹', href: '/admin/map', icon: 'map' },
  { name: '时间胶囊', href: '/admin/time-capsules', icon: 'event' }
]

export default function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* 左侧 Logo 和导航 */}
            <div className="flex items-center gap-8">
              <Link to="/admin/settings" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center">
                  <Icon name="settings" size={20} className="text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-black text-slate-800 tracking-tight">后台管理</h1>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Admin Panel</p>
                </div>
              </Link>

              {/* 导航菜单 */}
              <nav className="hidden md:flex items-center gap-1">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-primary text-white shadow-lg shadow-primary/20'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <Icon name={item.icon} size={18} />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
            </div>

            {/* 右侧退出按钮 */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            >
              <Icon name="logout" size={18} />
              <span className="hidden sm:inline font-medium">退出</span>
            </button>
          </div>
        </div>

        {/* 移动端导航栏 */}
        <nav className="md:hidden border-t border-slate-200 bg-white/50 backdrop-blur-sm overflow-x-auto">
          <div className="flex items-center gap-2 px-4 py-3">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-lg shadow-primary/20'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon name={item.icon} size={18} />
                </Link>
              )
            })}
          </div>
        </nav>
      </header>

      {/* 页面内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">{title}</h2>
          {subtitle && (
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{subtitle}</p>
          )}
        </div>

        {/* 内容区域 */}
        {children}
      </main>
    </div>
  )
}
