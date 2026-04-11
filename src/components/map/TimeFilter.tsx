import { useMemo } from 'react'
import { motion } from 'framer-motion'
import Icon from '../icons/Icons'

interface TimeFilterProps {
    selectedYear: string | null
    selectedMonth: string | null
    onYearChange: (year: string | null) => void
    onMonthChange: (month: string | null) => void
    onReset: () => void
    dates: string[]
}

export default function TimeFilter({
    selectedYear,
    selectedMonth,
    onYearChange,
    onMonthChange,
    onReset,
    dates
}: TimeFilterProps) {
    // 提取所有年份和月份
    const { years, months } = useMemo(() => {
        const yearSet = new Set<string>()
        const monthSet = new Set<string>()
        
        dates.forEach(dateStr => {
            const date = new Date(dateStr)
            const year = date.getFullYear().toString()
            const month = (date.getMonth() + 1).toString().padStart(2, '0')
            yearSet.add(year)
            monthSet.add(month)
        })
        
        return {
            years: Array.from(yearSet).sort((a, b) => b.localeCompare(a)),
            months: Array.from(monthSet).sort((a, b) => a.localeCompare(b))
        }
    }, [dates])

    const monthNames = ['全部', '1 月', '2 月', '3 月', '4 月', '5 月', '6 月', '7 月', '8 月', '9 月', '10 月', '11 月', '12 月']

    const hasActiveFilter = selectedYear !== null || selectedMonth !== null

    return (
        <motion.div 
            className="premium-card !p-4 !bg-white/60 backdrop-blur-sm mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
        >
            <div className="flex flex-wrap items-center gap-4">
                {/* 年份选择 */}
                <div className="flex items-center gap-2">
                    <Icon name="calendar_today" size={18} className="text-slate-400" />
                    <select
                        value={selectedYear || ''}
                        onChange={(e) => onYearChange(e.target.value || null)}
                        className="bg-white/80 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer hover:bg-white transition-colors"
                    >
                        <option value="">全部年份</option>
                        {years.map(year => (
                            <option key={year} value={year}>{year}年</option>
                        ))}
                    </select>
                </div>

                {/* 月份选择 */}
                <div className="flex items-center gap-2">
                    <Icon name="event" size={18} className="text-slate-400" />
                    <select
                        value={selectedMonth || ''}
                        onChange={(e) => onMonthChange(e.target.value || null)}
                        disabled={!selectedYear}
                        className="bg-white/80 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <option value="">全部月份</option>
                        {months.map((month, idx) => (
                            <option key={month} value={month}>{monthNames[idx + 1]}</option>
                        ))}
                    </select>
                </div>

                {/* 重置按钮 */}
                {hasActiveFilter && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={onReset}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium text-slate-600 transition-colors"
                    >
                        <Icon name="refresh" size={16} />
                        重置
                    </motion.button>
                )}

                {/* 筛选结果提示 */}
                {hasActiveFilter && (
                    <div className="ml-auto text-sm text-slate-500 font-medium">
                        <span className="text-primary">
                            {selectedYear ? `${selectedYear}年` : ''}
                            {selectedMonth ? `${monthNames[parseInt(selectedMonth)]}` : ''}
                        </span>
                        {' '}的足迹
                    </div>
                )}
            </div>
        </motion.div>
    )
}
