import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Icon from './icons/Icons'

interface TimeCapsuleProps {
  onSave: (message: string, unlockDate: string) => void
  onClose: () => void
}

export default function TimeCapsule({ onSave, onClose }: TimeCapsuleProps) {
  const [message, setMessage] = useState('')
  const [unlockDate, setUnlockDate] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  // 验证日期
  const validateDate = (date: string): boolean => {
    const selectedDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return selectedDate > today
  }

  // 处理保存
  const handleSave = async () => {
    if (!message.trim()) {
      setError('请输入你的秘密消息')
      return
    }

    if (!unlockDate) {
      setError('请选择解锁日期')
      return
    }

    if (!validateDate(unlockDate)) {
      setError('解锁日期必须是未来的日期')
      return
    }

    setError('')
    setIsSaving(true)

    try {
      await onSave(message, unlockDate)
      onClose()
    } catch (err) {
      setError('保存失败，请重试')
      setIsSaving(false)
    }
  }

  return (
    <div className="time-capsule">
      <div className="flex justify-between items-center mb-6 px-4">
        <h3 className="text-xl font-black text-slate-800">时间胶囊</h3>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-slate-100 transition-colors"
        >
          <Icon name="close" size={20} className="text-slate-400" />
        </button>
      </div>

      <div className="px-4 space-y-6">
        {/* 消息输入 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            你的秘密消息
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="写下你想对未来的自己或对方说的话..."
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors min-h-[150px] resize-none"
          />
        </div>

        {/* 解锁日期 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            解锁日期
          </label>
          <input
            type="date"
            value={unlockDate}
            onChange={(e) => setUnlockDate(e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
          />
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="text-red-500 text-sm font-medium">
            {error}
          </div>
        )}

        {/* 保存按钮 */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>保存中...</span>
            </div>
          ) : (
            '保存时间胶囊'
          )}
        </button>
      </div>

      {/* 装饰元素 */}
      <div className="absolute top-10 right-10 opacity-10 pointer-events-none">
        <Icon name="event" size={64} className="text-primary" />
      </div>
      <div className="absolute bottom-10 left-10 opacity-10 pointer-events-none">
        <Icon name="lock" size={48} className="text-primary" />
      </div>
    </div>
  )
}
