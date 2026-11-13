import { useLocation } from 'react-router-dom'
import { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface PageTransitionProps {
    children: ReactNode
}

// 仅使用 opacity 过渡，避免在祖先节点生成 transform 包含块而困住页面内 fixed 元素
const pageVariants = {
    initial: {
        opacity: 0
    },
    enter: {
        opacity: 1,
        transition: {
            duration: 0.3,
            ease: [0.22, 1, 0.36, 1] as const
        }
    },
    exit: {
        opacity: 0,
        transition: {
            duration: 0.2,
            ease: [0.55, 0, 1, 0.45] as const
        }
    }
}

export default function PageTransition({ children }: PageTransitionProps) {
    const location = useLocation()

    return (
        <motion.div
            key={location.key}
            variants={pageVariants}
            initial="initial"
            animate="enter"
            exit="exit"
        >
            {children}
        </motion.div>
    )
}
