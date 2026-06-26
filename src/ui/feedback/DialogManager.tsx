import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface DialogItem {
  id: string
  content: ReactNode
}

interface DialogContextValue {
  openDialog: (content: ReactNode) => string
  closeDialog: (id: string) => void
}

const DialogContext = createContext<DialogContextValue | undefined>(undefined)

const MAX_DIALOGS = 5

export function DialogProvider({ children }: { children: ReactNode }) {
  const [dialogs, setDialogs] = useState<DialogItem[]>([])

  const openDialog = useCallback((content: ReactNode) => {
    const id = Math.random().toString(36).slice(2)
    setDialogs((prev) => {
      const next = [...prev, { id, content }]
      return next.slice(-MAX_DIALOGS)
    })
    return id
  }, [])

  const closeDialog = useCallback((id: string) => {
    setDialogs((prev) => prev.filter((d) => d.id !== id))
  }, [])

  return (
    <DialogContext.Provider value={{ openDialog, closeDialog }}>
      {children}
      {dialogs.map((dialog) => (
        <div key={dialog.id} className="fixed inset-0 z-[60]">
          {dialog.content}
        </div>
      ))}
    </DialogContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDialog() {
  const ctx = useContext(DialogContext)
  if (!ctx) throw new Error('useDialog must be used within DialogProvider')
  return ctx
}
