import type { ReactNode } from 'react'

type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'neutral'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  primary: 'badge-primary',
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  neutral: 'badge-neutral',
}

export default function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  return <span className={`${variantClasses[variant]} ${className}`}>{children}</span>
}
