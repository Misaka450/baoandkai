import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import Modal from '../components/Modal'
import Icon from '../components/icons/Icons'
import TimeCapsule from '../components/TimeCapsule'
import TimeCapsuleList from '../components/TimeCapsuleList'
import { apiService, timeCapsuleService, TimeCapsuleData } from '../services/apiService'

interface TimeCapsuleItem {
  id: string
  message: string
  unlockDate: string
  createdAt: string
  isUnlocked: boolean
}

export default function CoupleFeatures() {
  const queryClient = useQueryClient()
  const [showTimeCapsule, setShowTimeCapsule] = useState(false)
  const [timeCapsules, setTimeCapsules] = useState<TimeCapsuleItem[]>([])

  // 使用 React Query 获取时间胶囊数据
  const { data: capsulesResponse, isLoading: isLoadingCapsules } = useQuery({
    queryKey: ['timeCapsules'],
    queryFn: async () => {
      const { data, error } = await timeCapsuleService.getAll()
      if (error) throw new Error(error)
      return data
    }
  })

  const timeCapsules: TimeCapsuleItem[] = (capsulesResponse?.data || []).map(c => ({
    id: c.id,
    message: c.message,
    unlockDate: c.unlock_date,
    createdAt: c.created_at,
    isUnlocked: c.is_unlocked
  }))

  // 创建时间胶囊的 mutation
  const createCapsuleMutation = useMutation({
    mutationFn: async (newCapsule: { message: string; unlockDate: string }) => {
      const { data, error } = await timeCapsuleService.create({
        message: newCapsule.message,
        unlock_date: newCapsule.unlockDate
      })
      if (error) throw new Error(error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeCapsules'] })
      setShowTimeCapsule(false)
    }
  })

  // 删除时间胶囊的 mutation
  const deleteCapsuleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await timeCapsuleService.delete(id)
      if (error) throw new Error(error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeCapsules'] })
    }
  })

  // 保存时间胶囊
  const handleSaveTimeCapsule = (message: string, unlockDate: string) => {
    createCapsuleMutation.mutate({ message, unlockDate })
  }

  // 删除时间胶囊
  const handleDeleteTimeCapsule = (id: string) => {
    deleteCapsuleMutation.mutate(id)
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
              <button
                onClick={() => setShowTimeCapsule(true)}
                className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
              >
                <Icon name="add" size={20} className="text-primary" />
              </button>
            </div>
            <p className="text-slate-400 mb-6">创建一个时间胶囊，设置未来的解锁日期，给对方一个惊喜。</p>

            <TimeCapsuleList 
              capsules={timeCapsules}
              isLoading={isLoadingCapsules}
              onOpenCapsule={(capsule: TimeCapsuleItem) => {
                // TODO: 实现打开胶囊逻辑
              }}
              onDeleteCapsule={handleDeleteTimeCapsule}
            />
          </motion.div>
        </div>
      </main>

      {/* 时间胶囊弹窗 */}
      <AnimatePresence>
        {showTimeCapsule && (
          <Modal 
            isOpen={showTimeCapsule}
            onClose={() => setShowTimeCapsule(false)}
            title="创建时间胶囊"
          >
            <TimeCapsule 
              onSave={(message: string, unlockDate: string) => {
                // TODO: 实现保存逻辑
                setShowTimeCapsule(false)
              }}
              onClose={() => setShowTimeCapsule(false)}
            />
          </Modal>
        )}
      </AnimatePresence>
    </div>
  )
}
