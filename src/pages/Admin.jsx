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
      {/* 移动端遮罩层 - 添加淡入淡出动画 */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ease-in-out animate-fade-in"
          onClick={onClose}
        />
      )}
      
      {/* 侧边栏 - 添加滑入动画和阴影效果 */}
      <div className={`fixed left-0 top-0 h-full w-64 bg-white shadow-2xl transform transition-all duration-300 ease-in-out z-50 ${
        isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      } lg:translate-x-0 lg:shadow-lg hover:lg:shadow-xl transition-shadow duration-300`}>
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
                  className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ease-in-out text-sm transform hover:scale-105 hover:translate-x-1 ${
                    isActive
                      ? 'bg-pink-500 text-white shadow-md hover:bg-pink-600'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm'
                  }`}
                  style={{
                    animationDelay: `${index * 50}ms`
                  }}
                >
                  <Icon className={`h-5 w-5 mr-3 flex-shrink-0 transition-transform duration-200 ${
                    isActive ? 'scale-110' : 'group-hover:scale-110'
                  }`} />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="mt-auto pt-4 border-t border-gray-100">
            <button
              onClick={logout}
              className="w-full flex items-center justify-center px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 ease-in-out text-sm transform hover:scale-105 hover:shadow-md group"
            >
              <LogOut className="h-5 w-5 mr-2 transition-transform duration-200 group-hover:rotate-12" />
              退出登录
            </button>
          </div>
        </div>
      </div>
    </>
  )
}