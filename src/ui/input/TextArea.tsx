import type { TextareaHTMLAttributes } from 'react'

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
  className?: string
}

export default function TextArea({ label, error, hint, className = '', disabled, ...props }: TextAreaProps) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-text-secondary mb-1">
          {label}
          {props.required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}
      <textarea
        {...props}
        disabled={disabled}
        className={`w-full min-h-[60px] rounded-sm border bg-bg-primary text-text-primary placeholder:text-text-tertiary transition-colors focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent px-3 py-2 text-sm resize-y ${
          error ? 'border-danger' : 'border-border-light'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
      {error && <p className="text-sm text-danger mt-1" aria-live="polite">{error}</p>}
      {hint && !error && <p className="text-sm text-text-tertiary mt-1">{hint}</p>}
    </div>
  )
}
