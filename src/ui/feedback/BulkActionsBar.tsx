import type { ReactNode } from 'react'
import { X } from 'lucide-react'

interface BulkActionsBarProps {
  count: number
  actions: ReactNode
  onClear: () => void
  className?: string
}

export default function BulkActionsBar({ count, actions, onClear, className = '' }: BulkActionsBarProps) {
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 px-5 py-3 bg-bg-primary border border-border-light rounded-sm shadow-super-heavy animate-in slide-in-from-bottom-4 ${className}`}
      role="toolbar"
      aria-label="Hành động hàng loạt"
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center justify-center h-6 min-w-6 px-1.5 rounded-pill bg-accent text-white text-xs font-medium">
          {count}
        </span>
        <span className="text-sm text-text-secondary">đã chọn</span>
      </div>
      <div className="h-4 w-px bg-border-light" />
      <div className="flex items-center gap-2">{actions}</div>
      <button
        onClick={onClear}
        className="ml-1 inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-sm hover:bg-bg-secondary transition-colors"
        aria-label="Bỏ chọn"
      >
        <X className="w-4 h-4 text-text-tertiary" aria-hidden="true" />
      </button>
    </div>
  )
}
