import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Icon from './icons/Icons'

interface TimeCapsuleItem {
  id: string
  message: string
  unlockDate: string
  createdAt: string
  isUnlocked: boolean
}

interface TimeCapsuleListProps {
  capsules: TimeCapsuleItem[]
  isLoading?: boolean
  onOpenCapsule?: (capsule: TimeCapsuleItem) => void
  onDeleteCapsule?: (id: string) => void
  /** 是否显示删除确认弹窗，如果不传则使用内置弹窗 */
  showDeleteConfirm?: boolean
}

export default function TimeCapsuleList({ capsules, isLoading, onOpenCapsule, onDeleteCapsule, showDeleteConfirm = false }: TimeCapsuleListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // 计算剩余时间
  const getTimeRemaining = (unlockDate: string): string => {
    const now = new Date()
    const unlock = new Date(unlockDate)
    const diff = unlock.getTime() - now.getTime()

    if (diff <= 0) return '已解锁'

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) return `${days}天 ${hours}小时`
    if (hours > 0) return `${hours}小时 ${minutes}分钟`
    return `${minutes}分钟`
  }

  return (
    <div className="time-capsule-list">
      <div className="flex items-center justify-between mb-6 px-4">
        <h3 className="text-xl font-black text-slate-800">时间胶囊</h3>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 text-sm">加载中...</p>
        </div>
      ) : capsules.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
            <Icon name="lock" size={32} className="text-slate-300" />
          </div>
          <h4 className="text-lg font-medium text-slate-400 mb-2">还没有时间胶囊</h4>
          <p className="text-slate-300 text-sm">创建一个时间胶囊，给未来的自己或对方一个惊喜</p>
        </div>
      ) : (
        <div className="space-y-4 px-4">
          {capsules.map((capsule) => (
            <motion.div
              key={capsule.id}
              className={`border border-slate-200 rounded-xl overflow-hidden ${capsule.isUnlocked ? 'bg-white' : 'bg-slate-50'}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.random() * 0.1 }}
            >
              <div 
                className="p-4 cursor-pointer"
                onClick={() => setExpandedId(expandedId === capsule.id ? null : capsule.id)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${capsule.isUnlocked ? 'bg-primary/10' : 'bg-slate-200'}`}>
                      <Icon 
                        name={capsule.isUnlocked ? 'check' : 'lock'} 
                        size={20} 
                        className={capsule.isUnlocked ? 'text-primary' : 'text-slate-400'} 
                      />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-800">
                        {capsule.isUnlocked ? '已解锁的胶囊' : '时间胶囊'}
                      </h4>
                      <p className="text-sm text-slate-400">
                        创建于 {new Date(capsule.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${capsule.isUnlocked ? 'text-primary' : 'text-slate-500'}`}>
                      {capsule.isUnlocked ? '已解锁' : getTimeRemaining(capsule.unlockDate)}
                    </p>
                    <p className="text-xs text-slate-400">
                      解锁日期: {new Date(capsule.unlockDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {expandedId === capsule.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-slate-100"
                  >
                    <div className="p-4 space-y-4">
                      {capsule.isUnlocked ? (
                        <div className="bg-slate-50 p-4 rounded-lg">
                          <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {capsule.message}
                          </p>
                        </div>
                      ) : (
                        <div className="bg-slate-50 p-4 rounded-lg text-center">
                          <Icon name="lock" size={32} className="text-slate-300 mx-auto mb-2" />
                          <p className="text-slate-400">时间胶囊尚未解锁</p>
                        </div>
                      )}
                      <div className="flex justify-end space-x-2">
                        {showDeleteConfirm ? (
                          <button
                            onClick={() => onDeleteCapsule && onDeleteCapsule(capsule.id)}
                            className="px-3 py-1 text-sm text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            删除
                          </button>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(capsule.id)}
                            className="px-3 py-1 text-sm text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            删除
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}

      {/* 内置删除确认弹窗 */}
      {!showDeleteConfirm && deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in">
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                <Icon name="warning" size={24} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">确认删除</h3>
              <p className="text-slate-400 text-sm mt-2">确定要删除这个时间胶囊吗？此操作不可恢复。</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  onDeleteCapsule && onDeleteCapsule(deleteConfirmId)
                  setDeleteConfirmId(null)
                }}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
