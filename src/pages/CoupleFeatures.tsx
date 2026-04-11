import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import Modal from '../components/Modal'
import Icon from '../components/icons/Icons'
import PuzzleGame from '../components/PuzzleGame'
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
  const [selectedImage, setSelectedImage] = useState<string>('')
  const [showPuzzle, setShowPuzzle] = useState(false)
  const [showTimeCapsule, setShowTimeCapsule] = useState(false)
  const [puzzleSize, setPuzzleSize] = useState(3)
  const [recentPhotos, setRecentPhotos] = useState<string[]>([])

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

  // 获取最近的照片
  useEffect(() => {
    const fetchRecentPhotos = async () => {
      try {
        const { data } = await apiService.get<any>('/albums')
        if (data && data.data) {
          const photos: string[] = []
          data.data.forEach((album: any) => {
            if (album.cover_url) {
              photos.push(album.cover_url)
            }
          })
          setRecentPhotos(photos.slice(0, 6))
        }
      } catch (error) {
        console.error('获取照片失败:', error)
      }
    }

    fetchRecentPhotos()
  }, [])

  // 保存时间胶囊
  const handleSaveTimeCapsule = (message: string, unlockDate: string) => {
    createCapsuleMutation.mutate({ message, unlockDate })
  }

  // 删除时间胶囊
  const handleDeleteTimeCapsule = (id: string) => {
    deleteCapsuleMutation.mutate(id)
  }

  // 打开时间胶囊
  const handleOpenTimeCapsule = (capsule: TimeCapsuleItem) => {
    // 这里可以添加打开胶囊的逻辑
  }

  // 处理拼图完成
  const handlePuzzleComplete = () => {
    // 拼图完成后的逻辑
    setShowPuzzle(false)
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* 记忆拼图 */}
          <motion.div 
            className="premium-card p-8 !bg-white/40 backdrop-blur-sm animate-slide-up"
            whileHover={{ y: -5 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Icon name="auto_awesome" size={24} className="text-primary" />
              </div>
              <h2 className="text-2xl font-black text-slate-800">记忆拼图</h2>
            </div>
            <p className="text-slate-400 mb-6">将你们的照片变成拼图游戏，一起挑战完成，增加互动乐趣。</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  选择拼图尺寸
                </label>
                <div className="flex space-x-2">
                  {[3, 4, 5].map((size) => (
                    <button
                      key={size}
                      onClick={() => setPuzzleSize(size)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${puzzleSize === size ? 'bg-primary text-white' : 'border border-slate-200 hover:bg-slate-50'}`}
                    >
                      {size}x{size}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  选择照片
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {recentPhotos.map((photo, index) => (
                    <div 
                      key={index}
                      className={`aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${selectedImage === photo ? 'border-primary' : 'border-transparent'}`}
                      onClick={() => setSelectedImage(photo)}
                    >
                      <img 
                        src={photo} 
                        alt={`Photo ${index + 1}`} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => selectedImage && setShowPuzzle(true)}
                disabled={!selectedImage}
                className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                开始拼图游戏
              </button>
            </div>
          </motion.div>

          {/* 时间胶囊 */}
          <motion.div 
            className="premium-card p-8 !bg-white/40 backdrop-blur-sm animate-slide-up"
            style={{ animationDelay: '0.2s' }}
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
              onOpenCapsule={handleOpenTimeCapsule}
              onDeleteCapsule={handleDeleteTimeCapsule}
            />
          </motion.div>
        </div>
      </main>

      {/* 拼图游戏弹窗 */}
      <AnimatePresence>
        {showPuzzle && selectedImage && (
          <Modal 
            isOpen={showPuzzle}
            onClose={() => setShowPuzzle(false)}
            title="记忆拼图"
          >
            <PuzzleGame 
              imageUrl={selectedImage}
              size={puzzleSize}
              onComplete={handlePuzzleComplete}
              onClose={() => setShowPuzzle(false)}
            />
          </Modal>
        )}
      </AnimatePresence>

      {/* 时间胶囊弹窗 */}
      <AnimatePresence>
        {showTimeCapsule && (
          <Modal 
            isOpen={showTimeCapsule}
            onClose={() => setShowTimeCapsule(false)}
            title="创建时间胶囊"
          >
            <TimeCapsule 
              onSave={handleSaveTimeCapsule}
              onClose={() => setShowTimeCapsule(false)}
            />
          </Modal>
        )}
      </AnimatePresence>
    </div>
  )
}
