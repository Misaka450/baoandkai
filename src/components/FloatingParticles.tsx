import React, { useMemo } from 'react'
import Icon from './icons/Icons'

interface FloatingParticlesProps {
  count?: number
  className?: string
}

const FloatingParticles: React.FC<FloatingParticlesProps> = ({
  count = 15,
  className = ''
}) => {
  const particles = useMemo(() => {
    const icons = ['favorite', 'star', 'favorite', 'auto_awesome', 'star', 'favorite', 'star', 'auto_awesome']
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      icon: icons[i % icons.length],
      size: Math.random() * 20 + 12,
      left: Math.random() * 100,
      delay: Math.random() * 15,
      duration: Math.random() * 10 + 15,
      opacity: Math.random() * 0.15 + 0.05,
      rotate: Math.random() * 360,
    }))
  }, [count])

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute text-primary animate-float"
          style={{
            left: `${particle.left}%`,
            top: '-5%',
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
            opacity: particle.opacity,
            transform: `rotate(${particle.rotate}deg)`,
            willChange: 'transform, opacity',
          }}
        >
          <Icon name={particle.icon as any} size={particle.size} />
        </div>
      ))}
    </div>
  )
}

export default FloatingParticles
