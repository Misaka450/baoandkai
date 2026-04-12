import { useLocation } from 'react-router-dom'
import { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface PageTransitionProps {
    children: ReactNode
}

const pageVariants = {
    initial: {
        opacity: 0,
        y: 20,
        scale: 0.98
    },
    enter: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.4,
            ease: [0.22, 1, 0.36, 1] as const
        }
    },
    exit: {
        opacity: 0,
        y: -10,
        scale: 1.02,
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
