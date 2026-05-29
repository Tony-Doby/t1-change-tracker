import { useEffect, useState } from 'react'
import { Search, Filter, Plus, Download, Inbox } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatDate } from '../lib/date-utils'
import { useDebounce } from '../hooks/useDebounce'
import ExportModal from '../components/ExportModal'
import { SkeletonTable } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'
import type { RequestStatus } from '../types'

const allStatuses: RequestStatus[] = ['step1', 'step2', 'step3', 'completed', 'cancelled']

const statusLabels: Record<string, string> = {
  step1: 'B1', step2: 'B2', step3: 'B3',
  completed: 'Hoàn tất', cancelled: 'Đã hủy',
}

const statusColors: Record<string, string> = {
  step1: 'bg-primary-light text-primary', step2: 'bg-primary/10 text-primary',
  step3: 'bg-warning-light text-warning', completed: 'bg-success-light/50 text-success',
  cancelled: 'bg-danger-light text-danger',
}

export default function RequestsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [requests, setRequests] = useState<any[]>([])
  const [t1Map, setT1Map] = useState<Record<string, { full_name: string; staff_id: string }>>({})
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [statusFilter, setStatusFilter] = useState<RequestStatus[]>(() => {
    const statusParam = searchParams.get('status')
    if (statusParam) {
      return statusParam.split(',').filter((s): s is RequestStatus => allStatuses.includes(s as RequestStatus))
    }
    return []
  })
  const [showExport, setShowExport] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRequests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, debouncedSearch])

  useEffect(() => {
    if (statusFilter.length > 0) {
      setSearchParams({ status: statusFilter.join(',') }, { replace: true })
    } else {
      setSearchParams({}, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  async function loadRequests() {
    setLoading(true)
    let query = supabase.from('t1_requests').select('*, agent: agent_id(full_name, staff_id)').is('deleted_at', null)
    if (statusFilter.length > 0) query = query.in('status', statusFilter)
    query = query.order('created_at', { ascending: false })
    const { data, error } = await query
    if (error) console.error(error)
    const list = data ?? []
    setRequests(list)

    const t1Ids = [...new Set(list.flatMap((r: any) => [r.old_t1_id, r.proposed_new_t1_id]).filter(Boolean))]
    if (t1Ids.length > 0) {
      const { data: t1Data } = await supabase
        .from('agents')
        .select('id, full_name, staff_id')
        .in('id', t1Ids)
      const map: Record<string, { full_name: string; staff_id: string }> = {}
      t1Data?.forEach((a: any) => { map[a.id] = a })
      setT1Map(map)
    } else {
      setT1Map({})
    }
    setLoading(false)
  }

  const filtered = requests.filter((r) => {
    if (!debouncedSearch.trim()) return true
    const q = debouncedSearch.toLowerCase()
    return r.id?.toLowerCase().includes(q) || r.agent?.full_name?.toLowerCase().includes(q)
  })

  const counts: Record<string, number> = {}
  allStatuses.forEach((s) => { counts[s] = requests.filter((r) => r.status === s).length })

  const toggleStatus = (s: RequestStatus) => {
    setStatusFilter((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Đề xuất đổi T1</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowExport(true)} className="flex items-center gap-1.5 px-3 h-9 border border-primary text-primary rounded-md text-sm hover:bg-primary-light"><Download className="w-4 h-4" /> Export</button>
          <button className="flex items-center gap-1.5 px-3 h-9 bg-primary text-white rounded-md text-sm hover:bg-primary-hover"><Plus className="w-4 h-4" /> Tạo đề xuất</button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input type="text" placeholder="Tìm kiếm..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-3 h-9 w-[240px] border border-neutral-300 rounded-md text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light" />
        </div>
        <button onClick={() => setStatusFilter([])} className={`flex items-center gap-1.5 px-3 h-9 border rounded-md text-sm ${statusFilter.length === 0 ? 'border-primary text-primary bg-primary-light/30' : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50'}`}><Filter className="w-4 h-4" /> Tất cả</button>
      </div>

      <div className="flex flex-wrap gap-3">
        {allStatuses.map((s) => (
          <button key={s} onClick={() => toggleStatus(s)} className={`px-4 py-2 rounded-md text-sm font-medium transition-opacity ${statusColors[s]} ${statusFilter.includes(s) ? 'ring-2 ring-offset-1 ring-neutral-300' : 'hover:opacity-90'}`}>
            {statusLabels[s]}: {counts[s] ?? 0}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-300">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">Mã</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">Agent</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">T1 cũ → T1 mới</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">Bước</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">Ngày tạo</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonTable rows={5} cols={5} />
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                  <td className="px-4 py-3"><Link to={`/requests/${r.id}`} className="text-primary hover:underline font-medium">#{r.id.slice(0, 8)}</Link></td>
                  <td className="px-4 py-3 text-neutral-900">
                    {r.agent ? (
                      <Link to={`/agents/${r.agent_id}`} className="hover:text-primary hover:underline">
                        {r.agent.full_name} - {r.agent.staff_id}
                      </Link>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    {r.old_t1_id ? (
                      <Link to={`/agents/${r.old_t1_id}`} className="text-neutral-800 font-medium hover:text-neutral-900 hover:underline">
                        {t1Map[r.old_t1_id] ? `${t1Map[r.old_t1_id].full_name} - ${t1Map[r.old_t1_id].staff_id}` : r.old_t1_id.slice(0, 8)}
                      </Link>
                    ) : (
                      <span className="text-neutral-400 italic">Không có T1</span>
                    )}
                    <span className="mx-1 text-neutral-400">→</span>
                    {r.proposed_new_t1_id ? (
                      <Link to={`/agents/${r.proposed_new_t1_id}`} className="text-primary font-medium hover:underline">
                        {t1Map[r.proposed_new_t1_id] ? `${t1Map[r.proposed_new_t1_id].full_name} - ${t1Map[r.proposed_new_t1_id].staff_id}` : r.proposed_new_t1_id.slice(0, 8)}
                      </Link>
                    ) : (
                      <span className="text-neutral-400 italic">Không có T1</span>
                    )}
                  </td>
                  <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[r.status]}`}>{statusLabels[r.status]}</span></td>
                  <td className="px-4 py-3 text-neutral-500">{formatDate(r.created_at)}</td>
                </tr>
              ))
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={5}><EmptyState icon={<Inbox className="w-12 h-12" />} title="Không có đề xuất nào" subtitle="Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm" /></td></tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {showExport && <ExportModal title="Xuất danh sách Requests" onClose={() => setShowExport(false)} data={filtered.map((r) => ({ 'Mã': r.id.slice(0, 8), 'Agent': r.agent ? `${r.agent.full_name} - ${r.agent.staff_id}` : '—', 'T1 cũ': r.old_t1_id ? (t1Map[r.old_t1_id] ? `${t1Map[r.old_t1_id].full_name} - ${t1Map[r.old_t1_id].staff_id}` : r.old_t1_id) : '—', 'T1 mới': r.proposed_new_t1_id ? (t1Map[r.proposed_new_t1_id] ? `${t1Map[r.proposed_new_t1_id].full_name} - ${t1Map[r.proposed_new_t1_id].staff_id}` : r.proposed_new_t1_id) : '—', 'Bước': statusLabels[r.status], 'Ngày tạo': formatDate(r.created_at) }))} filename="requests" hasFilter={statusFilter.length > 0 || !!search} />}
    </div>
  )
}
