import type { ReactNode } from 'react'

interface MobileNavItem {
  label: string
  icon: ReactNode
  active?: boolean
  onClick?: () => void
}

interface MobileNavigationBarProps {
  items: MobileNavItem[]
  className?: string
}

export default function MobileNavigationBar({ items, className = '' }: MobileNavigationBarProps) {
  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 h-14 bg-bg-primary border-t border-border-light flex items-center justify-around z-40 lg:hidden ${className}`}
    >
      {items.map((item, i) => (
        <button
          key={i}
          onClick={item.onClick}
          className={`flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors ${
            item.active ? 'text-accent' : 'text-text-tertiary'
          }`}
        >
          <span className="w-5 h-5 flex items-center justify-center">{item.icon}</span>
          <span className="text-[0.625rem]">{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
