import { Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import Layout from './components/Layout'
import { AuthProvider } from './contexts/AuthContext'
import ErrorBoundary from './components/common/ErrorBoundary'
import ProtectedRoute from './components/ProtectedRoute'

// 懒加载页面组件 - 优化首屏加载性能
const Home = lazy(() => import('./pages/Home'))
const Timeline = lazy(() => import('./pages/Timeline'))
const Albums = lazy(() => import('./pages/Albums'))
const AlbumDetail = lazy(() => import('./pages/AlbumDetail'))
const Todos = lazy(() => import('./pages/Todos'))
const FoodCheckin = lazy(() => import('./pages/FoodCheckin'))
const Admin = lazy(() => import('./pages/Admin'))
const Login = lazy(() => import('./pages/Login'))

import LoadingSpinner from './components/common/LoadingSpinner'

// 加载占位组件
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 via-stone-100 to-stone-50">
      <LoadingSpinner size="lg" text="小窝正在开启..." />
    </div>
  )
}

function App(): JSX.Element {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* 登录页面 - 顶级路由 */}
            <Route path="/login" element={<Login />} />
            {/* 主应用布局 */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="timeline" element={<ProtectedRoute><Timeline /></ProtectedRoute>} />
              <Route path="albums" element={<ProtectedRoute><Albums /></ProtectedRoute>} />
              <Route path="albums/:id" element={<ProtectedRoute><AlbumDetail /></ProtectedRoute>} />
              <Route path="todos" element={<ProtectedRoute><Todos /></ProtectedRoute>} />
              <Route path="food" element={<ProtectedRoute><FoodCheckin /></ProtectedRoute>} />
              <Route path="admin/*" element={
                <ProtectedRoute requireAdmin>
                  <Admin />
                </ProtectedRoute>
              } />
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App