import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Heart } from 'lucide-react'

const Login: React.FC = () => {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            await login(username, password)
            // 登录成功后跳转到首页
            navigate('/')
        } catch (error) {
            setError((error as Error).message || '登录失败,请检查用户名和密码')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 via-stone-100 to-stone-50">
            {/* 装饰性背景元素 */}
            <div className="fixed inset-0 -z-10 overflow-hidden">
                <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-pink-200/20 to-purple-200/20 rounded-full blur-3xl"></div>
                <div className="fixed inset-0 bg-gradient-to-br from-stone-50 via-stone-100 to-stone-50 -z-10" />
                <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-stone-200/20 via-transparent to-transparent -z-10" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-200/20 to-pink-200/20 rounded-full blur-3xl"></div>
            </div>
            
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 md:p-12 w-full max-w-md border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all duration-500 hover:shadow-[0_12px_48px_rgba(0,0,0,0.12)]">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-rose-100 to-pink-100 rounded-full mb-6 shadow-[0_4px_16px_rgba(255,105,180,0.15)]">
                        <Heart className="w-10 h-10 text-rose-500" />
                    </div>
                    <h1 className="text-4xl font-light text-stone-800 mb-3 bg-gradient-to-r from-stone-800 to-stone-600 bg-clip-text text-transparent">
                        宝&凯的小窝
                    </h1>
                    <p className="text-lg text-stone-600 font-light">请登录以继续访问</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-light text-stone-700 mb-2 ml-1">
                            用户名
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-5 py-4 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-rose-300 focus:border-transparent bg-white/80 font-light transition-all duration-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
                            required
                            autoFocus
                            placeholder="请输入用户名"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-light text-stone-700 mb-2 ml-1">
                            密码
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-5 py-4 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-rose-300 focus:border-transparent bg-white/80 font-light transition-all duration-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
                            required
                            placeholder="请输入密码"
                        />
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm text-center bg-red-50/50 border border-red-100 rounded-xl p-4 font-light shadow-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 px-6 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-2xl font-light hover:from-rose-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                登录中...
                            </div>
                        ) : (
                            '登录'
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-sm text-stone-500 font-light">
                        记录我们的美好回忆 ❤️
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Login
