import { useEffect, useRef, type RefObject } from 'react'

// Focus stack để hỗ trợ nested modals
const focusStack: HTMLElement[] = []

export function useFocusTrap(ref: RefObject<HTMLElement | null>, onEscape?: () => void) {
  const activeRef = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Push vào focus stack
    focusStack.push(el)
    activeRef.current = true

    const focusable = () =>
      Array.from(
        el.querySelectorAll<HTMLElement>(
          'a[href], button, textarea, input[type="text"], input[type="email"], input[type="password"], input[type="number"], input[type="search"], input[type="date"], select, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((e) => !(e as any).disabled && !e.getAttribute('aria-hidden'))

    const first = () => focusable()[0]
    const last = () => focusable()[focusable().length - 1]

    const handleKey = (e: KeyboardEvent) => {
      // Chỉ xử lý nếu modal này là modal trên cùng
      if (focusStack[focusStack.length - 1] !== el) return

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
    // Auto-focus first element sau khi stack cập nhật
    const timer = setTimeout(() => {
      if (focusStack[focusStack.length - 1] === el) {
        first()?.focus()
      }
    }, 0)

    return () => {
      el.removeEventListener('keydown', handleKey)
      clearTimeout(timer)
      // Pop khỏi stack
      const idx = focusStack.indexOf(el)
      if (idx !== -1) focusStack.splice(idx, 1)
      activeRef.current = false
    }
  }, [ref, onEscape])
}
