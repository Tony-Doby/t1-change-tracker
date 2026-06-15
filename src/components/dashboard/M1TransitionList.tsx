import { useMemo, useState } from 'react'
import { AlertTriangle, Search, X, Mail, Inbox } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatDate } from '../../lib/date-utils'
import EmptyState from '../EmptyState'
import type { TransitionTask } from '../../hooks/queries/useM1Transitions'
import type { Agent } from '../../types'

interface Props {
  tasks: TransitionTask[]
  processingId: string | null
  canCreateRequest: (agent: Partial<Agent> | null | undefined) => boolean
  onEmail: (agentId: string, taskId?: string) => void
  onCreateRequest: (agentId: string) => void
  onApplyT2: (task: TransitionTask) => void
}

type M1Filter = 'all' | 'eligible' | 'not-eligible' | 'emailed'

const FILTERS: { key: M1Filter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'eligible', label: 'Đủ điều kiện' },
  { key: 'not-eligible', label: 'Không đủ điều kiện' },
  { key: 'emailed', label: 'Đã gửi email' },
]

export default function M1TransitionList({ tasks, processingId, canCreateRequest, onEmail, onCreateRequest, onApplyT2 }: Props) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<M1Filter>('all')
  const q = search.trim().toLowerCase()

  const filtered = useMemo(() => {
    let result = tasks
    if (q) {
      result = result.filter((t) =>
        t.m1_agent?.full_name?.toLowerCase().includes(q) ||
        t.m1_agent?.staff_id?.toLowerCase().includes(q) ||
        t.temp_t1?.full_name?.toLowerCase().includes(q) ||
        t.temp_t1?.staff_id?.toLowerCase().includes(q) ||
        t.departed_agent?.full_name?.toLowerCase().includes(q) ||
        t.departed_agent?.staff_id?.toLowerCase().includes(q)
      )
    }
    switch (filter) {
      case 'eligible':
        result = result.filter((t) => canCreateRequest(t.m1_agent))
        break
      case 'not-eligible':
        result = result.filter((t) => !canCreateRequest(t.m1_agent))
        break
      case 'emailed':
        result = result.filter((t) => t.email_sent_count > 0)
        break
      case 'all':
      default:
        break
    }
    return result
  }, [tasks, q, filter, canCreateRequest])

  return (
    <div className="bg-white rounded-lg p-4 shadow-card h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 flex-shrink-0">
        <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-warning" /> M1 Transition ({filtered.length})
        </h2>
        <div className="relative w-full sm:w-56">
          <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm agent..."
            className="w-full h-9 pl-9 pr-8 border border-neutral-300 rounded-md text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"><X className="w-4 h-4" /></button>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-3 flex-shrink-0">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              filter === f.key
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
        {filtered.length === 0 && (
          <EmptyState icon={<Inbox className="w-12 h-12" />} title="Không có M1 nào đang trong giai đoạn transition"
            subtitle={search ? 'Không tìm thấy kết quả phù hợp' : 'Tất cả M1 đã được xử lý hoặc chưa có request hoàn tất'} />
        )}
        {filtered.map((t) => (
          <div key={t.id} className={`flex items-start justify-between gap-4 p-3 rounded-md ${t.status === 'expired' ? 'bg-danger-light/30' : 'bg-neutral-50'}`}>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <Link to={`/agents/${t.m1_agent_id}`} className="text-sm font-medium text-neutral-900 truncate hover:text-primary">{t.m1_agent?.full_name ?? '—'} - {t.m1_agent?.staff_id ?? '—'}</Link>
                {t.status === 'expired' ? (
                  <span className="text-xs text-danger font-medium shrink-0">Quá hạn {Math.abs(t.daysLeft)} ngày</span>
                ) : (
                  <span className="text-xs text-neutral-500 shrink-0">Còn {t.daysLeft} ngày</span>
                )}
              </div>
              <p className="text-xs text-neutral-500 truncate">T1 cũ: {t.departed_agent ? `${t.departed_agent.full_name} - ${t.departed_agent.staff_id}` : '—'}</p>
              <p className="text-xs text-neutral-500 truncate">T1 tạm: {t.temp_t1 ? `${t.temp_t1.full_name} - ${t.temp_t1.staff_id}` : (t.temp_t1_id === null ? 'Không có' : '—')}</p>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${t.parent_request_id ? 'bg-primary-light text-primary' : 'bg-warning-light text-warning'}`}>
                  {t.parent_request_id ? 'T1 cũ thay đổi' : 'Deactivate agent'}
                </span>
                {t.email_sent_count > 0 ? (
                  <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium bg-blue-100 text-blue-700" title={`Gửi lần cuối: ${formatDate(t.last_email_sent_at)}`}>
                    <Mail className="w-3 h-3" /> Đã gửi {t.email_sent_count} lần
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] text-neutral-400"><Mail className="w-3 h-3" /> Chưa gửi email</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => onEmail(t.m1_agent_id, t.id)} className="text-xs bg-white border border-neutral-300 text-neutral-700 px-2 py-1 rounded hover:bg-neutral-100 whitespace-nowrap">
                {t.email_sent_count > 0 ? 'Gửi lại email' : 'Tạo email mẫu'}
              </button>
              <button onClick={() => onCreateRequest(t.m1_agent_id)} disabled={!canCreateRequest(t.m1_agent)}
                className="text-xs bg-white border border-primary text-primary px-2 py-1 rounded hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
                Tạo đề xuất
              </button>
              <button onClick={() => onApplyT2(t)} disabled={processingId === t.id}
                className="text-xs bg-white border border-neutral-300 text-neutral-700 px-2 py-1 rounded hover:bg-neutral-100 disabled:opacity-50 whitespace-nowrap">
                {processingId === t.id ? 'Đang xử lý...' : 'Ở lại với T2'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
