import { useState, useEffect } from 'react'
import { Heart, Upload } from 'lucide-react'

export default function AdminSettings() {
  const [config, setConfig] = useState({
    coupleName1: '',
    coupleName2: '',
    anniversaryDate: '',
    backgroundImage: null
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/config')
      if (response.ok) {
        const data = await response.json()
        setConfig(data)
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

    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(config)
      })

      if (response.ok) {
        setMessage('保存成功！')
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage('保存失败，请重试')
      }
    } catch (error) {
      setMessage('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('image', file)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setConfig({ ...config, backgroundImage: data.url })
      }
    } catch (error) {
      console.error('上传图片失败:', error)
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              背景图片
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="background-upload"
              />
              <label
                htmlFor="background-upload"
                className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg flex items-center"
              >
                <Upload className="h-4 w-4 mr-2" />
                选择图片
              </label>
              {config.backgroundImage && (
                <img
                  src={config.backgroundImage}
                  alt="背景预览"
                  className="h-16 w-16 object-cover rounded-lg"
                />
              )}
            </div>
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