import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { MapCheckin } from '../../types'
import { mapService } from '../../services/apiService'
import ImageModal from '../ImageModal'
import Icon from '../icons/Icons'
import LazyImage from '../LazyImage'
import { getThumbnailUrl } from '../../utils/imageUtils'

interface CheckinCardProps {
    checkins: MapCheckin[]
    cityName: string
    onClose: () => void
    onRefresh?: () => void
}

export default function CheckinCard({ checkins, cityName, onClose, onRefresh }: CheckinCardProps) {
    const [selectedImages, setSelectedImages] = useState<string[]>([])
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [deletingId, setDeletingId] = useState<number | string | null>(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | string | null>(null)

    const handleImageClick = (images: string[], startIndex: number = 0) => {
        if (images && images.length > 0) {
            setSelectedImages(images)
            setCurrentImageIndex(startIndex)
        }
    }

    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr)
            return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
        } catch {
            return dateStr
        }
    }

    const handleDelete = async (id: number | string) => {
        setDeletingId(id)
        try {
            await mapService.delete(id)
            if (onRefresh) {
                onRefresh()
            }
            setShowDeleteConfirm(null)
        } catch (error) {
            console.error('删除失败:', error)
            alert('删除失败，请重试')
        } finally {
            setDeletingId(null)
        }
    }

    // 通过Cookie判断是否为管理员（auth_token为HttpOnly，用csrf_token判断登录状态）
    const isAdmin = document.cookie.split(';').some(c => c.trim().startsWith('csrf_token='))

    return (
        <>
            <AnimatePresence>
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {/* 背景遮罩 */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

                    {/* 卡片 */}
                    <motion.div
                        className="relative z-10 bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto border border-white/80"
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', duration: 0.4 }}
                    >
                        {/* 头部 */}
                        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-xl px-6 py-4 border-b border-slate-100/50 flex items-center justify-between rounded-t-[2rem]">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Icon name="location_on" size={16} className="text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-black text-lg text-slate-800">{cityName}</h3>
                                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{checkins.length} 个足迹</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-all"
                            >
                                <Icon name="close" size={16} />
                            </button>
                        </div>

                        {/* 打卡列表 */}
                        <div className="p-6 space-y-6">
                            {checkins.map((checkin, idx) => (
                                <motion.div
                                    key={checkin.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.08 }}
                                >
                                    {/* 图片区域 */}
                                    {checkin.images && checkin.images.length > 0 && (
                                        <div className="mb-4">
                                            {checkin.images.length === 1 ? (
                                                <div
                                                    className="rounded-2xl overflow-hidden cursor-pointer h-48 shadow-sm"
                                                    onClick={() => handleImageClick(checkin.images, 0)}
                                                >
                                                    <LazyImage
                                                        src={getThumbnailUrl(checkin.images[0], 600)}
                                                        alt={checkin.title}
                                                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 gap-2">
                                                    {checkin.images.slice(0, 4).map((img, i) => (
                                                        <div
                                                            key={i}
                                                            className="rounded-xl overflow-hidden cursor-pointer h-28 shadow-sm relative"
                                                            onClick={() => handleImageClick(checkin.images, i)}
                                                        >
                                                            <LazyImage
                                                                src={getThumbnailUrl(img, 300)}
                                                                alt={`${checkin.title} ${i + 1}`}
                                                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                                                            />
                                                            {i === 3 && checkin.images.length > 4 && (
                                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                                    <span className="text-white font-black text-lg">+{checkin.images.length - 4}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* 文字内容 */}
                                    <div className="relative">
                                        <h4 className="font-black text-xl text-slate-800 mb-2">{checkin.title}</h4>
                                        {checkin.description && (
                                            <p className="text-slate-500 text-sm leading-relaxed mb-3">{checkin.description}</p>
                                        )}
                                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                                            {formatDate(checkin.date)}
                                        </p>

                                        {/* 管理员删除按钮 */}
                                        {isAdmin && (
                                            <button
                                                onClick={() => setShowDeleteConfirm(checkin.id)}
                                                disabled={deletingId === checkin.id}
                                                className="absolute top-0 right-0 p-2 text-slate-300 hover:text-red-500 transition-colors disabled:opacity-50"
                                                title="删除足迹"
                                            >
                                                <Icon name="delete" size={16} />
                                            </button>
                                        )}
                                    </div>

                                    {/* 分隔线 */}
                                    {idx < checkins.length - 1 && (
                                        <div className="border-b border-dashed border-slate-100 mt-6" />
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            </AnimatePresence>

            {/* 图片查看器 */}
            <ImageModal
                isOpen={selectedImages.length > 0}
                onClose={() => setSelectedImages([])}
                images={selectedImages}
                currentIndex={currentImageIndex}
                onPrevious={() => setCurrentImageIndex(prev => (prev - 1 + selectedImages.length) % selectedImages.length)}
                onNext={() => setCurrentImageIndex(prev => (prev + 1) % selectedImages.length)}
                onJumpTo={setCurrentImageIndex}
            />

            {/* 删除确认弹窗 */}
            <AnimatePresence>
                {showDeleteConfirm !== null && (
                    <motion.div
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(null)} />
                        <motion.div
                            className="relative z-10 bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-white/80"
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            transition={{ type: 'spring', duration: 0.3 }}
                        >
                            <div className="text-center">
                                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                                    <Icon name="delete" size={32} className="text-red-500" />
                                </div>
                                <h3 className="text-xl font-black text-slate-800 mb-2">确认删除</h3>
                                <p className="text-slate-400 text-sm mb-6">确定要删除这条足迹记录吗？此操作不可恢复。</p>
                                
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowDeleteConfirm(null)}
                                        disabled={deletingId !== null}
                                        className="flex-1 px-6 py-3 rounded-2xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-colors disabled:opacity-50"
                                    >
                                        取消
                                    </button>
                                    <button
                                        onClick={() => handleDelete(showDeleteConfirm)}
                                        disabled={deletingId !== null}
                                        className="flex-1 px-6 py-3 rounded-2xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {deletingId === showDeleteConfirm ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                删除中...
                                            </>
                                        ) : (
                                            '删除'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
