import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { lazy, Suspense, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import AdminLogin from './admin/AdminLogin'
import Icon, { IconName } from '../components/icons/Icons'
import { useConfig } from '../hooks/useConfig'
import ErrorBoundary from '../components/ErrorBoundary'
import { getOptimizedAvatarUrl } from '../utils/imageUtils'

const AdminSettings = lazy(() => import('./admin/AdminSettings'))
const AdminTimeline = lazy(() => import('./admin/AdminTimeline'))
const AdminAlbums = lazy(() => import('./admin/AdminAlbums'))
const AdminFoodCheckin = lazy(() => import('./admin/AdminFoodCheckin'))
const AdminTodos = lazy(() => import('./admin/AdminTodos'))
const AdminTravelMap = lazy(() => import('./admin/AdminTravelMap'))

function AdminLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
    </div>
  )
}

export default function Admin() {
  const { user } = useAuth()
  const { config } = useConfig()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  if (!user) return <AdminLogin />

  const getDefaultAvatar = (seed: string, bg: string) =>
    `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}&backgroundColor=${bg}&backgroundType=solid`

  return (
    <div className="h-screen bg-background-light text-slate-700 transition-colors duration-300 flex relative overflow-hidden">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 右侧内容区域 - 独立滚动 */}
      <main className="flex-1 lg:ml-64 h-screen overflow-y-auto">
        <div className="p-4 md:p-8 pt-24 lg:pt-8 min-h-full w-full">
          <header className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-800"
              >
                <Icon name="menu" size={24} />
              </button>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-1">早安，{user.username || '主人'} ✨</h2>
                <p className="text-slate-500 text-xs md:text-sm hidden md:block">今天也要给生活加点甜呀！</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                <img alt="Bao Avatar" className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white shadow-sm bg-pink-100 object-cover" src={getOptimizedAvatarUrl(config.avatar1, 40) || getDefaultAvatar('Bao', 'ffdfbf')} />
                <img alt="Kai Avatar" className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white shadow-sm bg-blue-100 object-cover" src={getOptimizedAvatarUrl(config.avatar2, 40) || getDefaultAvatar('Kai', 'b6e3f4')} />
              </div>
              <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block"></div>
              <button className="text-gray-400 hover:text-primary transition-colors hidden md:block">
                <Icon name="notifications" size={24} />
              </button>
            </div>
          </header>

          <ErrorBoundary>
            <Suspense fallback={<AdminLoadingFallback />}>
              <Routes>
                <Route path="/" element={<AdminSettings />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="timeline" element={<AdminTimeline />} />
                <Route path="albums" element={<AdminAlbums />} />
                <Route path="food" element={<AdminFoodCheckin />} />
                <Route path="todos" element={<AdminTodos />} />
                <Route path="travel-map" element={<AdminTravelMap />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </div>
      </main>
    </div>
  )
}

interface AdminSidebarProps {
  isOpen: boolean
  onClose: () => void
}

function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const location = useLocation()
  const { logout } = useAuth()

  const menuItems: { path: string, label: string, icon: IconName }[] = [
    { path: '/admin/settings', label: '管理概览', icon: 'dashboard' },
    { path: '/admin/timeline', label: '时间轴管理', icon: 'schedule' },
    { path: '/admin/albums', label: '相册管理', icon: 'photo_library' },
    { path: '/admin/food', label: '美食管理', icon: 'restaurant' },
    { path: '/admin/todos', label: '待办事项', icon: 'checklist' },
    { path: '/admin/travel-map', label: '足迹地图', icon: 'map' },
  ]

  return (
    <aside className={`
      w-64 bg-white border-r border-slate-100 flex flex-col fixed inset-y-0 left-0 z-50 shadow-sm transition-transform duration-300
      lg:translate-x-0
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      {/* 顶部标题 - 不收缩 */}
      <div className="p-8 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <Icon name="favorite" size={20} />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-800 leading-tight">包包和恺恺</h1>
            <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Sweet Admin</p>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-slate-600">
          <Icon name="west" size={20} />
        </button>
      </div>

      {/* 导航菜单 - 可滚动区域 */}
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto min-h-0">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path === '/admin/settings' && location.pathname === '/admin')
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => window.innerWidth < 1024 && onClose()}
              className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 ${isActive
                ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105 pointer-events-none'
                : 'text-slate-500 hover:bg-slate-50'
                }`}
            >
              <Icon name={item.icon} size={20} />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* 底部按钮 - 固定不收缩 */}
      <div className="p-6 space-y-2 flex-shrink-0 border-t border-slate-100 mt-auto bg-white">
        <Link
          to="/"
          className="w-full flex items-center justify-center gap-2 py-3 text-primary hover:text-white hover:bg-primary rounded-2xl transition-all text-sm font-medium border border-primary/20"
        >
          <Icon name="home" size={20} />
          <span>返回首页</span>
        </Link>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-3 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all text-sm font-medium"
        >
          <Icon name="logout" size={20} />
          <span>退出管理</span>
        </button>
      </div>
    </aside>
  )
}