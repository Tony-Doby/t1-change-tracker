import type { ReactNode } from 'react'

interface FormFieldProps {
  label?: string
  htmlFor?: string
  error?: string
  hint?: string
  children: ReactNode
  className?: string
  required?: boolean
}

export default function FormField({ label, htmlFor, error, hint, children, className = '', required = false }: FormFieldProps) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className="block text-sm font-medium text-text-secondary mb-1">
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-sm text-danger mt-1" aria-live="polite">{error}</p>}
      {hint && !error && <p className="text-sm text-text-tertiary mt-1">{hint}</p>}
    </div>
  )
}
