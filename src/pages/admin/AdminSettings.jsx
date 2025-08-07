import { useState, useEffect } from 'react'
import { Heart, Upload } from 'lucide-react'

export default function AdminSettings() {
  const [config, setConfig] = useState({
    coupleName1: '',
    coupleName2: '',
    anniversaryDate: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      // 使用本地存储代替API
      const savedConfig = localStorage.getItem('coupleConfig')
      if (savedConfig) {
        setConfig(JSON.parse(savedConfig))
      } else {
        // 默认配置
        setConfig({
          coupleName1: '小明',
          coupleName2: '小红',
          anniversaryDate: '2024-01-01'
        })
      }
    } catch (error) {
      console.error('获取配置失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    // 验证必填字段
    if (!config.coupleName1 || !config.coupleName2 || !config.anniversaryDate) {
      setMessage('请填写完整的情侣姓名和纪念日')
      setSaving(false)
      return
    }

    try {
      // 保存到本地存储
      localStorage.setItem('coupleConfig', JSON.stringify(config))
      setMessage('保存成功！')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('保存失败:', error)
      setMessage('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }



  if (loading) {
    return <div className="text-center py-8">加载中...</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">基础设置</h1>

      <form onSubmit={handleSubmit} className="glass-card p-6 max-w-2xl">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              情侣姓名
            </label>
            <div className="flex gap-4">
              <input
                type="text"
                value={config.coupleName1}
                onChange={(e) => setConfig({ ...config, coupleName1: e.target.value })}
                placeholder="小明"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                required
              />
              <Heart className="h-5 w-5 text-pink-500 self-center" />
              <input
                type="text"
                value={config.coupleName2}
                onChange={(e) => setConfig({ ...config, coupleName2: e.target.value })}
                placeholder="小红"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              纪念日
            </label>
            <input
              type="date"
              value={config.anniversaryDate}
              onChange={(e) => setConfig({ ...config, anniversaryDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
              required
            />
          </div>



          {message && (
            <div className={`text-sm ${message.includes('成功') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg font-medium hover:from-pink-600 hover:to-purple-600 disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存设置'}
          </button>
        </div>
      </form>
    </div>
  )
}