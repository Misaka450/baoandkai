import { useState } from 'react'
import { motion } from 'framer-motion'
import Icon from '../icons/Icons'
import type { TimeCapsuleItem } from '../../types'
import { formatDate } from '../../utils/common'
import { hapticFeedback } from '../../utils/haptics'

interface TimeCapsuleListProps {
  capsules: TimeCapsuleItem[]
  isLoading?: boolean
  onOpenCapsule?: (capsule: TimeCapsuleItem) => void
  onDeleteCapsule?: (id: string) => void
  /** 是否显示删除确认弹窗，如果不传则使用内置弹窗 */
  showDeleteConfirm?: boolean
}

export default function TimeCapsuleList({
  capsules,
  isLoading,
  onOpenCapsule,
  onDeleteCapsule,
  showDeleteConfirm = false
}: TimeCapsuleListProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [lockedNoticeId, setLockedNoticeId] = useState<string | null>(null)

  // 计算剩余时间
  const getTimeRemaining = (unlockDate: string): string => {
    const now = new Date()
    const unlock = new Date(unlockDate)
    const diff = unlock.getTime() - now.getTime()

    if (diff <= 0) return '已可拆封'

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) return `还剩 ${days} 天 ${hours} 小时`
    if (hours > 0) return `还剩 ${hours} 小时 ${minutes} 分`
    return `还剩 ${minutes} 分钟`
  }

  const handleCardClick = (capsule: TimeCapsuleItem) => {
    if (capsule.isUnlocked) {
      hapticFeedback('medium')
      onOpenCapsule?.(capsule)
    } else {
      hapticFeedback('light')
      setLockedNoticeId(capsule.id)
      setTimeout(() => setLockedNoticeId(null), 3000)
    }
  }

  return (
    <div className="time-capsule-list">
      <div className="flex items-center justify-between mb-4 md:mb-6 px-1">
        <div>
          <h3 className="text-lg md:text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <span>💌</span>
            <span>写给未来的信箱</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">封存当下的心动与秘密，在未来的某一天拆封重温</p>
        </div>
        <div className="text-xs font-bold text-slate-400 bg-white/70 px-3 py-1 rounded-full border border-stone-200/60 shadow-xs">
          共 {capsules.length} 颗胶囊
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-16">
          <div className="w-9 h-9 border-3 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-400 text-xs font-medium">正在开启时光信箱...</p>
        </div>
      ) : capsules.length === 0 ? (
        <div className="text-center py-16 bg-[#FAF7F2]/60 rounded-3xl border border-dashed border-stone-300/80 p-8">
          <div className="w-16 h-16 rounded-full bg-[#FFEDF3] text-rose-400 flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Icon name="mark_email_unread" size={30} />
          </div>
          <h4 className="text-base font-bold text-slate-700 mb-1">信箱里空空如也</h4>
          <p className="text-slate-400 text-xs max-w-sm mx-auto leading-relaxed">
            前往后台创建一颗时光胶囊，写下一段寄给未来的私密告白吧
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {capsules.map((capsule, idx) => {
            const isUnlocked = capsule.isUnlocked
            const isShowingNotice = lockedNoticeId === capsule.id

            return (
              <motion.div
                key={capsule.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`group relative rounded-2xl md:rounded-3xl p-5 md:p-6 transition-all duration-300 cursor-pointer border select-none overflow-hidden ${
                  isUnlocked
                    ? 'bg-gradient-to-br from-[#FFFDF9] via-white to-[#FFF6F3] border-[#F0DED6] hover:border-rose-300 hover:shadow-xl hover:shadow-rose-500/10 hover:-translate-y-1'
                    : 'bg-[#FAF7F2]/80 border-stone-200/80 hover:bg-[#FAF7F2] hover:border-stone-300 shadow-sm'
                }`}
                onClick={() => handleCardClick(capsule)}
              >
                {/* 装饰性和纸胶带与邮票角标 */}
                <div className="absolute top-0 left-8 w-12 h-3.5 bg-rose-200/50 backdrop-blur-xs -translate-y-1.5 rotate-[-2deg] rounded-sm pointer-events-none" />

                {/* 顶部元信息行 */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-white border border-stone-200/70 text-stone-500 shadow-2xs">
                      {isUnlocked ? '✨ 已解锁' : '🔒 封存中'}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      创建于 {formatDate(capsule.createdAt, 'short')}
                    </span>
                  </div>

                  {/* 删除操作 */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      hapticFeedback('light')
                      if (showDeleteConfirm) {
                        onDeleteCapsule?.(capsule.id)
                      } else {
                        setDeleteConfirmId(capsule.id)
                      }
                    }}
                    className="w-7 h-7 rounded-full text-stone-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                    title="删除胶囊"
                  >
                    <Icon name="delete" size={15} />
                  </button>
                </div>

                {/* 信封卡片中央核心：火漆印章与解锁状态 */}
                <div className="flex items-center gap-4 py-1">
                  {/* 立体拟物火漆印章 (Wax Seal) */}
                  <div className="relative flex-shrink-0">
                    <div
                      className={`w-14 h-14 rounded-full flex flex-col items-center justify-center border-2 shadow-lg transition-transform duration-300 group-hover:scale-105 ${
                        isUnlocked
                          ? 'bg-gradient-to-br from-rose-500 via-rose-600 to-rose-700 border-rose-300/80 text-white shadow-rose-600/30 ring-4 ring-rose-100'
                          : 'bg-gradient-to-br from-stone-600 via-stone-700 to-stone-800 border-stone-500/80 text-stone-200 shadow-stone-800/25 ring-4 ring-stone-100'
                      }`}
                      style={{
                        boxShadow: isUnlocked
                          ? '0 8px 20px -3px rgba(225, 29, 72, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.4)'
                          : '0 8px 20px -3px rgba(41, 37, 36, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.2)'
                      }}
                    >
                      <Icon
                        name={isUnlocked ? 'mail' : 'lock'}
                        size={22}
                        className={isUnlocked ? 'animate-bounce' : ''}
                      />
                      <span className="text-[8px] font-black tracking-widest mt-0.5 scale-90">
                        {isUnlocked ? 'OPEN' : 'SEAL'}
                      </span>
                    </div>

                    {/* 解锁光晕 */}
                    {isUnlocked && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                      </span>
                    )}
                  </div>

                  {/* 状态文字与倒数 */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-800 text-sm md:text-base tracking-tight truncate flex items-center gap-1.5">
                      {isUnlocked ? '寄给未来的信 · 可拆阅' : '时间胶囊封存中'}
                    </h4>
                    <p className={`text-xs mt-1 font-medium ${isUnlocked ? 'text-rose-500 font-bold' : 'text-slate-500'}`}>
                      {isUnlocked ? '火漆封印已解开，点击立即拆信 ✨' : getTimeRemaining(capsule.unlockDate)}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1 font-mono">
                      <span>解锁日期:</span>
                      <span className="font-semibold text-slate-600">{formatDate(capsule.unlockDate, 'short')}</span>
                    </div>
                  </div>
                </div>

                {/* 未到期点击提示条 */}
                {isShowingNotice && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] font-medium text-amber-800 flex items-center gap-2"
                  >
                    <span>⏳</span>
                    <span>这是一封写给未来的信，时间还未到，请静待岁月的惊喜开启哦！</span>
                  </motion.div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}

      {/* 内置莫兰迪删除确认弹窗 */}
      {!showDeleteConfirm && deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirmId(null)}>
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-white/80 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="w-14 h-14 rounded-full bg-[#FFEDF3] text-rose-500 flex items-center justify-center mx-auto mb-3 shadow-inner border border-rose-100">
                <Icon name="warning" size={26} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">确认删除</h3>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed">确定要删除这个时间胶囊吗？此操作不可恢复。</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-full font-bold text-sm hover:bg-slate-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  onDeleteCapsule?.(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-morandi-rose to-rose-400 text-white rounded-full font-bold text-sm shadow-md hover:scale-105 transition-transform"
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
