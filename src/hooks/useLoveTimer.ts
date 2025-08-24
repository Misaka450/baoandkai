import { useState, useEffect } from 'react'

// 定义时间对象接口
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
  const [timeTogether, setTimeTogether] = useState<TimeTogether>({
    years: 0,
    months: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalDays: 0
  })

  const calculateTime = (): void => {
    if (!anniversaryDate) return

    const now = new Date()
    const anniversary = new Date(anniversaryDate)
    const diff = now.getTime() - anniversary.getTime()

    if (diff < 0) {
      setTimeTogether({
        years: 0,
        months: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalDays: 0
      })
      return
    }

    const totalSeconds = Math.floor(diff / 1000)
    const totalMinutes = Math.floor(totalSeconds / 60)
    const totalHours = Math.floor(totalMinutes / 60)
    const totalDays = Math.floor(totalHours / 24)

    // 计算年、月、日
    let years = now.getFullYear() - anniversary.getFullYear()
    let months = now.getMonth() - anniversary.getMonth()
    let days = now.getDate() - anniversary.getDate()

    if (days < 0) {
      months--
      const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
      days += lastMonth.getDate()
    }

    if (months < 0) {
      years--
      months += 12
    }

    const hours = now.getHours() - anniversary.getHours()
    const minutes = now.getMinutes() - anniversary.getMinutes()
    const seconds = now.getSeconds() - anniversary.getSeconds()

    setTimeTogether({
      years,
      months,
      days,
      hours: hours >= 0 ? hours : hours + 24,
      minutes: minutes >= 0 ? minutes : minutes + 60,
      seconds: seconds >= 0 ? seconds : seconds + 60,
      totalDays
    })
  }

  useEffect(() => {
    if (!anniversaryDate) return

    calculateTime()
    const interval = setInterval(calculateTime, 1000)

    return () => clearInterval(interval)
  }, [anniversaryDate])

  return timeTogether
}