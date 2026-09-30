import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

export type SubNavSection = 'memory' | 'couple'

interface SubTab {
  key: string
  label: string
  path: string
}

const memoryTabs: SubTab[] = [
  { key: 'albums', label: '📷 相册', path: '/albums' },
  { key: 'map', label: '🗺️ 足迹', path: '/map' },
  { key: 'timeline', label: '⏳ 时间轴', path: '/timeline' }
]

const coupleTabs: SubTab[] = [
  { key: 'couple', label: '💖 纪念日 & 胶囊', path: '/couple' },
  { key: 'todos', label: '✨ 心愿清单', path: '/todos' },
  { key: 'food', label: '🍲 美食探店', path: '/food' }
]

interface ModuleSubNavProps {
  section: SubNavSection
  className?: string
}

export default function ModuleSubNav({ section, className = '' }: ModuleSubNavProps) {
  const location = useLocation()
  const tabs = section === 'memory' ? memoryTabs : coupleTabs

  return (
    <nav
      aria-label={`${section === 'memory' ? '回忆' : '我们'}二级导航`}
      className={`flex justify-center mb-10 ${className}`}
    >
      <div className="inline-flex items-center gap-1.5 p-1.5 rounded-full bg-white/60 backdrop-blur-md border border-white/80 shadow-sm">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path || (tab.path !== '/' && location.pathname.startsWith(`${tab.path}/`))
          return (
            <Link
              key={tab.key}
              to={tab.path}
              className={`relative px-4 py-2 rounded-full text-xs md:text-sm font-medium tracking-wide transition-all duration-300 focus-visible:outline-2 focus-visible:outline-primary select-none ${
                isActive
                  ? 'text-primary font-semibold shadow-sm'
                  : 'text-stone-500 hover:text-stone-800 hover:bg-white/50 active:scale-95'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId={`subnav-pill-${section}`}
                  className="absolute inset-0 rounded-full bg-[#FFEDF3] border border-[#FF8BB1]/20 -z-10"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
