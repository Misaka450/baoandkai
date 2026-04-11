import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import Icon from '../components/icons/Icons'
import TimeCapsuleList from '../components/TimeCapsuleList'
import Modal from '../components/Modal'
import { timeCapsuleService } from '../services/apiService'

interface TimeCapsuleItem {
  id: string
  message: string
  unlockDate: string
  createdAt: string
  isUnlocked: boolean
}

export default function CoupleFeatures() {
  const [selectedCapsule, setSelectedCapsule] = useState<TimeCapsuleItem | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

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
      // 未解锁，显示提示信息
      alert('时间胶囊尚未到解锁日期，请耐心等待～')
    }
  }

  // 关闭胶囊详情
  const handleCloseCapsule = () => {
    setSelectedCapsule(null)
  }

  return (
    <div className="min-h-screen text-slate-700 transition-colors duration-300">
      <main className="max-w-6xl mx-auto px-6 pb-32 pt-40 relative">
        <header className="text-center mb-20 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-black text-gradient tracking-tight mb-6">情侣专属功能</h1>
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest leading-relaxed">
            Special features for our love journey
          </p>
        </header>

        {/* 功能卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-8 mb-16 max-w-3xl mx-auto">
          {/* 时间胶囊 */}
          <motion.div 
            className="premium-card p-8 !bg-white/40 backdrop-blur-sm animate-slide-up"
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
            />
          </motion.div>
        </div>
      </main>

      {/* 时间胶囊详情弹窗 */}
      <Modal
        isOpen={!!selectedCapsule}
        onClose={handleCloseCapsule}
        title={selectedCapsule?.isUnlocked ? '💌 已解锁的时间胶囊' : '🔒 时间胶囊'}
      >
        {selectedCapsule && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                {selectedCapsule.message}
              </p>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-400">
              <span>创建于：{new Date(selectedCapsule.createdAt).toLocaleDateString()}</span>
              <span>解锁于：{new Date(selectedCapsule.unlockDate).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <button
                onClick={() => {
                  setShowDeleteConfirm(selectedCapsule.id)
                  handleCloseCapsule()
                }}
                className="px-4 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                删除胶囊
              </button>
              <button
                onClick={handleCloseCapsule}
                className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* 删除确认弹窗 */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                  <Icon name="warning" size={24} className="text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">确认删除</h3>
                <p className="text-slate-400 text-sm mt-2">确定要删除这个时间胶囊吗？此操作不可恢复。</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => handleDeleteTimeCapsule(showDeleteConfirm)}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  删除
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
