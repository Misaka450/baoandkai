import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { Settings, Clock, Image, Utensils, CheckSquare, LogOut, Menu, X, Home } from 'lucide-react'
import { useState, lazy, Suspense } from 'react'
import { useAuth } from '../contexts/AuthContext'
import AdminLogin from './admin/AdminLogin'

// 懒加载 Admin 子页面组件 - 减小初始包大小
const AdminSettings = lazy(() => import('./admin/AdminSettings'))
const AdminTimeline = lazy(() => import('./admin/AdminTimeline'))
const AdminAlbums = lazy(() => import('./admin/AdminAlbums'))
const AdminFoodCheckin = lazy(() => import('./admin/AdminFoodCheckin'))
const AdminTodos = lazy(() => import('./admin/AdminTodos'))

// Admin 页面加载占位组件
function AdminLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-stone-600 mx-auto mb-4"></div>
        <p className="text-stone-500 text-sm">加载中...</p>
      </div>
    </div>
  )
}

// 定义AdminSidebar组件的props接口
interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Admin() {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!user) {
    return <AdminLogin />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-100 to-stone-50">
      {/* 移动端菜单按钮 */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-20 left-4 z-50 bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-stone-200/50 hover:bg-stone-50 transition-colors"
        aria-label="菜单"
      >
        {sidebarOpen ? <X className="h-5 w-5 text-stone-700" /> : <Menu className="h-5 w-5 text-stone-700" />}
      </button>

      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* 主要内容区域 */}
      <div className={`p-4 lg:p-8 pt-24 lg:pt-8 transition-all duration-300 ${sidebarOpen ? 'ml-72' : 'ml-0'} lg:ml-72`}>
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
      </div>
    </div>
  )
}

function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const location = useLocation()
  const { logout, user } = useAuth()

  const menuItems = [
    { path: '/admin/settings', label: '基础设置', icon: Settings },
    { path: '/admin/timeline', label: '时间轴管理', icon: Clock },
    { path: '/admin/albums', label: '相册管理', icon: Image },
    { path: '/admin/food', label: '美食管理', icon: Utensils },
    { path: '/admin/todos', label: '待办事项', icon: CheckSquare },
  ]

  return (
    <>
      {/* 移动端遮罩层 */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* 侧边栏 */}
      <div className={`fixed left-0 top-0 h-full w-72 bg-white/95 backdrop-blur-md shadow-2xl border-r border-stone-200/50 transform transition-transform duration-300 ease-out z-50 ${isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}>
        <div className="p-6 h-full flex flex-col">
          {/* 头部 */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-xl font-semibold text-stone-800">后台管理</h2>
              {user && (
                <p className="text-sm text-stone-500 mt-1">欢迎回来，{user.username || '管理员'}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
              aria-label="关闭菜单"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* 返回前台链接 */}
          <Link
            to="/"
            className="flex items-center px-4 py-3 mb-4 rounded-xl text-stone-600 hover:text-stone-800 hover:bg-stone-100/80 transition-all duration-200 group"
          >
            <Home className="h-5 w-5 mr-3 text-stone-400 group-hover:text-stone-600 transition-colors" />
            <span className="font-medium">返回前台</span>
          </Link>

          {/* 分隔线 */}
          <div className="h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent mb-4" />

          {/* 导航菜单 */}
          <nav className="flex-1 space-y-1.5 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive
                    ? 'bg-gradient-to-r from-stone-800 to-stone-700 text-white shadow-lg shadow-stone-300/30'
                    : 'text-stone-600 hover:text-stone-800 hover:bg-stone-100/80'
                    }`}
                >
                  <Icon className={`h-5 w-5 mr-3 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-stone-400 group-hover:text-stone-600'
                    }`} />
                  {item.label}
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* 底部区域 */}
          <div className="mt-auto pt-4 border-t border-stone-100">
            <button
              onClick={logout}
              className="w-full flex items-center justify-center px-4 py-3 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl text-sm font-medium transition-all duration-200 group"
            >
              <LogOut className="h-5 w-5 mr-2 transition-transform duration-200 group-hover:-translate-x-1" />
              退出登录
            </button>
          </div>
        </div>
      </div>
    </>
  )
}