import type { ReactNode } from 'react'

interface PageContainerProps {
  children: ReactNode
  className?: string
}

export default function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <div className={`flex flex-col max-w-7xl mx-auto px-4 sm:px-10 ${className}`}>
      {children}
    </div>
  )
}
