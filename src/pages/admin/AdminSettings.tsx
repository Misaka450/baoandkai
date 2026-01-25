import { useState, useEffect, useRef } from 'react'
import { apiService } from '../../services/apiService'
import AdminModal from '../../components/AdminModal'
import { useAdminModal } from '../../hooks/useAdminModal'
import Icon from '../../components/icons/Icons'

// 预设卡通头像列表
const presetAvatars = [
    { seed: 'Bao', bg: 'C9ADA7' },
    { seed: 'Kai', bg: '9A9EAB' },
    { seed: 'Luna', bg: 'E8B4B8' },
    { seed: 'Star', bg: 'B5C7E3' },
    { seed: 'Mochi', bg: 'F5E6CC' },
    { seed: 'Pudding', bg: 'D4E5D9' },
    { seed: 'Berry', bg: 'E1BEE7' },
    { seed: 'Sunny', bg: 'FFE0B2' },
]

interface SiteConfig {
    coupleName1: string
    coupleName2: string
    anniversaryDate: string
    homeTitle?: string
    homeSubtitle?: string
    avatar1?: string
    avatar2?: string
}

const AdminSettings = () => {
    const [config, setConfig] = useState<SiteConfig>({
        coupleName1: '',
        coupleName2: '',
        anniversaryDate: ''
    })
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState<'avatar1' | 'avatar2' | null>(null)
    const [uploadProgress, setUploadProgress] = useState<{ percent: number, speed: number } | null>(null)
    const fileInputRef1 = useRef<HTMLInputElement>(null)
    const fileInputRef2 = useRef<HTMLInputElement>(null)
    const { modalState, showAlert, closeModal } = useAdminModal()

    const getAvatarUrl = (seed: string, bg: string) =>
        `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}&backgroundColor=${bg}&backgroundType=solid`

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'avatar1' | 'avatar2') => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(field)
        try {
            const fd = new FormData()
            fd.append('file', file)
            fd.append('folder', 'avatars')
            const { data, error } = await apiService.uploadWithProgress<{ url: string }>(
                '/uploads',
                fd,
                (p) => setUploadProgress({ percent: p.percent, speed: p.speed })
            )
            if (error) throw new Error(error)
            if (data?.url) setConfig(prev => ({ ...prev, [field]: data.url }))
        } catch { await showAlert('错误', '上传失败', 'error') }
        finally {
            setUploading(null)
            setUploadProgress(null)
        }
    }

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
            {/* 粘性玻璃头部 */}
            <header className="premium-glass -mx-4 px-4 py-6 mb-10 flex items-center justify-between backdrop-blur-xl">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">小窝设置<span className="text-primary tracking-tighter ml-1">CONFIG</span></h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Personalize your sweet home</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 pb-20">
                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit} className="premium-card p-10">
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
                                        className="premium-input pl-12"
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
                                        className="premium-input pl-12"
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
                                        className="premium-input pl-12"
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

                            {/* 头像设置区域 */}
                            <div className="pt-6 border-t border-slate-100">
                                <h3 className="text-sm font-bold text-slate-600 mb-4 flex items-center gap-2">
                                    <Icon name="person" size={18} className="text-primary" />
                                    头像设置
                                </h3>

                                {/* TA的头像 */}
                                <div className="mb-6">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">TA的头像</label>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {presetAvatars.slice(0, 4).map((avatar) => (
                                            <button
                                                key={avatar.seed}
                                                type="button"
                                                onClick={() => setConfig({ ...config, avatar1: getAvatarUrl(avatar.seed, avatar.bg) })}
                                                className={`w-14 h-14 rounded-full overflow-hidden border-2 transition-all hover:scale-105 ${config.avatar1 === getAvatarUrl(avatar.seed, avatar.bg) ? 'border-primary ring-2 ring-primary/30' : 'border-slate-200'}`}
                                            >
                                                <img src={getAvatarUrl(avatar.seed, avatar.bg)} alt={avatar.seed} className="w-full h-full" />
                                            </button>
                                        ))}
                                        <label className="w-14 h-14 rounded-full border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all overflow-hidden p-1 text-center">
                                            {uploading === 'avatar1' ? (
                                                <div className="flex flex-col items-center justify-center">
                                                    <div className="relative w-8 h-8">
                                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                                        <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-primary">
                                                            {uploadProgress?.percent || 0}%
                                                        </div>
                                                    </div>
                                                    {uploadProgress && <span className="text-[8px] text-slate-400 font-mono scale-90">{uploadProgress.speed}KB/s</span>}
                                                </div>
                                            ) : config.avatar1 && config.avatar1.includes('/api/') ? (
                                                <img src={config.avatar1} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <Icon name="add_photo_alternate" size={20} className="text-slate-400" />
                                            )}
                                            <input ref={fileInputRef1} type="file" accept="image/*" onChange={(e) => handleAvatarUpload(e, 'avatar1')} className="hidden" />
                                        </label>
                                    </div>
                                    {config.avatar1 && <div className="text-xs text-slate-400">当前: 自定义头像 <button type="button" onClick={() => setConfig({ ...config, avatar1: '' })} className="text-primary hover:underline">恢复默认</button></div>}
                                </div>

                                {/* 你的头像 */}
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">你的头像</label>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {presetAvatars.slice(4, 8).map((avatar) => (
                                            <button
                                                key={avatar.seed}
                                                type="button"
                                                onClick={() => setConfig({ ...config, avatar2: getAvatarUrl(avatar.seed, avatar.bg) })}
                                                className={`w-14 h-14 rounded-full overflow-hidden border-2 transition-all hover:scale-105 ${config.avatar2 === getAvatarUrl(avatar.seed, avatar.bg) ? 'border-primary ring-2 ring-primary/30' : 'border-slate-200'}`}
                                            >
                                                <img src={getAvatarUrl(avatar.seed, avatar.bg)} alt={avatar.seed} className="w-full h-full" />
                                            </button>
                                        ))}
                                        <label className="w-14 h-14 rounded-full border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all overflow-hidden p-1 text-center">
                                            {uploading === 'avatar2' ? (
                                                <div className="flex flex-col items-center justify-center">
                                                    <div className="relative w-8 h-8">
                                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                                        <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-primary">
                                                            {uploadProgress?.percent || 0}%
                                                        </div>
                                                    </div>
                                                    {uploadProgress && <span className="text-[8px] text-slate-400 font-mono scale-90">{uploadProgress.speed}KB/s</span>}
                                                </div>
                                            ) : config.avatar2 && config.avatar2.includes('/api/') ? (
                                                <img src={config.avatar2} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <Icon name="add_photo_alternate" size={20} className="text-slate-400" />
                                            )}
                                            <input ref={fileInputRef2} type="file" accept="image/*" onChange={(e) => handleAvatarUpload(e, 'avatar2')} className="hidden" />
                                        </label>
                                    </div>
                                    {config.avatar2 && <div className="text-xs text-slate-400">当前: 自定义头像 <button type="button" onClick={() => setConfig({ ...config, avatar2: '' })} className="text-primary hover:underline">恢复默认</button></div>}
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

                <div className="space-y-8">
                    <div className="premium-card p-8 text-center group">
                        <div className="text-7xl font-black text-gradient mb-2 group-hover:scale-110 transition-transform duration-700">{daysCount}</div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Our Love Story Index</p>
                        <div className="mt-8 pt-8 border-t border-dashed border-slate-100">
                            <h2 className="text-xl font-black text-slate-800 leading-tight mb-2 tracking-tight">{config.coupleName1} & {config.coupleName2}</h2>
                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Since {config.anniversaryDate || '---'}</p>
                        </div>
                    </div>

                    <div className="premium-card p-10 bg-slate-900 text-white border-none shadow-2xl shadow-slate-300">
                        <h2 className="text-lg font-black mb-6 flex items-center gap-3">
                            <Icon name="auto_fix_high" size={20} className="text-primary" />
                            智慧小窝
                        </h2>
                        <ul className="space-y-5">
                            <li className="flex items-start gap-4">
                                <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                                    <Icon name="favorite" size={12} className="text-primary" />
                                </div>
                                <span className="text-sm font-medium text-slate-400 leading-relaxed">昵称将应用于全站，作为独特的数字足迹。</span>
                            </li>
                            <li className="flex items-start gap-4">
                                <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                                    <Icon name="calendar_month" size={12} className="text-primary" />
                                </div>
                                <span className="text-sm font-medium text-slate-400 leading-relaxed">您的每一天都会被精心记录并计算。</span>
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
