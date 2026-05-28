import { useState, useEffect, useRef } from 'react'
import { Bell, Check, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatDateTime } from '../lib/date-utils'

interface NotificationItem {
  id: string
  created_at: string
  description: string | null
  request_id: string | null
  agent_id: string | null
  action_type: string
}

const NOTIFICATIONS_READ_KEY = 't1_notifications_read'

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(false)
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(NOTIFICATIONS_READ_KEY) || '[]')
    setReadIds(new Set(saved))
  }, [])

  useEffect(() => {
    if (!open) return
    setLoading(true)
    supabase
      .from('activity_logs')
      .select('id, created_at, description, request_id, agent_id, action_type')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setItems(data ?? [])
        setLoading(false)
      })
  }, [open])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const unreadCount = items.filter((i) => !readIds.has(i.id)).length

  const markAllRead = () => {
    const allIds = items.map((i) => i.id)
    const next = new Set([...readIds, ...allIds])
    setReadIds(next)
    localStorage.setItem(NOTIFICATIONS_READ_KEY, JSON.stringify([...next]))
  }

  const markRead = (id: string) => {
    const next = new Set(readIds)
    next.add(id)
    setReadIds(next)
    localStorage.setItem(NOTIFICATIONS_READ_KEY, JSON.stringify([...next]))
  }

  return (
    <div className="relative" ref={ref}>
      <button
        className="relative p-1.5 rounded-md hover:bg-neutral-100"
        onClick={() => setOpen((v) => !v)}
        aria-label="Thông báo"
        aria-expanded={open}
      >
        <Bell className="w-5 h-5 text-neutral-500" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-dropdown border border-neutral-300 z-20 flex flex-col max-h-[480px] animate-fade-in-scale">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
              <h3 className="text-sm font-semibold text-neutral-900">Thông báo</h3>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-primary hover:underline flex items-center gap-1">
                  <Check className="w-3 h-3" /> Đánh dấu đã đọc
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="py-8 text-center text-sm text-neutral-400">Đang tải...</div>
              ) : items.length === 0 ? (
                <div className="py-8 text-center text-sm text-neutral-400">Chưa có thông báo</div>
              ) : (
                items.map((item) => {
                  const isUnread = !readIds.has(item.id)
                  return (
                    <div
                      key={item.id}
                      onClick={() => markRead(item.id)}
                      className={`px-4 py-3 border-b border-neutral-50 hover:bg-neutral-50 cursor-pointer transition-colors ${
                        isUnread ? 'bg-primary-light/20' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <Clock className="w-3.5 h-3.5 text-neutral-400 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-neutral-800 line-clamp-2">{item.description ?? 'Hoạt động mới'}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] text-neutral-400">{formatDateTime(item.created_at)}</span>
                            {item.request_id && (
                              <Link
                                to={`/requests/${item.request_id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-[10px] text-primary hover:underline"
                              >
                                Xem request
                              </Link>
                            )}
                          </div>
                        </div>
                        {isUnread && <div className="w-2 h-2 bg-primary rounded-full mt-1 shrink-0" />}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="px-4 py-2 border-t border-neutral-100 text-center">
              <Link to="/activity" onClick={() => setOpen(false)} className="text-xs text-primary hover:underline">
                Xem tất cả hoạt động
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
