import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import type { MapCheckin, FoodCheckin, Todo } from '../../types'
import { mapService, apiService } from '../../services/apiService'
import ImageModal from '../modals/ImageModal'
import Icon from '../icons/Icons'
import LazyImage from '../common/LazyImage'
import { getThumbnailUrl } from '../../utils/imageUtils'
import { useToast } from '../common/Toast'
import { formatDate } from '../../utils/common'

interface CheckinCardProps {
    checkins: MapCheckin[]
    cityName: string
    onClose: () => void
    onRefresh?: () => void
    onNavigateToTimeline?: (province: string, city?: string) => void
}

type TabType = 'checkins' | 'foods' | 'todos'

export default function CheckinCard({ checkins, cityName, onClose, onRefresh, onNavigateToTimeline }: CheckinCardProps) {
    const navigate = useNavigate()
    const toast = useToast()

    const [activeTab, setActiveTab] = useState<TabType>('checkins')
    const [selectedImages, setSelectedImages] = useState<string[]>([])
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [deletingId, setDeletingId] = useState<number | string | null>(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | string | null>(null)

    // 1. Query Foods
    const { data: foodsData } = useQuery({
        queryKey: ['map-city-foods'],
        queryFn: async () => {
            const res = await apiService.get<{ data: FoodCheckin[] } | FoodCheckin[]>('/food?limit=200')
            if (Array.isArray(res.data)) return res.data
            return res.data?.data || []
        },
        staleTime: 5 * 60 * 1000,
    })

    // 2. Query Todos
    const { data: todosData } = useQuery({
        queryKey: ['map-city-todos'],
        queryFn: async () => {
            const res = await apiService.get<{ data: Todo[] } | Todo[]>('/todos?limit=200')
            if (Array.isArray(res.data)) return res.data
            return res.data?.data || []
        },
        staleTime: 5 * 60 * 1000,
    })

    // 3. City matching logic
    const cleanCity = useMemo(() => {
        return (cityName || '').replace(/市|特别行政区|地区|盟|自治州/g, '').trim()
    }, [cityName])

    const allFoods: FoodCheckin[] = foodsData || []
    const allTodos: Todo[] = todosData || []

    const matchedFoods = useMemo(() => {
        if (!cleanCity) return []
        return allFoods.filter(food =>
            food.address?.includes(cleanCity) ||
            food.restaurant_name?.includes(cleanCity) ||
            food.description?.includes(cleanCity)
        )
    }, [allFoods, cleanCity])

    const matchedTodos = useMemo(() => {
        if (!cleanCity) return []
        return allTodos.filter(todo =>
            todo.title?.includes(cleanCity) ||
            todo.description?.includes(cleanCity) ||
            todo.category?.includes(cleanCity)
        )
    }, [allTodos, cleanCity])

    const handleImageClick = (images: string[], startIndex: number = 0) => {
        if (images && images.length > 0) {
            setSelectedImages(images)
            setCurrentImageIndex(startIndex)
        }
    }

    const handleDelete = async (id: number | string) => {
        setDeletingId(id)
        try {
            await mapService.delete(id)
            toast.success('足迹已成功删除')
            if (onRefresh) {
                onRefresh()
            }
            setShowDeleteConfirm(null)
        } catch (error) {
            console.error('删除失败:', error)
            toast.error('删除失败，请稍后重试')
        } finally {
            setDeletingId(null)
        }
    }

    // 通过Cookie判断是否为管理员
    const isAdmin = document.cookie.split(';').some(c => c.trim().startsWith('csrf_token='))

    if (typeof document === 'undefined') return null

    return createPortal(
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
                        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl px-6 pt-5 pb-3 border-b border-slate-100 rounded-t-[2rem]">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <Icon name="location_on" size={16} className="text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-lg text-slate-800">{cityName}</h3>
                                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest">
                                            {checkins.length} 个足迹 · {matchedFoods.length} 家美食 · {matchedTodos.length} 条心愿
                                        </p>
                                    </div>
                                    {/* 联动按钮：查看时间轴 */}
                                    {onNavigateToTimeline && checkins.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const firstCheckin = checkins[0]
                                                if (firstCheckin) onNavigateToTimeline(firstCheckin.province, firstCheckin.city || undefined)
                                            }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/5 hover:bg-primary/10 text-primary text-[11px] font-bold transition-all ml-2"
                                        >
                                            <Icon name="timeline" size={14} />
                                            时间轴
                                        </button>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-all"
                                >
                                    <Icon name="close" size={16} />
                                </button>
                            </div>

                            {/* 3 Tab Chips at top of CheckinCard */}
                            <div className="flex items-center gap-2 pt-1 pb-1 overflow-x-auto no-scrollbar">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('checkins')}
                                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                                        activeTab === 'checkins'
                                            ? 'bg-primary text-white shadow-md shadow-primary/25'
                                            : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80'
                                    }`}
                                >
                                    <span>📍 足迹 ({checkins.length})</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('foods')}
                                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                                        activeTab === 'foods'
                                            ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                                            : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80'
                                    }`}
                                >
                                    <span>🍜 美食 ({matchedFoods.length})</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('todos')}
                                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                                        activeTab === 'todos'
                                            ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
                                            : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80'
                                    }`}
                                >
                                    <span>🎯 心愿 ({matchedTodos.length})</span>
                                </button>
                            </div>
                        </div>

                        {/* 内容区域 */}
                        <div className="p-6">
                            {/* 1. 足迹 Tab */}
                            {activeTab === 'checkins' && (
                                <div className="space-y-6">
                                    {checkins.length === 0 ? (
                                        <div className="py-12 text-center text-slate-400">
                                            <p className="text-sm">暂无该城市的足迹打卡记录</p>
                                        </div>
                                    ) : (
                                        checkins.map((checkin, idx) => (
                                            <motion.div
                                                key={checkin.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.06 }}
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
                                                                    src={getThumbnailUrl(checkin.images[0] || '', 600)}
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
                                        ))
                                    )}
                                </div>
                            )}

                            {/* 2. 美食 Tab */}
                            {activeTab === 'foods' && (
                                <div>
                                    {matchedFoods.length === 0 ? (
                                        <div className="py-12 text-center">
                                            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-3">
                                                <Icon name="restaurant" size={26} />
                                            </div>
                                            <p className="font-bold text-slate-700 text-sm mb-1">
                                                暂无 {cleanCity || cityName} 的美食打卡
                                            </p>
                                            <p className="text-slate-400 text-xs mb-5">
                                                去美食打卡专区发现或记录当地餐厅吧
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    onClose()
                                                    navigate('/food')
                                                }}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-md shadow-amber-500/25 active:scale-95"
                                            >
                                                <Icon name="restaurant_menu" size={14} />
                                                <span>前往美食打卡</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {matchedFoods.map((food, idx) => {
                                                const foodImages = food.images || []
                                                return (
                                                    <motion.div
                                                        key={food.id || idx}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: idx * 0.05 }}
                                                        className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col gap-3 group"
                                                    >
                                                        {/* 头部：餐厅名称、菜系、评分 */}
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                                    <h4 className="font-black text-base text-slate-800 group-hover:text-primary transition-colors">
                                                                        {food.restaurant_name}
                                                                    </h4>
                                                                    {food.cuisine && (
                                                                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200/50">
                                                                            {food.cuisine}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {food.address && (
                                                                    <div className="flex items-center gap-1 text-slate-400 text-xs">
                                                                        <Icon name="location_on" size={12} className="text-amber-500/70 shrink-0" />
                                                                        <span className="truncate">{food.address}</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {food.overall_rating > 0 && (
                                                                <div className="flex items-center gap-1 text-amber-500 bg-amber-50 px-2 py-1 rounded-lg shrink-0">
                                                                    <Icon name="star" size={12} className="fill-current" />
                                                                    <span className="text-xs font-black">{food.overall_rating}</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* 推荐菜品 */}
                                                        {food.recommended_dishes && (
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {food.recommended_dishes
                                                                    .split(/[,，、]/)
                                                                    .filter(Boolean)
                                                                    .slice(0, 4)
                                                                    .map((dish, i) => (
                                                                        <span
                                                                            key={i}
                                                                            className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 text-[11px] font-medium border border-slate-100"
                                                                        >
                                                                            {dish.trim()}
                                                                        </span>
                                                                    ))}
                                                            </div>
                                                        )}

                                                        {/* 评价描述 */}
                                                        {food.description && (
                                                            <p className="text-xs text-slate-500 line-clamp-2 italic leading-relaxed">
                                                                "{food.description}"
                                                            </p>
                                                        )}

                                                        {/* 美食图片缩略图 */}
                                                        {foodImages.length > 0 && (
                                                            <div className="flex gap-2 pt-1 overflow-x-auto no-scrollbar">
                                                                {foodImages.slice(0, 4).map((img, i) => (
                                                                    <div
                                                                        key={i}
                                                                        className="w-16 h-16 rounded-xl overflow-hidden cursor-pointer shrink-0 border border-slate-100 hover:scale-105 transition-transform"
                                                                        onClick={() => handleImageClick(foodImages, i)}
                                                                    >
                                                                        <LazyImage
                                                                            src={getThumbnailUrl(img, 150)}
                                                                            alt={`${food.restaurant_name} ${i + 1}`}
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* 底部跳转链接 */}
                                                        <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                                                            <span className="text-[10px] text-slate-300 font-bold">
                                                                {food.date ? formatDate(food.date) : ''}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    onClose()
                                                                    navigate('/food')
                                                                }}
                                                                className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors"
                                                            >
                                                                <span>查看美食详情</span>
                                                                <Icon name="east" size={12} />
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 3. 心愿 Tab */}
                            {activeTab === 'todos' && (
                                <div>
                                    {matchedTodos.length === 0 ? (
                                        <div className="py-12 text-center">
                                            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-3">
                                                <Icon name="checklist" size={26} />
                                            </div>
                                            <p className="font-bold text-slate-700 text-sm mb-1">
                                                暂无与 {cleanCity || cityName} 相关的心愿清单
                                            </p>
                                            <p className="text-slate-400 text-xs mb-5">
                                                记录下想和TA一起在此完成的浪漫约定吧
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    onClose()
                                                    navigate('/todos')
                                                }}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-md shadow-rose-500/25 active:scale-95"
                                            >
                                                <Icon name="favorite" size={14} />
                                                <span>前往心愿清单</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {matchedTodos.map((todo, idx) => {
                                                const isCompleted = todo.status === 'completed'
                                                return (
                                                    <motion.div
                                                        key={todo.id || idx}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: idx * 0.05 }}
                                                        className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col gap-2.5 group"
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex items-center gap-2 flex-1">
                                                                <h4 className="font-black text-base text-slate-800 group-hover:text-primary transition-colors">
                                                                    {todo.title}
                                                                </h4>
                                                                {todo.category && (
                                                                    <span className="px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 text-[10px] font-bold border border-slate-100">
                                                                        {todo.category}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span
                                                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider shrink-0 ${
                                                                    isCompleted
                                                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
                                                                        : 'bg-rose-50 text-rose-600 border border-rose-200/60'
                                                                }`}
                                                            >
                                                                {isCompleted ? '已实现' : '进行中'}
                                                            </span>
                                                        </div>

                                                        {/* 完成备注或描述 */}
                                                        {(todo.completion_notes || todo.description) && (
                                                            <p className="text-xs text-slate-500 leading-relaxed">
                                                                {todo.completion_notes ? (
                                                                    <span className="italic text-emerald-700 bg-emerald-50/60 px-2.5 py-1 rounded-lg block">
                                                                        “{todo.completion_notes}”
                                                                    </span>
                                                                ) : (
                                                                    todo.description
                                                                )}
                                                            </p>
                                                        )}

                                                        {/* 底部跳转到 /todos */}
                                                        <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                                                            <span className="text-[10px] text-slate-300 font-bold">
                                                                {todo.due_date ? formatDate(todo.due_date) : (todo.created_at ? formatDate(todo.created_at) : '')}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    onClose()
                                                                    navigate('/todos')
                                                                }}
                                                                className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors"
                                                            >
                                                                <span>前往心愿清单</span>
                                                                <Icon name="east" size={12} />
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
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
                                <div className="w-16 h-16 rounded-full bg-[#FFEDF3] text-morandi-rose border border-rose-100 flex items-center justify-center mx-auto mb-4 shadow-inner">
                                    <Icon name="delete" size={30} />
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
                                        className="flex-1 px-6 py-3 rounded-2xl bg-gradient-to-r from-morandi-rose to-rose-400 text-white font-bold text-sm hover:shadow-lg shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
        </>,
        document.body
    )
}
