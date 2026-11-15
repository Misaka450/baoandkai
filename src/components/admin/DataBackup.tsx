import { useState, useRef } from 'react'
import { apiService } from '../../services/apiService'
import { useAdminModal } from '../../hooks/useAdminModal'
import AdminModal from '../modals/AdminModal'
import Icon from '../icons/Icons'
import { SiteConfig } from '../../types'
import Button from './ui/Button'
import Card from './ui/Card'

// 当前备份格式版本号（兼容 1.0.0 ~ 3.0.0）
const BACKUP_VERSION = '3.0.0'

// 支持的最低兼容版本
const MIN_SUPPORTED_VERSION = '1.0.0'

// 数据导出格式接口
interface ExportData {
    version: string
    exportDate: string
    config: SiteConfig
    albums: unknown[]
    photos: Record<string, unknown[]> | unknown[]
    timeline: unknown[]
    food: unknown[]
    map?: unknown[]
    mapCheckins?: unknown[]
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
    const [exporting, setExporting] = useState(false)
    const [importStrategy, setImportStrategy] = useState<ImportStrategy>('merge')
    const [importProgress, setImportProgress] = useState<ImportProgress>({ current: 0, total: 0, module: '', isImporting: false })
    const importFileRef = useRef<HTMLInputElement>(null)
    const { modalState, showAlert, showConfirm, closeModal } = useAdminModal()

    // 导出全量数据为 JSON 文件（对接后端 /api/vault/export 全量接口，避免分页截断与未解锁胶囊内容丢失）
    const handleExportData = async () => {
        if (exporting || importProgress.isImporting) return
        setExporting(true)
        try {
            const { data: exportData, error } = await apiService.get<ExportData>('/vault/export')
            if (error || !exportData) {
                throw new Error(error || '导出数据为空')
            }

            const exportDateStr = (exportData.exportDate || new Date().toISOString()).split('T')[0]
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `bbkk-backup-${exportDateStr}.json`
            a.click()
            URL.revokeObjectURL(url)

            await showAlert('成功', `已导出 ${exportDateStr} 的全量数据备份（含相册照片与时光胶囊）`, 'success')
        } catch (error) {
            console.error('导出数据失败:', error)
            const msg = error instanceof Error ? error.message : '导出数据失败，请稍后重试'
            await showAlert('错误', msg, 'error')
        } finally {
            setExporting(false)
        }
    }

    // 导入数据（对接后端 /api/vault/import 单事务接口，保证覆盖/合并导入的原子性）
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

            const mapItems = importData.map || importData.mapCheckins || []

            // 统计导入数据量
            const dataCounts = {
                albums: (importData.albums || []).length,
                timeline: (importData.timeline || []).length,
                food: (importData.food || []).length,
                map: mapItems.length,
                notes: (importData.notes || []).length,
                todos: (importData.todos || []).length,
                capsules: (importData.capsules || []).length,
            }
            const totalItems = Object.values(dataCounts).reduce((a, b) => a + b, 0)

            const chosenStrategy: ImportStrategy = importStrategy

            // 确认导入（点击取消则真正取消操作）
            const finalConfirm = await showConfirm(
                chosenStrategy === 'overwrite' ? '确认全量覆盖导入' : '确认增量合并导入',
                `备份日期：${(importData.exportDate || '').split('T')[0] || '未知'}\n版本：v${importData.version}\n数据量：${totalItems} 条\n\n${
                    chosenStrategy === 'overwrite'
                        ? '覆盖导入将在事务内清空现有数据后完整恢复（若导入出错会自动回滚）。确定继续？'
                        : '合并导入将保留现有数据并自动跳过重复项。确定继续？'
                }`,
                chosenStrategy === 'overwrite' ? '确认覆盖导入' : '确认合并导入'
            )

            if (!finalConfirm) {
                e.target.value = ''
                return
            }

            // 开始后端全量事务导入
            setImportProgress({
                current: 0,
                total: totalItems || 1,
                module: chosenStrategy === 'overwrite' ? '正在执行全量事务覆盖导入...' : '正在执行全量事务合并导入...',
                isImporting: true
            })

            const { data: result, error } = await apiService.post<{
                success: boolean
                imported: number
                skipped: number
                message: string
            }>('/vault/import', {
                strategy: chosenStrategy,
                data: importData,
            })

            if (error || !result?.success) {
                throw new Error(error || '服务端导入失败')
            }

            setImportProgress({
                current: totalItems || 1,
                total: totalItems || 1,
                module: '完成',
                isImporting: false
            })

            await showAlert(
                '成功',
                result.message || `数据导入完成！共导入 ${result.imported} 条数据`,
                'success'
            )

            // 刷新页面
            setTimeout(() => window.location.reload(), 1500)
        } catch (error) {
            setImportProgress(prev => ({ ...prev, isImporting: false }))
            const msg = error instanceof Error ? error.message : '无法读取或导入备份文件'
            await showAlert('错误', msg, 'error')
        }

        e.target.value = ''
    }

    return (
        <Card padding="md" className="bg-gradient-to-br from-amber-50 to-orange-50/30 !p-4 sm:!p-6">
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <Icon name="cloud_download" size={16} className="text-amber-500" />
                数据备份
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                导出全站全量数据为 JSON 格式备份，支持单事务完整恢复（含相册照片与时光胶囊）
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
                            className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-300 animate-pulse"
                            style={{ width: '100%' }}
                        />
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-3">
                <Button
                    variant="secondary"
                    size="md"
                    onClick={handleExportData}
                    loading={exporting}
                    disabled={exporting || importProgress.isImporting}
                    className="w-full justify-center"
                >
                    <Icon name="download" size={16} />
                    {exporting ? '正在导出全量备份...' : '导出数据备份'}
                </Button>

                {/* 导入模式选择器 */}
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-white/70 border border-slate-200/80 rounded-xl">
                    <button
                        type="button"
                        onClick={() => setImportStrategy('merge')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                            importStrategy === 'merge'
                                ? 'bg-primary text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        增量合并（推荐）
                    </button>
                    <button
                        type="button"
                        onClick={() => setImportStrategy('overwrite')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                            importStrategy === 'overwrite'
                                ? 'bg-amber-500 text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        全量覆盖恢复
                    </button>
                </div>

                <label className="w-full">
                    <input
                        ref={importFileRef}
                        type="file"
                        accept=".json"
                        onChange={handleImportData}
                        className="hidden"
                        disabled={exporting || importProgress.isImporting}
                    />
                    <div className={`w-full px-4 py-2 text-sm border border-dashed border-slate-300 rounded-xl flex items-center justify-center gap-2 text-slate-500 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all cursor-pointer ${exporting || importProgress.isImporting ? 'opacity-50 pointer-events-none' : ''}`}>
                        <Icon name="upload" size={16} />
                        {importStrategy === 'overwrite' ? '选择备份文件（全量覆盖）' : '选择备份文件（增量合并）'}
                    </div>
                </label>
            </div>
            <p className="text-[10px] text-slate-400 mt-3 text-center">
                支持全量导出与单事务覆盖/合并导入，自动版本校验
            </p>
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
        </Card>
    )
}

export default DataBackup
