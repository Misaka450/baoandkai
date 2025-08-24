import { useState } from 'react'

// 定义模态框状态接口
interface ModalState {
  isOpen: boolean
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  onConfirm: (() => void) | null
  showCancel: boolean
  confirmText: string
}

// 定义返回的钩子接口
interface UseAdminModalReturn {
  modalState: ModalState
  showAlert: (title: string, message: string, type?: 'info' | 'warning' | 'success' | 'error') => Promise<void>
  showConfirm: (title: string, message: string, confirmText?: string) => Promise<boolean>
  closeModal: () => void
}

export const useAdminModal = (): UseAdminModalReturn => {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null,
    showCancel: false,
    confirmText: '确定'
  })

  const showAlert = (title: string, message: string, type: 'info' | 'warning' | 'success' | 'error' = 'info'): Promise<void> => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        title,
        message,
        type,
        onConfirm: () => resolve(),
        showCancel: false,
        confirmText: '确定'
      })
    })
  }

  const showConfirm = (title: string, message: string, confirmText: string = '确定'): Promise<boolean> => {
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

  const closeModal = (): void => {
    setModalState(prev => ({ ...prev, isOpen: false }))
  }

  return {
    modalState,
    showAlert,
    showConfirm,
    closeModal
  }
}