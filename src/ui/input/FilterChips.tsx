import { X } from 'lucide-react'

export interface FilterChip {
  id: string
  label: string
}

interface FilterChipsProps {
  chips: FilterChip[]
  onRemove: (id: string) => void
  onClearAll?: () => void
  className?: string
}

export default function FilterChips({ chips, onRemove, onClearAll, className = '' }: FilterChipsProps) {
  if (chips.length === 0) return null

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {chips.map((chip) => (
        <span
          key={chip.id}
          className="inline-flex items-center gap-1.5 h-7 pl-3 pr-1.5 rounded-pill bg-accent-subtle text-accent text-xs font-medium border border-accent/20"
        >
          {chip.label}
          <button
            onClick={() => onRemove(chip.id)}
            className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-accent/20 transition-colors"
            aria-label={`Xóa bộ lọc ${chip.label}`}
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      {onClearAll && (
        <button
          onClick={onClearAll}
          className="text-xs text-text-tertiary hover:text-text-secondary underline transition-colors"
        >
          Xóa tất cả
        </button>
      )}
    </div>
  )
}
