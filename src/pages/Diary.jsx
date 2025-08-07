import { useState, useEffect } from 'react'
import { Calendar, Smile, Cloud, Image } from 'lucide-react'

export default function Diary() {
  const [diaries, setDiaries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDiaries()
  }, [])

  const fetchDiaries = async () => {
    try {
      const savedDiaries = localStorage.getItem('diaryEntries')
      if (savedDiaries) {
        const data = JSON.parse(savedDiaries)
        setDiaries(data)
      } else {
        // 如果没有数据，使用默认示例数据
        const defaultDiaries = [
          {
            id: 1,
            title: '今天好开心',
            date: '2024-01-20',
            content: '今天和他一起去看了电影，然后吃了好吃的火锅，感觉特别幸福！',
            mood: '开心',
            weather: '晴天',
            images: []
          },
          {
            id: 2,
            title: '下雨天的小确幸',
            date: '2024-01-25',
            content: '虽然今天下雨了，但是他给我送了伞，还在楼下等了我半个小时，真的好感动。',
            mood: '感动',
            weather: '雨天',
            images: []
          }
        ]
        setDiaries(defaultDiaries)
        localStorage.setItem('diaryEntries', JSON.stringify(defaultDiaries))
      }
    } catch (error) {
      console.error('获取日记失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const moodColors = {
    '开心': 'text-yellow-500',
    '感动': 'text-pink-500',
    '平淡': 'text-gray-500',
    '难过': 'text-blue-500',
    '生气': 'text-red-500'
  }

  const weatherIcons = {
    '晴天': '☀️',
    '多云': '⛅',
    '雨天': '🌧️',
    '雪天': '❄️',
    '阴天': '☁️'
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">加载中...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">心情日记</h1>
        <p className="text-gray-600">记录我们每一天的心情和故事</p>
      </div>

      <div className="space-y-6">
        {diaries.map((diary) => (
          <div key={diary.id} className="glass-card p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{diary.title}</h3>
                <div className="flex items-center text-sm text-gray-600 space-x-4">
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(diary.date).toLocaleDateString('zh-CN')}
                  </span>
                  {diary.mood && (
                    <span className={`flex items-center ${moodColors[diary.mood] || 'text-gray-500'}`}>
                      <Smile className="h-4 w-4 mr-1" />
                      {diary.mood}
                    </span>
                  )}
                  {diary.weather && (
                    <span className="flex items-center">
                      <Cloud className="h-4 w-4 mr-1" />
                      {weatherIcons[diary.weather] || diary.weather}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="prose prose-sm max-w-none mb-4">
              <p className="text-gray-700 whitespace-pre-wrap">{diary.content}</p>
            </div>

            {diary.images && diary.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {diary.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`日记配图 ${index + 1}`}
                    className="rounded-lg object-cover h-32 w-full"
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {diaries.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">还没有写日记</p>
        </div>
      )}
    </div>
  )
}