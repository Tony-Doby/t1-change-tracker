import type { ReactNode } from 'react'

interface ChipProps {
  children: ReactNode
  className?: string
}

export default function Chip({ children, className = '' }: ChipProps) {
  return (
    <span className={`inline-flex items-center h-6 px-2 rounded-sm bg-bg-quaternary text-xs text-text-secondary ${className}`}>
      {children}
    </span>
  )
}
