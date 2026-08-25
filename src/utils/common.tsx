// 公共工具函数 - TypeScript版本
import React from 'react'

/**
 * 防抖函数 - 限制函数在短时间内高频触发
 * 通俗理解：像电梯关门，每次有人进来就重新计时，直到最后一个人进来后等待 wait 毫秒才关门
 */
export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
): ((...args: Parameters<T>) => void) => {
    let timeout: ReturnType<typeof setTimeout> | null = null
    return function executedFunction(...args: Parameters<T>) {
        const later = () => {
            if (timeout) {
                clearTimeout(timeout)
            }
            func(...args)
        }
        if (timeout) {
            clearTimeout(timeout)
        }
        timeout = setTimeout(later, wait)
    }
}

/**
 * 日期格式化模式选项
 * - 'full': '2026年8月25日'（完整中文年月日）
 * - 'short': '2026-08-25'（标准短日期）
 * - 'yearMonth': '2026年8月'（月份概览）
 * - 'monthDay': '8月25日'（月日展示）
 * - 'monthDayShort': '8月25日'
 * - 'datetime': '2026/08/25 14:30'（日期+具体时刻）
 * - 'en': 'Aug 25, 2026'（英文风格日期展示）
 * - 'dot': '2026.08.25'（点号分隔日期）
 */
export type DateFormatMode = 'full' | 'short' | 'yearMonth' | 'monthDay' | 'datetime' | 'en' | 'dot';

/**
 * 统一日期格式化公共函数
 * 
 * 💡 原理解释：
 * 之前每个页面都在自己写 new Date(date).toLocaleDateString(...)，
 * 统一使用公共函数后，支持多种常用模式，内置异常捕获与友好兜底，修改一处即可全站生效。
 * 
 * @param dateInput 日期字符串、时间戳或 Date 对象
 * @param mode 格式化模式，默认为 'full'
 */
export const formatDate = (
    dateInput: string | number | Date | null | undefined,
    mode: DateFormatMode = 'full'
): string => {
    if (!dateInput) return ''
    try {
        const date = dateInput instanceof Date ? dateInput : new Date(dateInput)
        if (isNaN(date.getTime())) {
            return String(dateInput)
        }

        if (mode === 'yearMonth') {
            return `${date.getFullYear()}年${date.getMonth() + 1}月`
        }

        if (mode === 'monthDay') {
            return `${date.getMonth() + 1}月${date.getDate()}日`
        }

        if (mode === 'short') {
            const y = date.getFullYear()
            const m = String(date.getMonth() + 1).padStart(2, '0')
            const d = String(date.getDate()).padStart(2, '0')
            return `${y}-${m}-${d}`
        }

        if (mode === 'dot') {
            const y = date.getFullYear()
            const m = String(date.getMonth() + 1).padStart(2, '0')
            const d = String(date.getDate()).padStart(2, '0')
            return `${y}.${m}.${d}`
        }

        if (mode === 'en') {
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            })
        }

        if (mode === 'datetime') {
            return date.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
            })
        }

        // 默认 'full'：2026年8月25日
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    } catch {
        return String(dateInput || '')
    }
}

// 别名导出，便于语义化调用
export const formatLoveDate = formatDate;

// 待办事项优先级类型定义
export type Priority = 'high' | 'medium' | 'low'

// 将数字级别转换为文字优先级
export const mapPriority = (priority: number): Priority => {
    if (priority >= 3) return 'high'
    if (priority <= 1) return 'low'
    return 'medium'
}

// 优先级标签的莫兰迪配色方案
export const priorityColors: Record<Priority, string> = {
    high: 'bg-rose-100 text-rose-700 border-rose-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    low: 'bg-emerald-100 text-emerald-700 border-emerald-200'
}
