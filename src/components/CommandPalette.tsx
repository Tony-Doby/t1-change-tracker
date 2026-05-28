import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, Users, ClipboardList, LayoutDashboard, Activity, Upload, Trash2, Calendar, Mail } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useFocusTrap } from '../hooks/useFocusTrap'

interface PaletteItem {
  id: string
  label: string
  subtitle?: string
  icon: React.ElementType
  action: () => void
  group: string
}

const pages: { label: string; path: string; icon: React.ElementType }[] = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Agents', path: '/agents', icon: Users },
  { label: 'Requests', path: '/requests', icon: ClipboardList },
  { label: 'Activity Log', path: '/activity', icon: Activity },
  { label: 'Upload Data', path: '/upload', icon: Upload },
  { label: 'Trash', path: '/trash', icon: Trash2 },
  { label: 'Holidays', path: '/holidays', icon: Calendar },
  { label: 'Email Templates', path: '/templates', icon: Mail },
]

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<PaletteItem[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useFocusTrap(panelRef, () => setOpen(false))

  // Keyboard shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      document.body.style.overflow = ''
      setQuery('')
      setItems([])
    }
  }, [open])

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setItems(
        pages.map((p) => ({
          id: `page-${p.path}`,
          label: p.label,
          icon: p.icon,
          action: () => { navigate(p.path); setOpen(false) },
          group: 'Trang',
        }))
      )
      setSelectedIndex(0)
      return
    }

    setLoading(true)
    const term = q.trim()
    const like = `%${term}%`

    const [agentsRes, requestsRes] = await Promise.all([
      supabase
        .from('agents')
        .select('id, full_name, staff_id')
        .is('deleted_at', null)
        .or(`full_name.ilike.${like},staff_id.ilike.${like}`)
        .limit(5),
      supabase
        .from('t1_requests')
        .select('id, agent:agent_id(full_name, staff_id)')
        .is('deleted_at', null)
        .or(`id.ilike.${like},agent.full_name.ilike.${like}`)
        .limit(5),
    ])

    const results: PaletteItem[] = []

    // Pages
    const matchedPages = pages.filter((p) => p.label.toLowerCase().includes(term.toLowerCase()))
    matchedPages.forEach((p) =>
      results.push({
        id: `page-${p.path}`,
        label: p.label,
        icon: p.icon,
        action: () => { navigate(p.path); setOpen(false) },
        group: 'Trang',
      })
    )

    // Agents
    ;(agentsRes.data ?? []).forEach((a: any) =>
      results.push({
        id: `agent-${a.id}`,
        label: a.full_name,
        subtitle: a.staff_id,
        icon: Users,
        action: () => { navigate(`/agents/${a.id}`); setOpen(false) },
        group: 'Agent',
      })
    )

    // Requests
    ;(requestsRes.data ?? []).forEach((r: any) =>
      results.push({
        id: `req-${r.id}`,
        label: `Request #${r.id.slice(0, 8)}`,
        subtitle: r.agent?.full_name ?? '',
        icon: ClipboardList,
        action: () => { navigate(`/requests/${r.id}`); setOpen(false) },
        group: 'Đề xuất',
      })
    )

    setItems(results)
    setSelectedIndex(0)
    setLoading(false)
  }, [navigate])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(query), 200)
    return () => clearTimeout(debounceRef.current)
  }, [query, search])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => (i + 1) % items.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => (i - 1 + items.length) % items.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      items[selectedIndex]?.action()
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  if (!open) return null

  const grouped = items.reduce<Record<string, PaletteItem[]>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = []
    acc[item.group].push(item)
    return acc
  }, {})

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={() => setOpen(false)} />
      <div
        ref={panelRef}
        className="relative bg-white rounded-xl shadow-modal w-full max-w-2xl max-h-[70vh] flex flex-col animate-fade-in-scale"
        role="dialog"
        aria-modal="true"
        onKeyDown={onKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-100">
          <Search className="w-5 h-5 text-neutral-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm agent, đề xuất, hoặc điều hướng..."
            className="flex-1 bg-transparent outline-none text-sm text-neutral-900 placeholder:text-neutral-400"
          />
          {loading && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />}
          <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-neutral-100 text-neutral-400 shrink-0" aria-label="Đóng">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-2">
          {items.length === 0 && query.trim() && (
            <div className="py-8 text-center text-sm text-neutral-500">Không tìm thấy kết quả</div>
          )}
          {Object.entries(grouped).map(([group, groupItems]) => (
            <div key={group} className="mb-2">
              <div className="px-3 py-1.5 text-xs font-semibold text-neutral-400 uppercase tracking-wide">{group}</div>
              {groupItems.map((item) => {
                const globalIdx = items.findIndex((i) => i.id === item.id)
                const isSelected = globalIdx === selectedIndex
                return (
                  <button
                    key={item.id}
                    onClick={item.action}
                    onMouseEnter={() => setSelectedIndex(globalIdx)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                      isSelected ? 'bg-primary-light text-primary' : 'text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-primary' : 'text-neutral-400'}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{item.label}</p>
                      {item.subtitle && <p className="text-xs text-neutral-400 truncate">{item.subtitle}</p>}
                    </div>
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 bg-neutral-100 rounded text-[10px]">↑</kbd> <kbd className="px-1.5 py-0.5 bg-neutral-100 rounded text-[10px]">↓</kbd> Chọn</span>
            <span><kbd className="px-1.5 py-0.5 bg-neutral-100 rounded text-[10px]">Enter</kbd> Mở</span>
          </div>
          <span><kbd className="px-1.5 py-0.5 bg-neutral-100 rounded text-[10px]">Esc</kbd> Đóng</span>
        </div>
      </div>
    </div>
  )
}
