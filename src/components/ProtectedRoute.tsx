import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface ProtectedRouteProps {
    children: ReactNode
    requireAdmin?: boolean
}

/**
 * 路由守卫组件
 * 用于保护需要登录或管理员权限的路由
 */
export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps): JSX.Element {
    const { isLoggedIn, isAdmin, loading } = useAuth()
    const location = useLocation()

    // 加载中显示空白或loading
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 via-stone-100 to-stone-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
                    <p className="text-stone-600">加载中...</p>
                </div>
            </div>
        )
    }

    // 未登录重定向到登录页
    if (!isLoggedIn) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    // 需要管理员权限但用户不是管理员
    if (requireAdmin && !isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 via-stone-100 to-stone-50">
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 md:p-12 max-w-lg mx-4 border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full mb-6">
                            <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-light text-stone-800 mb-3">
                            权限不足
                        </h2>
                        <p className="text-stone-600 font-light mb-6">
                            您没有权限访问此页面，请联系管理员
                        </p>
                        <button
                            onClick={() => window.history.back()}
                            className="px-6 py-3 bg-stone-100 text-stone-700 rounded-xl font-light hover:bg-stone-200 transition-all duration-300"
                        >
                            返回上一页
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return <>{children}</>
}

export default ProtectedRoute
