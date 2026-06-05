import { useState, useCallback, useRef, useEffect } from 'react'

interface UseTableSelectionOptions {
  totalIds: string[]
  excludeRefs?: React.RefObject<HTMLElement | null>[]
}

export function useTableSelection({ totalIds, excludeRefs }: UseTableSelectionOptions) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const lastClickedRef = useRef<string | null>(null)
  const tableRef = useRef<HTMLTableElement | null>(null)

  const isSelected = useCallback((id: string) => selected.has(id), [selected])

  const toggle = useCallback(
    (id: string, shiftKey?: boolean) => {
      setSelected((prev) => {
        const next = new Set(prev)
        if (shiftKey && lastClickedRef.current) {
          const startIdx = totalIds.indexOf(lastClickedRef.current)
          const endIdx = totalIds.indexOf(id)
          if (startIdx !== -1 && endIdx !== -1) {
            const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx]
            const shouldSelect = !prev.has(id)
            for (let i = from; i <= to; i++) {
              if (shouldSelect) next.add(totalIds[i])
              else next.delete(totalIds[i])
            }
          }
        } else {
          if (next.has(id)) next.delete(id)
          else next.add(id)
        }
        return next
      })
      lastClickedRef.current = id
    },
    [totalIds]
  )

  const selectAll = useCallback(
    (checked: boolean) => {
      setSelected(checked ? new Set(totalIds) : new Set())
      lastClickedRef.current = null
    },
    [totalIds]
  )

  const clear = useCallback(() => {
    setSelected(new Set())
    lastClickedRef.current = null
  }, [])

  const selectedArray = Array.from(selected)
  const allSelected = totalIds.length > 0 && totalIds.every((id) => selected.has(id))
  const someSelected = selected.size > 0 && !allSelected

  // Click outside to deselect
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      // Skip if clicked inside excluded elements (e.g. BulkActionsBar)
      const isExcluded = excludeRefs?.some((ref) => ref.current?.contains(target))
      if (isExcluded) return
      if (tableRef.current && !tableRef.current.contains(target)) {
        clear()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [clear, excludeRefs])

  return {
    selected: selectedArray,
    selectedSet: selected,
    isSelected,
    toggle,
    selectAll,
    clear,
    allSelected,
    someSelected,
    tableRef,
  }
}
