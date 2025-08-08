import React from 'react'

const AdminModal = ({ isOpen, onClose, title, message, type = 'info', onConfirm, showCancel = false, confirmText = '确定' }) => {
  if (!isOpen) return null

  // 与网站整体配色协调的莫兰迪色系
  const typeStyles = {
    info: {
      icon: '💜',
      gradient: 'from-violet-50/90 to-purple-50/90',
      border: 'border-violet-200/50',
      titleColor: 'text-violet-800',
      textColor: 'text-violet-700',
      buttonGradient: 'from-violet-400 to-purple-400',
      buttonHover: 'from-violet-500 to-purple-500'
    },
    warning: {
      icon: '🌸',
      gradient: 'from-rose-50/90 to-pink-50/90',
      border: 'border-rose-200/50',
      titleColor: 'text-rose-800',
      textColor: 'text-rose-700',
      buttonGradient: 'from-rose-400 to-pink-400',
      buttonHover: 'from-rose-500 to-pink-500'
    },
    error: {
      icon: '💗',
      gradient: 'from-red-50/90 to-rose-50/90',
      border: 'border-red-200/50',
      titleColor: 'text-red-800',
      textColor: 'text-red-700',
      buttonGradient: 'from-red-400 to-rose-400',
      buttonHover: 'from-red-500 to-rose-500'
    },
    success: {
      icon: '✨',
      gradient: 'from-emerald-50/90 to-teal-50/90',
      border: 'border-emerald-200/50',
      titleColor: 'text-emerald-800',
      textColor: 'text-emerald-700',
      buttonGradient: 'from-emerald-400 to-teal-400',
      buttonHover: 'from-emerald-500 to-teal-500'
    }
  }

  const style = typeStyles[type] || typeStyles.info

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className={`glass-card max-w-md w-full mx-4 border-0 shadow-2xl transform transition-all duration-300 scale-100 hover:scale-[1.02]`}>
        {/* 顶部渐变装饰 */}
        <div className={`h-2 bg-gradient-to-r ${style.buttonGradient} rounded-t-2xl`}></div>
        
        <div className={`p-8 bg-gradient-to-br ${style.gradient} rounded-b-2xl`}>
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${style.buttonGradient} flex items-center justify-center text-white shadow-lg`}>
                <span className="text-xl">{style.icon}</span>
              </div>
            </div>
            
            <div className="flex-1">
              <h3 className={`text-xl font-semibold ${style.titleColor} mb-2 tracking-wide`}>
                {title}
              </h3>
              <p className={`${style.textColor} leading-relaxed font-light`}>
                {message}
              </p>
            </div>
          </div>
        </div>
        
        {/* 底部按钮区域 */}
        <div className="px-8 py-6 bg-white/60 backdrop-blur-sm rounded-b-2xl flex justify-end space-x-3">
          {showCancel && (
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-stone-600 bg-white/80 backdrop-blur-sm border border-stone-200/50 rounded-2xl font-medium hover:bg-stone-50/80 hover:border-stone-300/50 transition-all duration-300 hover:shadow-md"
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
            className={`px-6 py-2.5 bg-gradient-to-r ${style.buttonGradient} text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl hover:${style.buttonHover} transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-105`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminModal