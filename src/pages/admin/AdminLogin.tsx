import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Heart, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react'

const AdminLogin: React.FC = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(username, password)
    } catch (error) {
      setError((error as Error).message || '登录失败，请检查用户名和密码')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 via-stone-100 to-stone-50 relative overflow-hidden">
      {/* 装饰性背景元素 */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-rose-200/30 to-pink-200/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-stone-200/30 to-amber-200/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      {/* 登录卡片 */}
      <div className="relative bg-white/80 backdrop-blur-xl p-8 md:p-10 w-full max-w-md mx-4 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.1)] border border-white/50">
        {/* 头部 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-rose-100 to-pink-100 rounded-2xl mb-4 shadow-lg shadow-rose-100/50">
            <Heart className="w-8 h-8 text-rose-500" />
          </div>
          <h1 className="text-2xl font-semibold text-stone-800 mb-2">后台管理</h1>
          <p className="text-stone-500 text-sm">请输入账号密码登录管理后台</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 用户名输入 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-stone-700">
              用户名
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-stone-50/80 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400/50 focus:border-rose-300 transition-all duration-200 placeholder:text-stone-400"
                placeholder="请输入用户名"
                required
              />
            </div>
          </div>

          {/* 密码输入 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-stone-700">
              密码
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-3.5 bg-stone-50/80 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400/50 focus:border-rose-300 transition-all duration-200 placeholder:text-stone-400"
                placeholder="请输入密码"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm px-4 py-3 rounded-xl flex items-center">
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {/* 登录按钮 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 bg-gradient-to-r from-stone-800 to-stone-700 text-white rounded-xl font-medium hover:from-stone-900 hover:to-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                登录中...
              </>
            ) : (
              '登录'
            )}
          </button>
        </form>

        {/* 底部提示 */}
        <p className="text-center text-stone-400 text-xs mt-6">
          仅限管理员登录使用
        </p>
      </div>
    </div>
  )
}

export default AdminLogin