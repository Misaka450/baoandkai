import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { MapCheckin } from '../../types'
import Icon from '../icons/Icons'
import LazyImage from '../LazyImage'
import { getThumbnailUrl } from '../../utils/imageUtils'

interface PhotoWallProps {
    checkins: MapCheckin[]
    onPhotoClick?: (checkin: MapCheckin, imageIndex: number) => void
}

export default function PhotoWall({ checkins, onPhotoClick }: PhotoWallProps) {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

    // 提取所有照片
    const allPhotos = checkins.flatMap(checkin => 
        checkin.images.map((img, idx) => ({
            checkin,
            image: img,
            index: idx
        }))
    )

    if (allPhotos.length === 0) {
        return (
            <div className="text-center py-20">
                <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6">
                    <Icon name="photo_library" size={32} className="text-slate-300" />
                </div>
                <h3 className="text-xl font-black text-slate-400 mb-2">还没有照片</h3>
                <p className="text-slate-300 text-sm">在管理后台添加照片后，这里会显示你们的旅行回忆</p>
            </div>
        )
    }

    return (
        <div>
            {/* 视图切换 */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-xl transition-colors ${
                            viewMode === 'grid' 
                                ? 'bg-primary/10 text-primary' 
                                : 'bg-slate-100 text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <Icon name="grid_view" size={20} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-xl transition-colors ${
                            viewMode === 'list' 
                                ? 'bg-primary/10 text-primary' 
                                : 'bg-slate-100 text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <Icon name="view_list" size={20} />
                    </button>
                </div>
                <span className="text-sm font-bold text-slate-400">
                    共 {allPhotos.length} 张照片
                </span>
            </div>

            {/* 照片墙 */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {allPhotos.map((photo, idx) => (
                        <motion.div
                            key={`${photo.checkin.id}-${photo.index}`}
                            className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.03 }}
                            whileHover={{ scale: 1.05, rotate: 2 }}
                            onClick={() => onPhotoClick?.(photo.checkin, photo.index)}
                        >
                            <LazyImage
                                src={getThumbnailUrl(photo.image, 400)}
                                alt={photo.checkin.title}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="absolute bottom-0 left-0 right-0 p-4">
                                    <p className="text-white text-xs font-bold truncate">{photo.checkin.title}</p>
                                    <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest">
                                        {new Date(photo.checkin.date).toLocaleDateString('zh-CN')}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allPhotos.map((photo, idx) => (
                        <motion.div
                            key={`${photo.checkin.id}-${photo.index}`}
                            className="group flex gap-4 p-4 premium-card cursor-pointer hover:shadow-lg transition-all"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            onClick={() => onPhotoClick?.(photo.checkin, photo.index)}
                        >
                            <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                                <LazyImage
                                    src={getThumbnailUrl(photo.image, 200)}
                                    alt={photo.checkin.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                            </div>
                            <div className="flex-1 flex flex-col justify-center">
                                <h4 className="font-black text-slate-800 mb-1 group-hover:text-primary transition-colors">
                                    {photo.checkin.title}
                                </h4>
                                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">
                                    <Icon name="location_on" size={12} className="text-primary/40" />
                                    <span>{photo.checkin.province}{photo.checkin.city ? ` · ${photo.checkin.city}` : ''}</span>
                                </div>
                                <p className="text-[10px] text-slate-300 font-bold">
                                    {new Date(photo.checkin.date).toLocaleDateString('zh-CN')}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    )
}
