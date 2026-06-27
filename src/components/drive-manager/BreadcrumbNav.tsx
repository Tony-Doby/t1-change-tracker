import { ChevronRight } from 'lucide-react'

export interface BreadcrumbNavItem {
  label: string
  onClick?: () => void
}

interface BreadcrumbNavProps {
  items: BreadcrumbNavItem[]
  className?: string
}

export default function BreadcrumbNav({ items, className = '' }: BreadcrumbNavProps) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center gap-1 text-sm">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-text-tertiary" />}
            {item.onClick && i < items.length - 1 ? (
              <button
                type="button"
                onClick={item.onClick}
                className="text-text-tertiary hover:text-text-secondary transition-colors"
              >
                {item.label}
              </button>
            ) : (
              <span className="text-text-primary font-medium">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
