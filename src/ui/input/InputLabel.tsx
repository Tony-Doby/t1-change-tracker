interface InputLabelProps {
  children: string
  htmlFor?: string
  required?: boolean
  className?: string
}

export default function InputLabel({ children, htmlFor, required = false, className = '' }: InputLabelProps) {
  return (
    <label htmlFor={htmlFor} className={`block text-sm font-medium text-text-secondary mb-1 ${className}`}>
      {children}
      {required && <span className="text-danger ml-0.5">*</span>}
    </label>
  )
}
