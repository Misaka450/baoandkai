import { ReactNode, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Icon, { IconName } from '../icons/Icons'

interface AdminLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
}

interface NavItem {
  name: string
  href: string
  icon: IconName
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
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 flex">
      {/* 左侧边栏 */}
      <aside 
        className={`fixed left-0 top-0 h-full bg-white border-r border-slate-200 shadow-lg z-50 transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo 区域 */}
          <div className={`p-6 border-b border-slate-100 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
            {!collapsed && (
              <Link to="/admin/settings" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center">
                  <Icon name="settings" size={20} className="text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-black text-slate-800 tracking-tight">后台管理</h1>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Admin Panel</p>
                </div>
              </Link>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 hover:bg-slate-100 rounded-xl transition-all"
              title={collapsed ? '展开导航栏' : '收起导航栏'}
            >
              <Icon 
                name={collapsed ? 'menu_open' : 'close'} 
                size={20} 
                className="text-slate-600" 
              />
            </button>
          </div>

          {/* 导航菜单 */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    collapsed ? 'justify-center' : ''
                  } ${
                    isActive
                      ? 'bg-primary text-white shadow-lg shadow-primary/20'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title={collapsed ? item.name : undefined}
                >
                  <Icon name={item.icon} size={20} />
                  {!collapsed && item.name}
                </Link>
              )
            })}
          </nav>

          {/* 底部按钮 */}
          <div className={`p-4 border-t border-slate-100 space-y-2 ${collapsed ? 'space-y-2' : ''}`}>
            <Link
              to="/"
              className={`flex items-center gap-2 px-4 py-3 text-slate-600 hover:bg-slate-100 rounded-xl transition-all text-sm font-medium ${
                collapsed ? 'justify-center' : 'justify-center'
              }`}
              title={collapsed ? '返回首页' : undefined}
            >
              <Icon name="home" size={18} />
              {!collapsed && '返回首页'}
            </Link>
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-2 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all text-sm font-medium ${
                collapsed ? 'justify-center' : 'justify-center'
              }`}
              title={collapsed ? '退出管理' : undefined}
            >
              <Icon name="logout" size={18} />
              {!collapsed && '退出管理'}
            </button>
          </div>
        </div>
      </aside>

      {/* 页面内容 */}
      <main className={`flex-1 transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-64'} p-8`}>
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
