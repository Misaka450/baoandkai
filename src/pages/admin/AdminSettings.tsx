import { useState, useEffect } from 'react'
import { apiService } from '../../services/apiService'
import AdminModal from '../../components/AdminModal'
import { useAdminModal } from '../../hooks/useAdminModal'
import Icon from '../../components/icons/Icons'

interface SiteConfig {
    coupleName1: string
    coupleName2: string
    anniversaryDate: string
    homeTitle?: string
    homeSubtitle?: string
}

const AdminSettings = () => {
    const [config, setConfig] = useState<SiteConfig>({
        coupleName1: '',
        coupleName2: '',
        anniversaryDate: ''
    })
    const [saving, setSaving] = useState(false)
    const { modalState, showAlert, closeModal } = useAdminModal()

    useEffect(() => {
        loadConfig()
    }, [])

    const loadConfig = async () => {
        try {
            const { data, error } = await apiService.get<SiteConfig>('/config')
            if (error) throw new Error(error)
            if (data) setConfig(data)
        } catch (error) {
            console.error('加载配置失败:', error)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            const { error } = await apiService.put('/config', config)
            if (error) throw new Error(error)
            await showAlert('成功', '设置已保存，我们的小窝又更新啦！', 'success')
        } catch (error) {
            await showAlert('错误', '保存设置时遇到了一点小问题', 'error')
        } finally {
            setSaving(false)
        }
    }

    const daysCount = config.anniversaryDate
        ? Math.floor((new Date().getTime() - new Date(config.anniversaryDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0

    return (
        <div className="animate-fade-in text-slate-700">
            <header className="mb-10">
                <h1 className="text-2xl font-bold text-slate-800 mb-1">小窝设置</h1>
                <p className="text-sm text-slate-400">管理我们的个人信息和小窝配置</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                        <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800">
                            <Icon name="favorite" size={20} className="text-primary" />
                            基本信息
                        </h2>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">TA的昵称</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">
                                        <Icon name="female" size={20} />
                                    </div>
                                    <input
                                        type="text"
                                        value={config.coupleName1}
                                        onChange={(e) => setConfig({ ...config, coupleName1: e.target.value })}
                                        className="w-full pl-12 pr-6 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none text-sm text-slate-700"
                                        placeholder="例如：包包"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">你的昵称</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">
                                        <Icon name="male" size={20} />
                                    </div>
                                    <input
                                        type="text"
                                        value={config.coupleName2}
                                        onChange={(e) => setConfig({ ...config, coupleName2: e.target.value })}
                                        className="w-full pl-12 pr-6 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none text-sm text-slate-700"
                                        placeholder="例如：恺恺"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">纪念日</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">
                                        <Icon name="calendar_month" size={20} />
                                    </div>
                                    <input
                                        type="date"
                                        value={config.anniversaryDate}
                                        onChange={(e) => setConfig({ ...config, anniversaryDate: e.target.value })}
                                        className="w-full pl-12 pr-6 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none text-sm text-slate-700"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">首页标题</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">
                                        <Icon name="home" size={20} />
                                    </div>
                                    <input
                                        type="text"
                                        value={config.homeTitle || ''}
                                        onChange={(e) => setConfig({ ...config, homeTitle: e.target.value })}
                                        className="w-full pl-12 pr-6 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none text-sm text-slate-700"
                                        placeholder="例如：包包和恺恺的小窝"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">首页副标题</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">
                                        <Icon name="favorite" size={20} />
                                    </div>
                                    <input
                                        type="text"
                                        value={config.homeSubtitle || ''}
                                        onChange={(e) => setConfig({ ...config, homeSubtitle: e.target.value })}
                                        className="w-full pl-12 pr-6 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none text-sm text-slate-700"
                                        placeholder="例如：遇见你，是银河赠予我的糖。"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-8">
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                            >
                                <Icon name="auto_awesome" size={20} />
                                {saving ? '保存中...' : '保存设置'}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center">
                        <div className="text-6xl font-bold text-primary mb-2">{daysCount}</div>
                        <p className="text-slate-400 text-sm">我们已经相爱的天数</p>
                        <div className="mt-6 pt-6 border-t border-dashed border-slate-100">
                            <h2 className="font-display text-2xl mb-2 text-slate-800">{config.coupleName1} 和 {config.coupleName2} 的小窝</h2>
                            <p className="text-xs text-slate-400">自 {config.anniversaryDate || '---'} 起</p>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800">
                            <Icon name="auto_fix_high" size={20} className="text-primary" />
                            小提示
                        </h2>
                        <ul className="space-y-3 text-sm text-slate-500">
                            <li className="flex items-start gap-2">
                                <Icon name="favorite" size={16} className="text-primary shrink-0 mt-0.5" />
                                <span>昵称会显示在首页和各个页面的欢迎语中</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Icon name="calendar_month" size={16} className="text-primary shrink-0 mt-0.5" />
                                <span>纪念日用于计算我们在一起的天数</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Icon name="auto_awesome" size={16} className="text-primary shrink-0 mt-0.5" />
                                <span>所有设置都会实时同步到全站</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <AdminModal
                isOpen={modalState.isOpen}
                onClose={closeModal}
                title={modalState.title}
                message={modalState.message}
                type={modalState.type}
                onConfirm={modalState.onConfirm || undefined}
                showCancel={modalState.showCancel}
                confirmText={modalState.confirmText}
            />
        </div>
    )
}

export default AdminSettings
