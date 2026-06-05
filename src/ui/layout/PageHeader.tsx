import type { ReactNode } from 'react'
import { X, ChevronDown } from 'lucide-react'

interface PageHeaderProps {
  title: string
  icon?: ReactNode
  children?: ReactNode
  onClose?: () => void
  onCollapse?: () => void
  className?: string
}

export default function PageHeader({ title, icon, children, onClose, onCollapse, className = '' }: PageHeaderProps) {
  return (
    <div className={`flex items-center justify-between gap-4 mb-6 ${className}`}>
      <div className="flex items-center gap-3 min-w-0">
        {icon && <span className="shrink-0 text-text-secondary">{icon}</span>}
        <h1 className="text-[1.85rem] font-semibold text-text-primary tracking-tight truncate">{title}</h1>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {children}
        {onCollapse && (
          <button
            onClick={onCollapse}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-sm hover:bg-bg-secondary text-text-tertiary transition-colors"
            aria-label="Thu gọn"
          >
            <ChevronDown className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
        {onClose && (
          <button
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-sm hover:bg-bg-secondary text-text-tertiary transition-colors"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}
