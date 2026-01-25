import { useState, useEffect } from 'react'
import { useLoveTimer } from '../hooks/useLoveTimer'
import StickyNotes from '../components/StickyNotes'
import { apiService } from '../services/apiService'
import Icon from '../components/icons/Icons'

interface Config {
  coupleName1: string;
  coupleName2: string;
  anniversaryDate: string;
  homeTitle: string;
  homeSubtitle: string;
}

export default function Home() {
  const [config, setConfig] = useState<Config>({
    coupleName1: '包包',
    coupleName2: '恺恺',
    anniversaryDate: '2023-10-08',
    homeTitle: '包包和恺恺的小窝',
    homeSubtitle: '遇见你，是银河赠予我的糖。'
  })

  const timeTogether = useLoveTimer(config.anniversaryDate)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const result = await apiService.get<Config>('/config')
      const data = result.data
      if (data) {
        setConfig({
          coupleName1: data.coupleName1 || '包包',
          coupleName2: data.coupleName2 || '恺恺',
          anniversaryDate: data.anniversaryDate || '2023-10-08',
          homeTitle: data.homeTitle || '包包和恺恺的小窝',
          homeSubtitle: data.homeSubtitle || '遇见你，是银河赠予我的糖。'
        })
      }
    } catch (error) {
      console.error('获取配置失败:', error)
    }
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-12 pt-32">
      <header className="text-center mb-16 relative">
        <div className="flex justify-center items-center space-x-12 mb-8 relative">
          <div className="avatar-ring">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white soft-shadow bg-stone-100 flex items-center justify-center">
              <img alt="Bao Avatar" className="w-full h-full object-cover opacity-90" src="https://api.dicebear.com/7.x/adventurer/svg?seed=Bao&backgroundColor=C9ADA7&backgroundType=solid" />
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="w-24 md:w-32 h-[2px] bg-gradient-to-r from-stone-200 via-primary to-slate-200"></div>
            <div className="absolute bg-white/90 p-2 rounded-full border border-stone-100 shadow-sm flex items-center justify-center">
              <Icon name="favorite" className="text-primary/60" size={20} />
            </div>
          </div>

          <div className="avatar-ring">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white soft-shadow bg-slate-100 flex items-center justify-center">
              <img alt="Kai Avatar" className="w-full h-full object-cover opacity-90" src="https://api.dicebear.com/7.x/adventurer/svg?seed=Kai&backgroundColor=9A9EAB&backgroundType=solid" />
            </div>
          </div>
        </div>

        <h1 className="font-display text-5xl md:text-6xl mb-4 text-gray-800">{config.homeTitle}</h1>
        <p className="text-gray-500 text-lg max-w-lg mx-auto leading-relaxed italic">
          "{config.homeSubtitle}"
        </p>
      </header>

      <section className="bg-white/40 rounded-xlarge p-8 md:p-12 mb-16 border border-white/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Icon name="favorite" size={120} />
        </div>
        <div className="text-center mb-10">
          <p className="text-gray-400 tracking-widest text-sm uppercase font-bold">我们已携手走过</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 md:gap-6 mb-10">
          {[
            { value: timeTogether.years, label: '年', color: 'morandi-pink', shadow: 'diffused-shadow-pink', textColor: 'text-primary' },
            { value: timeTogether.months, label: '月', color: 'morandi-yellow', shadow: 'diffused-shadow-yellow', textColor: 'text-amber-600/60' },
            { value: timeTogether.days, label: '天', color: 'morandi-blue', shadow: 'diffused-shadow-blue', textColor: 'text-secondary' },
            { value: timeTogether.hours, label: '时', color: 'morandi-green', shadow: 'diffused-shadow-green', textColor: 'text-morandi-green' },
            { value: timeTogether.minutes, label: '分', color: 'morandi-purple', shadow: 'diffused-shadow-purple', textColor: 'text-morandi-purple' },
            { value: timeTogether.seconds, label: '秒', color: 'morandi-rose', shadow: 'diffused-shadow-pink', textColor: 'text-morandi-rose' },
          ].map((item, idx) => (
            <div key={idx} className={`bg-white/70 p-6 rounded-3xl text-center shadow-lg border border-white/40 transition-all hover:scale-105 group`}>
              <div className={`${item.textColor} text-4xl md:text-5xl font-bold mb-1 opacity-80 group-hover:opacity-100 transition-opacity`}>
                {String(item.value).padStart(2, '0')}
              </div>
              <div className={`${item.textColor} opacity-60 text-xs font-bold uppercase tracking-wider`}>{item.label}</div>
              <div className={`mt-2 h-1 w-12 mx-auto rounded-full bg-${item.color} opacity-40`}></div>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-8">
          <div className="bg-white/60 px-6 py-3 rounded-full border border-white/40 flex items-center space-x-3">
            <Icon name="calendar_month" className="text-primary" size={18} />
            <span className="text-sm font-semibold text-gray-500">纪念日：2023年10月8日</span>
          </div>
          <p className="text-gray-400 text-sm">
            已经一起度过了 <span className="text-primary font-bold">{timeTogether.totalDays}</span> 个温柔的日子
          </p>
        </div>
      </section>

      <section>
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 px-4">
          <div className="mb-6 md:mb-0">
            <div className="flex items-center space-x-3 mb-2">
              <span className="bg-primary/10 text-primary p-2 rounded-xl flex items-center justify-center">
                <Icon name="auto_fix_high" size={24} />
              </span>
              <h2 className="font-display text-4xl text-gray-800">碎碎念</h2>
            </div>
            <p className="text-gray-500">记录生活中的小确幸，让美好时光在此停留</p>
          </div>
        </div>

        <StickyNotes />
      </section>
    </main>
  )
}