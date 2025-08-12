import { useState, useEffect } from 'react'
import { Heart, Calendar, Camera, Clock } from 'lucide-react'
import { useLoveTimer } from '../hooks/useLoveTimer'
import StickyNotes from '../components/StickyNotes'

export default function Home() {
  const [config, setConfig] = useState({
    coupleName1: '包包',
    coupleName2: '恺恺',
    anniversaryDate: '2023-10-08'
  })

  const timeTogether = useLoveTimer(config.anniversaryDate)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/config')
      if (response.ok) {
        const data = await response.json()
        setConfig({
          coupleName1: data.coupleName1 || '包包',
          coupleName2: data.coupleName2 || '恺恺',
          anniversaryDate: data.anniversaryDate || '2024-01-01'
        })
      } else {
        const defaultConfig = {
          coupleName1: '包包',
          coupleName2: '恺恺',
          anniversaryDate: '2023-10-08'
        }
        setConfig(defaultConfig)
      }
    } catch (error) {
      console.error('获取配置失败:', error)
      const defaultConfig = {
        coupleName1: '包包',
        coupleName2: '恺恺',
        anniversaryDate: '2023-10-08'
      }
      setConfig(defaultConfig)
    }
  }

  const TimeCard = ({ value, label, color = 'rose' }) => {
    const colorClasses = {
      rose: 'from-rose-50/80 to-rose-100/80 text-rose-700 border-rose-200/30',
      amber: 'from-amber-50/80 to-amber-100/80 text-amber-700 border-amber-200/30',
      slate: 'from-slate-50/80 to-slate-100/80 text-slate-700 border-slate-200/30',
      emerald: 'from-emerald-50/80 to-emerald-100/80 text-emerald-700 border-emerald-200/30',
      violet: 'from-violet-50/80 to-violet-100/80 text-violet-700 border-violet-200/30',
      stone: 'from-stone-50/80 to-stone-100/80 text-stone-700 border-stone-200/30'
    }

    return (
      <div className="relative">
        <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-3xl p-6 border backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all duration-500 hover:shadow-[0_12px_48px_rgba(0,0,0,0.15)] hover:-translate-y-2 hover:scale-[1.02]`}>
          <div className="text-3xl md:text-4xl font-light mb-2 font-mono tracking-wider">
            {String(value).padStart(2, '0')}
          </div>
          <div className="text-sm font-light opacity-80">
            {label}
          </div>
        </div>
      </div>
    )
  }

  const colors = ['rose', 'amber', 'slate', 'emerald', 'violet', 'stone']

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-100 to-stone-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-light text-stone-800 mb-6">
            {config.coupleName1} <span className="text-rose-400 mx-4">♥</span> {config.coupleName2}
          </h1>
          <p className="text-xl text-stone-600 font-light tracking-wide">我们的温柔时光</p>
        </div>

        <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all duration-500 hover:shadow-[0_12px_48px_rgba(0,0,0,0.12)] mb-12">
          <div className="text-center mb-8">
            <div className="text-xl text-stone-600 mb-8 font-light">我们相爱已经</div>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 md:gap-6">
              <TimeCard value={timeTogether.years} label="年" color={colors[0]} />
              <TimeCard value={timeTogether.months} label="月" color={colors[1]} />
              <TimeCard value={timeTogether.days} label="日" color={colors[2]} />
              <TimeCard value={String(timeTogether.hours).padStart(2, '0')} label="时" color={colors[3]} />
              <TimeCard value={String(timeTogether.minutes).padStart(2, '0')} label="分" color={colors[4]} />
              <TimeCard value={String(timeTogether.seconds).padStart(2, '0')} label="秒" color={colors[5]} />
            </div>
          </div>

          <div className="bg-stone-50/50 backdrop-blur-sm rounded-2xl p-6 border border-stone-200/30 transition-all duration-500 hover:bg-stone-100/60">
            <div className="flex items-center justify-center text-stone-700 mb-2">
              <Calendar className="h-5 w-5 mr-3 text-stone-400" />
              <span className="text-base font-light">我们的纪念日：{new Date(config.anniversaryDate).toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
            </div>
            <div className="text-sm text-stone-500 font-light text-center">
              已经一起走过了 {timeTogether.totalDays} 个温柔的日子
            </div>
          </div>

          <div className="flex justify-center space-x-8 text-stone-500 mt-8">
            <div className="flex items-center">
              <Heart className="h-4 w-4 mr-2 text-rose-400" />
              <span className="text-sm font-light">每一天都在相爱</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-stone-400" />
              <span className="text-sm font-light">每一刻都值得纪念</span>
            </div>
          </div>
        </div>
        
        {/* 碎碎念区域 */}
        <div>
          <StickyNotes />
        </div>
      </div>
    </div>
  )
}