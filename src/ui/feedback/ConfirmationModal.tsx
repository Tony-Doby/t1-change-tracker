import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import Modal from '../layout/Modal'

interface ConfirmationModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  description?: string
  confirmText?: string
  confirmType?: 'danger' | 'primary'
  requireType?: boolean
  typeText?: string
  loading?: boolean
}

export default function ConfirmationModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Xác nhận',
  confirmType = 'danger',
  requireType = false,
  typeText = 'DELETE',
  loading = false,
}: ConfirmationModalProps) {
  const [typed, setTyped] = useState('')

  if (!open) return null

  const canConfirm = !requireType || typed === typeText

  return (
    <Modal onClose={onClose} title={title} size="sm">
      <div className="flex items-start gap-3 mb-4">
        <div className="shrink-0 w-10 h-10 rounded-full bg-danger-subtle flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-danger" />
        </div>
        <div>
          {description && <p className="text-sm text-text-secondary">{description}</p>}
        </div>
      </div>

      {requireType && (
        <div className="mb-4">
          <p className="text-sm text-text-secondary mb-2">
            Nhập <strong className="text-text-primary">{typeText}</strong> để xác nhận:
          </p>
          <input
            autoFocus
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            className="w-full h-10 px-3 rounded-sm border border-border-light bg-bg-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
          />
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-4 h-10 rounded-sm border border-border-light text-sm text-text-secondary hover:bg-bg-secondary transition-colors"
        >
          Hủy
        </button>
        <button
          onClick={async () => {
            await onConfirm()
            setTyped('')
          }}
          disabled={!canConfirm || loading}
          className={`px-4 h-10 rounded-sm text-sm text-white transition-colors ${
            confirmType === 'danger'
              ? 'bg-danger hover:bg-danger-hover'
              : 'bg-accent hover:bg-accent-hover'
          } ${!canConfirm || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? 'Đang xử lý...' : confirmText}
        </button>
      </div>
    </Modal>
  )
}
