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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <div className="text-center">
        <div className="glass-card max-w-2xl mx-auto p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent mb-4">
              {config.coupleName1} ❤️ {config.coupleName2}
            </h1>
            <p className="text-xl text-gray-600">我们的爱情时光</p>
          </div>

          <div className="mb-8">
            <div className="text-2xl text-gray-700 mb-2">我们在一起已经</div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4 text-center">
              <div className="bg-pink-50 rounded-lg p-4">
                <div className="text-3xl md:text-4xl font-bold text-pink-600">{timeTogether.years}</div>
                <div className="text-sm text-gray-600">年</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-3xl md:text-4xl font-bold text-purple-600">{timeTogether.months}</div>
                <div className="text-sm text-gray-600">月</div>
              </div>
              <div className="bg-indigo-50 rounded-lg p-4">
                <div className="text-3xl md:text-4xl font-bold text-indigo-600">{timeTogether.days}</div>
                <div className="text-sm text-gray-600">日</div>
              </div>
              <div className="bg-pink-50 rounded-lg p-4">
                <div className="text-2xl md:text-3xl font-bold text-pink-600">{timeTogether.hours}</div>
                <div className="text-sm text-gray-600">时</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-2xl md:text-3xl font-bold text-purple-600">{timeTogether.minutes}</div>
                <div className="text-sm text-gray-600">分</div>
              </div>
              <div className="bg-indigo-50 rounded-lg p-4">
                <div className="text-2xl md:text-3xl font-bold text-indigo-600">{timeTogether.seconds}</div>
                <div className="text-sm text-gray-600">秒</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center text-gray-600 mb-8">
            <Calendar className="h-5 w-5 mr-2" />
            <span>纪念日: {new Date(config.anniversaryDate).toLocaleDateString('zh-CN')}</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a href="/timeline" className="btn-primary flex items-center justify-center">
              <Clock className="h-4 w-4 mr-2" />
              时间轴
            </a>
            <a href="/albums" className="btn-secondary flex items-center justify-center">
              <Camera className="h-4 w-4 mr-2" />
              相册
            </a>
            <a href="/food" className="btn-secondary flex items-center justify-center">
              <Heart className="h-4 w-4 mr-2" />
              美食
            </a>
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