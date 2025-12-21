import { useState, useEffect } from 'react'
import { apiService } from '../../services/apiService'
import { Heart, Calendar, User, Save, Loader2, CheckCircle } from 'lucide-react'
import { LoadingSpinner } from '../../utils/common'

// 定义配置接口
interface SiteConfig {
  coupleName1: string;
  coupleName2: string;
  anniversaryDate: string;
}

const AdminSettings: React.FC = () => {
  const [config, setConfig] = useState<SiteConfig>({
    coupleName1: '包包',
    coupleName2: '恺恺',
    anniversaryDate: '2023-10-08'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data, error } = await apiService.get<SiteConfig>('/config');
      if (error) {
        throw new Error(error);
      }
      if (data) {
        setConfig({
          coupleName1: data.coupleName1 || '包包',
          coupleName2: data.coupleName2 || '恺恺',
          anniversaryDate: data.anniversaryDate || '2023-10-08'
        });
      }
    } catch (error) {
      console.error('加载配置失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const { error } = await apiService.put('/config', config);
      if (error) {
        throw new Error(error);
      }
      setMessage('配置保存成功！首页将显示新的设置');
      setMessageType('success');
    } catch (error) {
      console.error('保存配置失败:', error);
      setMessage('保存失败，请稍后重试');
      setMessageType('error');
    } finally {
      setSaving(false);
      // 3秒后清除消息
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="正在加载配置..." />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* 页面标题 */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-rose-100 to-pink-100 rounded-2xl mb-4 shadow-lg">
          <Heart className="w-8 h-8 text-rose-500" />
        </div>
        <h1 className="text-2xl font-semibold text-stone-800 mb-2">首页配置</h1>
        <p className="text-stone-600 text-sm">设置首页显示的情侣名称和纪念日</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-stone-100">
        <div className="space-y-6">
          {/* 情侣名称区域 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-stone-700">
                <User className="w-4 h-4 mr-2 text-rose-500" />
                第一个人的名字
              </label>
              <input
                type="text"
                value={config.coupleName1}
                onChange={(e) => setConfig({ ...config, coupleName1: e.target.value })}
                className="w-full px-4 py-3 bg-stone-50/80 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400/50 focus:border-rose-300 transition-all duration-200 placeholder:text-stone-400"
                placeholder="例如：包包"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-stone-700">
                <User className="w-4 h-4 mr-2 text-blue-500" />
                第二个人的名字
              </label>
              <input
                type="text"
                value={config.coupleName2}
                onChange={(e) => setConfig({ ...config, coupleName2: e.target.value })}
                className="w-full px-4 py-3 bg-stone-50/80 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 transition-all duration-200 placeholder:text-stone-400"
                placeholder="例如：恺恺"
                required
              />
            </div>
          </div>

          {/* 纪念日 */}
          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-stone-700">
              <Calendar className="w-4 h-4 mr-2 text-purple-500" />
              在一起的日期
            </label>
            <input
              type="date"
              value={config.anniversaryDate}
              onChange={(e) => setConfig({ ...config, anniversaryDate: e.target.value })}
              className="w-full px-4 py-3 bg-stone-50/80 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-300 transition-all duration-200"
              required
            />
            <p className="text-xs text-stone-500 mt-1">
              这个日期将用于计算首页的"在一起 X 天"
            </p>
          </div>

          {/* 预览卡片 */}
          <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl p-4 border border-rose-100">
            <p className="text-sm text-stone-600 mb-2">预览效果：</p>
            <p className="text-lg font-medium text-stone-800">
              💕 {config.coupleName1} & {config.coupleName2} 的故事
            </p>
            <p className="text-sm text-stone-500 mt-1">
              纪念日：{new Date(config.anniversaryDate).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* 消息提示 */}
          {message && (
            <div className={`flex items-center px-4 py-3 rounded-xl text-sm ${messageType === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
              {messageType === 'success' ? (
                <CheckCircle className="w-5 h-5 mr-2" />
              ) : (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              {message}
            </div>
          )}

          {/* 保存按钮 */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 px-6 bg-gradient-to-r from-stone-700 to-stone-800 text-white rounded-xl font-medium hover:from-stone-800 hover:to-stone-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                保存配置
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AdminSettings