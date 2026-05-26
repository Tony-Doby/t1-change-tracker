import { useState, useMemo, useEffect } from 'react'
import { Filter, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface LogItem {
  id: string
  created_at: string
  action_type: string
  description: string | null
  old_t1_id: string | null
  new_t1_id: string | null
  request_id: string | null
  agent_id: string | null
  agent_name?: string
}

const actionTypeLabels: Record<string, { label: string; color: string; dot: string }> = {
  t1_changed: { label: 'Đổi T1', color: 'bg-primary-light text-primary', dot: 'bg-primary' },
  template_generated: { label: 'Soạn mẫu', color: 'bg-warning-light text-warning', dot: 'bg-warning' },
  m1_chose_new_t1: { label: 'M1 chọn T1 mới', color: 'bg-success-light text-success', dot: 'bg-success' },
  m1_stayed_with_t2: { label: 'M1 ở lại T2', color: 'bg-neutral-100 text-neutral-700', dot: 'bg-neutral-500' },
  request_created: { label: 'Tạo đề xuất', color: 'bg-primary-light/50 text-primary', dot: 'bg-primary-light' },
  request_completed: { label: 'Hoàn tất', color: 'bg-success-light text-success', dot: 'bg-success' },
  request_step_changed: { label: 'Chuyển bước', color: 'bg-neutral-100 text-neutral-700', dot: 'bg-neutral-700' },
}

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<LogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('all')
  const [search, setSearch] = useState('')
  const [showFilter, setShowFilter] = useState(false)

  useEffect(() => {
    loadLogs()
  }, [])

  async function loadLogs() {
    setLoading(true)
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*, agent: agent_id(full_name)')
      .order('created_at', { ascending: false })
      .limit(500)
    if (error) { console.error(error); setLoading(false); return }
    setLogs((data ?? []).map((l: any) => ({ ...l, agent_name: l.agent?.full_name ?? null })))
    setLoading(false)
  }

  const allTypes = useMemo(() => {
    const types = new Set(logs.map((l) => l.action_type))
    return ['all', ...Array.from(types)]
  }, [logs])

  const filtered = useMemo(() => {
    let list = [...logs]
    if (filterType !== 'all') {
      list = list.filter((l) => l.action_type === filterType)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((l) =>
        (l.description?.toLowerCase() ?? '').includes(q) ||
        (l.agent_name?.toLowerCase() ?? '').includes(q)
      )
    }
    return list
  }, [filterType, search, logs])

  const grouped = useMemo(() => {
    const g: Record<string, LogItem[]> = {}
    filtered.forEach((item) => {
      const date = new Date(item.created_at).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      if (!g[date]) g[date] = []
      g[date].push(item)
    })
    return g
  }, [filtered])

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-neutral-900">Lịch sử hoạt động</h1>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input type="text" placeholder="Tìm agent..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 h-9 w-[240px] border border-neutral-300 rounded-md text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light" />
        </div>
        <div className="relative">
          <button onClick={() => setShowFilter((v) => !v)} className="flex items-center gap-1.5 px-3 h-9 border border-neutral-300 rounded-md text-sm text-neutral-700 hover:bg-neutral-50">
            <Filter className="w-4 h-4" /> Loại hành động
          </button>
          {showFilter && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowFilter(false)} />
              <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-dropdown border border-neutral-300 z-20 py-1">
                {allTypes.map((t) => (
                  <button key={t} onClick={() => { setFilterType(t); setShowFilter(false) }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 ${filterType === t ? 'text-primary font-medium bg-primary-light/30' : 'text-neutral-700'}`}>
                    {actionTypeLabels[t]?.label ?? t}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <div className="divide-y divide-neutral-100">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date} className="p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-3">{date}</h3>
              <div className="space-y-3">
                {items.map((item) => {
                  const meta = actionTypeLabels[item.action_type] ?? { label: item.action_type, color: 'bg-neutral-100 text-neutral-700', dot: 'bg-neutral-500' }
                  const time = new Date(item.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                  return (
                    <div key={item.id} className="flex items-start gap-3">
                      <div className="w-16 text-xs text-neutral-500 shrink-0 pt-1">{time}</div>
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${meta.dot}`} />
                      <div className="flex-1">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium mr-2 ${meta.color}`}>{meta.label}</span>
                        <span className="text-sm text-neutral-800">{item.description}</span>
                        {(item.old_t1_id || item.new_t1_id) && (
                          <p className="text-xs text-neutral-500 mt-1">
                            {item.old_t1_id && `T1 cũ: ${item.old_t1_id.slice(0, 8)}`}
                            {item.old_t1_id && item.new_t1_id && ' → '}
                            {item.new_t1_id && `T1 mới: ${item.new_t1_id.slice(0, 8)}`}
                          </p>
                        )}
                        {item.request_id && (
                          <Link to={`/requests/${item.request_id}`} className="text-xs text-primary hover:underline mt-0.5 inline-block">#{item.request_id.slice(0, 8)}</Link>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
          {Object.keys(grouped).length === 0 && (
            <div className="p-12 text-center text-neutral-500 text-sm">Không có dữ liệu</div>
          )}
        </div>
      </div>
    </div>
  )
}
