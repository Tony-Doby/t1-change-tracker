import type { ReactNode } from 'react'

interface FormSectionProps {
  title?: string
  children: ReactNode
  className?: string
}

export default function FormSection({ title, children, className = '' }: FormSectionProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {title && <h3 className="text-[1.23rem] font-medium text-text-primary">{title}</h3>}
      {children}
    </div>
  )
}
