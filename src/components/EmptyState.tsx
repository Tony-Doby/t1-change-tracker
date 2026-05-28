import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  icon?: ReactNode
  title?: string
  subtitle?: string
  action?: ReactNode
  className?: string
}

export default function EmptyState({
  icon,
  title = 'Không có dữ liệu',
  subtitle,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`empty-state ${className}`}>
      <div className="empty-state-icon">
        {icon ?? <Inbox className="w-12 h-12" />}
      </div>
      <p className="empty-state-title">{title}</p>
      {subtitle && <p className="empty-state-subtitle">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
