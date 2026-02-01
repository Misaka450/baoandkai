import { useLocation } from 'react-router-dom'
import { ReactNode } from 'react'

interface PageTransitionProps {
    children: ReactNode
}

/**
 * 页面过渡动画组件
 * 使用 location.key 作为 React key，确保每次页面切换时都会重新触发动画
 */
export default function PageTransition({ children }: PageTransitionProps) {
    const location = useLocation()

    return (
        <div
            key={location.key}
            className="animate-page-transition"
        >
            {children}
        </div>
    )
}
