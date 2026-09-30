import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLoveTimer } from '../hooks/useLoveTimer'
import { useConfig } from '../hooks/useConfig'
import StickyNotes from '../components/StickyNotes'
import Icon from '../components/icons/Icons'
import { getOptimizedAvatarUrl, getAvatarSrcSet } from '../utils/imageUtils'
import { generateLocalAvatar } from '../utils/localAvatar'
import FloatingParticles from '../components/FloatingParticles'
import { formatDate } from '../utils/common'
import { useToast } from '../components/common/Toast'
import OnThisDayCard from '../components/home/OnThisDayCard'

export default function Home() {
  const { config } = useConfig()
  const timeTogether = useLoveTimer(config.anniversaryDate)
  const toast = useToast()
  const [isHeartPopping, setIsHeartPopping] = useState(false)
  const [isPrecisionOpen, setIsPrecisionOpen] = useState(false)

  const handleHeartClick = () => {
    setIsHeartPopping(true)
    setTimeout(() => setIsHeartPopping(false), 500)
    const sweetMessages = [
      '包包和恺恺要一直在一起哦 ❤️',
      '今天也是超级喜欢包包的一天 ✨',
      '心跳怦怦，想你啦 💕',
      '宇宙第一可爱包包已收到想念 🌸',
      '执子之手，与子偕老 💫'
    ]
    const msg = sweetMessages[Math.floor(Math.random() * sweetMessages.length)] || sweetMessages[0]
    toast.success(msg)
  }

  const getDefaultAvatar = (seed: string, bg: string) =>
    generateLocalAvatar(seed, bg)

  const formattedDays = timeTogether.totalDays.toLocaleString('en-US')
  const startDateStr = formatDate(config.anniversaryDate, 'dot')

  return (
    <main className="max-w-6xl mx-auto px-6 pb-20 pt-32 md:pt-40 relative overflow-hidden">
      <FloatingParticles count={20} />

      <div className="absolute top-0 left-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-pink-200/20 blur-[80px] md:blur-[120px] rounded-full pointer-events-none -z-10 animate-pulse"></div>
      <div className="absolute top-20 right-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-blue-200/20 blur-[80px] md:blur-[120px] rounded-full pointer-events-none -z-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-40 left-1/3 w-[200px] md:w-[400px] h-[200px] md:h-[400px] bg-purple-200/15 blur-[60px] md:blur-[100px] rounded-full pointer-events-none -z-10 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <header className="text-center mb-16 relative animate-fade-in">
        {/* 头像区域 */}
        <div className="flex justify-center items-center space-x-12 md:space-x-20 mb-10 relative">
          <div className="relative group">
            <div className="absolute inset-0 bg-[#FF8BB1]/20 blur-2xl rounded-full scale-125 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="w-24 h-24 md:w-36 md:h-36 rounded-full p-2 bg-white shadow-2xl relative z-10 overflow-hidden transform group-hover:rotate-6 transition-all duration-500 border-4 border-[#FFEDF3]">
              <img
                alt="Bao Avatar"
                className="w-full h-full object-cover rounded-full"
                src={getOptimizedAvatarUrl(config.avatar1, 160) || getDefaultAvatar('Bao', 'C9ADA7')}
                srcSet={getAvatarSrcSet(config.avatar1)}
                sizes="(max-width: 768px) 96px, 160px"
                loading="eager"
                fetchPriority="high"
              />
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="w-20 md:w-40 h-[2px] bg-gradient-to-r from-transparent via-[#FF8BB1]/40 to-transparent"></div>
            <button
              onClick={handleHeartClick}
              aria-label="传递心意"
              className={`absolute w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center group border-2 border-[#FFEDF3] transition-all duration-300 active:scale-90 ${isHeartPopping ? 'animate-heart-pop scale-125' : 'animate-elastic'}`}
            >
              <Icon name="favorite" size={28} className="text-[#FF8BB1] group-hover:scale-125 transition-transform" />
            </button>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-[#6BBFFF]/20 blur-2xl rounded-full scale-125 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="w-24 h-24 md:w-36 md:h-36 rounded-full p-2 bg-white shadow-2xl relative z-10 overflow-hidden transform group-hover:-rotate-6 transition-all duration-500 border-4 border-[#EBF7FF]">
              <img
                alt="Kai Avatar"
                className="w-full h-full object-cover rounded-full"
                src={getOptimizedAvatarUrl(config.avatar2, 160) || getDefaultAvatar('Kai', '9A9EAB')}
                srcSet={getAvatarSrcSet(config.avatar2)}
                sizes="(max-width: 768px) 96px, 160px"
                loading="eager"
                fetchPriority="high"
              />
            </div>
          </div>
        </div>

        {/* 标题与副标题 */}
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black mb-4 tracking-tight text-gradient antialiased py-1">
          {config.homeTitle}
        </h1>
        <p className="text-slate-400 text-sm md:text-lg max-w-2xl mx-auto leading-relaxed font-medium italic opacity-80 px-4 mb-8">
          "{config.homeSubtitle}"
        </p>

        {/* 核心主视觉：纯粹大字天数与可折叠精密时间 */}
        <section aria-label="相恋天数计时" className="max-w-2xl mx-auto px-4">
          <div
            role="button"
            tabIndex={0}
            onClick={() => setIsPrecisionOpen(prev => !prev)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setIsPrecisionOpen(prev => !prev)
              }
            }}
            className="group relative cursor-pointer select-none rounded-[2.5rem] bg-white/45 hover:bg-white/65 border border-white/80 p-8 md:p-10 shadow-lg shadow-pink-100/30 backdrop-blur-md transition-all duration-300 hover:shadow-xl hover:shadow-pink-200/40 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            {/* 悬停光晕 */}
            <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-b from-[#FFEDF3]/30 via-transparent to-[#EBF7FF]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center">
              {/* 上行文案：字间距舒展、温和 */}
              <span className="text-xs md:text-sm tracking-[0.3em] font-medium text-slate-400 uppercase mb-3">
                我们相恋的第
              </span>

              {/* 大号数字天数：纯净、干净，绝对不要❤️ */}
              <div className="flex items-baseline justify-center gap-2 mb-3">
                <span className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tight text-slate-800 drop-shadow-sm font-sans tabular-nums bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent">
                  {formattedDays}
                </span>
                <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-500 tracking-wide">
                  天
                </span>
              </div>

              {/* 下方低调小字与展开指示 */}
              <div className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors">
                <span>从 {startDateStr} 至今</span>
                <span className="opacity-40">·</span>
                <span className="flex items-center gap-1 font-medium">
                  点击{isPrecisionOpen ? '收起' : '查看'}精确时间
                  <motion.span
                    animate={{ rotate: isPrecisionOpen ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                    className="inline-block text-[10px]"
                  >
                    ▾
                  </motion.span>
                </span>
              </div>
            </div>

            {/* 渐进披露精密时间彩蛋 (Expandable Precision Panel) */}
            <AnimatePresence>
              {isPrecisionOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden relative z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="pt-4 border-t border-stone-200/50 flex flex-col items-center gap-3">
                    {/* 温柔相伴年月天 */}
                    <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#FFEDF3]/70 border border-[#FF8BB1]/20 text-xs md:text-sm font-medium text-stone-700 shadow-sm">
                      <span className="text-[#FF8BB1] text-xs">🌱</span>
                      <span>已温柔相伴</span>
                      <span className="font-semibold text-stone-900">{timeTogether.years}</span>
                      <span>年</span>
                      <span className="font-semibold text-stone-900">{timeTogether.months}</span>
                      <span>个月</span>
                      <span className="font-semibold text-stone-900">{timeTogether.days}</span>
                      <span>天</span>
                    </div>

                    {/* 精密计时时分秒 */}
                    <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/70 border border-white shadow-sm text-xs md:text-sm text-stone-600 backdrop-blur-md">
                      <span className="text-[#6BBFFF] text-xs">⏱️</span>
                      <span className="text-slate-400">精密计时</span>
                      <div className="flex items-center gap-1.5 font-mono font-bold text-slate-800 tabular-nums text-sm md:text-base">
                        <span className="px-2 py-0.5 rounded-md bg-[#EBF7FF] text-[#3b82f6]">
                          {String(timeTogether.hours).padStart(2, '0')}
                        </span>
                        <span className="text-slate-400">:</span>
                        <span className="px-2 py-0.5 rounded-md bg-[#FFF9EB] text-[#d97706]">
                          {String(timeTogether.minutes).padStart(2, '0')}
                        </span>
                        <span className="text-slate-400">:</span>
                        <span className="px-2 py-0.5 rounded-md bg-[#FFF0F0] text-[#e11d48]">
                          {String(timeTogether.seconds).padStart(2, '0')}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </header>

      {/* 那年今日 · 时光机 */}
      <OnThisDayCard />

      <section className="animate-slide-up mt-16" style={{ animationDelay: '0.2s' }}>
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 px-2">
          <div className="mb-6 md:mb-0">
            <div className="flex items-center space-x-4 mb-3">
              <span className="bg-[#FFEDF3] text-[#FF8BB1] w-10 h-10 rounded-2xl flex items-center justify-center shadow-md shadow-[#FFEDF3]/50 border border-[#FF8BB1]/20">
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
