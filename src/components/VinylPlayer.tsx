import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'

export type AmbientTrackId = 'rain' | 'fireplace' | 'cafe' | 'ocean' | 'chords'

interface AmbientTrack {
  id: AmbientTrackId
  title: string
  subtitle: string
  icon: string
  color: string
  description: string
}

const TRACKS: AmbientTrack[] = [
  {
    id: 'rain',
    title: '雨落窗台',
    subtitle: 'Rain on Window',
    icon: '🌧️',
    color: 'from-blue-400/20 to-indigo-500/20 text-indigo-700',
    description: '淅淅沥沥的细雨，洗去一天的疲惫'
  },
  {
    id: 'fireplace',
    title: '暖冬壁炉',
    subtitle: 'Cozy Fireplace',
    icon: '🪵',
    color: 'from-amber-500/20 to-orange-600/20 text-orange-700',
    description: '壁炉里噼啪作响的木柴与跳动的火苗'
  },
  {
    id: 'cafe',
    title: '街角咖啡',
    subtitle: 'Lo-Fi Cafe',
    icon: '☕',
    color: 'from-amber-700/20 to-yellow-800/20 text-stone-700',
    description: '午后转角咖啡馆的温暖杯盏与低语'
  },
  {
    id: 'ocean',
    title: '夏日海浪',
    subtitle: 'Ocean Waves',
    icon: '🌊',
    color: 'from-teal-400/20 to-cyan-600/20 text-teal-700',
    description: '潮涨潮落的轻柔拍岸，宁静而辽阔'
  },
  {
    id: 'chords',
    title: '舒缓和弦',
    subtitle: 'Dreamy Chords',
    icon: '✨',
    color: 'from-purple-400/20 to-rose-400/20 text-purple-700',
    description: '漂浮在空气中的温暖和弦与治愈共鸣'
  }
]

const TIMER_OPTIONS = [
  { label: '常开', value: 0 },
  { label: '15分', value: 15 },
  { label: '30分', value: 30 },
  { label: '60分', value: 60 }
]

