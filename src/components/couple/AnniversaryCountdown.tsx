import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useConfig } from '../../hooks/useConfig'
import Icon, { IconName } from '../icons/Icons'
import Modal from '../modals/Modal'
import { formatDate } from '../../utils/common'
import { safeStorage } from '../../utils/storage'

export type CountdownCategory = 'anniversary' | 'birthday' | 'trip' | 'wish'

export interface CustomCountdown {
  id: string
  title: string
  targetDate: string // YYYY-MM-DD
  category: CountdownCategory
  icon: IconName
  isYearly?: boolean
}

interface MilestoneItem {
  id: string
  title: string
  targetDate: string
  daysRemaining: number
  isToday: boolean
  isPassed?: boolean
  category: CountdownCategory | 'system'
  icon: IconName
  bgClass: string
  borderClass: string
  textClass: string
  tagBgClass: string
  badgeText: string
  subtitle?: string
  isCustom?: boolean
  totalTargetDays?: number
}

const STORAGE_KEY = 'bbkk_custom_countdowns'

// Morandi pastel backgrounds specified in requirements
const MORANDI_THEMES = [
  {
    bg: '#FFEDF3',
    border: 'border-rose-200/60',
    text: 'text-rose-600',
    tagBg: 'bg-rose-100/70',
    accent: '#E07A5F'
  },
  {
    bg: '#EBF7FF',
    border: 'border-sky-200/60',
    text: 'text-sky-600',
    tagBg: 'bg-sky-100/70',
    accent: '#3B82F6'
  },
  {
    bg: '#F0FFF4',
    border: 'border-emerald-200/60',
    text: 'text-emerald-600',
    tagBg: 'bg-emerald-100/70',
    accent: '#10B981'
  },
  {
    bg: '#FFF9EB',
    border: 'border-amber-200/60',
    text: 'text-amber-600',
    tagBg: 'bg-amber-100/70',
    accent: '#F59E0B'
  },
  {
    bg: '#F5F0FF',
    border: 'border-purple-200/60',
    text: 'text-purple-600',
    tagBg: 'bg-purple-100/70',
    accent: '#8B5CF6'
  }
]

/**
 * 按下标安全获取主题
 * 严格索引检查下数组下标访问可能为 undefined，
 * 统一走此函数取值，越界时回退到第一个主题兜底
 */
function getTheme(index: number) {
  return MORANDI_THEMES[index] ?? MORANDI_THEMES[0]!
}

const CATEGORY_MAP: Record<CountdownCategory, { label: string; icon: IconName }> = {
  anniversary: { label: '纪念日', icon: 'favorite' },
  birthday: { label: '生日', icon: 'cake' },
  trip: { label: '旅行', icon: 'flight' },
  wish: { label: '愿望', icon: 'star' }
}

const AVAILABLE_ICONS: { name: IconName; label: string }[] = [
  { name: 'favorite', label: '爱心' },
  { name: 'cake', label: '蛋糕' },
  { name: 'flight', label: '旅行' },
  { name: 'star', label: '愿望' },
  { name: 'celebration', label: '庆祝' },
  { name: 'restaurant', label: '大餐' },
  { name: 'photo_camera', label: '打卡' },
  { name: 'local_cafe', label: '咖啡' }
]

function getStartOfDay(d: Date = new Date()): Date {
  const res = new Date(d)
  res.setHours(0, 0, 0, 0)
  return res
}

function parseYMD(dateStr: string): Date {
  // 解构 + 默认值兜底：格式不符时各项为 NaN，自动走下方 fallback 逻辑
  const [y = NaN, m = NaN, d = NaN] = dateStr.split('-').map(Number)
  if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
    return new Date(y, m - 1, d, 0, 0, 0, 0)
  }
  const fallback = new Date(dateStr)
  return getStartOfDay(isNaN(fallback.getTime()) ? new Date() : fallback)
}

