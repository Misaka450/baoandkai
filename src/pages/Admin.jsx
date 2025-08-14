import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { Settings, Clock, Image, BookOpen, Utensils, CheckSquare, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import AdminLogin from './admin/AdminLogin'
import AdminSettings from './admin/AdminSettings'
import AdminTimeline from './admin/AdminTimeline'
import AdminAlbums from './admin/AdminAlbums'
// 日记管理已移除
import AdminFoodCheckin from './admin/AdminFoodCheckin'
import AdminTodos from './admin/AdminTodos'

export default function Admin() {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!user) {
    return <AdminLogin />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 移动端菜单按钮 */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-white p-3 rounded-lg shadow-lg"
      >
        {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      <AdminSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      {/* 主要内容区域 */}
      <div className="lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8">
        <Routes>
          <Route path="/" element={<AdminSettings />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="timeline" element={<AdminTimeline />} />
          <Route path="albums" element={<AdminAlbums />} />
          {/* <Route path="diary" element={<AdminDiary />} /> 日记管理已移除 */}
          <Route path="food" element={<AdminFoodCheckin />} />
          <Route path="todos" element={<AdminTodos />} />
        </Routes>
      </div>
    </div>
  )
}

function AdminSidebar({ isOpen, onClose }) {
  const location = useLocation()
  const { logout } = useAuth()

  const menuItems = [
    { path: '/admin/settings', label: '基础设置', icon: Settings },
    { path: '/admin/timeline', label: '时间轴管理', icon: Clock },
    { path: '/admin/albums', label: '相册管理', icon: Image },
    // { path: '/admin/diary', label: '日记管理', icon: BookOpen }, // 日记管理已移除
    { path: '/admin/food', label: '美食管理', icon: Utensils },
    { path: '/admin/todos', label: '待办事项', icon: CheckSquare },
  ]

  return (
    <>
      {/* 移动端遮罩层 */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}
      
      {/* 侧边栏 - 恢复必要的响应式动画 */}
      <div className={`fixed left-0 top-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">后台管理</h2>
            <button 
              onClick={onClose}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <nav className="flex-1 space-y-2 overflow-y-auto">
            {menuItems.map((item, index) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center px-4 py-3 rounded-lg text-sm ${
                    isActive
                      ? 'bg-pink-500 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="mt-auto">
            <button
              onClick={logout}
              className="w-full flex items-center justify-center px-4 py-3 text-red-600 hover:bg-gray-100 rounded-lg text-sm"
            >
              <LogOut className="h-5 w-5 mr-2" />
              退出登录
            </button>
          </div>
        </div>
      </div>
    </>
  )
}