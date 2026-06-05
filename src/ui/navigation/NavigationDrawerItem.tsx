import type { ReactNode } from 'react'

interface NavigationDrawerItemProps {
  label: string
  icon: ReactNode
  active?: boolean
  soon?: boolean
  badge?: number
  onClick?: () => void
  collapsed?: boolean
}

export default function NavigationDrawerItem({
  label,
  icon,
  active = false,
  soon = false,
  badge,
  onClick,
  collapsed = false,
}: NavigationDrawerItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-sm text-sm transition-colors ${
        active
          ? 'bg-accent-subtle text-accent font-medium'
          : 'text-text-secondary hover:bg-bg-secondary'
      } ${soon ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={soon}
      title={collapsed ? label : undefined}
    >
      <span className="shrink-0 w-5 h-5 flex items-center justify-center">{icon}</span>
      {!collapsed && (
        <>
          <span className="flex-1 text-left">{label}</span>
          {badge !== undefined && (
            <span
              className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                badge > 0 ? 'bg-danger text-white' : 'bg-gray-6 text-white'
              }`}
            >
              {badge}
            </span>
          )}
          {soon && <span className="text-xs text-text-tertiary">Soon</span>}
        </>
      )}
    </button>
  )
}
