import { useState, useEffect, useRef, useMemo } from 'react'

interface TimeTogether {
    years: number
    months: number
    days: number
    hours: number
    minutes: number
    seconds: number
    totalDays: number
}

export function useLoveTimer(anniversaryDate: string | null): TimeTogether {
    const baseTimeRef = useRef<Omit<TimeTogether, 'seconds'>>({
        years: 0,
        months: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        totalDays: 0
    })

    const [seconds, setSeconds] = useState(0)

    useEffect(() => {
        if (!anniversaryDate) return

        // 使用总毫秒差精确计算各时间单位，避免逐级减法导致的借位遗漏
        const calculateTime = () => {
            const now = new Date()
            const anniversary = new Date(anniversaryDate)
            const diffMs = now.getTime() - anniversary.getTime()

            if (diffMs < 0) {
                baseTimeRef.current = {
                    years: 0, months: 0, days: 0,
                    hours: 0, minutes: 0, totalDays: 0
                }
                setSeconds(0)
                return
            }

            // 计算总天数
            const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

            // 计算年、月、日（考虑月份天数差异）
            let years = now.getFullYear() - anniversary.getFullYear()
            let months = now.getMonth() - anniversary.getMonth()
            let days = now.getDate() - anniversary.getDate()

            // 日借位：如果日差为负，从月份借一天数
            if (days < 0) {
                months--
                // 获取上个月的总天数
                const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
                days += lastMonth.getDate()
            }

            // 月借位：如果月差为负，从年份借12个月
            if (months < 0) {
                years--
                months += 12
            }

            // 计算剩余的时、分、秒（基于毫秒差，精确无借位问题）
            const remainingMs = diffMs % (1000 * 60 * 60 * 24)
            const hours = Math.floor(remainingMs / (1000 * 60 * 60))
            const remainingMins = remainingMs % (1000 * 60 * 60)
            const minutes = Math.floor(remainingMins / (1000 * 60))
            const secs = Math.floor((remainingMins % (1000 * 60)) / 1000)

            baseTimeRef.current = {
                years,
                months,
                days,
                hours,
                minutes,
                totalDays
            }

            setSeconds(secs)
        }

        calculateTime()
        const interval = setInterval(calculateTime, 1000)

        return () => clearInterval(interval)
    }, [anniversaryDate])

    const timeTogether = useMemo<TimeTogether>(() => ({
        ...baseTimeRef.current,
        seconds
    }), [seconds])

    return timeTogether
}
