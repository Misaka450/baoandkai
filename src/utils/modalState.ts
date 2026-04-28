// 全局模态框状态管理 - 用自定义事件替代 MutationObserver
// 当模态框打开/关闭时，派发事件通知 Navigation 隐藏/显示

type ModalStateCallback = (isOpen: boolean) => void

const listeners = new Set<ModalStateCallback>()
let modalCount = 0

// 通知所有监听者模态框状态变化
function notify() {
  listeners.forEach(cb => cb(modalCount > 0))
}

// 模态框打开时调用
export function openModal() {
  modalCount++
  notify()
}

// 模态框关闭时调用
export function closeModal() {
  modalCount = Math.max(0, modalCount - 1)
  notify()
}

// Navigation 组件订阅模态框状态
export function subscribeModalState(callback: ModalStateCallback) {
  listeners.add(callback)
  // 立即同步当前状态
  callback(modalCount > 0)
  return () => {
    listeners.delete(callback)
  }
}
