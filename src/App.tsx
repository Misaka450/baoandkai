import { Routes, Route } from 'react-router-dom'
import { Suspense, lazy, useEffect } from 'react'
import Layout from './components/Layout'
import { AuthProvider } from './contexts/AuthContext'
import ErrorBoundary from './components/common/ErrorBoundary'
import RouteErrorBoundary from './components/common/RouteErrorBoundary'
import ProtectedRoute from './components/ProtectedRoute'

// 懒加载页面组件 - 优化首屏加载性能
const Home = lazy(() => import('./pages/Home'))
const Timeline = lazy(() => import('./pages/Timeline'))
const Albums = lazy(() => import('./pages/Albums'))
const AlbumDetail = lazy(() => import('./pages/AlbumDetail'))
const PhotoViewer = lazy(() => import('./pages/PhotoViewer'))
const Todos = lazy(() => import('./pages/Todos'))
const FoodCheckin = lazy(() => import('./pages/FoodCheckin'))
const TravelMap = lazy(() => import('./pages/TravelMap'))
const Admin = lazy(() => import('./pages/Admin'))
const Login = lazy(() => import('./pages/Login'))
const CoupleFeatures = lazy(() => import('./pages/CoupleFeatures'))
const NotFound = lazy(() => import('./pages/NotFound'))

import LoadingSpinner from './components/common/LoadingSpinner'

/**
 * 路由预加载映射表
 * 首页加载完成后，在浏览器空闲时预加载其他常用页面
 */
const prefetchRoutes: Record<string, () => Promise<any>> = {
  '/timeline': () => import('./pages/Timeline'),
  '/albums': () => import('./pages/Albums'),
  '/todos': () => import('./pages/Todos'),
  '/food': () => import('./pages/FoodCheckin'),
  '/couple': () => import('./pages/CoupleFeatures'),
}

/**
 * 在浏览器空闲时预加载路由模块
 * 使用 requestIdleCallback 避免阻塞主线程
 */
function prefetchCommonRoutes() {
  const prefetch = () => {
    Object.values(prefetchRoutes).forEach(loader => {
      loader().catch(() => {})
    })
  }

  if ('requestIdleCallback' in window) {
    requestIdleCallback(prefetch, { timeout: 3000 })
  } else {
    setTimeout(prefetch, 2000)
  }
}

// 加载占位组件
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 via-stone-100 to-stone-50">
      <LoadingSpinner size="lg" text="小窝正在开启..." />
    </div>
  )
}

function App() {
  // 首页渲染后预加载常用路由
  useEffect(() => {
    prefetchCommonRoutes()
  }, [])

  return (
    <ErrorBoundary>
      <AuthProvider>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<RouteErrorBoundary><Home /></RouteErrorBoundary>} />
              <Route path="timeline" element={<RouteErrorBoundary><ProtectedRoute><Timeline /></ProtectedRoute></RouteErrorBoundary>} />
              <Route path="albums" element={<RouteErrorBoundary><ProtectedRoute><Albums /></ProtectedRoute></RouteErrorBoundary>} />
              <Route path="albums/:id" element={<RouteErrorBoundary><ProtectedRoute><AlbumDetail /></ProtectedRoute></RouteErrorBoundary>} />
              <Route path="todos" element={<RouteErrorBoundary><ProtectedRoute><Todos /></ProtectedRoute></RouteErrorBoundary>} />
              <Route path="food" element={<RouteErrorBoundary><ProtectedRoute><FoodCheckin /></ProtectedRoute></RouteErrorBoundary>} />
              <Route path="map" element={<RouteErrorBoundary><ProtectedRoute><TravelMap /></ProtectedRoute></RouteErrorBoundary>} />
              <Route path="couple" element={<RouteErrorBoundary><ProtectedRoute><CoupleFeatures /></ProtectedRoute></RouteErrorBoundary>} />
              <Route path="admin/*" element={
                <RouteErrorBoundary>
                  <ProtectedRoute requireAdmin>
                    <Admin />
                  </ProtectedRoute>
                </RouteErrorBoundary>
              } />
            </Route>
            <Route path="/albums/:albumId/photo" element={<RouteErrorBoundary><ProtectedRoute><PhotoViewer /></ProtectedRoute></RouteErrorBoundary>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
