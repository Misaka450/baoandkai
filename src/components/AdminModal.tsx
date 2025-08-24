import React from 'react'

// 定义模态框组件的属性接口
interface AdminModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  type?: 'info' | 'warning' | 'error' | 'success'
  onConfirm?: () => void
  showCancel?: boolean
  confirmText?: string
}

const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  onConfirm,
  showCancel = false,
  confirmText = '确定'
}) => {
  if (!isOpen) return null

  // 极简优雅的配色方案，统一使用莫兰迪色系
  const typeStyles = {
    info: {
      icon: 'ℹ️',
      bg: 'bg-white/95',
      border: 'border-stone-200/50',
      titleColor: 'text-stone-800',
      textColor: 'text-stone-600',
      button: 'bg-gradient-to-r from-pink-500 to-purple-500',
      buttonHover: 'hover:from-pink-600 hover:to-purple-600'
    },
    warning: {
      icon: '⚠️',
      bg: 'bg-white/95',
      border: 'border-stone-200/50',
      titleColor: 'text-stone-800',
      textColor: 'text-stone-600',
      button: 'bg-gradient-to-r from-amber-500 to-orange-500',
      buttonHover: 'hover:from-amber-600 hover:to-orange-600'
    },
    error: {
      icon: '❌',
      bg: 'bg-white/95',
      border: 'border-stone-200/50',
      titleColor: 'text-stone-800',
      textColor: 'text-stone-600',
      button: 'bg-gradient-to-r from-red-500 to-rose-500',
      buttonHover: 'hover:from-red-600 hover:to-rose-600'
    },
    success: {
      icon: '✅',
      bg: 'bg-white/95',
      border: 'border-stone-200/50',
      titleColor: 'text-stone-800',
      textColor: 'text-stone-600',
      button: 'bg-gradient-to-r from-emerald-500 to-teal-500',
      buttonHover: 'hover:from-emerald-600 hover:to-teal-600'
    }
  }

  const style = typeStyles[type] || typeStyles.info

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className={`${style.bg} backdrop-blur-md border ${style.border} rounded-2xl shadow-xl max-w-md w-full mx-4 transform transition-all duration-300`}>
        <div className="p-8">
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-3">{style.icon}</span>
            <h3 className={`text-lg font-semibold ${style.titleColor}`}>{title}</h3>
          </div>
          
          <p className={`${style.textColor} leading-relaxed mb-6`}>{message}</p>
          
          <div className="flex justify-end space-x-3">
            {showCancel && (
              <button
                onClick={onClose}
                className="px-4 py-2 text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl font-medium transition-colors"
              >
                取消
              </button>
            )}
            <button
              onClick={() => {
                if (onConfirm) {
                  onConfirm()
                }
                onClose()
              }}
              className={`px-5 py-2 ${style.button} ${style.buttonHover} text-white rounded-xl font-medium transition-colors`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminModal

// 莫兰迪色系配色方案 - 与时间轴统一
const colors = [
  'bg-pink-100 border-pink-200 text-pink-800',
  'bg-blue-100 border-blue-200 text-blue-800',
  'bg-green-100 border-green-200 text-green-800',
  'bg-yellow-100 border-yellow-200 text-yellow-800',
  'bg-purple-100 border-purple-200 text-purple-800',
]