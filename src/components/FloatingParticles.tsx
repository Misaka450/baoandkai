import React, { useMemo, memo } from 'react'
import Icon from './icons/Icons'

interface FloatingParticlesProps {
  count?: number
  className?: string
}

interface Particle {
  id: number
  icon: 'favorite' | 'star' | 'auto_awesome'
  size: number
  left: number
  delay: number
  duration: number
  opacity: number
  rotate: number
}

const iconList: Particle['icon'][] = ['favorite', 'star', 'favorite', 'auto_awesome', 'star', 'favorite', 'star', 'auto_awesome']

const ParticleElement = memo(({ particle }: { particle: Particle }) => (
  <div
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
    <Icon name={particle.icon} size={particle.size} />
  </div>
))

ParticleElement.displayName = 'ParticleElement'

const FloatingParticlesComponent: React.FC<FloatingParticlesProps> = ({
  count = 15,
  className = ''
}) => {
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: count }, (_, i): Particle => ({
      id: i,
      icon: iconList[i % iconList.length] ?? 'favorite',
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
        <ParticleElement key={particle.id} particle={particle} />
      ))}
    </div>
  )
}

const FloatingParticles = memo(FloatingParticlesComponent)

FloatingParticles.displayName = 'FloatingParticles'

export default FloatingParticles
