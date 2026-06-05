import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useFocusTrap } from '../../hooks/useFocusTrap'

interface ModalProps {
  children: ReactNode
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showClose?: boolean
  className?: string
}

const sizeMap: Record<string, string> = {
  sm: 'max-w-[400px]',
  md: 'max-w-[560px]',
  lg: 'max-w-[640px]',
  xl: 'max-w-[800px]',
}

export default function Modal({ children, onClose, title, size = 'md', showClose = true, className = '' }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null)
  const titleId = title ? `modal-title-${Math.random().toString(36).slice(2, 9)}` : undefined
  useFocusTrap(ref, onClose)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={ref}
        className={`relative bg-bg-primary rounded-sm shadow-modal w-full ${sizeMap[size]} max-h-[92vh] overflow-y-auto animate-fade-in-scale ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        {(title || showClose) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-hairline">
            {title && <h2 id={titleId} className="text-[1.23rem] font-medium text-text-primary">{title}</h2>}
            {showClose && (
              <button
                onClick={onClose}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-sm hover:bg-bg-secondary text-text-tertiary hover:text-text-secondary transition-colors ml-auto"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            )}
          </div>
        )}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body
  )
}
