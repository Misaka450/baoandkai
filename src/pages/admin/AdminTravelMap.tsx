import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { mapService } from '../../services/apiService'
import { apiService } from '../../services/apiService'
import type { MapCheckin } from '../../types'
import { getAllProvinceNames } from '../../data/chinaMapData'
import { getCitiesForProvince } from '../../data/provinceCities'
import Icon from '../../components/icons/Icons'

const provinceNames = getAllProvinceNames()

interface CheckinFormData {
    title: string
    description: string
    province: string
    city: string
    date: string
    images: string[]
}

const emptyForm: CheckinFormData = {
    title: '',
    description: '',
    province: '',
    city: '',
    date: new Date().toISOString().split('T')[0] || '',
    images: []
}

export default function AdminTravelMap() {
    const queryClient = useQueryClient()
    const [showModal, setShowModal] = useState(false)
    const [editingId, setEditingId] = useState<number | string | null>(null)
    const [formData, setFormData] = useState<CheckinFormData>(emptyForm)
    const [saving, setSaving] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState<number | string | null>(null)

    const { data: mapData, isLoading } = useQuery({
        queryKey: ['mapCheckins'],
        queryFn: async () => {
            const response = await mapService.getAll()
            return response.data
        },
        staleTime: Infinity,
    })

    const checkins = mapData?.data || []

    // 当前选中省份的城市列表
    const cityOptions = formData.province ? getCitiesForProvince(formData.province) : []

    const handleAdd = () => {
        setFormData(emptyForm)
        setEditingId(null)
        setShowModal(true)
    }

    const handleEdit = (checkin: MapCheckin) => {
        setFormData({
            title: checkin.title,
            description: checkin.description || '',
            province: checkin.province,
            city: checkin.city || '',
            date: checkin.date,
            images: checkin.images || []
        })
        setEditingId(checkin.id)
        setShowModal(true)
    }

    const handleSave = async () => {
        if (!formData.title || !formData.province || !formData.date) return

        setSaving(true)
        try {
            if (editingId) {
                await mapService.update(editingId, formData)
            } else {
                await mapService.create(formData as any)
            }
            queryClient.invalidateQueries({ queryKey: ['mapCheckins'] })
            setShowModal(false)
        } catch (error) {
            console.error('保存失败:', error)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: number | string) => {
        try {
            await mapService.delete(id)
            queryClient.invalidateQueries({ queryKey: ['mapCheckins'] })
            setDeleteConfirm(null)
        } catch (error) {
            console.error('删除失败:', error)
        }
    }

    const handleImageUpload = async (files: FileList) => {
        for (let i = 0; i < files.length; i++) {
            const file = files.item(i)
            if (!file) continue
            const uploadData = new globalThis.FormData()
            uploadData.append('file', file)
            const response = await apiService.upload<{ url: string }>('/upload', uploadData)
            if (response.data?.url) {
                setFormData(prev => ({ ...prev, images: [...prev.images, response.data!.url] }))
            }
        }
    }

    const handleRemoveImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }))
    }

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('zh-CN')
        } catch {
            return dateStr
        }
    }

    return (
        <div>
            {/* 头部 */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <Icon name="map" size={24} className="text-primary" />
                        足迹地图管理
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">管理地图打卡记录</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="bg-primary text-white px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                >
                    <Icon name="add" size={18} />
                    添加打卡
                </button>
            </div>

            {/* 统计卡片 */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                    { label: '总打卡', value: checkins.length, icon: 'auto_awesome', color: 'text-[#6BCB77]', bg: 'bg-[#F0FFF4]' },
                    { label: '省份', value: new Set(checkins.map(c => c.province)).size, icon: 'map', color: 'text-[#FF8BB1]', bg: 'bg-[#FFEDF3]' },
                    { label: '城市', value: new Set(checkins.filter(c => c.city).map(c => c.city)).size, icon: 'location_on', color: 'text-[#6BBFFF]', bg: 'bg-[#EBF7FF]' },
                ].map(stat => (
                    <div key={stat.label} className={`${stat.bg} rounded-2xl p-4 flex items-center gap-3`}>
                        <Icon name={stat.icon as any} size={20} className={stat.color} />
                        <div>
                            <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 列表 */}
            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
            ) : checkins.length === 0 ? (
                <div className="text-center py-20 bg-white/40 rounded-[2rem] border border-white">
                    <Icon name="map" size={48} className="text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold">还没有打卡记录</p>
                    <p className="text-slate-300 text-sm mt-1">点击上方按钮添加第一个足迹吧！</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence>
                        {checkins.map((checkin, idx) => (
                            <motion.div
                                key={checkin.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                transition={{ delay: idx * 0.03 }}
                                className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-4 border border-white/80 shadow-sm hover:shadow-md transition-all group"
                            >
                                {/* 缩略图 */}
                                {checkin.images && checkin.images.length > 0 ? (
                                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                                        <img src={checkin.images[0]} alt={checkin.title} className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-16 h-16 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0">
                                        <Icon name="landscape" size={24} className="text-slate-200" />
                                    </div>
                                )}

                                {/* 信息 */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-slate-800 truncate">{checkin.title}</h3>
                                    <div className="flex items-center gap-2 text-slate-400 mt-1">
                                        <Icon name="location_on" size={12} className="text-primary/50" />
                                        <span className="text-xs font-medium">{checkin.province}{checkin.city ? ` · ${checkin.city}` : ''}</span>
                                        <span className="text-slate-200">•</span>
                                        <span className="text-xs">{formatDate(checkin.date)}</span>
                                    </div>
                                    {checkin.description && (
                                        <p className="text-xs text-slate-400 truncate mt-1">{checkin.description}</p>
                                    )}
                                </div>

                                {/* 操作按钮 */}
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                    <button
                                        onClick={() => handleEdit(checkin)}
                                        className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 transition-all"
                                    >
                                        <Icon name="edit" size={16} />
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirm(checkin.id)}
                                        className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                    >
                                        <Icon name="delete" size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* 添加/编辑弹窗 */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="relative bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto border border-white/80">
                        {/* 头部 */}
                        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-xl px-6 py-4 border-b border-slate-100/50 flex items-center justify-between rounded-t-[2rem]">
                            <h3 className="font-black text-lg text-slate-800">{editingId ? '编辑足迹' : '添加足迹'}</h3>
                            <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all">
                                <Icon name="close" size={16} />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            {/* 标题 */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">标题 *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm"
                                    placeholder="如：故宫一日游"
                                />
                            </div>

                            {/* 省份 */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">省份 *</label>
                                <select
                                    value={formData.province}
                                    onChange={e => setFormData(prev => ({ ...prev, province: e.target.value, city: '' }))}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm bg-white"
                                >
                                    <option value="">请选择省份</option>
                                    {provinceNames.map(name => (
                                        <option key={name} value={name}>{name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* 城市 */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">城市</label>
                                <select
                                    value={formData.city}
                                    onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm bg-white"
                                    disabled={!formData.province}
                                >
                                    <option value="">请选择城市</option>
                                    {cityOptions.map(city => (
                                        <option key={city.name} value={city.name}>{city.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* 日期 */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">日期 *</label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm"
                                />
                            </div>

                            {/* 描述 */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">描述</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm resize-none"
                                    rows={3}
                                    placeholder="记录这次旅行的美好瞬间..."
                                />
                            </div>

                            {/* 图片上传 */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">照片</label>
                                {formData.images.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {formData.images.map((img, i) => (
                                            <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden group">
                                                <img src={img} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                                                <button
                                                    onClick={() => handleRemoveImage(i)}
                                                    className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Icon name="close" size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        onChange={e => e.target.files && handleImageUpload(e.target.files)}
                                    />
                                    <div className="text-center">
                                        <Icon name="add_photo_alternate" size={24} className="text-slate-300 mx-auto mb-1" />
                                        <span className="text-xs text-slate-400 font-medium">点击上传照片</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* 底部按钮 */}
                        <div className="sticky bottom-0 bg-white/90 backdrop-blur-xl px-6 py-4 border-t border-slate-100/50 flex gap-3 rounded-b-[2rem]">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-medium text-sm hover:bg-slate-50 transition-all"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !formData.title || !formData.province || !formData.date}
                                className="flex-1 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? '保存中...' : '保存'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 删除确认弹窗 */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
                    <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <h3 className="font-bold text-lg text-slate-800 mb-2">确认删除</h3>
                        <p className="text-slate-500 text-sm mb-6">删除后将无法恢复，确定要删除这条打卡记录吗？</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-medium text-sm hover:bg-slate-50 transition-all"
                            >
                                取消
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium text-sm hover:bg-red-600 transition-all"
                            >
                                确认删除
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
