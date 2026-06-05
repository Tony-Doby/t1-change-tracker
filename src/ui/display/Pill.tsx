import type { ReactNode } from 'react'

interface PillProps {
  children: ReactNode
  active?: boolean
  className?: string
}

export default function Pill({ children, active = false, className = '' }: PillProps) {
  return (
    <span
      className={`inline-flex items-center h-5 px-2 rounded-pill text-xs font-medium transition-colors ${
        active
          ? 'bg-accent text-white'
          : 'bg-bg-quaternary text-text-tertiary'
      } ${className}`}
    >
      {children}
    </span>
  )
}
