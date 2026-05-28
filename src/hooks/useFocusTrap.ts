import { useEffect, type RefObject } from 'react'

export function useFocusTrap(ref: RefObject<HTMLElement | null>, onEscape?: () => void) {
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const focusable = () =>
      Array.from(
        el.querySelectorAll<HTMLElement>(
          'a[href], button, textarea, input[type="text"], input[type="email"], input[type="password"], input[type="number"], input[type="search"], input[type="date"], select, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((e) => !(e as any).disabled && !e.getAttribute('aria-hidden'))

    const first = () => focusable()[0]
    const last = () => focusable()[focusable().length - 1]

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscape) {
        onEscape()
        return
      }
      if (e.key !== 'Tab') return

      const f = focusable()
      if (f.length === 0) return

      const active = document.activeElement as HTMLElement
      if (e.shiftKey && active === first()) {
        e.preventDefault()
        last()?.focus()
      } else if (!e.shiftKey && active === last()) {
        e.preventDefault()
        first()?.focus()
      }
    }

    el.addEventListener('keydown', handleKey)
    // Auto-focus first element
    setTimeout(() => first()?.focus(), 0)
    return () => el.removeEventListener('keydown', handleKey)
  }, [ref, onEscape])
}
