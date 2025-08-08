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
    // 从API获取配置
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      // 从API获取配置
      const response = await fetch('/api/config')
      if (response.ok) {
        const data = await response.json()
        setConfig({
          coupleName1: data.coupleName1 || '包包',
          coupleName2: data.coupleName2 || '恺恺',
          anniversaryDate: data.anniversaryDate || '2024-01-01'
        })
      } else {
        // 如果API失败，使用默认配置
        const defaultConfig = {
          coupleName1: '包包',
          coupleName2: '恺恺',
          anniversaryDate: '2023-10-08'
        }
        setConfig(defaultConfig)
      }
    } catch (error) {
      console.error('获取配置失败:', error)
      // 如果API失败，使用默认配置
      const defaultConfig = {
        coupleName1: '包包',
        coupleName2: '恺恺',
        anniversaryDate: '2023-10-08'
      }
      setConfig(defaultConfig)
    }
  }

  const TimeCard = ({ value, label, color = 'pink' }) => {
    const colorClasses = {
      pink: 'from-pink-400 to-pink-600 shadow-pink-200',
      purple: 'from-purple-400 to-purple-600 shadow-purple-200',
      indigo: 'from-indigo-400 to-indigo-600 shadow-indigo-200',
      blue: 'from-blue-400 to-blue-600 shadow-blue-200'
    }

    return (
      <div className="relative">
        <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-2xl p-6 shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl`}>
          <div className="text-4xl md:text-5xl font-bold text-white mb-2">
            {String(value).padStart(2, '0')}
          </div>
          <div className="text-sm text-white/90 font-medium">
            {label}
          </div>
        </div>
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-lg"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <div className="text-center">
        <div className="glass-card max-w-4xl mx-auto p-8 md:p-12">
          <div className="mb-12">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent mb-6">
              {config.coupleName1} 💕 {config.coupleName2}
            </h1>
            <p className="text-xl text-gray-600 font-light">我们的爱情故事</p>
          </div>

          <div className="mb-12">
            <div className="text-2xl text-gray-700 mb-8 font-medium">我们相爱已经</div>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 md:gap-6">
              <TimeCard value={timeTogether.years} label="年" color="pink" />
              <TimeCard value={timeTogether.months} label="月" color="purple" />
              <TimeCard value={timeTogether.days} label="日" color="indigo" />
              <TimeCard value={String(timeTogether.hours).padStart(2, '0')} label="时" color="blue" />
              <TimeCard value={String(timeTogether.minutes).padStart(2, '0')} label="分" color="pink" />
              <TimeCard value={String(timeTogether.seconds).padStart(2, '0')} label="秒" color="purple" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-center text-gray-700">
              <Calendar className="h-6 w-6 mr-3 text-pink-500" />
              <span className="text-lg font-medium">我们的纪念日：{new Date(config.anniversaryDate).toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              已经一起走过了 {timeTogether.totalDays} 个美好的日子
            </div>
          </div>

          <div className="flex justify-center space-x-8 text-gray-500">
            <div className="flex items-center">
              <Heart className="h-5 w-5 mr-2 text-pink-400" />
              <span className="text-sm">每一天都在相爱</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-purple-400" />
              <span className="text-sm">每一刻都值得纪念</span>
            </div>
          </div>
        </div>
        
        {/* 碎碎念区域 */}
        <div className="mt-12">
          <StickyNotes />
        </div>
      </div>
    </div>
  )
}