import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Icon from './icons/Icons'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import { useToast } from './common/Toast'
import { formatDate } from '../utils/common'

export interface PolaroidModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  defaultCaption?: string
  defaultDate?: string
  defaultLocation?: string
}

interface MorandiFilter {
  id: string
  name: string
  label: string
  cssFilter: string
  canvasFilter: string
  badgeColor: string
}

const MORANDI_FILTERS: MorandiFilter[] = [
  {
    id: 'original',
    name: 'Original',
    label: '原图',
    cssFilter: 'none',
    canvasFilter: 'none',
    badgeColor: 'bg-stone-300'
  },
  {
    id: 'warm',
    name: 'Warm Sunlight',
    label: '暖阳',
    cssFilter: 'sepia(0.24) saturate(1.22) brightness(1.05) contrast(0.96)',
    canvasFilter: 'sepia(24%) saturate(122%) brightness(105%) contrast(96%)',
    badgeColor: 'bg-amber-300'
  },
  {
    id: 'vintage',
    name: 'Vintage Film',
    label: '胶片',
    cssFilter: 'sepia(0.35) contrast(1.12) brightness(0.94) saturate(1.12) hue-rotate(-8deg)',
    canvasFilter: 'sepia(35%) contrast(112%) brightness(94%) saturate(112%) hue-rotate(-8deg)',
    badgeColor: 'bg-orange-300'
  },
  {
    id: 'noir',
    name: 'B&W Noir',
    label: '黑白',
    cssFilter: 'grayscale(1) contrast(1.2) brightness(0.96)',
    canvasFilter: 'grayscale(100%) contrast(120%) brightness(96%)',
    badgeColor: 'bg-stone-600'
  },
  {
    id: 'pastel',
    name: 'Pastel Dream',
    label: '梦幻',
    cssFilter: 'saturate(0.85) brightness(1.08) contrast(0.92) hue-rotate(10deg)',
    canvasFilter: 'saturate(85%) brightness(108%) contrast(92%) hue-rotate(10deg)',
    badgeColor: 'bg-rose-300'
  }
]

