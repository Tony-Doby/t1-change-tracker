import type { ReactNode } from 'react'

interface ShowPageContainerProps {
  children: ReactNode
  className?: string
}

export default function ShowPageContainer({ children, className = '' }: ShowPageContainerProps) {
  return (
    <div className={`max-w-5xl mx-auto px-4 sm:px-10 py-6 ${className}`}>
      {children}
    </div>
  )
}
