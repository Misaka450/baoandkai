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
    <main className="max-w-6xl mx-auto px-6 pb-20 pt-32 md:pt-40 relative">
      {/* 背景光晕 - 升级为多彩混色 */}
      <div className="absolute top-0 left-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-pink-200/20 blur-[80px] md:blur-[120px] rounded-full pointer-events-none -z-10 animate-pulse"></div>
      <div className="absolute top-20 right-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-blue-200/20 blur-[80px] md:blur-[120px] rounded-full pointer-events-none -z-10 animate-pulse" style={{ animationDelay: '1s' }}></div>

      <header className="text-center mb-24 relative animate-fade-in">
        <div className="flex justify-center items-center space-x-12 md:space-x-20 mb-12 relative">
          <div className="relative group">
            <div className="absolute inset-0 bg-[#FF8BB1]/20 blur-2xl rounded-full scale-125 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="w-24 h-24 md:w-40 md:h-40 rounded-full p-2 bg-white shadow-2xl relative z-10 overflow-hidden transform group-hover:rotate-6 transition-all duration-500 border-4 border-[#FFEDF3]">
              <img alt="Bao Avatar" className="w-full h-full object-cover rounded-full" src={config.avatar1 || getDefaultAvatar('Bao', 'C9ADA7')} />
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="w-20 md:w-40 h-[2px] bg-gradient-to-r from-transparent via-[#FF8BB1]/40 to-transparent"></div>
            <button className="absolute w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center group animate-elastic border-2 border-[#FFEDF3]">
              <Icon name="favorite" size={28} className="text-[#FF8BB1] group-hover:scale-125 transition-transform" />
            </button>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-[#6BBFFF]/20 blur-2xl rounded-full scale-125 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="w-24 h-24 md:w-40 md:h-40 rounded-full p-2 bg-white shadow-2xl relative z-10 overflow-hidden transform group-hover:-rotate-6 transition-all duration-500 border-4 border-[#EBF7FF]">
              <img alt="Kai Avatar" className="w-full h-full object-cover rounded-full" src={config.avatar2 || getDefaultAvatar('Kai', '9A9EAB')} />
            </div>
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-7xl font-black mb-6 tracking-tight text-gradient antialiased py-2">
          {config.homeTitle}
        </h1>
        <p className="text-slate-400 text-base md:text-xl max-w-2xl mx-auto leading-relaxed font-medium italic opacity-80 px-4">
          "{config.homeSubtitle}"
        </p>
      </header>

      <section className="premium-card p-10 md:p-16 mb-24 animate-slide-up group overflow-hidden !border-none !bg-white/40 backdrop-blur-sm">
        <div className="absolute top-0 right-0 p-10 opacity-[0.05] pointer-events-none group-hover:scale-150 transition-transform duration-1000 rotate-12 text-[#FF8BB1]">
          <Icon name="favorite" size={240} />
        </div>

        <div className="text-center mb-16">
          <span className="premium-badge !bg-[#FFEDF3] !text-[#FF8BB1] mb-6">LOVE TIMER</span>
          <p className="text-slate-400 font-black tracking-[0.4em] text-[12px] uppercase opacity-60">Memory since Oct 8, 2023</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6 mb-16 relative z-10">
          {[
            { value: timeTogether.years, label: '年', color: 'bg-[#FFEDF3]', text: 'text-[#FF8BB1]', icon: 'favorite', delay: '0s' },
            { value: timeTogether.months, label: '月', color: 'bg-[#EBF7FF]', text: 'text-[#6BBFFF]', icon: 'cloud', delay: '0.2s' },
            { value: timeTogether.days, label: '天', color: 'bg-[#F0FFF4]', text: 'text-[#6BCB77]', icon: 'auto_awesome', delay: '0.4s' },
            { value: timeTogether.hours, label: '时', color: 'bg-[#F5F0FF]', text: 'text-[#A688FA]', icon: 'celebration', delay: '0.1s' },
            { value: timeTogether.minutes, label: '分', color: 'bg-[#FFF9EB]', text: 'text-[#FFB344]', icon: 'wb_cloudy', delay: '0.3s' },
            { value: timeTogether.seconds, label: '秒', color: 'bg-[#FFF0F0]', text: 'text-[#FF7D7D]', icon: 'star', delay: '0.5s' },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`px-4 py-8 md:p-10 rounded-[2.5rem] text-center shadow-lg shadow-black/[0.03] hover:scale-105 active:scale-95 transition-all duration-500 border-4 md:border-8 border-white relative group/item overflow-hidden ${item.color}`}
              style={{ animation: `float 6s ease-in-out infinite ${item.delay}` }}
            >
              <div className={`absolute -top-4 -right-4 opacity-10 group-hover/item:opacity-30 transition-opacity rotate-12 ${item.text}`}>
                <Icon name={item.icon as any} size={idx % 2 === 0 ? 64 : 48} />
              </div>

              <div className={`text-4xl md:text-5xl lg:text-6xl font-black mb-3 ${item.text} drop-shadow-sm`}>
                {String(item.value).padStart(2, '0')}
              </div>
              <div className="text-[10px] font-black text-slate-400/50 uppercase tracking-[0.2em]">{item.label}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
          <div className="bg-white/60 border border-white px-10 py-4 rounded-[2rem] flex items-center shadow-sm">
            <Icon name="calendar_month" className="text-[#FF8BB1] mr-3" size={20} />
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">STARTING LINE: 2023.10.8</span>
          </div>
          <p className="text-slate-400 font-bold text-sm tracking-[0.05em]">
            已经一起度过了 <span className="text-3xl font-black text-[#FF8BB1] mx-2 drop-shadow-sm font-mono">{timeTogether.totalDays}</span> 个温柔的日子
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