export default function PolaroidModal({
  isOpen,
  onClose,
  imageUrl,
  defaultCaption = '',
  defaultDate,
  defaultLocation = ''
}: PolaroidModalProps) {
  const toast = useToast()
  useBodyScrollLock(isOpen)

  const [activeFilterId, setActiveFilterId] = useState<string>('warm')
  const [caption, setCaption] = useState<string>(defaultCaption || '记录属于我们的美好瞬间')
  const [date, setDate] = useState<string>(
    defaultDate || formatDate(new Date().toISOString(), 'dot')
  )
  const [location, setLocation] = useState<string>(defaultLocation || '甜甜蜜蜜的小窝')
  const [isExporting, setIsExporting] = useState<boolean>(false)

  // Reset or update state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (defaultCaption) setCaption(defaultCaption)
      if (defaultDate) setDate(defaultDate)
      if (defaultLocation) setLocation(defaultLocation)
    }
  }, [isOpen, defaultCaption, defaultDate, defaultLocation])

  // ESC key to close
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const activeFilter =
    MORANDI_FILTERS.find((f) => f.id === activeFilterId) || MORANDI_FILTERS[0]!

  /**
   * Helper to load image with crossOrigin fallback
   */
  const loadHtmlImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = () => {
        // Fallback without crossOrigin
        const fallbackImg = new Image()
        fallbackImg.onload = () => resolve(fallbackImg)
        fallbackImg.onerror = () => reject(new Error('图片加载失败，请检查网络或图片跨域设置'))
        fallbackImg.src = src
      }
      img.src = src
    })
  }

  /**
   * Save Polaroid Photo to Canvas and download
   */
  const handleSavePolaroid = async () => {
    if (isExporting || !imageUrl) return
    setIsExporting(true)

    try {
      const img = await loadHtmlImage(imageUrl)

      // High DPI (2x) scale settings
      const scale = 2
      const baseWidth = 600
      const baseHeight = 750
      const canvas = document.createElement('canvas')
      canvas.width = baseWidth * scale
      canvas.height = baseHeight * scale

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Canvas context not available')
      }

      ctx.scale(scale, scale)

      // 1. Draw warm ivory Polaroid card paper (#FAF7F2)
      ctx.fillStyle = '#FAF7F2'
      ctx.fillRect(0, 0, baseWidth, baseHeight)

      // Card border
      ctx.strokeStyle = 'rgba(214, 211, 209, 0.8)' // border-stone-200/80
      ctx.lineWidth = 1
      ctx.strokeRect(0.5, 0.5, baseWidth - 1, baseHeight - 1)

      // 2. Photo frame dimensions
      const photoMargin = 38
      const photoSize = baseWidth - photoMargin * 2 // 524 x 524
      const photoX = photoMargin
      const photoY = photoMargin

      // Photo background placeholder
      ctx.fillStyle = '#F5F5F4'
      ctx.fillRect(photoX, photoY, photoSize, photoSize)

      // Calculate object-fit: cover
      const imgWidth = img.naturalWidth || img.width
      const imgHeight = img.naturalHeight || img.height
      let sx = 0
      let sy = 0
      let sWidth = imgWidth
      let sHeight = imgHeight

      if (imgWidth > imgHeight) {
        sWidth = imgHeight
        sx = (imgWidth - imgHeight) / 2
      } else {
        sHeight = imgWidth
        sy = (imgHeight - imgWidth) / 2
      }

      // Draw photo with filter
      ctx.save()
      if (activeFilter.canvasFilter && activeFilter.canvasFilter !== 'none') {
        try {
          ctx.filter = activeFilter.canvasFilter
        } catch {
          // ignore if browser doesn't support specific filter string
        }
      }
      ctx.drawImage(img, sx, sy, sWidth, sHeight, photoX, photoY, photoSize, photoSize)
      ctx.restore()

      // Subtle photo inner shadow / border
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)'
      ctx.lineWidth = 1
      ctx.strokeRect(photoX, photoY, photoSize, photoSize)

      // 3. Bottom White Margin with Caption, Date, Location
      const textStartX = photoMargin + 6
      const contentBottomY = photoY + photoSize + 32

      // Caption text
      ctx.fillStyle = '#292524' // stone-800
      ctx.font = '600 20px "PingFang SC", "Microsoft YaHei", -apple-system, sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'

      const maxCaptionWidth = baseWidth - photoMargin * 2 - 130
      let displayCaption = caption || '记录美好瞬间'
      // Truncate caption if too long
      while (displayCaption.length > 0 && ctx.measureText(displayCaption).width > maxCaptionWidth) {
        displayCaption = displayCaption.slice(0, -1)
      }
      if (displayCaption !== caption && displayCaption.length > 0) {
        displayCaption = displayCaption.slice(0, -1) + '...'
      }
      ctx.fillText(displayCaption, textStartX, contentBottomY)

      // Date & Location
      const metaParts: string[] = []
      if (date) metaParts.push(date)
      if (location) metaParts.push(location)
      const metaText = metaParts.join('  ·  ')

      if (metaText) {
        ctx.fillStyle = '#78716C' // stone-500
        ctx.font = '500 13px "PingFang SC", "Microsoft YaHei", -apple-system, sans-serif'
        ctx.fillText(metaText, textStartX, contentBottomY + 36)
      }

      // 4. Romantic couple red seal stamp: rotated -12deg circular stamp with '❤️ 包包 & 恺恺 · 珍藏回忆'
      const stampCenterX = baseWidth - photoMargin - 52
      const stampCenterY = photoY + photoSize + 66

      ctx.save()
      ctx.translate(stampCenterX, stampCenterY)
      ctx.rotate((-12 * Math.PI) / 180)

      const stampRadius = 45
      // Outer ring
      ctx.strokeStyle = '#BE123C' // rose-700
      ctx.lineWidth = 2.2
      ctx.beginPath()
      ctx.arc(0, 0, stampRadius, 0, Math.PI * 2)
      ctx.stroke()

      // Inner dashed ring
      ctx.strokeStyle = 'rgba(190, 18, 60, 0.65)'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      ctx.arc(0, 0, stampRadius - 5, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])

      // Stamp text
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#BE123C'

      // Top text: ❤️ 包包 & 恺恺
      ctx.font = 'bold 11px sans-serif'
      ctx.fillText('❤️ 包包 & 恺恺', 0, -10)

      // Center separator line
      ctx.strokeStyle = 'rgba(190, 18, 60, 0.4)'
      ctx.lineWidth = 0.8
      ctx.beginPath()
      ctx.moveTo(-22, 1)
      ctx.lineTo(22, 1)
      ctx.stroke()

      // Bottom text: 珍藏回忆
      ctx.font = 'bold 10px sans-serif'
      ctx.fillText('珍藏回忆', 0, 13)

      ctx.restore()

      // 5. Trigger download of 'bbkk-polaroid.png'
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            toast.error('生成相片失败，请重试')
            setIsExporting(false)
            return
          }
          const downloadUrl = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = downloadUrl
          link.download = 'bbkk-polaroid.png'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(downloadUrl)
          toast.success('拍立得相片已保存！')
          setIsExporting(false)
        },
        'image/png'
      )
    } catch (error) {
      console.error('Failed to export polaroid:', error)
      toast.error('保存失败：可能由于图片跨域限制，请重试')
      setIsExporting(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3 md:p-6 bg-slate-950/75 backdrop-blur-md overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/80 p-5 md:p-8 flex flex-col lg:flex-row gap-8 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Right Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-800 flex items-center justify-center transition-all shadow-sm"
          title="关闭"
        >
          <Icon name="close" size={18} />
        </button>

        {/* Left Side: Polaroid Photo Paper Card (#FAF7F2) */}
        <div className="flex-1 flex items-center justify-center">
          <div
            className="w-full max-w-[340px] sm:max-w-[370px] md:max-w-[390px] rounded-2xl p-4 pb-6 transition-all duration-300 border border-stone-200/80"
            style={{
              backgroundColor: '#FAF7F2',
              boxShadow:
                '0 20px 45px -10px rgba(50, 40, 30, 0.22), 0 0 0 1px rgba(214, 211, 209, 0.6)'
            }}
          >
            {/* Photo Paper Inner Recessed Frame */}
            <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-stone-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] border border-stone-200/50">
              <img
                src={imageUrl}
                alt="Polaroid preview"
                className="w-full h-full object-cover select-none transition-all duration-500"
                style={{ filter: activeFilter.cssFilter }}
                crossOrigin="anonymous"
              />
            </div>

            {/* Bottom White Margin (Classic Polaroid bottom margin) */}
            <div className="mt-4 pt-2 px-1 flex items-end justify-between gap-2">
              <div className="flex-1 min-w-0 pr-2">
                <p className="font-bold text-stone-800 text-sm md:text-base tracking-tight truncate">
                  {caption || '记录属于我们的美好瞬间'}
                </p>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] font-medium text-stone-500 truncate">
                  {date && <span>{date}</span>}
                  {date && location && <span>·</span>}
                  {location && <span>{location}</span>}
                </div>
              </div>

              {/* Romantic couple red seal stamp: rotated -12deg circular stamp with '❤️ 包包 & 恺恺 · 珍藏回忆' */}
              <div
                className="flex-shrink-0 relative w-[76px] h-[76px] rounded-full border-2 border-rose-600/85 flex flex-col items-center justify-center p-1 text-rose-700 select-none shadow-[0_2px_8px_rgba(225,29,72,0.15)] bg-rose-50/25"
                style={{ transform: 'rotate(-12deg)' }}
                title="❤️ 包包 & 恺恺 · 珍藏回忆"
              >
                {/* Inner dashed ring */}
                <div className="absolute inset-[3px] rounded-full border border-dashed border-rose-500/60 pointer-events-none" />
                <span className="text-[9px] font-black tracking-tighter leading-tight text-rose-700">
                  ❤️ 包包 & 恺恺
                </span>
                <div className="w-8 h-[0.5px] bg-rose-400/60 my-0.5" />
                <span className="text-[8.5px] font-extrabold tracking-widest leading-tight text-rose-600">
                  珍藏回忆
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Controls Panel */}
        <div className="w-full lg:w-80 flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">📷</span>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">拍立得胶片定制</h3>
              </div>
              <p className="text-xs text-slate-400">选择专属滤镜与题字，一键保存拍立得卡片</p>
            </div>

            {/* 1. Filter Selector Chips (5 Morandi Filters) */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                莫兰迪滤镜 / FILTERS
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2">
                {MORANDI_FILTERS.map((f) => {
                  const isActive = f.id === activeFilterId
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setActiveFilterId(f.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                        isActive
                          ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20'
                          : 'bg-stone-50 text-stone-600 border-stone-200/80 hover:bg-stone-100'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${f.badgeColor} shrink-0`} />
                      <span className="truncate">{f.label}</span>
                      <span className="text-[10px] opacity-75 truncate">{f.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 2. Caption Input */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
                拍立得题字 / CAPTION
              </label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={40}
                placeholder="写下这一刻的心情..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-400 transition-all"
              />
            </div>

            {/* 3. Date & Location Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  日期 / DATE
                </label>
                <input
                  type="text"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  placeholder="2026.05.20"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-400 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  地点 / LOCATION
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="拍摄地点"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-400 transition-all"
                />
              </div>
            </div>
          </div>

          {/* 4. Action Save Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleSavePolaroid}
              disabled={isExporting}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-black text-sm tracking-wide shadow-lg shadow-rose-500/25 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>正在生成高清拍立得...</span>
                </>
              ) : (
                <>
                  <Icon name="photo_camera" size={18} />
                  <span>📥 保存拍立得相片</span>
                </>
              )}
            </button>
            <p className="text-center text-[10px] text-stone-400 mt-2">
              基于 HTML5 Canvas 高清 2x 导出为 PNG
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
