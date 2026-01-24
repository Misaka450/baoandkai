import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Icon from '../components/icons/Icons'

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
            navigate('/')
        } catch (error) {
            setError((error as Error).message || '登录失败,请检查用户名和密码')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background-light p-6 transition-colors duration-300 relative overflow-hidden">
            {/* 背景装饰 */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
                <div className="absolute -top-24 -left-24 text-primary animate-float">
                    <Icon name="favorite" size={300} className="fill-current" />
                </div>
                <div className="absolute -bottom-24 -right-24 text-secondary animate-float" style={{ animationDelay: '-2s' }}>
                    <Icon name="auto_awesome" size={200} />
                </div>
            </div>

            <div className="glass-card p-8 md:p-12 w-full max-w-md rounded-xlarge border border-white/50 relative z-10 animate-fade-in shadow-xl">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6">
                        <Icon name="favorite" size={40} className="text-primary fill-current" />
                    </div>
                    <h1 className="font-display text-4xl text-gray-800 mb-2">欢迎回家</h1>
                    <p className="text-gray-400 text-sm italic">“记录我们的美好回忆 ❤️”</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 text-slate-400">用户名</label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300">
                                <Icon name="person" size={20} />
                            </div>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-slate-700"
                                required
                                autoFocus
                                placeholder="请输入用户名"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 text-slate-400">密码</label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300">
                                <Icon name="lock" size={20} />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-slate-700"
                                required
                                placeholder="请输入密码"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-500 text-xs text-center bg-red-50 rounded-xl p-3 animate-shake">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {loading ? '正在回家...' : '登录'}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <button onClick={() => navigate('/')} className="text-xs text-gray-400 hover:text-primary transition-colors flex items-center justify-center space-x-2 mx-auto">
                        <Icon name="west" size={16} />
                        <span>返回小窝首页</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Login
