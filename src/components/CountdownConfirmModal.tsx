import { useState, useEffect } from 'react'
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
      setRemaining(countdownSeconds)
      return
    }
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
      ? 'bg-danger text-white hover:bg-danger/90'
      : 'bg-primary text-white hover:bg-primary-hover'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-modal w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
          <button onClick={onCancel} className="text-neutral-400 hover:text-neutral-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="text-sm text-neutral-600">{children}</div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            className="px-4 h-9 border border-neutral-300 rounded-md text-sm text-neutral-700 hover:bg-neutral-50"
          >
            Hủy thao tác
          </button>
          <button
            onClick={onConfirm}
            disabled={remaining > 0}
            className={`px-4 h-9 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed ${btnClass}`}
          >
            {remaining > 0 ? `${confirmText} (${remaining})` : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
