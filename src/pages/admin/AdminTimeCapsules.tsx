import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { timeCapsuleService } from '../../services/apiService'
import Icon from '../../components/icons/Icons'
import Modal from '../../components/Modal'
import TimeCapsule from '../../components/TimeCapsule'
import type { TimeCapsuleItem } from '../../types'

export default function AdminTimeCapsules() {
  const queryClient = useQueryClient()
  const [showAddModal, setShowAddModal] = useState(false)

  // 获取时间胶囊数据
  const { data: capsulesResponse, isLoading } = useQuery({
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

  // 创建时间胶囊
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
      setShowAddModal(false)
    }
  })

  // 删除时间胶囊
  const deleteCapsuleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await timeCapsuleService.delete(id)
      if (error) throw new Error(error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeCapsules'] })
    }
  })

  const handleSave = (message: string, unlockDate: string) => {
    createCapsuleMutation.mutate({ message, unlockDate })
  }

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除这个时间胶囊吗？')) {
      deleteCapsuleMutation.mutate(id)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">时间胶囊管理</h2>
          <p className="text-slate-500 text-sm">创建和管理时间胶囊，给未来的惊喜</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
        >
          <Icon name="add" size={20} />
          创建胶囊
        </button>
      </div>

      {/* 胶囊列表 */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : timeCapsules.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
            <Icon name="event" size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">暂无时间胶囊</p>
            <p className="text-slate-400 text-sm mt-2">点击右上角创建一个吧～</p>
          </div>
        ) : (
          timeCapsules.map((capsule, idx) => (
            <motion.div
              key={capsule.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      capsule.isUnlocked ? 'bg-green-100' : 'bg-primary/10'
                    }`}>
                      <Icon 
                        name={capsule.isUnlocked ? 'lock_open' : 'lock'} 
                        size={20} 
                        className={capsule.isUnlocked ? 'text-green-600' : 'text-primary'} 
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{capsule.isUnlocked ? '已解锁' : '未解锁'}</h3>
                      <p className="text-xs text-slate-400">创建于 {new Date(capsule.createdAt).toLocaleDateString('zh-CN')}</p>
                    </div>
                  </div>
                  <p className="text-slate-600 mb-4 leading-relaxed">{capsule.message}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Icon name="event" size={16} />
                      <span>解锁日期：{new Date(capsule.unlockDate).toLocaleDateString('zh-CN')}</span>
                    </div>
                    {!capsule.isUnlocked && (
                      <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-bold">
                        等待解锁
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(capsule.id)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                  title="删除"
                >
                  <Icon name="delete" size={20} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* 创建胶囊弹窗 */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="创建时间胶囊"
      >
        <TimeCapsule
          onSave={handleSave}
          onClose={() => setShowAddModal(false)}
        />
      </Modal>
    </div>
  )
}
