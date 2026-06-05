import type { ReactNode } from 'react'

type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'neutral'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  primary: 'bg-accent-subtle text-accent border border-accent/20',
  success: 'bg-success-subtle text-success border border-success/20',
  warning: 'bg-warning-subtle text-warning border border-warning/20',
  danger: 'bg-danger-subtle text-danger border border-danger/20',
  neutral: 'bg-bg-quaternary text-text-secondary border border-border-light',
}

export default function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center h-5 px-2 rounded-pill text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
