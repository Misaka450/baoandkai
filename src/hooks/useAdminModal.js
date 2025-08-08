import { useState } from 'react'

export const useAdminModal = () => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null,
    showCancel: false,
    confirmText: '确定'
  })

  const showAlert = (title, message, type = 'info') => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        title,
        message,
        type,
        onConfirm: resolve,
        showCancel: false,
        confirmText: '确定'
      })
    })
  }

  const showConfirm = (title, message, confirmText = '确定') => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        title,
        message,
        type: 'warning',
        onConfirm: () => resolve(true),
        showCancel: true,
        confirmText
      })
    })
  }

  const closeModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }))
  }

  return {
    modalState,
    showAlert,
    showConfirm,
    closeModal
  }
}