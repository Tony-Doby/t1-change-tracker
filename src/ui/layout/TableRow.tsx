import type { ReactNode } from 'react'

interface TableRowProps {
  children: ReactNode
  className?: string
  selected?: boolean
  onClick?: () => void
}

export default function TableRow({ children, className = '', selected = false, onClick }: TableRowProps) {
  return (
    <tr
      className={`h-[52px] border-b border-border-hairline transition-colors duration-100 ${
        selected ? 'bg-accent-subtle' : 'hover:bg-bg-secondary/50'
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  )
}
