import type { ReactNode } from 'react'

interface TagProps {
  children: ReactNode
  className?: string
}

export default function Tag({ children, className = '' }: TagProps) {
  return (
    <span className={`inline-flex items-center h-5 px-2 rounded-xs border border-border-light text-xs text-text-secondary ${className}`}>
      {children}
    </span>
  )
}
