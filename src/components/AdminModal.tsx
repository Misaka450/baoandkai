import React from 'react'
import { createPortal } from 'react-dom'
import Icon, { IconName } from './icons/Icons'

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

  const typeConfig: Record<'info' | 'warning' | 'error' | 'success', {
    icon: IconName,
    headerGradient: string,
    iconColor: string,
    buttonGradient: string,
    buttonHover: string
  }> = {
    info: {
      icon: 'info',
      headerGradient: 'bg-gradient-to-r from-slate-50 to-indigo-50/30',
      iconColor: 'text-secondary',
      buttonGradient: 'bg-gradient-to-r from-secondary to-slate-400',
      buttonHover: 'hover:opacity-90'
    },
    warning: {
      icon: 'warning',
      headerGradient: 'bg-gradient-to-r from-stone-50 to-orange-50/30',
      iconColor: 'text-morandi-yellow',
      buttonGradient: 'bg-gradient-to-r from-morandi-yellow to-stone-400',
      buttonHover: 'hover:opacity-90'
    },
    error: {
      icon: 'error',
      headerGradient: 'bg-gradient-to-r from-rose-50 to-pink-50/30',
      iconColor: 'text-morandi-rose',
      buttonGradient: 'bg-gradient-to-r from-morandi-rose to-rose-400',
      buttonHover: 'hover:opacity-90'
    },
    success: {
      icon: 'check_circle',
      headerGradient: 'bg-gradient-to-r from-morandi-green/10 to-teal-50/30',
      iconColor: 'text-morandi-green',
      buttonGradient: 'bg-gradient-to-r from-morandi-green to-teal-600',
      buttonHover: 'hover:opacity-90'
    }
  }

  const config = typeConfig[type] || typeConfig.info

  // 使用 Portal 确保模态框相对于视口定位
  return createPortal(
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[999]" onClick={onClose}>
      <div
        className="bg-white/95 backdrop-blur-sm border border-white/50 rounded-3xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 overflow-hidden animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <div className={`p-6 ${config.headerGradient} border-b border-slate-100/50 flex items-center gap-4`}>
          <div className={`w-10 h-10 rounded-full bg-white/80 flex items-center justify-center shadow-sm ${config.iconColor}`}>
            <Icon name={config.icon} size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">{title}</h3>
        </div>

        <div className="p-8">
          <p className="text-slate-600 leading-relaxed mb-8 text-lg">{message}</p>

          <div className="flex justify-end space-x-3">
            {showCancel && (
              <button
                onClick={onClose}
                className="px-6 py-2.5 text-slate-500 bg-slate-100 hover:bg-slate-200 hover:text-slate-700 rounded-full font-medium transition-colors"
              >
                取消
              </button>
            )}
            <button
              onClick={() => {
                if (onConfirm) onConfirm()
                onClose()
              }}
              className={`px-8 py-2.5 ${config.buttonGradient} ${config.buttonHover} text-white rounded-full font-bold shadow-lg shadow-primary/20 transition-all transform hover:scale-105`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
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