import { useState, useEffect, useRef } from 'react'
import { Bell, Check, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatDateTime } from '../lib/date-utils'
import { useAuth } from '../hooks/useAuth'
import { markNotificationAsRead, markAllNotificationsAsRead } from '../lib/notifications'
import type { Notification } from '../types'

export default function NotificationDropdown() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  async function loadNotifications() {
    if (!user?.id) return
    setLoading(true)
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    setItems(data ?? [])
    setLoading(false)
  }

  async function loadUnreadCount() {
    if (!user?.id) return
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false)
    setUnreadCount(count ?? 0)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUnreadCount()
    const interval = setInterval(loadUnreadCount, 30000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  useEffect(() => {
    if (!open) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadNotifications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const handleMarkAllRead = async () => {
    if (!user?.id) return
    await markAllNotificationsAsRead(user.id)
    setItems((prev) => prev.map((i) => ({ ...i, read: true })))
    setUnreadCount(0)
  }

  const handleMarkRead = async (id: string) => {
    await markNotificationAsRead(id)
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, read: true } : i)))
    setUnreadCount((c) => Math.max(0, c - 1))
  }

  const typeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'request_new': return '📝'
      case 'request_completed': return '✅'
      case 'request_cancelled': return '❌'
      case 'comment_new': return '💬'
      case 'agent_deactivated': return '🔴'
      case 'agent_restored': return '🟢'
      case 'b2_alert': return '⚠️'
      case 'm1_expired': return '⏰'
      default: return '🔔'
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        className="relative min-w-[40px] min-h-[40px] flex items-center justify-center rounded-md hover:bg-neutral-100"
        onClick={() => setOpen((v) => !v)}
        aria-label="Thông báo"
        aria-expanded={open}
      >
        <Bell className="w-5 h-5 text-neutral-500" aria-hidden="true" />
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
                <button onClick={handleMarkAllRead} className="text-xs text-primary hover:underline flex items-center gap-1 min-h-[32px] px-2 rounded-sm hover:bg-primary-light/20 transition-colors">
                  <Check className="w-3 h-3" aria-hidden="true" /> Đánh dấu đã đọc
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
                  const isUnread = !item.read
                  return (
                    <div
                      key={item.id}
                      onClick={() => { if (isUnread) handleMarkRead(item.id) }}
                      className={`px-4 py-3 border-b border-neutral-50 hover:bg-neutral-50 cursor-pointer transition-colors ${
                        isUnread ? 'bg-primary-light/20' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-sm shrink-0 mt-0.5">{typeIcon(item.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-800 line-clamp-1">{item.title}</p>
                          {item.message && <p className="text-xs text-neutral-500 line-clamp-2 mt-0.5">{item.message}</p>}
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" aria-hidden="true" />
                              {formatDateTime(item.created_at)}
                            </span>
                            {item.link && (
                              <Link
                                to={item.link}
                                onClick={(e) => e.stopPropagation()}
                                className="text-[10px] text-primary hover:underline"
                              >
                                Xem chi tiết
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
