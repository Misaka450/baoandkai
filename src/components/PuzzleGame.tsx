import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Icon from './icons/Icons'

interface PuzzlePiece {
  id: number
  x: number
  y: number
  correctX: number
  correctY: number
  isCorrect: boolean
  imageUrl: string
  width: number
  height: number
  imageX: number
  imageY: number
}

interface PuzzleGameProps {
  imageUrl: string
  size: number // 拼图尺寸，如 3x3, 4x4
  onComplete: () => void
  onClose: () => void
}

export default function PuzzleGame({ imageUrl, size = 3, onComplete, onClose }: PuzzleGameProps) {
  const [pieces, setPieces] = useState<PuzzlePiece[]>([])
  const [isShuffling, setIsShuffling] = useState(true)
  const [moves, setMoves] = useState(0)
  const [time, setTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [selectedPiece, setSelectedPiece] = useState<PuzzlePiece | null>(null)
  const timerRef = useRef<number | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // 生成拼图块
  useEffect(() => {
    if (!imageUrl) return

    const generatePieces = async () => {
      const image = new Image()
      image.src = imageUrl

      await new Promise<void>((resolve) => {
        image.onload = () => {
          const pieceWidth = image.width / size
          const pieceHeight = image.height / size
          const newPieces: PuzzlePiece[] = []

          for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
              newPieces.push({
                id: y * size + x,
                x: x * pieceWidth,
                y: y * pieceHeight,
                correctX: x * pieceWidth,
                correctY: y * pieceHeight,
                isCorrect: false,
                imageUrl,
                width: pieceWidth,
                height: pieceHeight,
                imageX: -x * pieceWidth,
                imageY: -y * pieceHeight
              })
            }
          }

          // 打乱拼图
          const shuffled = shufflePieces([...newPieces])
          setPieces(shuffled)
          setIsShuffling(false)
          resolve()
        }
      })
    }

    generatePieces()

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [imageUrl, size])

  // 打乱拼图
  const shufflePieces = (pieces: PuzzlePiece[]): PuzzlePiece[] => {
    const shuffled = [...pieces]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!]
    }
    return shuffled.map((piece, index) => ({
      ...piece,
      x: (index % size) * piece.width,
      y: Math.floor(index / size) * piece.height
    }))
  }

  // 开始游戏
  const startGame = () => {
    setIsPlaying(true)
    setMoves(0)
    setTime(0)
    
    timerRef.current = window.setInterval(() => {
      setTime(prev => prev + 1)
    }, 1000)
  }

  // 处理拼图块点击
  const handlePieceClick = (piece: PuzzlePiece) => {
    if (!isPlaying || piece.isCorrect) return

    if (!selectedPiece) {
      setSelectedPiece(piece)
    } else {
      // 交换两块拼图
      setPieces(prev => prev.map(p => {
        if (p.id === selectedPiece.id) {
          return { ...p, x: piece.x, y: piece.y }
        }
        if (p.id === piece.id) {
          return { ...p, x: selectedPiece.x, y: selectedPiece.y }
        }
        return p
      }))
      setMoves(prev => prev + 1)
      setSelectedPiece(null)
    }
  }

  // 检查是否完成
  useEffect(() => {
    if (!isPlaying || pieces.length === 0) return

    const allCorrect = pieces.every(piece => 
      Math.abs(piece.x - piece.correctX) < 1 && 
      Math.abs(piece.y - piece.correctY) < 1
    )

    if (allCorrect) {
      setIsPlaying(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      onComplete()
    }
  }, [pieces, isPlaying, onComplete])

  // 格式化时间
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (isShuffling) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-medium">正在生成拼图...</p>
      </div>
    )
  }

  return (
    <div className="puzzle-game">
      {/* 游戏信息 */}
      <div className="flex justify-between items-center mb-4 px-4">
        <div className="flex items-center space-x-6">
          <div className="flex items-center gap-2">
            <Icon name="schedule" size={16} className="text-primary" />
            <span className="text-sm font-medium">{formatTime(time)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="restart_alt" size={16} className="text-primary" />
            <span className="text-sm font-medium">{moves} 步</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-slate-100 transition-colors"
        >
          <Icon name="close" size={20} className="text-slate-400" />
        </button>
      </div>

      {/* 游戏开始界面 */}
      <AnimatePresence>
        {!isPlaying && pieces.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-10"
          >
            <div className="bg-white p-8 rounded-2xl shadow-2xl text-center">
              <Icon name="auto_awesome" size={48} className="text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-black text-slate-800 mb-2">记忆拼图</h3>
              <p className="text-slate-400 mb-6">挑战一下，看看你需要多少时间完成！</p>
              <button
                onClick={startGame}
                className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors"
              >
                开始游戏
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 拼图区域 */}
      <div 
        className="relative mx-auto"
        style={{
          width: pieces.length > 0 ? pieces[0].width * size : 300,
          height: pieces.length > 0 ? pieces[0].height * size : 300
        }}
      >
        {pieces.map((piece) => (
          <motion.div
            key={piece.id}
            className={`absolute cursor-pointer transition-all duration-300 ${selectedPiece?.id === piece.id ? 'ring-2 ring-primary ring-offset-2' : ''}`}
            style={{
              left: piece.x,
              top: piece.y,
              width: piece.width,
              height: piece.height,
              backgroundImage: `url(${piece.imageUrl})`,
              backgroundPosition: `${piece.imageX}px ${piece.imageY}px`,
              backgroundSize: `${piece.width * size}px ${piece.height * size}px`,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            whileHover={{ scale: 1.02 }}
            onClick={() => handlePieceClick(piece)}
          />
        ))}
      </div>

      {/* 控制按钮 */}
      <div className="flex justify-center mt-6 space-x-4">
        <button
          onClick={() => {
            const shuffled = shufflePieces([...pieces])
            setPieces(shuffled)
            setMoves(0)
            setTime(0)
          }}
          className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          重新开始
        </button>
      </div>
    </div>
  )
}
