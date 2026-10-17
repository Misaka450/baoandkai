import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import Icon from '../components/icons/Icons'
import TimeCapsuleList from '../components/features/TimeCapsuleList'
import Modal from '../components/modals/Modal'
import AnniversaryCountdown from '../components/couple/AnniversaryCountdown'
import { timeCapsuleService } from '../services/apiService'
import type { TimeCapsuleItem } from '../types'
import { formatDate } from '../utils/common'
import ModuleSubNav from '../components/ModuleSubNav'

export default function CoupleFeatures() {
  const [selectedCapsule, setSelectedCapsule] = useState<TimeCapsuleItem | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [showLockedTip, setShowLockedTip] = useState(false)

  // 使用 React Query 获取时间胶囊数据
  const { data: capsulesResponse, isLoading: isLoadingCapsules } = useQuery({
    queryKey: ['timeCapsules'],
    queryFn: async () => {
      const { data, error } = await timeCapsuleService.getAll()
      if (error) throw new Error(error)
      return data
    }
  })

  // 处理时间胶囊数据
  const timeCapsules: TimeCapsuleItem[] = (capsulesResponse?.data || []).map(c => ({
    id: c.id,
    message: c.message,
    unlockDate: c.unlock_date,
    createdAt: c.created_at,
    isUnlocked: c.is_unlocked
  }))

  // 删除时间胶囊的 mutation（仅用于已解锁的胶囊）
  const deleteCapsuleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await timeCapsuleService.delete(id)
      if (error) throw new Error(error)
    },
    onSuccess: () => {
      // 刷新数据
      setShowDeleteConfirm(null)
    }
  })

  // 删除时间胶囊
  const handleDeleteTimeCapsule = (id: string) => {
    deleteCapsuleMutation.mutate(id)
  }

  // 打开时间胶囊
  const handleOpenCapsule = (capsule: TimeCapsuleItem) => {
    if (capsule.isUnlocked) {
      setSelectedCapsule(capsule)
    } else {
      setShowLockedTip(true)
    }
  }

  // 关闭胶囊详情
  const handleCloseCapsule = () => {
    setSelectedCapsule(null)
  }

  return (
    <div className="min-h-screen text-slate-700 transition-colors duration-300">
      <main className="max-w-6xl mx-auto px-3.5 md:px-6 pb-20 md:pb-32 pt-16 sm:pt-20 md:pt-40 relative">
        <header className="text-center mb-4 sm:mb-6 md:mb-12 animate-fade-in">
          <h1 className="text-xl sm:text-3xl md:text-5xl lg:text-6xl font-black text-gradient tracking-tight mb-1 sm:mb-1.5 md:mb-6">情侣专属功能</h1>
          <p className="hidden sm:block text-slate-400 font-bold text-[10px] sm:text-xs md:text-sm uppercase tracking-widest leading-relaxed mb-3 sm:mb-4 md:mb-8">
            Special features for our love journey
          </p>
          <ModuleSubNav section="couple" className="mb-0" />
        </header>

        {/* 纪念日与倒数日看板 */}
        <AnniversaryCountdown />

        {/* 功能卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 md:gap-8 mb-12 md:mb-16 max-w-4xl mx-auto">
          {/* 时间胶囊 */}
          <motion.div 
            className="premium-card p-4 md:p-8 rounded-2xl md:rounded-[2.5rem] !bg-white/40 backdrop-blur-sm animate-slide-up"
            whileHover={{ y: -5 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Icon name="event" size={24} className="text-primary" />
                </div>
                <h2 className="text-2xl font-black text-slate-800">时间胶囊</h2>
              </div>
            </div>
            <p className="text-slate-400 mb-6">查看已创建的时间胶囊，等待未来的惊喜解锁。</p>

            <TimeCapsuleList 
              capsules={timeCapsules}
              isLoading={isLoadingCapsules}
              onOpenCapsule={handleOpenCapsule}
              onDeleteCapsule={(id) => setShowDeleteConfirm(id)}
              showDeleteConfirm={true}
            />
          </motion.div>
        </div>
      </main>

      {/* 时间胶囊·情书信笺详情弹窗 */}
      <Modal
        isOpen={!!selectedCapsule}
        onClose={handleCloseCapsule}
        title={selectedCapsule?.isUnlocked ? '💌 跨越时光的信函' : '🔒 时间胶囊'}
      >
        {selectedCapsule && (
          <div className="space-y-5">
            {/* 拟物信纸背景 */}
            <div
              className="relative rounded-2xl p-6 md:p-8 border border-stone-200/80 shadow-sm"
              style={{
                backgroundColor: '#FFFDF9',
                backgroundImage: 'radial-gradient(#e5e7eb 0.75px, transparent 0.75px)',
                backgroundSize: '16px 16px'
              }}
            >
              {/* 信纸顶部微型邮票与邮戳 */}
              <div className="flex items-start justify-between pb-4 border-b border-stone-200/60 mb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">✉️</span>
                    <h3 className="font-black text-slate-800 text-base md:text-lg tracking-tight">
                      致未来的我们
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 font-mono">
                    Time Capsule · Written from the Past
                  </p>
                </div>

                {/* 邮戳印记 */}
                <div className="text-right font-mono text-[10px] text-stone-400 bg-stone-100/80 px-2.5 py-1 rounded-md border border-stone-200/60">
                  <div>POST: {formatDate(selectedCapsule.createdAt, 'dot')}</div>
                  <div className="text-rose-500 font-bold">OPEN: {formatDate(selectedCapsule.unlockDate, 'dot')}</div>
                </div>
              </div>

              {/* 正文内容 */}
              <div className="py-2">
                <p className="text-slate-800 text-sm md:text-base leading-relaxed md:leading-loose whitespace-pre-wrap font-medium tracking-wide">
                  {selectedCapsule.message}
                </p>
              </div>

              {/* 底部情侣印章 */}
              <div className="mt-8 pt-4 border-t border-stone-200/60 flex items-center justify-between">
                <div className="text-xs text-slate-400 font-serif italic">
                  “念念不忘，必有回响。”
                </div>

                <div
                  className="w-16 h-16 rounded-full border-2 border-rose-500/80 flex flex-col items-center justify-center p-1 text-rose-600 select-none shadow-xs bg-rose-50/40 rotate-[-12deg]"
                >
                  <div className="absolute inset-[2px] rounded-full border border-dashed border-rose-400/50 pointer-events-none" />
                  <span className="text-[8px] font-black leading-tight">BB & KK</span>
                  <div className="w-6 h-[0.5px] bg-rose-300 my-0.5" />
                  <span className="text-[7.5px] font-bold leading-tight">真爱印证</span>
                </div>
              </div>
            </div>

            {/* 底部按钮栏 */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  setShowDeleteConfirm(selectedCapsule.id)
                  handleCloseCapsule()
                }}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              >
                删除这封信
              </button>
              <button
                onClick={handleCloseCapsule}
                className="px-6 py-2.5 text-xs font-bold bg-primary text-white rounded-full hover:bg-primary/90 shadow-md shadow-primary/25 active:scale-95 transition-all"
              >
                封存回信箱
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* 莫兰迪删除确认弹窗 */}
      <Modal
        isOpen={showDeleteConfirm !== null}
        onClose={() => setShowDeleteConfirm(null)}
        title="确认删除"
      >
        <div className="text-center py-2 space-y-4">
          <div className="w-14 h-14 rounded-full bg-[#FFEDF3] text-rose-500 flex items-center justify-center mx-auto shadow-inner border border-rose-100">
            <Icon name="warning" size={26} />
          </div>
          <p className="text-slate-600 text-sm leading-relaxed">
            确定要删除这个时间胶囊吗？此操作不可恢复。
          </p>
          <div className="flex justify-center gap-3 pt-3">
            <button
              onClick={() => setShowDeleteConfirm(null)}
              className="px-6 py-2.5 rounded-full bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={() => {
                if (showDeleteConfirm) {
                  handleDeleteTimeCapsule(showDeleteConfirm);
                }
              }}
              className="px-8 py-2.5 bg-gradient-to-r from-morandi-rose to-rose-400 text-white rounded-full font-bold shadow-md hover:scale-105 transition-transform"
            >
              确认删除
            </button>
          </div>
        </div>
      </Modal>

      {/* 未解锁提示弹窗 - 使用统一的 Modal 组件 */}
      <Modal
        isOpen={showLockedTip}
        onClose={() => setShowLockedTip(false)}
        title="🔒 还未到解锁日期"
      >
        <div className="space-y-6">
          <div className="text-center py-4">
            <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <Icon name="schedule" size={40} className="text-amber-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">时间胶囊正在等待解锁</h3>
            <p className="text-slate-400 leading-relaxed">
              这枚时间胶囊还在沉睡中，请耐心等待约定的日期到来。<br />
              届时再来开启这份来自过去的惊喜吧～
            </p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <p className="text-sm text-slate-500">
              💡 提示：创建时间胶囊时设定的解锁日期到达后，胶囊将自动解锁
            </p>
          </div>
          <button
            onClick={() => setShowLockedTip(false)}
            className="w-full px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium"
          >
            我知道了
          </button>
        </div>
      </Modal>
    </div>
  )
}
