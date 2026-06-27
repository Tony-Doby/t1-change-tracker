import type { ElementType } from 'react'
import { Link } from 'react-router-dom'

export interface PageTabItem {
  label: string
  icon: ElementType
  path: string
  badge?: number
}

interface PageTabsProps {
  tabs: PageTabItem[]
  /** Path của tab đang active (đã giải qua resolveActiveNav — phủ cả detail route). */
  activePath: string | null
}

// FEAT-038: Thanh page-tabs tái dùng, điều hướng bằng ROUTE (mỗi tab là 1 <Link>).
// Khác DriveManagerTabs (tab nội-trang theo state) — component này dùng cho điều hướng cấp nhóm trên sidebar.
// Style đồng bộ với DriveManagerTabs (border-b-2, text-accent khi active).
export default function PageTabs({ tabs, activePath }: PageTabsProps) {
  if (tabs.length <= 1) return null

  return (
    <div className="border-b border-border-hairline mb-6">
      <div className="flex items-center gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const active = tab.path === activePath
          const Icon = tab.icon
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`inline-flex items-center gap-2 px-4 h-10 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                active
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
              }`}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-danger text-white">
                  {tab.badge}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
