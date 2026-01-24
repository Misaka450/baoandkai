import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { useAuth } from '../contexts/AuthContext'
import AdminLogin from './admin/AdminLogin'
import Icon, { IconName } from '../components/icons/Icons'

const AdminSettings = lazy(() => import('./admin/AdminSettings'))
const AdminTimeline = lazy(() => import('./admin/AdminTimeline'))
const AdminAlbums = lazy(() => import('./admin/AdminAlbums'))
const AdminFoodCheckin = lazy(() => import('./admin/AdminFoodCheckin'))
const AdminTodos = lazy(() => import('./admin/AdminTodos'))

function AdminLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
    </div>
  )
}

export default function Admin() {
  const { user } = useAuth()

  if (!user) return <AdminLogin />

  return (
    <div className="min-h-screen bg-background-light text-slate-700 transition-colors duration-300 flex">
      <AdminSidebar />

      <main className="flex-1 ml-64 p-8 pt-32 lg:pt-8 min-h-screen">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-1">早安，{user.username || '主人'} ✨</h2>
            <p className="text-slate-500 text-sm">今天也要给生活加点甜呀！</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              <img alt="Bao Avatar" className="w-10 h-10 rounded-full border-2 border-white shadow-sm bg-pink-100" src="https://api.dicebear.com/7.x/adventurer/svg?seed=Bao&backgroundColor=ffdfbf" />
              <img alt="Kai Avatar" className="w-10 h-10 rounded-full border-2 border-white shadow-sm bg-blue-100" src="https://api.dicebear.com/7.x/adventurer/svg?seed=Kai&backgroundColor=b6e3f4" />
            </div>
            <div className="h-8 w-px bg-slate-200 mx-2"></div>
            <button className="text-gray-400 hover:text-primary transition-colors">
              <Icon name="notifications" size={24} />
            </button>
          </div>
        </header>

        <Suspense fallback={<AdminLoadingFallback />}>
          <Routes>
            <Route path="/" element={<AdminSettings />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="timeline" element={<AdminTimeline />} />
            <Route path="albums" element={<AdminAlbums />} />
            <Route path="food" element={<AdminFoodCheckin />} />
            <Route path="todos" element={<AdminTodos />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  )
}

function AdminSidebar() {
  const location = useLocation()
  const { logout } = useAuth()

  const menuItems: { path: string, label: string, icon: IconName }[] = [
    { path: '/admin/settings', label: '管理概览', icon: 'dashboard' },
    { path: '/admin/timeline', label: '时间轴管理', icon: 'schedule' },
    { path: '/admin/albums', label: '相册管理', icon: 'photo_library' },
    { path: '/admin/food', label: '美食管理', icon: 'restaurant' },
    { path: '/admin/todos', label: '待办事项', icon: 'checklist' },
  ]

  return (
    <aside className="w-64 bg-white border-r border-slate-100 flex flex-col fixed h-full z-50 shadow-sm">
      <div className="p-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <Icon name="favorite" size={20} />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-800 leading-tight">宝包和恺恺</h1>
            <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Sweet Admin</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path === '/admin/settings' && location.pathname === '/admin')
          return (
            <Link
              key={item.path}
              to={item.path}
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

      <div className="p-6 space-y-4">
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