import { useState, forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  hint?: string
  size?: 'sm' | 'md' | 'lg'
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  isPassword?: boolean
  className?: string
}

const sizeMap = {
  sm: 'h-8 text-xs px-2.5',
  md: 'h-10 text-sm px-3',
  lg: 'h-12 text-sm px-4',
}

const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  {
    label,
    error,
    hint,
    size = 'md',
    leftIcon,
    rightIcon,
    isPassword,
    className = '',
    disabled,
    ...props
  },
  ref
) {
  const [showPw, setShowPw] = useState(false)
  const inputType = isPassword ? (showPw ? 'text' : 'password') : props.type

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-text-secondary mb-1">
          {label}
          {props.required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          {...props}
          ref={ref}
          type={inputType}
          disabled={disabled}
          className={`w-full rounded-sm border bg-bg-primary text-text-primary placeholder:text-text-tertiary transition-colors focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent ${
            error ? 'border-danger' : 'border-border-light'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${leftIcon ? 'pl-9' : ''} ${
            rightIcon || isPassword ? 'pr-9' : ''
          } ${sizeMap[size]}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
            tabIndex={-1}
          >
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
        {rightIcon && !isPassword && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="text-sm text-danger mt-1" aria-live="polite">{error}</p>}
      {hint && !error && <p className="text-sm text-text-tertiary mt-1">{hint}</p>}
    </div>
  )
})

export default TextInput
