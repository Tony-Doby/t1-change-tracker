import { useState, useRef, useEffect, type SelectHTMLAttributes } from 'react'
import { ChevronDown, X } from 'lucide-react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string
  error?: string
  hint?: string
  options: SelectOption[]
  searchable?: boolean
  clearable?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  placeholder?: string
}

const sizeMap = {
  sm: 'h-8 text-xs px-2.5',
  md: 'h-10 text-sm px-3',
  lg: 'h-12 text-sm px-4',
}

export default function Select({
  label,
  error,
  hint,
  options,
  searchable = false,
  clearable = false,
  size = 'md',
  className = '',
  disabled,
  value,
  onChange,
  ...props
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = searchable
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options

  return (
    <div className={className} ref={ref}>
      {label && (
        <label className="block text-sm font-medium text-text-secondary mb-1">
          {label}
          {props.required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setOpen((v) => !v)}
          className={`w-full rounded-sm border bg-bg-primary text-left transition-colors focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent flex items-center justify-between ${
            error ? 'border-danger' : 'border-border-light'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${sizeMap[size]}`}
        >
          <span className={selected ? 'text-text-primary' : 'text-text-tertiary'}>
            {selected?.label ?? (props.placeholder || 'Chọn...')}
          </span>
          <div className="flex items-center gap-1">
            {clearable && selected && (
              <span
                onClick={(e) => {
                  e.stopPropagation()
                  const ev = { target: { value: '' } } as React.ChangeEvent<HTMLSelectElement>
                  onChange?.(ev)
                }}
                className="p-0.5 rounded hover:bg-bg-secondary text-text-tertiary"
              >
                <X className="w-3.5 h-3.5" />
              </span>
            )}
            <ChevronDown className={`w-4 h-4 text-text-tertiary transition-transform ${open ? 'rotate-180' : ''}`} />
          </div>
        </button>
        {open && (
          <div className="absolute z-50 mt-1 w-full bg-bg-primary border border-border-light rounded-sm shadow-dropdown max-h-60 overflow-auto">
            {searchable && (
              <div className="p-2 border-b border-border-hairline">
                <input
                  autoFocus
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm kiếm..."
                  className="w-full h-8 px-2 text-sm border border-border-light rounded-xs focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
              </div>
            )}
            {filtered.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  const ev = { target: { value: opt.value } } as React.ChangeEvent<HTMLSelectElement>
                  onChange?.(ev)
                  setOpen(false)
                  setSearch('')
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-bg-secondary transition-colors ${
                  opt.value === value ? 'bg-accent-subtle text-accent' : 'text-text-primary'
                }`}
              >
                {opt.label}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-sm text-text-tertiary">Không có kết quả</div>
            )}
          </div>
        )}
      </div>
      {error && <p className="text-sm text-danger mt-1" aria-live="polite">{error}</p>}
      {hint && !error && <p className="text-sm text-text-tertiary mt-1">{hint}</p>}
    </div>
  )
}
