import { useState, useRef } from 'react'
import { apiService } from '../../services/apiService'
import { useAdminModal } from '../../hooks/useAdminModal'
import Icon from '../icons/Icons'
import { useConfig } from '../../hooks/useConfig'
import { SiteConfig } from '../../types'
import Button from './ui/Button'
import Card from './ui/Card'

// 当前备份格式版本号
const BACKUP_VERSION = '2.0.0'

// 支持的最低兼容版本
const MIN_SUPPORTED_VERSION = '1.0.0'

// 数据导出格式接口
interface ExportData {
    version: string
    exportDate: string
    config: SiteConfig
    albums: unknown[]
    photos: Record<string, unknown[]>
    timeline: unknown[]
    food: unknown[]
    map: unknown[]
    notes: unknown[]
    todos: unknown[]
    capsules: unknown[]
}

// 导入策略
type ImportStrategy = 'overwrite' | 'merge'

// 导入进度状态
interface ImportProgress {
    current: number
    total: number
    module: string
    isImporting: boolean
}

// 版本号比较工具
const compareVersions = (v1: string, v2: string): number => {
    const parts1 = v1.split('.').map(Number)
    const parts2 = v2.split('.').map(Number)
    for (let i = 0; i < 3; i++) {
        const p1 = parts1[i] || 0
        const p2 = parts2[i] || 0
        if (p1 > p2) return 1
        if (p1 < p2) return -1
    }
    return 0
}