function formatToYMD(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getDaysDiff(target: Date, base: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24
  return Math.round((target.getTime() - base.getTime()) / msPerDay)
}

// Calculate the next occurrence of a fixed month/day (1-based month)
function getNextFixedEvent(month: number, day: number, today: Date): { date: Date; daysRemaining: number } {
  const currentYear = today.getFullYear()
  let target = new Date(currentYear, month - 1, day, 0, 0, 0, 0)
  if (target.getTime() < today.getTime()) {
    target = new Date(currentYear + 1, month - 1, day, 0, 0, 0, 0)
  }
  return {
    date: target,
    daysRemaining: getDaysDiff(target, today)
  }
}

export default function AnniversaryCountdown() {
  const { config } = useConfig()
  const anniversaryDateStr = config.anniversaryDate || '2023-10-08'
  const coupleName1 = config.coupleName1 || '包包'
  const coupleName2 = config.coupleName2 || '恺恺'

  const [customList, setCustomList] = useState<CustomCountdown[]>(() => {
    const saved = safeStorage.getJSON<CustomCountdown[] | null>(STORAGE_KEY, null)
    if (saved && Array.isArray(saved)) {
      return saved
    }
    return [
      {
        id: 'default-wish-1',
        title: '一起去海边看日落',
        targetDate: '2026-11-20',
        category: 'trip',
        icon: 'flight',
        isYearly: false
      }
    ]
  })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formDate, setFormDate] = useState('')
  const [formCategory, setFormCategory] = useState<CountdownCategory>('anniversary')
  const [formIcon, setFormIcon] = useState<IconName>('favorite')
  const [formIsYearly, setFormIsYearly] = useState(false)
  const [formError, setFormError] = useState('')

  // Persist custom countdowns with safeStorage
  useEffect(() => {
    safeStorage.setJSON(STORAGE_KEY, customList)
  }, [customList])

  // Calculation of milestones & countdowns
  const { totalDaysTogether, anniversaryObj, milestoneCards, nearestHero } = useMemo(() => {
    const today = getStartOfDay(new Date())
    const annivStartDate = parseYMD(anniversaryDateStr)

    // 1. Total days together
    const totalDaysTogether = Math.max(0, getDaysDiff(today, annivStartDate))

    // 2. Next hundred-day milestone
    // e.g. if totalDays is 1234, next milestone is 1300 days
    const nextHundreds = (Math.floor(totalDaysTogether / 100) + 1) * 100
    const targetHundredDate = new Date(annivStartDate.getTime() + nextHundreds * 24 * 60 * 60 * 1000)
    const hundredDaysRemaining = getDaysDiff(targetHundredDate, today)

    // 3. Next anniversary celebration (distance in days to the next yearly anniversary date)
    const annivMonth = annivStartDate.getMonth() + 1
    const annivDay = annivStartDate.getDate()
    const nextAnniv = getNextFixedEvent(annivMonth, annivDay, today)
    const nextAnnivYears = nextAnniv.date.getFullYear() - annivStartDate.getFullYear()

    // 4. Romantic couple calendar milestones
    // Valentine's Day: Feb 14
    const valentines = getNextFixedEvent(2, 14, today)
    // 520 Love Day: May 20
    const may520 = getNextFixedEvent(5, 20, today)
    // Next New Year: Jan 1
    const newYear = getNextFixedEvent(1, 1, today)

    // System milestones list
    const systemItems: MilestoneItem[] = [
      {
        id: 'system-hundred',
        title: `相爱 ${nextHundreds} 天纪念`,
        targetDate: formatToYMD(targetHundredDate),
        daysRemaining: hundredDaysRemaining,
        isToday: hundredDaysRemaining === 0,
        category: 'system',
        icon: 'auto_awesome',
        bgClass: getTheme(0).bg,
        borderClass: getTheme(0).border,
        textClass: getTheme(0).text,
        tagBgClass: getTheme(0).tagBg,
        badgeText: '百天里程碑',
        subtitle: `距离相伴 ${nextHundreds} 天的大日子`,
        totalTargetDays: nextHundreds
      },
      {
        id: 'system-anniversary',
        title: `相爱 ${nextAnnivYears} 周年纪念日`,
        targetDate: formatToYMD(nextAnniv.date),
        daysRemaining: nextAnniv.daysRemaining,
        isToday: nextAnniv.daysRemaining === 0,
        category: 'system',
        icon: 'favorite',
        bgClass: getTheme(4).bg,
        borderClass: getTheme(4).border,
        textClass: getTheme(4).text,
        tagBgClass: getTheme(4).tagBg,
        badgeText: '相恋纪念日',
        subtitle: `${annivMonth}月${annivDay}日 我们在一起的日子`
      },
      {
        id: 'system-520',
        title: '520 告白日',
        targetDate: formatToYMD(may520.date),
        daysRemaining: may520.daysRemaining,
        isToday: may520.daysRemaining === 0,
        category: 'system',
        icon: 'favorite',
        bgClass: getTheme(0).bg,
        borderClass: getTheme(0).border,
        textClass: getTheme(0).text,
        tagBgClass: getTheme(0).tagBg,
        badgeText: '情侣节日',
        subtitle: '勇敢表达爱意的浪漫时刻'
      },
      {
        id: 'system-valentines',
        title: '情人节 (Valentine\'s Day)',
        targetDate: formatToYMD(valentines.date),
        daysRemaining: valentines.daysRemaining,
        isToday: valentines.daysRemaining === 0,
        category: 'system',
        icon: 'celebration',
        bgClass: getTheme(1).bg,
        borderClass: getTheme(1).border,
        textClass: getTheme(1).text,
        tagBgClass: getTheme(1).tagBg,
        badgeText: '浪漫情人节',
        subtitle: '2月14日 鲜花与巧克力的约定'
      },
      {
        id: 'system-newyear',
        title: `${newYear.date.getFullYear()} 元旦跨年`,
        targetDate: formatToYMD(newYear.date),
        daysRemaining: newYear.daysRemaining,
        isToday: newYear.daysRemaining === 0,
        category: 'system',
        icon: 'star',
        bgClass: getTheme(3).bg,
        borderClass: getTheme(3).border,
        textClass: getTheme(3).text,
        tagBgClass: getTheme(3).tagBg,
        badgeText: '新年跨年',
        subtitle: '与最爱的人迎接新的一年'
      }
    ]

    // Custom countdowns
    const customItems: MilestoneItem[] = customList.map((item, idx) => {
      let tDate = parseYMD(item.targetDate)
      if (item.isYearly) {
        const mon = tDate.getMonth() + 1
        const d = tDate.getDate()
        const next = getNextFixedEvent(mon, d, today)
        tDate = next.date
      }
      const rem = getDaysDiff(tDate, today)
      const theme = getTheme((idx + 2) % MORANDI_THEMES.length)
      return {
        id: item.id,
        title: item.title,
        targetDate: formatToYMD(tDate),
        daysRemaining: rem,
        isToday: rem === 0,
        isPassed: rem < 0,
        category: item.category,
        icon: item.icon || CATEGORY_MAP[item.category]?.icon || 'favorite',
        bgClass: theme.bg,
        borderClass: theme.border,
        textClass: theme.text,
        tagBgClass: theme.tagBg,
        badgeText: item.isYearly ? `每年·${CATEGORY_MAP[item.category]?.label || '专属'}` : (CATEGORY_MAP[item.category]?.label || '自定义'),
        subtitle: item.isYearly ? '年度循环倒数' : '我们的甜蜜约定',
        isCustom: true
      }
    })

    const allCards = [...systemItems, ...customItems]

    // Find the nearest upcoming countdown (daysRemaining >= 0)
    const upcoming = allCards.filter(c => c.daysRemaining >= 0).sort((a, b) => a.daysRemaining - b.daysRemaining)
    const nearestHero = upcoming[0] || allCards[0]

    return {
      totalDaysTogether,
      anniversaryObj: annivStartDate,
      milestoneCards: allCards,
      nearestHero
    }
  }, [anniversaryDateStr, customList])

  const handleOpenModal = () => {
    setFormTitle('')
    setFormDate('')
    setFormCategory('anniversary')
    setFormIcon('favorite')
    setFormIsYearly(false)
    setFormError('')
    setIsModalOpen(true)
  }

  const handleSaveCountdown = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim()) {
      setFormError('请输入倒数日标题')
      return
    }
    if (!formDate) {
      setFormError('请选择目标日期')
      return
    }

    const newCountdown: CustomCountdown = {
      id: 'custom-' + Date.now(),
      title: formTitle.trim(),
      targetDate: formDate,
      category: formCategory,
      icon: formIcon,
      isYearly: formIsYearly
    }

    setCustomList(prev => [newCountdown, ...prev])
    setIsModalOpen(false)
  }

  const handleDeleteCustom = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setCustomList(prev => prev.filter(item => item.id !== id))
  }

  return (
    <section className="w-full mb-16 animate-fade-in">
      {/* Header with Title and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-rose-500/80">
              Our Love Milestones
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <span>纪念日与倒数日</span>
            <span className="text-rose-400 text-2xl md:text-3xl">ෆ</span>
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            记录 {coupleName1} 和 {coupleName2} 相守的每一天与即将到来的每个惊喜
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleOpenModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/80 hover:bg-white text-rose-600 font-bold text-sm shadow-md shadow-rose-100/60 border border-rose-200/50 backdrop-blur-md transition-all self-start sm:self-auto cursor-pointer"
        >
          <Icon name="add" size={18} className="text-rose-500" />
          <span>添加倒数日</span>
        </motion.button>
      </div>

      {/* Top Banner: Total Days Together & Hero Nearest Countdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Total Days Together Card */}
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="lg:col-span-5 relative overflow-hidden rounded-[2.5rem] p-8 bg-gradient-to-br from-rose-100/70 via-pink-50/60 to-amber-50/50 border border-white/80 shadow-xl shadow-rose-950/5 flex flex-col justify-between"
        >
          {/* Decorative ambient bubbles */}
          <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-rose-300/20 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-pink-200/30 blur-2xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-white/80 text-rose-600 shadow-sm border border-rose-100">
                <Icon name="favorite" size={14} className="text-rose-500" />
                恋爱相伴日常
              </span>
              <span className="text-xs font-semibold text-slate-400">
                始于 {formatDate(anniversaryObj, 'short')}
              </span>
            </div>

            <p className="text-slate-600 text-sm font-medium">
              {coupleName1} & {coupleName2} 已经牵手走过
            </p>

            <div className="my-5 flex items-baseline gap-2">
              <span className="text-6xl md:text-7xl font-black text-slate-800 tracking-tight font-sans tabular-nums">
                {totalDaysTogether}
              </span>
              <span className="text-xl font-bold text-rose-500">DAYS</span>
            </div>
          </div>

          <div className="relative z-10 pt-4 border-t border-rose-200/40 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1 text-rose-500/90 font-semibold">
              <Icon name="auto_awesome" size={14} />
              每分每秒，都因为有你而格外闪耀
            </span>
            <span className="text-slate-400">
              Day by day
            </span>
          </div>
        </motion.div>

        {/* Hero Nearest Countdown Card */}
        {nearestHero && (
          <motion.div
            whileHover={{ y: -4 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="lg:col-span-7 relative overflow-hidden rounded-[2.5rem] p-8 bg-white/75 backdrop-blur-md border border-white/80 shadow-xl shadow-slate-900/5 flex flex-col justify-between"
          >
            {/* Soft background tint */}
            <div 
              className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-30 pointer-events-none"
              style={{ backgroundColor: nearestHero.bgClass }}
            />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200/60 shadow-sm flex items-center gap-1">
                    <Icon name={nearestHero.icon} size={14} className="text-rose-500" />
                    最近期待 · {nearestHero.badgeText}
                  </span>
                </div>
                <span className="text-xs font-semibold text-slate-400">
                  目标：{nearestHero.targetDate}
                </span>
              </div>

              <h3 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight mb-2">
                {nearestHero.title}
              </h3>
              <p className="text-slate-500 text-sm mb-6">
                {nearestHero.subtitle || '心中最甜的约定，正在悄悄靠近'}
              </p>

              {/* Highlight number display */}
              <div className="bg-slate-50/70 border border-slate-100 rounded-3xl p-5 md:p-6 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">
                    Counting down
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-bold text-slate-500">还有</span>
                    <span className="text-5xl md:text-6xl font-black text-slate-800 tabular-nums font-sans">
                      {nearestHero.daysRemaining}
                    </span>
                    <span className="text-lg font-bold text-rose-500">天</span>
                  </div>
                </div>

                {/* Progress Visualizer Ring/Pill */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200/60">
                  <div className="text-xs text-slate-400 font-semibold mb-1">
                    {nearestHero.isToday ? '🎉 就在今天！' : '期盼指数'}
                  </div>
                  <div className="w-36 h-3 bg-slate-200/80 rounded-full overflow-hidden p-0.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.max(8, Math.min(100, 100 - (nearestHero.daysRemaining % 100)))}%`
                      }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-rose-400 to-primary rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 font-medium pt-2">
              <span className="flex items-center gap-1.5 text-rose-500 font-medium">
                <Icon name="auto_awesome" size={14} />
                愿所有的奔赴，都是因为爱与期待
              </span>
              <span>距离美好更近一步</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Grid of Milestone & Custom Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {milestoneCards.map((card, idx) => {
          const isNearest = nearestHero?.id === card.id
          return (
            <motion.div
              key={card.id || idx}
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 350, damping: 22 }}
              style={{ backgroundColor: card.bgClass }}
              className={`group relative rounded-[2rem] p-6 border ${card.borderClass} shadow-md shadow-slate-900/5 flex flex-col justify-between overflow-hidden transition-shadow hover:shadow-xl`}
            >
              {/* Subtle top glare */}
              <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />

              {/* Card Header */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-2xl bg-white/80 shadow-sm flex items-center justify-center">
                      <Icon name={card.icon} size={18} className={card.textClass} />
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${card.tagBgClass} ${card.textClass}`}>
                      {card.badgeText}
                    </span>
                  </div>

                  {card.isCustom && (
                    <button
                      type="button"
                      title="删除此倒数日"
                      onClick={(e) => handleDeleteCustom(card.id, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-xl bg-white/70 hover:bg-rose-50 text-slate-400 hover:text-rose-500 shadow-sm cursor-pointer"
                    >
                      <Icon name="delete" size={16} />
                    </button>
                  )}
                  {!card.isCustom && isNearest && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white shadow-sm">
                      NEXT
                    </span>
                  )}
                </div>

                <h4 className="text-lg font-black text-slate-800 tracking-tight line-clamp-1 mb-1">
                  {card.title}
                </h4>
                <p className="text-xs text-slate-500 line-clamp-1 mb-5">
                  {card.subtitle || `约定日期: ${card.targetDate}`}
                </p>
              </div>

              {/* Card Footer: Days Counter */}
              <div className="relative z-10 pt-4 border-t border-slate-900/5 flex items-baseline justify-between">
                <span className="text-xs font-semibold text-slate-400">
                  {card.targetDate}
                </span>

                <div className="flex items-baseline gap-1.5">
                  {card.isToday ? (
                    <span className="text-xl font-black text-rose-500">就是今天！🎉</span>
                  ) : card.isPassed ? (
                    <>
                      <span className="text-xs font-bold text-slate-400">已过去</span>
                      <span className="text-2xl font-black text-slate-700 tabular-nums font-sans">
                        {Math.abs(card.daysRemaining)}
                      </span>
                      <span className="text-xs font-bold text-slate-400">天</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xs font-bold text-slate-400">还有</span>
                      <span className="text-3xl font-black text-slate-800 tabular-nums font-sans">
                        {card.daysRemaining}
                      </span>
                      <span className="text-xs font-bold text-rose-500">天</span>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Add Custom Countdown Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="✨ 添加属于我们的倒数日"
      >
        <form onSubmit={handleSaveCountdown} className="space-y-6">
          {formError && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium flex items-center gap-2">
              <Icon name="error" size={16} />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              倒数日名称
            </label>
            <input
              type="text"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="例如：一起去大理旅行、恺恺的生日、看陈奕迅演唱会..."
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-rose-400 focus:bg-white text-slate-800 text-sm outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                目标日期
              </label>
              <input
                type="date"
                required
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-rose-400 focus:bg-white text-slate-800 text-sm outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                分类标签
              </label>
              <select
                value={formCategory}
                onChange={(e) => {
                  const cat = e.target.value as CountdownCategory
                  setFormCategory(cat)
                  if (CATEGORY_MAP[cat]) {
                    setFormIcon(CATEGORY_MAP[cat].icon)
                  }
                }}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-rose-400 focus:bg-white text-slate-800 text-sm outline-none transition-all"
              >
                <option value="anniversary">纪念日 (Anniversary)</option>
                <option value="birthday">生日 (Birthday)</option>
                <option value="trip">旅行 (Trip)</option>
                <option value="wish">心愿清单 (Wish)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              挑选代表图标
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {AVAILABLE_ICONS.map((ic) => {
                const isSelected = formIcon === ic.name
                return (
                  <button
                    key={ic.name}
                    type="button"
                    onClick={() => setFormIcon(ic.name)}
                    className={`p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all ${
                      isSelected
                        ? 'border-rose-400 bg-rose-50 text-rose-600 shadow-sm'
                        : 'border-slate-100 bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <Icon name={ic.name} size={20} />
                    <span className="text-[10px] font-medium">{ic.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <input
              type="checkbox"
              id="isYearly"
              checked={formIsYearly}
              onChange={(e) => setFormIsYearly(e.target.checked)}
              className="w-4 h-4 rounded text-rose-500 focus:ring-rose-400"
            />
            <label htmlFor="isYearly" className="text-xs text-slate-600 font-medium cursor-pointer select-none">
              每年重复（如生日、固定相识纪念日，每年到达时自动循环倒数）
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 rounded-xl text-slate-500 hover:bg-slate-100 text-sm font-semibold transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-400 to-primary text-white text-sm font-bold shadow-md shadow-rose-200 hover:opacity-95 transition-opacity"
            >
              保存倒数日
            </button>
          </div>
        </form>
      </Modal>
    </section>
  )
}
