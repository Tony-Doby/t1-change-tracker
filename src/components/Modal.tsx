import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { useFocusTrap } from '../hooks/useFocusTrap'

interface ModalProps {
  children: ReactNode
  onClose: () => void
  title?: string
  maxWidth?: string
  showClose?: boolean
}

export default function Modal({ children, onClose, title, maxWidth = 'max-w-lg', showClose = true }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null)
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={ref}
        className={`relative bg-white rounded-xl shadow-modal w-full ${maxWidth} max-h-[92vh] overflow-y-auto animate-fade-in-scale`}
        role="dialog"
        aria-modal="true"
      >
        {(title || showClose) && (
          <div className="flex items-center justify-between p-5 border-b border-neutral-100">
            {title && <h2 className="text-xl font-semibold text-neutral-900">{title}</h2>}
            {showClose && (
              <button
                onClick={onClose}
                className="p-1 rounded-md hover:bg-neutral-100 text-neutral-500 hover:text-neutral-700 transition-colors ml-auto"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
