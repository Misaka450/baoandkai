import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { Settings, Clock, Image, BookOpen, Utensils, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import AdminLogin from './admin/AdminLogin'
import AdminSettings from './admin/AdminSettings'
import AdminTimeline from './admin/AdminTimeline'
import AdminAlbums from './admin/AdminAlbums'
// 日记管理已移除
import AdminFood from './admin/AdminFood'

export default function Admin() {
  const { user } = useAuth()

  if (!user) {
    return <AdminLogin />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="ml-64 p-8">
        <Routes>
          <Route path="/" element={<AdminSettings />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="timeline" element={<AdminTimeline />} />
          <Route path="albums" element={<AdminAlbums />} />
          {/* <Route path="diary" element={<AdminDiary />} /> 日记管理已移除 */}
          <Route path="food" element={<AdminFood />} />
        </Routes>
      </div>
    </div>
  )
}

function AdminSidebar() {
  const location = useLocation()
  const { logout } = useAuth()

  const menuItems = [
    { path: '/admin/settings', label: '基础设置', icon: Settings },
    { path: '/admin/timeline', label: '时间轴管理', icon: Clock },
    { path: '/admin/albums', label: '相册管理', icon: Image },
    // { path: '/admin/diary', label: '日记管理', icon: BookOpen }, // 日记管理已移除
    { path: '/admin/food', label: '美食管理', icon: Utensils },
  ]

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">后台管理</h2>
        
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-pink-500 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5 mr-2" />
            退出登录
          </button>
        </div>
      </div>
    </div>
  )
}