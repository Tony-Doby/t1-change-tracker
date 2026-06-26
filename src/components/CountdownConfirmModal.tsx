import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  title: string
  children: React.ReactNode
  confirmText?: string
  confirmVariant?: 'primary' | 'danger'
  countdownSeconds?: number
  onConfirm: () => void
  onCancel: () => void
}

export default function CountdownConfirmModal({
  open,
  title,
  children,
  confirmText = 'Xác nhận',
  confirmVariant = 'primary',
  countdownSeconds = 10,
  onConfirm,
  onCancel,
}: Props) {
  const [remaining, setRemaining] = useState(countdownSeconds)

  useEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRemaining(countdownSeconds)
      return
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRemaining(countdownSeconds)
    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [open, countdownSeconds])

  if (!open) return null

  const btnClass =
    confirmVariant === 'danger'
      ? 'bg-danger text-white hover:bg-danger-hover'
      : 'bg-accent text-white hover:bg-accent-hover'

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Full-page backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onCancel}
        aria-hidden="true"
      />
      {/* Centered popup */}
      <div className="relative bg-bg-primary rounded-sm shadow-modal w-full max-w-md mx-4 p-6 space-y-4 animate-fade-in-scale">
        <div className="flex items-center justify-between">
          <h3 className="text-[1.23rem] font-medium text-text-primary">{title}</h3>
          <button
            onClick={onCancel}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-sm text-text-tertiary hover:text-text-secondary hover:bg-bg-secondary transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        <div className="text-sm text-text-secondary">{children}</div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            className="px-4 h-9 border border-border-light rounded-sm text-sm text-text-secondary hover:bg-bg-secondary transition-colors"
          >
            Hủy thao tác
          </button>
          <button
            onClick={onConfirm}
            disabled={remaining > 0}
            className={`px-4 h-9 rounded-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${btnClass}`}
          >
            {remaining > 0 ? `${confirmText} (${remaining})` : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
