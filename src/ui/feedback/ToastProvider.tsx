import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastItem {
  id: string
  message: string
  type: ToastType
  dedupeKey?: string
}

interface ToastContextValue {
  show: (message: string, type?: ToastType) => void
  enqueue: (message: string, type?: ToastType, dedupeKey?: string) => void
  enqueueSuccess: (message: string, dedupeKey?: string) => void
  enqueueError: (message: string, dedupeKey?: string) => void
  enqueueWarning: (message: string, dedupeKey?: string) => void
  enqueueInfo: (message: string, dedupeKey?: string) => void
  closeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

const MAX_QUEUE = 5

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timers = useRef<Record<string, number>>({})

  const closeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    if (timers.current[id]) {
      window.clearTimeout(timers.current[id])
      delete timers.current[id]
    }
  }, [])

  const enqueue = useCallback((message: string, type: ToastType = 'info', dedupeKey?: string) => {
    setToasts((prev) => {
      if (dedupeKey && prev.some((t) => t.dedupeKey === dedupeKey)) return prev
      const next = [...prev, { id: Math.random().toString(36).slice(2), message, type, dedupeKey }]
      return next.slice(-MAX_QUEUE)
    })
    const id = Math.random().toString(36).slice(2)
    timers.current[id] = window.setTimeout(() => {
      closeToast(id)
    }, 3000)
  }, [closeToast])

  const show = useCallback((message: string, type: ToastType = 'info') => enqueue(message, type), [enqueue])
  const enqueueSuccess = useCallback((message: string, dedupeKey?: string) => enqueue(message, 'success', dedupeKey), [enqueue])
  const enqueueError = useCallback((message: string, dedupeKey?: string) => enqueue(message, 'error', dedupeKey), [enqueue])
  const enqueueWarning = useCallback((message: string, dedupeKey?: string) => enqueue(message, 'warning', dedupeKey), [enqueue])
  const enqueueInfo = useCallback((message: string, dedupeKey?: string) => enqueue(message, 'info', dedupeKey), [enqueue])

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
  }

  const styles = {
    success: 'bg-success-subtle border border-success/20 text-success',
    error: 'bg-danger-subtle border border-danger/20 text-danger',
    warning: 'bg-warning-subtle border border-warning/20 text-warning',
    info: 'bg-accent-subtle border border-accent/20 text-accent',
  }

  return (
    <ToastContext.Provider value={{ show, enqueue, enqueueSuccess, enqueueError, enqueueWarning, enqueueInfo, closeToast }}>
      {children}
      <div
        className="fixed top-4 right-4 z-[100] space-y-2 w-full max-w-[400px]"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((toast) => {
          const Icon = icons[toast.type]
          return (
            <div
              key={toast.id}
              className={`flex items-start gap-3 p-4 rounded-sm shadow-dropdown animate-toast-slide-in ${styles[toast.type]}`}
              onMouseEnter={() => {
                if (timers.current[toast.id]) {
                  window.clearTimeout(timers.current[toast.id])
                }
              }}
              onMouseLeave={() => {
                timers.current[toast.id] = window.setTimeout(() => closeToast(toast.id), 3000)
              }}
            >
              <Icon className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="flex-1 text-sm font-medium text-text-primary">{toast.message}</p>
              <button
                onClick={() => closeToast(toast.id)}
                className="shrink-0 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-sm text-text-tertiary hover:text-text-secondary transition-colors"
                aria-label="Đóng thông báo"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
