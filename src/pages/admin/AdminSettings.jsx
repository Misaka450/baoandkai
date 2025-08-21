import { useState, useEffect } from 'react'
import { apiRequest } from '../../utils/api.js'
import { Heart, Upload } from 'lucide-react'
import { LoadingSpinner } from '../../utils/common.js'

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    site_name: '包包和恺恺的故事',
    site_description: '记录我们的点点滴滴',
    theme: 'light'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await apiRequest('/api/settings');
      setSettings(data);
    } catch (error) {
      console.error('加载设置失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      await apiRequest('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
      setMessage('设置保存成功！');
    } catch (error) {
      console.error('保存设置失败:', error);
      setMessage('保存失败，请检查网络连接');
    } finally {
      setSaving(false);
    }
  };

  // 使用统一加载组件
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center">
            <Heart className="w-12 h-12 text-purple-800 mx-auto mb-4" />
            <h1 className="text-4xl font-light text-purple-800 mb-4">系统设置</h1>
            <p className="text-purple-600 font-light mb-8">配置网站基础信息</p>
            <LoadingSpinner message="正在加载设置..." />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <Heart className="w-12 h-12 text-purple-800 mx-auto mb-4" />
          <h1 className="text-4xl font-light text-purple-800 mb-4">系统设置</h1>
          <p className="text-purple-600 font-light">配置网站基础信息</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.08)] max-w-2xl mx-auto">
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-800 mb-2">网站名称</label>
                <input
                  type="text"
                  value={settings.site_name}
                  onChange={(e) => setSettings({...settings, site_name: e.target.value})}
                  className="w-full px-4 py-3 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white/50 backdrop-blur-sm"
                  placeholder="请输入网站名称"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-purple-800 mb-2">网站描述</label>
                <textarea
                  value={settings.site_description}
                  onChange={(e) => setSettings({...settings, site_description: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-3 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white/50 backdrop-blur-sm"
                  placeholder="请输入网站描述"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-purple-800 mb-2">主题风格</label>
                <select
                  value={settings.theme}
                  onChange={(e) => setSettings({...settings, theme: e.target.value})}
                  className="w-full px-4 py-3 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white/50 backdrop-blur-sm"
                >
                  <option value="light">浅色主题</option>
                  <option value="dark">深色主题</option>
                </select>
              </div>
            </div>

            {message && (
              <div className={`text-sm font-light ${message.includes('成功') ? 'text-green-600' : 'text-red-600'}`}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg disabled:cursor-not-allowed"
            >
              {saving ? '保存中...' : '保存设置'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}