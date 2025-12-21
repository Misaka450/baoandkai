import { useState, useEffect } from 'react'
import { apiService } from '../../services/apiService'
import { Heart, Upload } from 'lucide-react'
import { LoadingSpinner } from '../../utils/common'

// 定义设置接口
interface Settings {
  site_name: string;
  site_description: string;
  theme: string;
}

const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({
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
      const { data, error } = await apiService.get<Settings>('/settings');
      if (error) {
        throw error;
      }
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('加载设置失败:', error);
      setSettings({
        site_name: '包包和恺恺的故事',
        site_description: '记录我们的点点滴滴',
        theme: 'light'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      await apiService.put('/settings', settings);
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
      <div className="min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center">
            <Heart className="w-12 h-12 text-stone-700 mx-auto mb-4" />
            <h1 className="text-4xl font-light text-stone-800 mb-4">系统设置</h1>
            <p className="text-stone-600 font-light mb-8">配置网站基础信息</p>
            <LoadingSpinner message="正在加载设置..." />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <Heart className="w-12 h-12 text-stone-700 mx-auto mb-4" />
          <h1 className="text-3xl font-semibold text-stone-800 mb-2">系统设置</h1>
          <p className="text-stone-600 font-light">配置网站基础信息</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.08)] max-w-2xl mx-auto">
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">网站名称</label>
                <input
                  type="text"
                  value={settings.site_name}
                  onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-500 bg-white/50 backdrop-blur-sm"
                  placeholder="请输入网站名称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">网站描述</label>
                <textarea
                  value={settings.site_description}
                  onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-500 bg-white/50 backdrop-blur-sm"
                  placeholder="请输入网站描述"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">主题风格</label>
                <select
                  value={settings.theme}
                  onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-500 bg-white/50 backdrop-blur-sm"
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
              className="w-full px-6 py-3 bg-gradient-to-r from-stone-700 to-stone-800 text-white rounded-xl font-medium hover:from-stone-800 hover:to-stone-900 disabled:opacity-50 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg disabled:cursor-not-allowed"
            >
              {saving ? '保存中...' : '保存设置'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AdminSettings