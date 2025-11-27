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
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 w-full max-w-md border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-rose-100 to-pink-100 rounded-full mb-4">
                        <Heart className="w-8 h-8 text-rose-500" />
                    </div>
                    <h1 className="text-3xl font-light text-stone-800 mb-2">宝&凯的小窝</h1>
                    <p className="text-stone-600 font-light">请登录以继续访问</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-light text-stone-700 mb-2">
                            用户名
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-400 focus:border-transparent bg-white/50 font-light"
                            required
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-light text-stone-700 mb-2">
                            密码
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-400 focus:border-transparent bg-white/50 font-light"
                            required
                        />
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm text-center bg-red-50/50 border border-red-100 rounded-lg p-3 font-light">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 bg-stone-800 text-white rounded-xl font-light hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg hover:shadow-xl"
                    >
                        {loading ? '登录中...' : '登录'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-xs text-stone-500 font-light">
                        记录我们的美好回忆 ❤️
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Login
