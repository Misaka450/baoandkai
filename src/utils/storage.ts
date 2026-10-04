/**
 * 安全的 Web Storage 封装
 * 解决 iOS Safari 无痕浏览模式、存储配额溢出或安全策略下 localStorage 抛异常导致白屏的问题
 * 当 localStorage 不可用时，自动无缝降级到内存 Map，保障应用 100% 稳定运行
 */
class MemoryStorage {
  private store = new Map<string, string>()

  getItem(key: string): string | null {
    return this.store.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value)
  }

  removeItem(key: string): void {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }
}

const memoryFallback = new MemoryStorage()

function isLocalStorageAvailable(): boolean {
  if (typeof window === "undefined" || !window.localStorage) {
    return false
  }
  try {
    const testKey = "__storage_test__"
    window.localStorage.setItem(testKey, testKey)
    window.localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

const hasLocalStorage = isLocalStorageAvailable()

export const safeStorage = {
  getItem(key: string): string | null {
    if (hasLocalStorage) {
      try {
        return window.localStorage.getItem(key)
      } catch {
        return memoryFallback.getItem(key)
      }
    }
    return memoryFallback.getItem(key)
  },

  setItem(key: string, value: string): boolean {
    if (hasLocalStorage) {
      try {
        window.localStorage.setItem(key, value)
        return true
      } catch {
        memoryFallback.setItem(key, value)
        return false
      }
    }
    memoryFallback.setItem(key, value)
    return false
  },

  removeItem(key: string): boolean {
    if (hasLocalStorage) {
      try {
        window.localStorage.removeItem(key)
        return true
      } catch {
        memoryFallback.removeItem(key)
        return false
      }
    }
    memoryFallback.removeItem(key)
    return false
  },

  getJSON<T>(key: string, fallback: T): T {
    const val = safeStorage.getItem(key)
    if (!val) return fallback
    try {
      return JSON.parse(val) as T
    } catch {
      return fallback
    }
  },

  setJSON<T>(key: string, value: T): boolean {
    try {
      return safeStorage.setItem(key, JSON.stringify(value))
    } catch {
      return false
    }
  }
}
