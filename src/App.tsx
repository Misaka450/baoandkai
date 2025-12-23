import { Routes, Route, Outlet } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import Layout from './components/Layout'
import { AuthProvider } from './contexts/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import ProtectedRoute from './components/ProtectedRoute'

// 懒加载页面组件 - 优化首屏加载性能
const Home = lazy(() => import('./pages/Home'))
const Timeline = lazy(() => import('./pages/Timeline'))
const Albums = lazy(() => import('./pages/Albums'))
const Todos = lazy(() => import('./pages/Todos'))
const FoodCheckin = lazy(() => import('./pages/FoodCheckin'))
const ErrorDemo = lazy(() => import('./pages/ErrorDemo'))
const Admin = lazy(() => import('./pages/Admin'))
const Login = lazy(() => import('./pages/Login'))

// 加载占位组件
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 via-stone-100 to-stone-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
        <p className="text-stone-600">加载中...</p>
      </div>
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
              <Route path="timeline" element={<Timeline />} />
              <Route path="albums" element={<Albums />} />
              <Route path="todos" element={<Todos />} />
              <Route path="food" element={<FoodCheckin />} />
              <Route path="error-demo" element={<ErrorDemo />} />
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