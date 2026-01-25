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
  avatar1: string;
  avatar2: string;
}

export default function Home() {
  const [config, setConfig] = useState<Config>({
    coupleName1: '包包',
    coupleName2: '恺恺',
    anniversaryDate: '2023-10-08',
    homeTitle: '包包和恺恺的小窝',
    homeSubtitle: '遇见你，是银河赠予我的糖。',
    avatar1: '',
    avatar2: ''
  })

  const getDefaultAvatar = (seed: string, bg: string) =>
    `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}&backgroundColor=${bg}&backgroundType=solid`

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
          homeSubtitle: data.homeSubtitle || '遇见你，是银河赠予我的糖。',
          avatar1: data.avatar1 || '',
          avatar2: data.avatar2 || ''
        })
      }
    } catch (error) {
      console.error('获取配置失败:', error)
    }
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-12 pt-40 relative">
      {/* 背景光晕 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>

      <header className="text-center mb-24 relative animate-fade-in">
        <div className="flex justify-center items-center space-x-12 md:space-x-20 mb-12 relative">
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-125 opacity-0 group-hover:opacity-40 transition-opacity duration-700"></div>
            <div className="w-24 h-24 md:w-40 md:h-40 rounded-full p-1.5 bg-white shadow-2xl relative z-10 overflow-hidden transform group-hover:rotate-6 transition-all duration-500">
              <img alt="Bao Avatar" className="w-full h-full object-cover rounded-full" src={config.avatar1 || getDefaultAvatar('Bao', 'C9ADA7')} />
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="w-20 md:w-40 h-[1.5px] bg-gradient-to-r from-transparent via-primary/40 to-transparent"></div>
            <button className="absolute w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center group animate-elastic">
              <Icon name="favorite" size={24} className="text-primary group-hover:scale-125 transition-transform" />
            </button>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-secondary/20 blur-2xl rounded-full scale-125 opacity-0 group-hover:opacity-40 transition-opacity duration-700"></div>
            <div className="w-24 h-24 md:w-40 md:h-40 rounded-full p-1.5 bg-white shadow-2xl relative z-10 overflow-hidden transform group-hover:-rotate-6 transition-all duration-500">
              <img alt="Kai Avatar" className="w-full h-full object-cover rounded-full" src={config.avatar2 || getDefaultAvatar('Kai', '9A9EAB')} />
            </div>
          </div>
        </div>

        <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter text-gradient antialiased py-2">
          {config.homeTitle}
        </h1>
        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-medium italic opacity-80">
          "{config.homeSubtitle}"
        </p>
      </header>

      <section className="premium-card p-10 md:p-16 mb-24 animate-slide-up group overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none group-hover:scale-150 transition-transform duration-1000 rotate-12">
          <Icon name="favorite" size={240} />
        </div>

        <div className="text-center mb-12">
          <span className="premium-badge mb-4">LOVE TIMER</span>
          <p className="text-slate-400 font-black tracking-[0.3em] text-[10px] uppercase">已携手走过</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-6 mb-12 relative z-10">
          {[
            { value: timeTogether.years, label: '年' },
            { value: timeTogether.months, label: '月' },
            { value: timeTogether.days, label: '天' },
            { value: timeTogether.hours, label: '时' },
            { value: timeTogether.minutes, label: '分' },
            { value: timeTogether.seconds, label: '秒' },
          ].map((item, idx) => (
            <div key={idx} className="glass-effect p-6 rounded-[2rem] text-center shadow-sm hover:scale-105 active:scale-95 transition-all duration-300 border border-white group/time">
              <div className="text-4xl md:text-5xl font-black text-slate-800 mb-2 group-hover/time:text-primary transition-colors">
                {String(item.value).padStart(2, '0')}
              </div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-6">
          <div className="premium-glass !bg-white/40 border !border-white/60 px-8 py-3 rounded-2xl flex items-center shadow-sm">
            <Icon name="calendar_month" className="text-primary mr-3" size={18} />
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">纪念日：2023年10月8日</span>
          </div>
          <p className="text-slate-400 font-bold text-sm tracking-tight">
            已经一起度过了 <span className="text-primary font-black text-lg underline decoration-primary/20 decoration-4 underline-offset-4">{timeTogether.totalDays}</span> 个温柔的日子
          </p>
        </div>
      </section>

      <section className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 px-2">
          <div className="mb-6 md:mb-0">
            <div className="flex items-center space-x-4 mb-3">
              <span className="bg-slate-900 text-white w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200">
                <Icon name="auto_fix_high" size={20} />
              </span>
              <h2 className="text-4xl font-black text-slate-800 tracking-tight">碎碎念</h2>
            </div>
            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Little things that make us smile</p>
          </div>
        </div>

        <StickyNotes />
      </section>
    </main>
  )
}