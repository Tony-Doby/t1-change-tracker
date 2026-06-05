interface InputHintProps {
  children: string
  className?: string
}

export default function InputHint({ children, className = '' }: InputHintProps) {
  return (
    <p className={`text-sm text-text-tertiary mt-1 ${className}`}>
      {children}
    </p>
  )
}
