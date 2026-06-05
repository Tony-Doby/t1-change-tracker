import { useState, useCallback, useRef } from 'react'

export function useColumnResize(initialWidths: (number | undefined)[]) {
  const [widths, setWidths] = useState<(number | undefined)[]>(initialWidths)
  const resizingRef = useRef<{ index: number; startX: number; startWidth: number } | null>(null)

  const startResize = useCallback((index: number, startX: number) => {
    const currentWidth = widths[index] ?? 150
    resizingRef.current = { index, startX, startWidth: currentWidth }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [widths])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizingRef.current) return
    const { index, startX, startWidth } = resizingRef.current
    const delta = e.clientX - startX
    const newWidth = Math.max(60, startWidth + delta)
    setWidths((prev) => {
      const next = [...prev]
      next[index] = newWidth
      return next
    })
  }, [])

  const stopResize = useCallback(() => {
    if (!resizingRef.current) return
    resizingRef.current = null
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [])

  // Attach global listeners on demand
  const attachResizeListeners = useCallback(() => {
    const onMove = (e: MouseEvent) => handleMouseMove(e)
    const onUp = () => {
      stopResize()
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [handleMouseMove, stopResize])

  return {
    widths,
    startResize: (index: number, e: React.MouseEvent) => {
      startResize(index, e.clientX)
      attachResizeListeners()
    },
  }
}
