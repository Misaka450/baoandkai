import { useState, useRef, useEffect } from 'react'
import { apiService } from '../../services/apiService'
import AdminModal from '../../components/AdminModal'
import { useAdminModal } from '../../hooks/useAdminModal'
import Icon from '../../components/icons/Icons'
import { useConfig } from '../../hooks/useConfig'
import { SiteConfig } from '../../types'
import Button from '../../components/admin/ui/Button'
import Card from '../../components/admin/ui/Card'

// 数据导出格式接口
interface ExportData {
    version: string
    exportDate: string
    config: SiteConfig
    albums: unknown[]
    photos: unknown[]
    timeline: unknown[]
    food: unknown[]
    map: unknown[]
    notes: unknown[]
    todos: unknown[]
    capsules: unknown[]
}

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

const AdminSettings = () => {
    const { config: globalConfig, updateConfig } = useConfig()
    const [config, setConfig] = useState<SiteConfig>(globalConfig)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState<'avatar1' | 'avatar2' | null>(null)
    const [uploadProgress, setUploadProgress] = useState<{ percent: number, speed: number } | null>(null)
    const fileInputRef1 = useRef<HTMLInputElement>(null)
    const fileInputRef2 = useRef<HTMLInputElement>(null)
    const { modalState, showAlert, showConfirm, closeModal } = useAdminModal()

    useEffect(() => {
        setConfig(globalConfig)
    }, [globalConfig])

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
                '/upload',
                fd,
                (p) => setUploadProgress({ percent: p.percent, speed: p.speed })
            )
            if (error) throw new Error(error)
            if (data?.url) {
                const customField = field === 'avatar1' ? 'customAvatar1' : 'customAvatar2'
                setConfig(prev => ({
                    ...prev,
                    [field]: data.url,
                    [customField]: data.url
                }))
            }
        } catch { await showAlert('错误', '上传失败', 'error') }
        finally {
            setUploading(null)
            setUploadProgress(null)
        }
    }

    const handleAvatarDelete = async (field: 'avatar1' | 'avatar2') => {
        const url = config[field]
        if (!url || !url.includes('/api/images/')) return

        try {
            const filename = url.split('/api/images/')[1]
            if (filename) {
                await apiService.request('/delete', {
                    method: 'DELETE',
                    body: JSON.stringify({ filename })
                })
            }
            const customField = field === 'avatar1' ? 'customAvatar1' : 'customAvatar2'
            setConfig(prev => ({
                ...prev,
                [field]: prev[field] === url ? '' : prev[field],
                [customField]: ''
            }))
        } catch (error) {
            console.error('删除头像物理文件失败:', error)
            setConfig(prev => ({ ...prev, [field]: '' }))
        }
    }

    // 导出数据为 JSON 文件
    const handleExportData = async () => {
        try {
            const [
                { data: albums },
                { data: timeline },
                { data: food },
                { data: map },
                { data: notes },
                { data: todos },
                { data: capsules }
            ] = await Promise.all([
                apiService.get<{ data: unknown[] }>('/albums'),
                apiService.get<{ data: unknown[] }>('/timeline'),
                apiService.get<{ data: unknown[] }>('/food'),
                apiService.get<{ data: unknown[] }>('/map'),
                apiService.get<{ data: unknown[] }>('/notes'),
                apiService.get<{ data: unknown[] }>('/todos'),
                apiService.get<{ data: unknown[] }>('/time-capsules')
            ])

            const exportData: ExportData = {
                version: '1.0.0',
                exportDate: new Date().toISOString(),
                config: globalConfig,
                albums: albums?.data || [],
                photos: [],
                timeline: timeline?.data || [],
                food: food?.data || [],
                map: map?.data || [],
                notes: notes?.data || [],
                todos: todos?.data || [],
                capsules: capsules?.data || []
            }

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `bbkk-backup-${new Date().toISOString().split('T')[0]}.json`
            a.click()
            URL.revokeObjectURL(url)

            await showAlert('成功', `已导出 ${exportData.exportDate.split('T')[0]} 的数据备份`, 'success')
        } catch (error) {
            console.error('导出数据失败:', error)
            await showAlert('错误', '导出数据失败，请稍后重试', 'error')
        }
    }

    // 导入数据
    const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            const text = await file.text()
            const importData: ExportData = JSON.parse(text)

            if (!importData.version || !importData.config) {
                throw new Error('无效的备份文件格式')
            }

            const confirmed = await showConfirm(
                '确认导入',
                `即将导入 ${importData.exportDate.split('T')[0]} 的备份数据，这将覆盖现有数据。是否继续？`,
                '导入'
            )

            if (!confirmed) {
                e.target.value = ''
                return
            }

            try {
                await updateConfig(importData.config)
                await showAlert('成功', '数据导入成功，页面将刷新', 'success')
                setTimeout(() => window.location.reload(), 1500)
            } catch (error) {
                console.error('导入数据失败:', error)
                await showAlert('错误', '数据导入失败', 'error')
            }
        } catch (error) {
            console.error('解析备份文件失败:', error)
            await showAlert('错误', '无法读取备份文件，请确保选择正确的 JSON 文件', 'error')
        }

        e.target.value = ''
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            const result = await updateConfig(config)
            if (!result.success) throw new Error(result.error)
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
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit}>
                        <Card padding="lg" className="mb-8">
                            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800">
                                <Icon name="favorite" size={20} className="text-primary" />
                                基本信息
                            </h2>

                            <div className="space-y-5">
                                <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 z-10">
                                    <Icon name="female" size={20} />
                                </div>
                                <input
                                    type="text"
                                    value={config.coupleName1}
                                    onChange={(e) => setConfig({ ...config, coupleName1: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    placeholder="TA 的昵称（例如：包包）"
                                />
                            </div>

                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 z-10">
                                    <Icon name="male" size={20} />
                                </div>
                                <input
                                    type="text"
                                    value={config.coupleName2}
                                    onChange={(e) => setConfig({ ...config, coupleName2: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    placeholder="你的昵称（例如：恺恺）"
                                />
                            </div>

                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 z-10">
                                    <Icon name="calendar_month" size={20} />
                                </div>
                                <input
                                    type="date"
                                    value={config.anniversaryDate}
                                    onChange={(e) => setConfig({ ...config, anniversaryDate: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                />
                            </div>

                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 z-10">
                                    <Icon name="home" size={20} />
                                </div>
                                <input
                                    type="text"
                                    value={config.homeTitle || ''}
                                    onChange={(e) => setConfig({ ...config, homeTitle: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    placeholder="首页标题（例如：包包和恺恺的小窝）"
                                />
                            </div>

                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 z-10">
                                    <Icon name="favorite" size={20} />
                                </div>
                                <input
                                    type="text"
                                    value={config.homeSubtitle || ''}
                                    onChange={(e) => setConfig({ ...config, homeSubtitle: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    placeholder="首页副标题（例如：遇见你，是银河赠予我的糖。）"
                                />
                            </div>

                            {/* 保存按钮 */}
                            <div className="pt-4 flex gap-3">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="lg"
                                    loading={saving}
                                    className="flex-1"
                                >
                                    {saving ? '保存中...' : '保存设置'}
                                </Button>
                            </div>
                            </div>
                        </Card>

                        {/* 头像设置区域 */}
                        <Card padding="lg" className="mb-8">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800">
                                <Icon name="person" size={20} className="text-primary" />
                                头像设置
                            </h3>

                            <div className="space-y-6">
                                {/* TA 的头像 */}
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">TA 的头像</label>
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
                                        <div className="relative group">
                                            <label
                                                onClick={() => config.customAvatar1 && setConfig({ ...config, avatar1: config.customAvatar1 })}
                                                className={`w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden p-0.5 text-center ${config.avatar1 === config.customAvatar1 && config.customAvatar1 ? 'border-primary ring-2 ring-primary/30' : 'border-dashed border-slate-200 hover:border-primary hover:bg-primary/5'}`}
                                            >
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
                                                ) : config.customAvatar1 ? (
                                                    <img src={config.customAvatar1} alt="Preview" className="w-full h-full object-cover rounded-full" />
                                                ) : (
                                                    <Icon name="add_photo_alternate" size={20} className="text-slate-400" />
                                                )}
                                                {!config.customAvatar1 && <input ref={fileInputRef1} type="file" accept="image/*" onChange={(e) => handleAvatarUpload(e, 'avatar1')} className="hidden" />}
                                            </label>

                                            {config.customAvatar1 && !uploading && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleAvatarDelete('avatar1');
                                                    }}
                                                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all shadow-sm z-30 border-2 border-white"
                                                    title="物理删除头像"
                                                >
                                                    <Icon name="delete" size={10} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {config.avatar1 && <div className="text-xs text-slate-400">当前：自定义头像</div>}
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
                                        <div className="relative group">
                                            <label
                                                onClick={() => config.customAvatar2 && setConfig({ ...config, avatar2: config.customAvatar2 })}
                                                className={`w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden p-0.5 text-center ${config.avatar2 === config.customAvatar2 && config.customAvatar2 ? 'border-primary ring-2 ring-primary/30' : 'border-dashed border-slate-200 hover:border-primary hover:bg-primary/5'}`}
                                            >
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
                                                ) : config.customAvatar2 ? (
                                                    <img src={config.customAvatar2} alt="Preview" className="w-full h-full object-cover rounded-full" />
                                                ) : (
                                                    <Icon name="add_photo_alternate" size={20} className="text-slate-400" />
                                                )}
                                                {!config.customAvatar2 && <input ref={fileInputRef2} type="file" accept="image/*" onChange={(e) => handleAvatarUpload(e, 'avatar2')} className="hidden" />}
                                            </label>

                                            {config.customAvatar2 && !uploading && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleAvatarDelete('avatar2');
                                                    }}
                                                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all shadow-sm z-30 border-2 border-white"
                                                    title="物理删除头像"
                                                >
                                                    <Icon name="delete" size={10} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {config.avatar2 && <div className="text-xs text-slate-400">当前：自定义头像</div>}
                                </div>
                            </div>
                        </Card>
                    </form>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    {/* 纪念日统计卡片 */}
                    {config.anniversaryDate && (
                        <Card padding="lg" className="relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                            <div className="relative">
                                <div className="flex items-center gap-2 mb-3">
                                    <Icon name="favorite" size={20} className="text-primary" />
                                    <h3 className="text-sm font-bold text-slate-600">相爱纪念日</h3>
                                </div>
                                <div className="text-4xl font-black text-primary mb-1">
                                    {daysCount}
                                </div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    DAYS TOGETHER
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
                                    从 {config.anniversaryDate} 开始
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* 数据管理卡片 */}
                    <Card padding="lg" className="bg-gradient-to-br from-amber-50 to-orange-50/30">
                        <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                            <Icon name="cloud_download" size={16} className="text-amber-500" />
                            数据备份
                        </h3>
                        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                            导出全站数据为 JSON 格式备份，方便迁移或保存珍贵回忆
                        </p>
                        <div className="flex flex-col gap-3">
                            <Button
                                variant="secondary"
                                size="md"
                                onClick={handleExportData}
                                className="w-full justify-center"
                            >
                                <Icon name="download" size={16} />
                                导出数据备份
                            </Button>
                            <label className="w-full">
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={handleImportData}
                                    className="hidden"
                                />
                                <div className="w-full px-4 py-2 text-sm border border-dashed border-slate-300 rounded-xl flex items-center justify-center gap-2 text-slate-500 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all cursor-pointer">
                                    <Icon name="upload" size={16} />
                                    导入数据备份
                                </div>
                            </label>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-3 text-center">
                            提示：导入会覆盖现有设置
                        </p>
                    </Card>

                    {/* 提示卡片 */}
                    <Card padding="md" className="bg-gradient-to-br from-slate-50 to-slate-100/50">
                        <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                            <Icon name="info" size={16} className="text-primary" />
                            设置提示
                        </h3>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                                <span className="text-xs text-slate-600 leading-relaxed">昵称将应用于全站，作为你们独特的数字足迹</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                                <span className="text-xs text-slate-600 leading-relaxed">相爱的每一天都会被精心记录并呈现在首页</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                                <span className="text-xs text-slate-600 leading-relaxed">头像支持自定义上传或选择预设样式</span>
                            </li>
                        </ul>
                    </Card>
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
