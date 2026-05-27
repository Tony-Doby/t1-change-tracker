import { useEffect, useState } from 'react'
import { Search, Filter, Plus, Download } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatDate } from '../lib/date-utils'
import ExportModal from '../components/ExportModal'
import type { RequestStatus } from '../types'

const allStatuses: RequestStatus[] = ['step1', 'step2', 'step3', 'step4', 'step5', 'completed', 'cancelled']

const statusLabels: Record<string, string> = {
  step1: 'B1', step2: 'B2', step3: 'B3', step4: 'B4', step5: 'B5',
  completed: 'Hoàn tất', cancelled: 'Đã hủy',
}

const statusColors: Record<string, string> = {
  step1: 'bg-primary-light text-primary', step2: 'bg-primary/10 text-primary',
  step3: 'bg-warning-light text-warning', step4: 'bg-neutral-100 text-neutral-700',
  step5: 'bg-success-light text-success', completed: 'bg-success-light/50 text-success',
  cancelled: 'bg-danger-light text-danger',
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [t1Map, setT1Map] = useState<Record<string, { full_name: string; staff_id: string }>>({})
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('all')
  const [showExport, setShowExport] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRequests()
  }, [statusFilter])

  async function loadRequests() {
    setLoading(true)
    let query = supabase.from('t1_requests').select('*, agent: agent_id(full_name, staff_id)').is('deleted_at', null)
    if (statusFilter !== 'all') query = query.eq('status', statusFilter)
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
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return r.id?.toLowerCase().includes(q) || r.agent?.full_name?.toLowerCase().includes(q)
  })

  const counts: Record<string, number> = {}
  allStatuses.forEach((s) => { counts[s] = requests.filter((r) => r.status === s).length })

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
        <button onClick={() => setStatusFilter('all')} className={`flex items-center gap-1.5 px-3 h-9 border rounded-md text-sm ${statusFilter === 'all' ? 'border-primary text-primary bg-primary-light/30' : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50'}`}><Filter className="w-4 h-4" /> Tất cả</button>
      </div>

      <div className="flex flex-wrap gap-3">
        {allStatuses.map((s) => (
          <button key={s} onClick={() => setStatusFilter(s === statusFilter ? 'all' : s)} className={`px-4 py-2 rounded-md text-sm font-medium transition-opacity ${statusColors[s]} ${statusFilter === s ? 'ring-2 ring-offset-1 ring-neutral-300' : 'hover:opacity-90'}`}>
            {statusLabels[s]}: {counts[s] ?? 0}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <table className="w-full text-sm">
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
              <tr><td colSpan={5} className="px-4 py-12 text-center text-neutral-500">Đang tải...</td></tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                  <td className="px-4 py-3"><Link to={`/requests/${r.id}`} className="text-primary hover:underline font-medium">#{r.id.slice(0, 8)}</Link></td>
                  <td className="px-4 py-3 text-neutral-900">{r.agent ? `${r.agent.full_name} - ${r.agent.staff_id}` : '—'}</td>
                  <td className="px-4 py-3 text-neutral-700">{r.old_t1_id ? (t1Map[r.old_t1_id] ? `${t1Map[r.old_t1_id].full_name} - ${t1Map[r.old_t1_id].staff_id}` : r.old_t1_id.slice(0, 8)) : '—'} → {r.proposed_new_t1_id ? (t1Map[r.proposed_new_t1_id] ? `${t1Map[r.proposed_new_t1_id].full_name} - ${t1Map[r.proposed_new_t1_id].staff_id}` : r.proposed_new_t1_id.slice(0, 8)) : '—'}</td>
                  <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[r.status]}`}>{statusLabels[r.status]}</span></td>
                  <td className="px-4 py-3 text-neutral-500">{formatDate(r.created_at)}</td>
                </tr>
              ))
            )}
            {!loading && filtered.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-neutral-500">Không có dữ liệu</td></tr>}
          </tbody>
        </table>
      </div>

      {showExport && <ExportModal title="Xuất danh sách Requests" onClose={() => setShowExport(false)} data={filtered.map((r) => ({ 'Mã': r.id.slice(0, 8), 'Agent': r.agent ? `${r.agent.full_name} - ${r.agent.staff_id}` : '—', 'T1 cũ': r.old_t1_id ? (t1Map[r.old_t1_id] ? `${t1Map[r.old_t1_id].full_name} - ${t1Map[r.old_t1_id].staff_id}` : r.old_t1_id) : '—', 'T1 mới': r.proposed_new_t1_id ? (t1Map[r.proposed_new_t1_id] ? `${t1Map[r.proposed_new_t1_id].full_name} - ${t1Map[r.proposed_new_t1_id].staff_id}` : r.proposed_new_t1_id) : '—', 'Bước': statusLabels[r.status], 'Ngày tạo': formatDate(r.created_at) }))} filename="requests" hasFilter={statusFilter !== 'all' || !!search} />}
    </div>
  )
}