export default function VinylPlayer() {
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeTrack, setActiveTrack] = useState<AmbientTrackId>('rain')
  const [volume, setVolume] = useState(0.65)
  const [isMuted, setIsMuted] = useState(false)
  const [timerMinutes, setTimerMinutes] = useState(0)
  const [timerRemainingSec, setTimerRemainingSec] = useState<number | null>(null)

  // Web Audio Context & Node Refs
  const audioCtxRef = useRef<AudioContext | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)
  const trackNodesRef = useRef<{
    stop: () => void
  } | null>(null)

  // Track client-side mount state for document.body portal
  useEffect(() => {
    setMounted(true)
  }, [])

  // Keep volume & muted updated in audio node
  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current) {
      const targetGain = isMuted ? 0 : volume
      masterGainRef.current.gain.setTargetAtTime(
        targetGain,
        audioCtxRef.current.currentTime,
        0.05
      )
    }
  }, [volume, isMuted])

  // Timer countdown handling
  useEffect(() => {
    if (!isPlaying || timerMinutes === 0) {
      setTimerRemainingSec(null)
      return
    }

    setTimerRemainingSec(timerMinutes * 60)
  }, [timerMinutes, isPlaying])

  useEffect(() => {
    if (timerRemainingSec === null || !isPlaying) return

    if (timerRemainingSec <= 0) {
      // Time is up, stop playback
      stopAudio()
      setIsPlaying(false)
      setTimerRemainingSec(null)
      setTimerMinutes(0)
      return
    }

    const interval = setInterval(() => {
      setTimerRemainingSec((prev) => (prev !== null && prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(interval)
  }, [timerRemainingSec, isPlaying])

  // Clean up Web Audio on unmount
  useEffect(() => {
    return () => {
      stopAudio()
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {})
      }
    }
  }, [])

  // Web Audio Context Initializer
  const getOrCreateAudioContext = () => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AudioContextClass()
      const master = ctx.createGain()
      master.gain.setValueAtTime(isMuted ? 0 : volume, ctx.currentTime)
      master.connect(ctx.destination)

      audioCtxRef.current = ctx
      masterGainRef.current = master
    }

    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume()
    }

    return { ctx: audioCtxRef.current, master: masterGainRef.current! }
  }

  // Helper to create Pink Noise Buffer (softer, more natural than white noise)
  const createPinkNoiseBuffer = (ctx: AudioContext, durationSeconds = 5) => {
    const bufferSize = ctx.sampleRate * durationSeconds
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const output = buffer.getChannelData(0)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + white * 0.0555179
      b1 = 0.99332 * b1 + white * 0.0750759
      b2 = 0.96900 * b2 + white * 0.1538520
      b3 = 0.86650 * b3 + white * 0.3104856
      b4 = 0.55000 * b4 + white * 0.5329522
      b5 = -0.7616 * b5 - white * 0.0168980
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
      b6 = white * 0.115926
    }
    return buffer
  }

  // Procedural Sound Generator Implementations
  const startTrackSound = (trackId: AmbientTrackId) => {
    const { ctx, master } = getOrCreateAudioContext()

    // Stop currently running procedural sound
    if (trackNodesRef.current) {
      trackNodesRef.current.stop()
      trackNodesRef.current = null
    }

    const cleanups: (() => void)[] = []

    if (trackId === 'rain') {
      // 1. Soothing Rain: Pink noise through bandpass + gentle randomized raindrops
      const pinkBuffer = createPinkNoiseBuffer(ctx, 4)
      const noiseSource = ctx.createBufferSource()
      noiseSource.buffer = pinkBuffer
      noiseSource.loop = true

      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(1000, ctx.currentTime)

      const rainGain = ctx.createGain()
      rainGain.gain.setValueAtTime(0.45, ctx.currentTime)

      noiseSource.connect(filter)
      filter.connect(rainGain)
      rainGain.connect(master)
      noiseSource.start()

      // Soft randomized raindrop impacts
      const intervalId = window.setInterval(() => {
        if (ctx.state !== 'running') return
        const dropOsc = ctx.createOscillator()
        const dropGain = ctx.createGain()
        const dropFilter = ctx.createBiquadFilter()

        dropOsc.type = 'sine'
        const freq = 1200 + Math.random() * 800
        dropOsc.frequency.setValueAtTime(freq, ctx.currentTime)
        dropOsc.frequency.exponentialRampToValueAtTime(freq * 0.4, ctx.currentTime + 0.08)

        dropGain.gain.setValueAtTime(0.06 * Math.random(), ctx.currentTime)
        dropGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08)

        dropFilter.type = 'bandpass'
        dropFilter.frequency.setValueAtTime(1400, ctx.currentTime)

        dropOsc.connect(dropFilter)
        dropFilter.connect(dropGain)
        dropGain.connect(master)

        dropOsc.start()
        dropOsc.stop(ctx.currentTime + 0.09)
      }, 180)

      cleanups.push(() => {
        try {
          noiseSource.stop()
          noiseSource.disconnect()
        } catch (_) {}
        clearInterval(intervalId)
      })
    } else if (trackId === 'fireplace') {
      // 2. Cozy Fireplace: Low warm rumble + crisp wood snaps/crackles
      const pinkBuffer = createPinkNoiseBuffer(ctx, 3)
      const rumbleSource = ctx.createBufferSource()
      rumbleSource.buffer = pinkBuffer
      rumbleSource.loop = true

      const rumbleFilter = ctx.createBiquadFilter()
      rumbleFilter.type = 'lowpass'
      rumbleFilter.frequency.setValueAtTime(260, ctx.currentTime)

      const rumbleGain = ctx.createGain()
      rumbleGain.gain.setValueAtTime(0.65, ctx.currentTime)

      rumbleSource.connect(rumbleFilter)
      rumbleFilter.connect(rumbleGain)
      rumbleGain.connect(master)
      rumbleSource.start()

      // Procedural crackles & snaps
      const crackleInterval = window.setInterval(() => {
        if (ctx.state !== 'running') return
        // Random chance of crackle burst
        if (Math.random() < 0.45) {
          const crackleBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.03, ctx.sampleRate)
          const data = crackleBuffer.getChannelData(0)
          for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.008))
          }
          const cSource = ctx.createBufferSource()
          cSource.buffer = crackleBuffer

          const cFilter = ctx.createBiquadFilter()
          cFilter.type = 'highpass'
          cFilter.frequency.setValueAtTime(800 + Math.random() * 1200, ctx.currentTime)

          const cGain = ctx.createGain()
          const amp = 0.08 + Math.random() * 0.18
          cGain.gain.setValueAtTime(amp, ctx.currentTime)

          cSource.connect(cFilter)
          cFilter.connect(cGain)
          cGain.connect(master)

          cSource.start()
        }
      }, 90)

      cleanups.push(() => {
        try {
          rumbleSource.stop()
          rumbleSource.disconnect()
        } catch (_) {}
        clearInterval(crackleInterval)
      })
    } else if (trackId === 'cafe') {
      // 3. Lo-Fi Cafe: Murmur texture + soft tape hiss + occasional porcelain cup clinks
      const pinkBuffer = createPinkNoiseBuffer(ctx, 6)
      const murmurSource = ctx.createBufferSource()
      murmurSource.buffer = pinkBuffer
      murmurSource.loop = true

      const murmurFilter = ctx.createBiquadFilter()
      murmurFilter.type = 'bandpass'
      murmurFilter.frequency.setValueAtTime(450, ctx.currentTime)
      murmurFilter.Q.setValueAtTime(0.8, ctx.currentTime)

      const murmurGain = ctx.createGain()
      murmurGain.gain.setValueAtTime(0.5, ctx.currentTime)

      murmurSource.connect(murmurFilter)
      murmurFilter.connect(murmurGain)
      murmurGain.connect(master)
      murmurSource.start()

      // Delicate ceramic mug clink every few seconds
      const clinkInterval = window.setInterval(() => {
        if (ctx.state !== 'running') return
        if (Math.random() < 0.35) {
          const clinkOsc = ctx.createOscillator()
          const clinkGain = ctx.createGain()

          clinkOsc.type = 'sine'
          const baseFreq = 2200 + Math.random() * 600
          clinkOsc.frequency.setValueAtTime(baseFreq, ctx.currentTime)

          clinkGain.gain.setValueAtTime(0.03, ctx.currentTime)
          clinkGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3)

          clinkOsc.connect(clinkGain)
          clinkGain.connect(master)

          clinkOsc.start()
          clinkOsc.stop(ctx.currentTime + 0.32)
        }
      }, 3500)

      cleanups.push(() => {
        try {
          murmurSource.stop()
          murmurSource.disconnect()
        } catch (_) {}
        clearInterval(clinkInterval)
      })
    } else if (trackId === 'ocean') {
      // 4. Summer Ocean Waves: Modulated low-passed noise that swells like rhythmic tidal waves
      const pinkBuffer = createPinkNoiseBuffer(ctx, 8)
      const waveSource = ctx.createBufferSource()
      waveSource.buffer = pinkBuffer
      waveSource.loop = true

      const waveFilter = ctx.createBiquadFilter()
      waveFilter.type = 'lowpass'
      waveFilter.frequency.setValueAtTime(400, ctx.currentTime)

      const waveGain = ctx.createGain()
      waveGain.gain.setValueAtTime(0.15, ctx.currentTime)

      // LFO for wave swelling rhythm (period ~7.5 seconds)
      const lfo = ctx.createOscillator()
      lfo.frequency.setValueAtTime(0.13, ctx.currentTime) // 1 wave cycle every ~7.7s
      const lfoGain = ctx.createGain()
      lfoGain.gain.setValueAtTime(0.35, ctx.currentTime)

      lfo.connect(lfoGain)
      lfoGain.connect(waveGain.gain)

      waveSource.connect(waveFilter)
      waveFilter.connect(waveGain)
      waveGain.connect(master)

      waveSource.start()
      lfo.start()

      cleanups.push(() => {
        try {
          waveSource.stop()
          waveSource.disconnect()
          lfo.stop()
          lfo.disconnect()
        } catch (_) {}
      })
    } else if (trackId === 'chords') {
      // 5. Dreamy Ambient Chords: Warm sine chord pad cycling through Major 7th/9th soothing chords
      const chordsProgression = [
        [261.63, 329.63, 392.00, 493.88], // Cmaj7
        [220.00, 261.63, 329.63, 392.00], // Am7
        [174.61, 220.00, 261.63, 329.63], // Fmaj7
        [196.00, 246.94, 293.66, 349.23]  // G7
      ]
      let currentChordIdx = 0
      let activeOscs: OscillatorNode[] = []
      let activeGains: GainNode[] = []

      const playCurrentChord = () => {
        if (ctx.state !== 'running') return
        const freqs = chordsProgression[currentChordIdx]
        currentChordIdx = (currentChordIdx + 1) % chordsProgression.length

        // Stop past chord gently
        activeGains.forEach((g) => {
          g.gain.setTargetAtTime(0.0001, ctx.currentTime, 1.2)
        })
        const oldOscs = activeOscs
        window.setTimeout(() => {
          oldOscs.forEach((o) => {
            try {
              o.stop()
              o.disconnect()
            } catch (_) {}
          })
        }, 2500)

        activeOscs = []
        activeGains = []

        // Spawn smooth new chord
        freqs.forEach((freq) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = 'sine'
          osc.frequency.setValueAtTime(freq, ctx.currentTime)

          gain.gain.setValueAtTime(0.0001, ctx.currentTime)
          gain.gain.setTargetAtTime(0.045, ctx.currentTime, 1.5)

          osc.connect(gain)
          gain.connect(master)

          osc.start()
          activeOscs.push(osc)
          activeGains.push(gain)
        })
      }

      playCurrentChord()
      const chordInterval = window.setInterval(playCurrentChord, 5500)

      cleanups.push(() => {
        clearInterval(chordInterval)
        activeOscs.forEach((o) => {
          try {
            o.stop()
            o.disconnect()
          } catch (_) {}
        })
      })
    }

    trackNodesRef.current = {
      stop: () => {
        cleanups.forEach((fn) => fn())
      }
    }
  }

  const stopAudio = () => {
    if (trackNodesRef.current) {
      trackNodesRef.current.stop()
      trackNodesRef.current = null
    }
  }

  const handleTogglePlay = () => {
    if (isPlaying) {
      stopAudio()
      setIsPlaying(false)
    } else {
      startTrackSound(activeTrack)
      setIsPlaying(true)
    }
  }

  const handleSelectTrack = (trackId: AmbientTrackId) => {
    setActiveTrack(trackId)
    if (isPlaying) {
      startTrackSound(trackId)
    }
  }

  const formatRemainingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const activeTrackObj = TRACKS.find((t) => t.id === activeTrack) || TRACKS[0]

  if (!mounted || typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <div className="fixed right-4 md:right-8 bottom-6 md:bottom-8 z-50 select-none font-sans pointer-events-auto">
      <AnimatePresence>
        {/* Expanded Ambient Glass Player Panel */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-[340px] max-w-[calc(100vw-2rem)] glass-card bg-white/85 dark:bg-stone-900/85 backdrop-blur-2xl border border-white/60 shadow-2xl rounded-3xl p-5 mb-3 overflow-hidden text-slate-700"
          >
            {/* Header: Title & Close Button */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200/60">
              <div className="flex items-center space-x-2">
                <span className="text-xl">📻</span>
                <div>
                  <h3 className="text-sm font-semibold text-stone-800 tracking-wide">
                    微型黑胶白噪音
                  </h3>
                  <p className="text-[11px] text-stone-400 font-mono">Lo-Fi Ambient Space</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-stone-200/60 transition-colors text-stone-500 hover:text-stone-800 active:scale-90"
                aria-label="收起播放器"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Currently Active Track Spotlight */}
            <div className="my-3.5 p-3 rounded-2xl bg-gradient-to-r from-stone-100 to-white/90 border border-stone-200/50 shadow-sm flex items-center space-x-3">
              <div className="relative w-12 h-12 rounded-full bg-stone-900 flex-shrink-0 flex items-center justify-center shadow-md overflow-hidden">
                <div
                  className={`w-full h-full rounded-full flex items-center justify-center ${
                    isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''
                  }`}
                  style={{
                    backgroundImage:
                      'radial-gradient(circle, #2d2a2a 22%, #141414 24%, #2d2a2a 42%, #141414 44%, #282828 65%, #181818 70%)'
                  }}
                >
                  <span className="text-sm">{activeTrackObj.icon}</span>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-800 truncate">
                    {activeTrackObj.title}
                  </span>
                  {timerRemainingSec !== null && isPlaying && (
                    <span className="text-[10px] bg-primary/20 text-stone-700 px-1.5 py-0.5 rounded-full font-mono font-medium">
                      ⏱ {formatRemainingTime(timerRemainingSec)}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-stone-400 truncate mt-0.5">
                  {activeTrackObj.description}
                </p>
              </div>
            </div>

            {/* Soundscape List */}
            <div className="space-y-1.5 mb-3.5">
              <span className="text-[11px] font-medium text-stone-400 px-1">环境白噪音声景</span>
              <div className="grid grid-cols-1 gap-1.5">
                {TRACKS.map((t) => {
                  const isSelected = activeTrack === t.id
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleSelectTrack(t.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-all duration-200 text-xs ${
                        isSelected
                          ? 'bg-primary/20 border border-primary/40 font-medium text-stone-800 shadow-sm'
                          : 'hover:bg-stone-100/80 text-stone-600 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="text-base">{t.icon}</span>
                        <div>
                          <span className="block">{t.title}</span>
                          <span className="block text-[10px] text-stone-400">{t.subtitle}</span>
                        </div>
                      </div>

                      {/* Equalizer Wave / Playing Status */}
                      {isSelected && isPlaying ? (
                        <div className="flex items-end space-x-0.5 h-3.5">
                          <span className="w-1 bg-primary rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-full" />
                          <span className="w-1 bg-primary rounded-full animate-[pulse_0.9s_ease-in-out_infinite] h-2/3" />
                          <span className="w-1 bg-primary rounded-full animate-[pulse_0.4s_ease-in-out_infinite] h-4/5" />
                        </div>
                      ) : (
                        <span className="text-[10px] text-stone-400">{isSelected ? '已选' : ''}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Volume Control */}
            <div className="mb-3 p-2.5 rounded-xl bg-stone-100/70 border border-stone-200/50 flex items-center space-x-2.5">
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className="text-stone-500 hover:text-stone-800 transition-colors"
                aria-label={isMuted ? '取消静音' : '静音'}
              >
                {isMuted || volume === 0 ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                    />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                    />
                  </svg>
                )}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value))
                  if (isMuted) setIsMuted(false)
                }}
                className="flex-1 h-1.5 bg-stone-300 rounded-lg appearance-none cursor-pointer accent-primary"
                aria-label="音量调节"
              />
              <span className="text-[10px] text-stone-500 font-mono w-7 text-right">
                {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
              </span>
            </div>

            {/* Sleep Timer & Play Action Controls */}
            <div className="flex items-center justify-between pt-1">
              {/* Timer Selector */}
              <div className="flex items-center space-x-1">
                {TIMER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTimerMinutes(opt.value)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
                      timerMinutes === opt.value
                        ? 'bg-stone-800 text-white shadow-sm'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Main Play/Pause Button */}
              <button
                type="button"
                onClick={handleTogglePlay}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-primary to-morandi-pink text-white font-medium text-xs flex items-center space-x-1.5 shadow-md hover:shadow-lg transition-all duration-300 active:scale-95"
              >
                {isPlaying ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="6" y="4" width="4" height="16" rx="1" />
                      <rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                    <span>暂停</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    <span>播放</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Realistic Vinyl Disc Trigger Widget */}
      <div className="relative group flex items-center">
        {/* Floating Sound Notes Animation When Playing */}
        {isPlaying && (
          <div className="absolute -top-7 left-1 pointer-events-none flex space-x-1.5 items-end">
            <span className="text-morandi-pink text-xs animate-[bounce_1.4s_infinite]">🎵</span>
            <span className="text-secondary text-sm animate-[bounce_1.8s_infinite] -translate-y-1">🎶</span>
            <span className="text-primary text-[10px] animate-[bounce_1.2s_infinite]">✨</span>
          </div>
        )}

        {/* Collapsed Vinyl Disc */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isPlaying ? '正在播放白噪音，点击展开或收起播放器' : '点击打开黑胶白噪音播放器'}
          className="relative w-14 h-14 rounded-full p-0.5 bg-stone-800 shadow-xl border-2 border-white/80 hover:scale-105 active:scale-95 transition-transform duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary group"
        >
          {/* Vinyl Grooves Body */}
          <div
            className={`w-full h-full rounded-full flex items-center justify-center relative overflow-hidden ${
              isPlaying ? 'animate-[spin_6s_linear_infinite]' : ''
            }`}
            style={{
              backgroundImage:
                'repeating-radial-gradient(circle, #1a1a1a 0, #1a1a1a 3px, #262626 4px, #1a1a1a 5px)'
            }}
          >
            {/* Center Label (Morandi Soft Heart Motif) */}
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-rose-300 to-amber-200 flex items-center justify-center shadow-inner border border-stone-700/40">
              <span className="text-[10px] leading-none select-none">
                {isPlaying ? '💖' : '🤍'}
              </span>
            </div>

            {/* Metallic Center Spindle Hole */}
            <div className="absolute w-1.5 h-1.5 rounded-full bg-stone-300 shadow-sm" />
          </div>

          {/* Realistic Tonearm (唱臂) */}
          <div
            className={`absolute -top-1.5 right-1 origin-top-right transition-transform duration-500 pointer-events-none ${
              isPlaying ? 'rotate-[26deg]' : 'rotate-0'
            }`}
          >
            {/* Pivot base */}
            <div className="w-2.5 h-2.5 rounded-full bg-stone-300 border border-stone-500 shadow-sm" />
            {/* Metal arm */}
            <div className="w-0.5 h-5 bg-gradient-to-b from-stone-300 to-stone-400 mx-auto -mt-0.5" />
            {/* Cartridge/Stylus */}
            <div className="w-1.5 h-2 rounded-sm bg-stone-600 mx-auto -mt-0.5 shadow-xs" />
          </div>
        </button>
      </div>
    </div>,
    document.body
  )
}
