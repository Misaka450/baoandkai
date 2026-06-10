import { useState, useEffect, useMemo } from 'react'

interface TimeTogether {
    years: number
    months: number
    days: number
    hours: number
    minutes: number
    seconds: number
    totalDays: number
}

/**
 * 相爱时长计数器 Hook
 * 
 * 每秒更新一次，使用单个时间戳状态驱动所有计算，
 * 避免多 state 更新导致的重复渲染。
 */
export function useLoveTimer(anniversaryDate: string | null): TimeTogether {
    const [now, setNow] = useState(Date.now())

    useEffect(() => {
        if (!anniversaryDate) return

        const timer = setInterval(() => {
            setNow(Date.now())
        }, 1000)

        return () => clearInterval(timer)
    }, [anniversaryDate])

    return useMemo(() => {
        const defaultTime: TimeTogether = {
            years: 0, months: 0, days: 0,
            hours: 0, minutes: 0, seconds: 0, totalDays: 0
        }

        if (!anniversaryDate) return defaultTime

        const anniversary = new Date(anniversaryDate)
        const diffMs = now - anniversary.getTime()

        if (diffMs < 0) return defaultTime

        // 计算总天数
        const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

        // 从日期对象计算年、月、日（自动处理闰月/大小月）
        const nowDate = new Date(now)
        let years = nowDate.getFullYear() - anniversary.getFullYear()
        let months = nowDate.getMonth() - anniversary.getMonth()
        let days = nowDate.getDate() - anniversary.getDate()

        // 日借位：如果日差为负，从月份借天数
        if (days < 0) {
            months--
            const lastMonth = new Date(nowDate.getFullYear(), nowDate.getMonth(), 0)
            days += lastMonth.getDate()
        }

        // 月借位：如果月差为负，从年份借 12 个月
        if (months < 0) {
            years--
            months += 12
        }

        // 从毫秒差中提取时、分、秒（精确无借位问题）
        const dayRemainder = diffMs % (1000 * 60 * 60 * 24)
        const hours = Math.floor(dayRemainder / (1000 * 60 * 60))
        const hourRemainder = dayRemainder % (1000 * 60 * 60)
        const minutes = Math.floor(hourRemainder / (1000 * 60))
        const seconds = Math.floor((hourRemainder % (1000 * 60)) / 1000)

        return { years, months, days, hours, minutes, seconds, totalDays }
    }, [anniversaryDate, now])
}