interface InputErrorHelperProps {
  message?: string
  className?: string
}

export default function InputErrorHelper({ message, className = '' }: InputErrorHelperProps) {
  if (!message) return null
  return (
    <p className={`text-sm text-danger mt-1 ${className}`} aria-live="polite">
      {message}
    </p>
  )
}
