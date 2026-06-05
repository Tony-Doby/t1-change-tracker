import type { ReactNode } from 'react'

interface TableProps {
  children: ReactNode
  className?: string
}

export default function Table({ children, className = '' }: TableProps) {
  return (
    <div className={`bg-bg-primary rounded-sm shadow-card border border-border-hairline overflow-hidden ${className}`}>
      <table className="w-full text-left">{children}</table>
    </div>
  )
}
