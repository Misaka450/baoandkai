import React from 'react'

const AdminModal = ({ isOpen, onClose, title, message, type = 'info', onConfirm, showCancel = false, confirmText = '确定' }) => {
  if (!isOpen) return null

  const typeStyles = {
    info: {
      icon: 'ℹ️',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      titleColor: 'text-blue-800',
      textColor: 'text-blue-700'
    },
    warning: {
      icon: '⚠️',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      titleColor: 'text-yellow-800',
      textColor: 'text-yellow-700'
    },
    error: {
      icon: '❌',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      titleColor: 'text-red-800',
      textColor: 'text-red-700'
    },
    success: {
      icon: '✅',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      titleColor: 'text-green-800',
      textColor: 'text-green-700'
    }
  }

  const style = typeStyles[type] || typeStyles.info

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white rounded-lg shadow-xl max-w-md w-full mx-4 ${style.borderColor} border`}>
        <div className={`p-6 ${style.bgColor} rounded-t-lg`}>
          <div className="flex items-center">
            <span className="text-2xl mr-3">{style.icon}</span>
            <h3 className={`text-lg font-semibold ${style.titleColor}`}>{title}</h3>
          </div>
          <p className={`mt-2 ${style.textColor}`}>{message}</p>
        </div>
        
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
          {showCancel && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
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
            className={`px-4 py-2 rounded-lg transition-colors ${
              type === 'error' || type === 'warning'
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminModal