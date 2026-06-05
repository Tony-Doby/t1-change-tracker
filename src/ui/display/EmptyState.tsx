import type { ReactNode } from 'react'
import { Inbox, SearchX, ShieldAlert, Trash2 } from 'lucide-react'

type EmptyStateContext = 'no_data' | 'filter_empty' | 'no_permission' | 'soft_delete'

interface EmptyStateProps {
  context?: EmptyStateContext
  icon?: ReactNode
  title?: string
  subtitle?: string
  action?: ReactNode
  className?: string
}

const contextMap: Record<EmptyStateContext, { icon: ReactNode; title: string; subtitle: string }> = {
  no_data: {
    icon: <Inbox className="w-12 h-12" />,
    title: 'Không có dữ liệu',
    subtitle: 'Dữ liệu sẽ xuất hiện ở đây khi có bản ghi.',
  },
  filter_empty: {
    icon: <SearchX className="w-12 h-12" />,
    title: 'Không tìm thấy kết quả',
    subtitle: 'Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm.',
  },
  no_permission: {
    icon: <ShieldAlert className="w-12 h-12" />,
    title: 'Không có quyền truy cập',
    subtitle: 'Bạn không có quyền xem nội dung này.',
  },
  soft_delete: {
    icon: <Trash2 className="w-12 h-12" />,
    title: 'Thùng rác trống',
    subtitle: 'Các bản ghi đã xóa sẽ xuất hiện ở đây.',
  },
}

export default function EmptyState({
  context = 'no_data',
  icon,
  title,
  subtitle,
  action,
  className = '',
}: EmptyStateProps) {
  const ctx = contextMap[context]
  return (
    <div className={`flex flex-col items-center justify-center py-12 text-center ${className}`}>
      <div className="w-12 h-12 text-gray-8 mb-3">{icon ?? ctx.icon}</div>
      <p className="text-[1.23rem] font-medium text-text-secondary mb-1">{title ?? ctx.title}</p>
      {(subtitle ?? ctx.subtitle) && <p className="text-sm text-text-tertiary">{subtitle ?? ctx.subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
