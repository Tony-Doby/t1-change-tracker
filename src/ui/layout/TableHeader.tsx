import type { ReactNode } from 'react'
import { ArrowUp, ArrowDown } from 'lucide-react'

interface TableHeaderProps {
  children: ReactNode
  className?: string
}

export default function TableHeader({ children, className = '' }: TableHeaderProps) {
  return (
    <thead className={`bg-bg-secondary ${className}`}>
      <tr>{children}</tr>
    </thead>
  )
}

interface TableHeaderCellProps {
  children?: ReactNode
  sortable?: boolean
  sortDirection?: 'asc' | 'desc' | null
  onSort?: () => void
  className?: string
  width?: string | number
  resizable?: boolean
  onResizeStart?: (e: React.MouseEvent) => void
}

export function TableHeaderCell({
  children,
  sortable = false,
  sortDirection = null,
  onSort,
  className = '',
  width,
  resizable = false,
  onResizeStart,
}: TableHeaderCellProps) {
  const style: React.CSSProperties = {}
  if (width !== undefined) {
    style.width = typeof width === 'number' ? `${width}px` : width
    style.minWidth = typeof width === 'number' ? `${width}px` : width
  }

  return (
    <th
      className={`relative px-3 py-3 text-xs font-medium uppercase tracking-wider text-text-tertiary ${
        sortable ? 'cursor-pointer hover:text-text-secondary select-none' : ''
      } ${className}`}
      style={style}
      onClick={sortable ? onSort : undefined}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortable && sortDirection && (
          <span className="text-text-tertiary">
            {sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
          </span>
        )}
      </div>
      {resizable && (
        <div
          className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-accent/30 transition-colors"
          onMouseDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onResizeStart?.(e)
          }}
          role="separator"
          aria-orientation="vertical"
        />
      )}
    </th>
  )
}
