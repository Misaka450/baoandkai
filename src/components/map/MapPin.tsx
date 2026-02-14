import { motion } from 'framer-motion'

interface MapPinProps {
    x: number
    y: number
    color?: string
    scale?: number
    delay?: number
}

export default function MapPin({ x, y, color = '#C9ADA7', scale = 1, delay = 0 }: MapPinProps) {
    return (
        <motion.g
            initial={{ opacity: 0, y: y - 20 }}
            animate={{ opacity: 1, y: y }}
            transition={{
                type: 'spring',
                stiffness: 300,
                damping: 20,
                delay: delay
            }}
            className="pointer-events-none"
        >
            {/* 投影 */}
            <motion.ellipse
                cx={x}
                cy={y + 2}
                rx={4 * scale}
                ry={1.5 * scale}
                fill="rgba(0,0,0,0.15)"
                animate={{
                    rx: [4 * scale, 3 * scale, 4 * scale],
                    opacity: [0.15, 0.1, 0.15]
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            {/* 浮动动画容器 */}
            <motion.g
                animate={{
                    y: [0, -4, 0]
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            >
                {/* 钉尖/针身 (3D 渐变效果) */}
                <path
                    d={`M ${x} ${y} L ${x - 2 * scale} ${y - 8 * scale} L ${x + 2 * scale} ${y - 8 * scale} Z`}
                    fill={`url(#pin-tip-gradient-${color.replace('#', '')})`}
                />

                {/* 钉头 (圆球) */}
                <circle
                    cx={x}
                    cy={y - 10 * scale}
                    r={5 * scale}
                    fill={`url(#pin-head-gradient-${color.replace('#', '')})`}
                    style={{ filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.1))' }}
                />

                {/* 钉头高光 */}
                <circle
                    cx={x - 1.5 * scale}
                    cy={y - 11.5 * scale}
                    r={1.5 * scale}
                    fill="rgba(255,255,255,0.4)"
                />

                {/* 定义渐变 */}
                <defs>
                    <radialGradient id={`pin-head-gradient-${color.replace('#', '')}`} cx="35%" cy="35%" r="60%">
                        <stop offset="0%" stopColor="white" stopOpacity="0.3" />
                        <stop offset="100%" stopColor={color} />
                    </radialGradient>
                    <linearGradient id={`pin-tip-gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={color} stopOpacity="0.8" />
                        <stop offset="100%" stopColor={color} />
                    </linearGradient>
                </defs>
            </motion.g>
        </motion.g>
    )
}
