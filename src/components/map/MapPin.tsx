import { memo } from 'react'
import { motion } from 'framer-motion'

interface MapPinProps {
    x: number
    y: number
    color?: string
    scale?: number
    delay?: number
}

function MapPin({ x, y, color = '#C9ADA7', scale = 1, delay = 0 }: MapPinProps) {
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
                type: 'spring',
                stiffness: 260,
                damping: 20,
                delay: delay
            }}
            className="pointer-events-none"
        >
            <circle
                cx={x}
                cy={y}
                r={6 * scale}
                fill="rgba(0,0,0,0.08)"
            />
            <path
                d={`M ${x} ${y}
                   C ${x - 5 * scale} ${y - 5 * scale}, ${x - 5 * scale} ${y - 12 * scale}, ${x} ${y - 12 * scale}
                   C ${x + 5 * scale} ${y - 12 * scale}, ${x + 5 * scale} ${y - 5 * scale}, ${x} ${y} Z`}
                fill={color}
            />
            <circle
                cx={x}
                cy={y - 8.5 * scale}
                r={2 * scale}
                fill="white"
            />
        </motion.g>
    )
}

export default memo(MapPin)
