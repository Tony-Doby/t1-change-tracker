import type { ReactNode } from 'react'

interface TableCellProps {
  children?: ReactNode
  className?: string
  align?: 'left' | 'center' | 'right'
}

const alignMap = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

export default function TableCell({ children, className = '', align = 'left' }: TableCellProps) {
  return (
    <td className={`px-3 py-2 text-sm text-text-primary ${alignMap[align]} ${className}`}>
      {children}
    </td>
  )
}
