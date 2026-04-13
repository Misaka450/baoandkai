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

    const calculateBaseTime = () => {
      const now = new Date()
      const anniversary = new Date(anniversaryDate)
      const diff = now.getTime() - anniversary.getTime()

      if (diff < 0) {
        baseTimeRef.current = {
          years: 0,
          months: 0,
          days: 0,
          hours: 0,
          minutes: 0,
          totalDays: 0
        }
        setSeconds(0)
        return
      }

      const totalSeconds = Math.floor(diff / 1000)
      const totalMinutes = Math.floor(totalSeconds / 60)
      const totalHours = Math.floor(totalMinutes / 60)
      const totalDays = Math.floor(totalHours / 24)

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

      baseTimeRef.current = {
        years,
        months,
        days,
        hours: hours >= 0 ? hours : hours + 24,
        minutes: minutes >= 0 ? minutes : minutes + 60,
        totalDays
      }

      setSeconds(now.getSeconds() - anniversary.getSeconds())
    }

    const tick = () => {
      const now = new Date()
      const anniversary = new Date(anniversaryDate)
      const currentSeconds = now.getSeconds() - anniversary.getSeconds()
      setSeconds(currentSeconds >= 0 ? currentSeconds : currentSeconds + 60)
    }

    calculateBaseTime()
    const interval = setInterval(tick, 1000)

    return () => clearInterval(interval)
  }, [anniversaryDate])

  const timeTogether = useMemo<TimeTogether>(() => ({
    ...baseTimeRef.current,
    seconds
  }), [seconds])

  return timeTogether
}
