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
const AdminTimeCapsules = lazy(() => import('./admin/AdminTimeCapsules'))

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
    <div className="h-screen bg-background-light text-slate-700 transition-colors duration-300">
      {/* 右侧内容区域 - 独立滚动 */}
      <main className="h-screen overflow-y-auto">
        <div className="p-4 md:p-8 pt-24 lg:pt-8 min-h-full w-full">
          <header className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-4">
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
                <Route path="time-capsules" element={<AdminTimeCapsules />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </div>
      </main>
    </div>
  )
}