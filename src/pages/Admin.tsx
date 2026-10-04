import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { lazy, Suspense, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import AdminLogin from './admin/AdminLogin'
import Icon, { IconName } from '../components/icons/Icons'
import { useConfig } from '../hooks/useConfig'
import ErrorBoundary from '../components/common/ErrorBoundary'
import { getOptimizedAvatarUrl } from '../utils/imageUtils'
import { hapticFeedback } from '../utils/haptics'

const AdminSettings = lazy(() => import('./admin/AdminSettings'))
const AdminTimeline = lazy(() => import('./admin/AdminTimeline'))
const AdminAlbums = lazy(() => import('./admin/AdminAlbums'))
const AdminFoodCheckin = lazy(() => import('./admin/AdminFoodCheckin'))
const AdminTodos = lazy(() => import('./admin/AdminTodos'))
const AdminTravelMap = lazy(() => import('./admin/AdminTravelMap'))
const AdminTimeCapsules = lazy(() => import('./admin/AdminTimeCapsules'))
const AdminDashboard = lazy(() => import('./admin/AdminDashboard'))

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
    <div className="h-[100dvh] bg-background-light text-slate-700 transition-colors duration-300 flex relative overflow-hidden">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-stone-900/40 backdrop-blur-[2px] z-40 lg:hidden animate-fade-in"
          onClick={() => {
            hapticFeedback('light')
            setIsSidebarOpen(false)
          }}
        />
      )}

      {/* 右侧内容区域 - 独立滚动，底部自适应安全区 */}
      <main className="flex-1 lg:ml-72 h-[100dvh] overflow-y-auto">
        <div className="p-4 md:p-8 min-h-full w-full pb-[calc(4rem+env(safe-area-inset-bottom))]">
          {/* 吸顶头部 - 移动端支持随时呼出侧边栏 */}
          <header className="sticky top-0 z-30 -mx-4 -mt-4 px-4 py-3 md:-mx-8 md:-mt-8 md:px-8 md:py-4 bg-[#FAF7F2]/90 backdrop-blur-md border-b border-stone-200/60 lg:border-none lg:static lg:bg-transparent lg:p-0 lg:m-0 flex justify-between items-center mb-6 lg:mb-10">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  hapticFeedback('light')
                  setIsSidebarOpen(true)
                }}
                className="lg:hidden w-10 h-10 rounded-xl bg-white border border-stone-200/80 shadow-sm flex items-center justify-center text-slate-600 hover:text-primary active:scale-90 transition-all"
                aria-label="打开管理导航"
              >
                <Icon name="menu" size={20} />
              </button>
              <div>
                <h2 className="text-base sm:text-lg md:text-2xl font-black text-slate-800 leading-tight">早安，{user.username || '主人'} ✨</h2>
                <p className="text-slate-400 text-[11px] md:text-sm hidden sm:block font-medium">今天也要给生活加点甜呀！</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2.5">
                <img alt="Bao Avatar" className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white shadow-sm bg-pink-100 object-cover" src={getOptimizedAvatarUrl(config.avatar1, 40) || getDefaultAvatar('Bao', 'ffdfbf')} />
                <img alt="Kai Avatar" className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white shadow-sm bg-blue-100 object-cover" src={getOptimizedAvatarUrl(config.avatar2, 40) || getDefaultAvatar('Kai', 'b6e3f4')} />
              </div>
              <div className="h-6 w-px bg-slate-200 mx-1 hidden md:block"></div>
              <button className="text-gray-400 hover:text-primary transition-colors hidden md:block">
                <Icon name="notifications" size={20} />
              </button>
            </div>
          </header>

          <ErrorBoundary>
            <Suspense fallback={<AdminLoadingFallback />}>
              <Routes>
                <Route path="/" element={<AdminDashboard />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="timeline" element={<AdminTimeline />} />
                <Route path="albums" element={<AdminAlbums />} />
                <Route path="food" element={<AdminFoodCheckin />} />
                <Route path="todos" element={<AdminTodos />} />
                <Route path="travel-map" element={<AdminTravelMap />} />
                <Route path="time-capsules" element={<AdminTimeCapsules />} />
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
    { path: '/admin', label: '数据看板', icon: 'dashboard' },
    { path: '/admin/settings', label: '站点设置', icon: 'settings' },
    { path: '/admin/timeline', label: '时间轴管理', icon: 'schedule' },
    { path: '/admin/albums', label: '相册管理', icon: 'photo_library' },
    { path: '/admin/food', label: '美食管理', icon: 'restaurant' },
    { path: '/admin/todos', label: '待办事项', icon: 'checklist' },
    { path: '/admin/travel-map', label: '足迹地图', icon: 'map' },
    { path: '/admin/time-capsules', label: '时间胶囊', icon: 'event' },
  ]

  return (
    <aside className={`
      w-72 max-w-[85vw] bg-[#FAF7F2] border-r border-stone-200/80 flex flex-col fixed top-0 bottom-0 left-0 h-[100dvh] z-50 shadow-2xl transition-transform duration-300
      lg:translate-x-0
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      {/* 顶部标题 - 不收缩 */}
      <div className="p-6 flex justify-between items-center flex-shrink-0 border-b border-stone-200/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <Icon name="favorite" size={20} />
          </div>
          <div>
            <h1 className="font-bold text-base md:text-lg text-slate-800 leading-tight">包包和恺恺</h1>
            <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Sweet Admin</p>
          </div>
        </div>
        <button
          onClick={() => {
            hapticFeedback('light')
            onClose()
          }}
          className="lg:hidden w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-stone-200/50 active:scale-90 transition-all"
        >
          <Icon name="west" size={20} />
        </button>
      </div>

      {/* 导航菜单 - 可滚动区域 */}
      <nav className="flex-1 px-3.5 py-4 space-y-1.5 overflow-y-auto no-scrollbar min-h-0">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path === '/admin' && location.pathname === '/admin/')
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => {
                hapticFeedback('light')
                window.innerWidth < 1024 && onClose()
              }}
              className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all duration-200 active:scale-[0.98] ${
                isActive
                  ? 'bg-primary text-white shadow-md shadow-primary/25 font-semibold'
                  : 'text-stone-600 hover:bg-white/80 hover:text-primary'
              }`}
            >
              <Icon name={item.icon} size={20} />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* 底部按钮 - 固定不收缩，并严格适配移动端安全区域 (杜绝任何浏览器底栏遮挡) */}
      <div className="p-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] space-y-2 flex-shrink-0 border-t border-stone-200/60 mt-auto bg-[#FAF7F2]">
        <Link
          to="/"
          onClick={() => hapticFeedback('light')}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-primary hover:text-white hover:bg-primary rounded-xl md:rounded-2xl transition-all text-xs md:text-sm font-semibold border border-primary/20 active:scale-95 bg-white shadow-xs"
        >
          <Icon name="home" size={18} />
          <span>返回首页</span>
        </Link>
        <button
          onClick={() => {
            hapticFeedback('medium')
            logout()
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-red-500 hover:bg-red-50 rounded-xl md:rounded-2xl transition-all text-xs md:text-sm font-medium active:scale-95 bg-white border border-stone-200/40 shadow-xs"
        >
          <Icon name="logout" size={18} />
          <span>退出管理</span>
        </button>
      </div>
    </aside>
  )
}