const DataBackup = () => {
    const { config: globalConfig, updateConfig } = useConfig()
    const [importProgress, setImportProgress] = useState<ImportProgress>({ current: 0, total: 0, module: '', isImporting: false })
    const importFileRef = useRef<HTMLInputElement>(null)
    const { showAlert, showConfirm } = useAdminModal()

    // 导出数据为 JSON 文件（增强版：包含相册照片）
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
                apiService.get<{ data: unknown[] }>('/timeline?limit=100'),
                apiService.get<{ data: unknown[] }>('/food'),
                apiService.get<{ data: unknown[] }>('/map'),
                apiService.get<{ data: unknown[] }>('/notes'),
                apiService.get<{ data: unknown[] }>('/todos'),
                apiService.get<{ data: unknown[] }>('/time-capsules')
            ])

            // 逐个获取相册的照片数据
            const photosMap: Record<string, unknown[]> = {}
            const albumList = (albums?.data || []) as { id: string; name: string }[]
            for (const album of albumList) {
                try {
                    const { data: albumDetail } = await apiService.get<{ photos: unknown[] }>(`/albums/${album.id}`)
                    if (albumDetail?.photos) {
                        photosMap[album.id] = albumDetail.photos
                    }
                } catch {
                    // 单个相册获取失败不影响整体导出
                }
            }

            const exportData: ExportData = {
                version: BACKUP_VERSION,
                exportDate: new Date().toISOString(),
                config: globalConfig,
                albums: albums?.data || [],
                photos: photosMap,
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

            await showAlert('成功', `已导出 ${exportData.exportDate.split('T')[0]} 的数据备份（含相册照片）`, 'success')
        } catch (error) {
            console.error('导出数据失败:', error)
            await showAlert('错误', '导出数据失败，请稍后重试', 'error')
        }
    }

    // 导入数据（增强版：完整恢复 + 版本校验 + 策略选择 + 进度条）
    const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            const text = await file.text()
            const importData: ExportData = JSON.parse(text)

            // 版本校验
            if (!importData.version || !importData.config) {
                throw new Error('无效的备份文件格式：缺少版本号或配置信息')
            }

            if (compareVersions(importData.version, MIN_SUPPORTED_VERSION) < 0) {
                throw new Error(`备份文件版本过旧（v${importData.version}），最低支持 v${MIN_SUPPORTED_VERSION}`)
            }

            if (compareVersions(importData.version, BACKUP_VERSION) > 0) {
                throw new Error(`备份文件版本过新（v${importData.version}），当前系统支持最高 v${BACKUP_VERSION}，请先更新系统`)
            }

            // 统计导入数据量
            const dataCounts = {
                albums: (importData.albums || []).length,
                timeline: (importData.timeline || []).length,
                food: (importData.food || []).length,
                map: (importData.map || []).length,
                notes: (importData.notes || []).length,
                todos: (importData.todos || []).length,
                capsules: (importData.capsules || []).length,
            }
            const totalItems = Object.values(dataCounts).reduce((a, b) => a + b, 0)

            // 选择导入策略
            const strategy = await showConfirm(
                '选择导入方式',
                `备份日期：${importData.exportDate.split('T')[0]}\n版本：v${importData.version}\n数据量：${totalItems} 条\n\n覆盖导入：清空现有数据后导入\n合并导入：保留现有数据，跳过重复项`,
                '覆盖导入'
            )

            const chosenStrategy: ImportStrategy = strategy ? 'overwrite' : 'merge'

            // 二次确认
            const finalConfirm = await showConfirm(
                '最终确认',
                chosenStrategy === 'overwrite'
                    ? '覆盖导入将删除所有现有数据，此操作不可恢复！确定继续？'
                    : '合并导入将保留现有数据，按标题+日期去重。确定继续？',
                '确认导入'
            )

            if (!finalConfirm) {
                e.target.value = ''
                return
            }

            // 开始导入
            setImportProgress({ current: 0, total: totalItems, module: '准备中', isImporting: true })

            let imported = 0
            const errors: string[] = []

            // 辅助函数：创建单条记录
            const createItem = async (endpoint: string, item: unknown, moduleName: string) => {
                try {
                    await apiService.post(endpoint, item)
                } catch {
                    errors.push(`${moduleName}导入失败`)
                }
                imported++
                setImportProgress(prev => ({ ...prev, current: imported, module: moduleName }))
            }

            // 覆盖模式：先删除现有数据
            if (chosenStrategy === 'overwrite') {
                setImportProgress(prev => ({ ...prev, module: '清空现有数据' }))

                const modules = [
                    { endpoint: '/time-capsules', name: '时光胶囊' },
                    { endpoint: '/todos', name: '待办事项' },
                    { endpoint: '/notes', name: '便签' },
                    { endpoint: '/map', name: '地图打卡' },
                    { endpoint: '/food', name: '美食打卡' },
                    { endpoint: '/timeline', name: '时间轴' },
                ]

                for (const mod of modules) {
                    try {
                        const { data } = await apiService.get<{ data: { id: number | string }[] }>(mod.endpoint)
                        const items = data?.data || []
                        for (const item of items) {
                            await apiService.delete(`${mod.endpoint}/${item.id}`)
                        }
                    } catch {
                        // 删除失败继续
                    }
                }

                // 删除相册（含照片）
                try {
                    const { data: albumData } = await apiService.get<{ data: { id: string }[] }>('/albums')
                    const albumItems = albumData?.data || []
                    for (const album of albumItems) {
                        await apiService.delete(`/albums/${album.id}`)
                    }
                } catch {
                    // 删除失败继续
                }
            }

            // 合并模式：获取现有数据用于去重
            const existingKeys = new Set<string>()
            if (chosenStrategy === 'merge') {
                const mergeChecks = [
                    { endpoint: '/timeline', key: (d: unknown) => { const i = d as { title: string; date: string }; return `timeline_${i.title}_${i.date}` } },
                    { endpoint: '/map', key: (d: unknown) => { const i = d as { title: string; date: string }; return `map_${i.title}_${i.date}` } },
                    { endpoint: '/food', key: (d: unknown) => { const i = d as { restaurant_name: string; date: string }; return `food_${i.restaurant_name}_${i.date}` } },
                    { endpoint: '/notes', key: (d: unknown) => { const i = d as { content: string }; return `notes_${i.content?.substring(0, 50)}` } },
                    { endpoint: '/todos', key: (d: unknown) => { const i = d as { title: string }; return `todos_${i.title}` } },
                    { endpoint: '/time-capsules', key: (d: unknown) => { const i = d as { message: string; unlock_date: string }; return `capsule_${i.message?.substring(0, 50)}_${i.unlock_date}` } },
                ]

                for (const check of mergeChecks) {
                    try {
                        const { data } = await apiService.get<{ data: unknown[] }>(check.endpoint)
                        const items = data?.data || []
                        items.forEach(item => existingKeys.add(check.key(item)))
                    } catch {
                        // 获取失败继续
                    }
                }
            }

            // 导入配置
            setImportProgress(prev => ({ ...prev, module: '系统配置' }))
            try {
                await updateConfig(importData.config)
            } catch {
                errors.push('系统配置导入失败')
            }

            // 导入时间轴
            const timelineItems = (importData.timeline || []) as unknown[]
            for (const item of timelineItems) {
                const i = item as { title: string; date: string }
                const key = `timeline_${i.title}_${i.date}`
                if (chosenStrategy === 'merge' && existingKeys.has(key)) { imported++; setImportProgress(prev => ({ ...prev, current: imported, module: '时间轴（跳过）' })); continue }
                await createItem('/timeline', item, '时间轴')
            }

            // 导入地图打卡
            const mapItems = (importData.map || []) as unknown[]
            for (const item of mapItems) {
                const i = item as { title: string; date: string }
                const key = `map_${i.title}_${i.date}`
                if (chosenStrategy === 'merge' && existingKeys.has(key)) { imported++; setImportProgress(prev => ({ ...prev, current: imported, module: '地图打卡（跳过）' })); continue }
                await createItem('/map', item, '地图打卡')
            }

            // 导入美食打卡
            const foodItems = (importData.food || []) as unknown[]
            for (const item of foodItems) {
                const i = item as { restaurant_name: string; date: string }
                const key = `food_${i.restaurant_name}_${i.date}`
                if (chosenStrategy === 'merge' && existingKeys.has(key)) { imported++; setImportProgress(prev => ({ ...prev, current: imported, module: '美食打卡（跳过）' })); continue }
                await createItem('/food', item, '美食打卡')
            }

            // 导入便签
            const noteItems = (importData.notes || []) as unknown[]
            for (const item of noteItems) {
                const i = item as { content: string }
                const key = `notes_${i.content?.substring(0, 50)}`
                if (chosenStrategy === 'merge' && existingKeys.has(key)) { imported++; setImportProgress(prev => ({ ...prev, current: imported, module: '便签（跳过）' })); continue }
                await createItem('/notes', item, '便签')
            }

            // 导入待办事项
            const todoItems = (importData.todos || []) as unknown[]
            for (const item of todoItems) {
                const i = item as { title: string }
                const key = `todos_${i.title}`
                if (chosenStrategy === 'merge' && existingKeys.has(key)) { imported++; setImportProgress(prev => ({ ...prev, current: imported, module: '待办事项（跳过）' })); continue }
                await createItem('/todos', item, '待办事项')
            }

            // 导入时光胶囊
            const capsuleItems = (importData.capsules || []) as unknown[]
            for (const item of capsuleItems) {
                const i = item as { message: string; unlock_date: string }
                const key = `capsule_${i.message?.substring(0, 50)}_${i.unlock_date}`
                if (chosenStrategy === 'merge' && existingKeys.has(key)) { imported++; setImportProgress(prev => ({ ...prev, current: imported, module: '时光胶囊（跳过）' })); continue }
                await createItem('/time-capsules', item, '时光胶囊')
            }

            // 导入相册（含照片）
            const albumItems = (importData.albums || []) as { id?: string; name: string; description?: string; cover_url?: string }[]
            for (const album of albumItems) {
                try {
                    const { data: newAlbum } = await apiService.post<{ id: string }>('/albums', {
                        name: album.name,
                        description: album.description,
                        cover_url: album.cover_url
                    })
                    imported++
                    setImportProgress(prev => ({ ...prev, current: imported, module: '相册' }))

                    const albumPhotos = importData.photos?.[album.id || ''] || []
                    for (const photo of albumPhotos) {
                        const p = photo as { url: string; caption?: string }
                        if (newAlbum?.id && p.url) {
                            try {
                                await apiService.post(`/albums/${newAlbum.id}/photos`, { url: p.url, caption: p.caption || '' })
                            } catch {
                                errors.push(`相册"${album.name}"照片导入失败`)
                            }
                        }
                    }
                } catch {
                    errors.push(`相册"${album.name}"创建失败`)
                }
            }

            // 导入完成
            setImportProgress({ current: totalItems, total: totalItems, module: '完成', isImporting: false })

            const errorSummary = errors.length > 0 ? `\n\n${errors.length} 项导入失败` : ''
            await showAlert(
                errors.length > 0 ? '部分成功' : '成功',
                `数据导入完成！共处理 ${imported} 条数据${errorSummary}`,
                errors.length > 0 ? 'warning' : 'success'
            )

            // 刷新页面
            setTimeout(() => window.location.reload(), 1500)
        } catch (error) {
            setImportProgress(prev => ({ ...prev, isImporting: false }))
            const msg = error instanceof Error ? error.message : '无法读取备份文件'
            await showAlert('错误', msg, 'error')
        }

        e.target.value = ''
    }

    return (
        <Card padding="lg" className="bg-gradient-to-br from-amber-50 to-orange-50/30">
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <Icon name="cloud_download" size={16} className="text-amber-500" />
                数据备份
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                导出全站数据为 JSON 格式备份，支持完整恢复（含相册照片）
            </p>

            {/* 导入进度条 */}
            {importProgress.isImporting && (
                <div className="mb-4 p-3 bg-white/60 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-600">{importProgress.module}</span>
                        <span className="text-xs font-bold text-primary">{importProgress.current}/{importProgress.total}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-300"
                            style={{ width: `${importProgress.total > 0 ? (importProgress.current / importProgress.total) * 100 : 0}%` }}
                        />
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-3">
                <Button
                    variant="secondary"
                    size="md"
                    onClick={handleExportData}
                    disabled={importProgress.isImporting}
                    className="w-full justify-center"
                >
                    <Icon name="download" size={16} />
                    导出数据备份
                </Button>
                <label className="w-full">
                    <input
                        ref={importFileRef}
                        type="file"
                        accept=".json"
                        onChange={handleImportData}
                        className="hidden"
                        disabled={importProgress.isImporting}
                    />
                    <div className={`w-full px-4 py-2 text-sm border border-dashed border-slate-300 rounded-xl flex items-center justify-center gap-2 text-slate-500 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all cursor-pointer ${importProgress.isImporting ? 'opacity-50 pointer-events-none' : ''}`}>
                        <Icon name="upload" size={16} />
                        导入数据备份
                    </div>
                </label>
            </div>
            <p className="text-[10px] text-slate-400 mt-3 text-center">
                支持覆盖导入和合并导入，自动版本校验
            </p>
        </Card>
    )
}

export default DataBackup
