import { useState, useEffect } from 'react'

/**
 * 防抖 Hook - 延迟更新值
 * @param value 原始值
 * @param delay 延迟时间（毫秒）
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}