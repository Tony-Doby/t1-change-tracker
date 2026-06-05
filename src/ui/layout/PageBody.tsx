import type { ReactNode } from 'react'

interface PageBodyProps {
  children: ReactNode
  className?: string
}

export default function PageBody({ children, className = '' }: PageBodyProps) {
  return (
    <div className={`flex flex-row gap-4 ${className}`}>
      {children}
    </div>
  )
}
