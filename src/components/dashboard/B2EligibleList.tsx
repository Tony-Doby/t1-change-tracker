import { useState } from 'react'
import { CheckCircle, Search, X, Inbox } from 'lucide-react'
import { formatDate } from '../../lib/date-utils'
import EmptyState from '../EmptyState'
import type { B2Request } from '../../hooks/queries/useB2Requests'

interface Props {
  items: B2Request[]
  onConfirm: (req: B2Request) => void
  onCancel: (req: B2Request) => void
  onEmail: (agentId: string, requestId: string) => void
}

export default function B2EligibleList({ items, onConfirm, onCancel, onEmail }: Props) {
  const [search, setSearch] = useState('')
  const q = search.trim().toLowerCase()
  const filtered = q
    ? items.filter((r) => {
        const a = r.agent
        const old = r.old_t1
        const n = r.new_t1
        return (
          (a?.full_name && a.full_name.toLowerCase().includes(q)) ||
          (a?.staff_id && a.staff_id.toLowerCase().includes(q)) ||
          (old?.full_name && old.full_name.toLowerCase().includes(q)) ||
          (old?.staff_id && old.staff_id.toLowerCase().includes(q)) ||
          (n?.full_name && n.full_name.toLowerCase().includes(q)) ||
          (n?.staff_id && n.staff_id.toLowerCase().includes(q))
        )
      })
    : items

  if (items.length === 0) return null

  return (
    <div className="bg-white rounded-lg p-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-success" /> B2 đủ điều kiện xác nhận thay đổi ({filtered.length})
        </h2>
        <div className="relative w-48 sm:w-56">
          <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm agent..."
            className="w-full h-9 pl-9 pr-8 border border-neutral-300 rounded-md text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"><X className="w-4 h-4" /></button>
          )}
        </div>
      </div>
      <div className="space-y-3 max-h-[320px] overflow-y-auto">
        {filtered.length === 0 && (
          <EmptyState icon={<Inbox className="w-12 h-12" />} title="Không tìm thấy kết quả" subtitle="Thử tìm theo tên hoặc mã nhân viên" />
        )}
        {filtered.map((r) => (
          <div key={r.id} className="flex items-center justify-between p-3 rounded-md bg-success-light/30">
            <div className="min-w-0">
              <p className="text-sm font-medium text-neutral-900 truncate">{r.agent?.full_name ?? '—'} - {r.agent?.staff_id ?? '—'}</p>
              <p className="text-xs text-neutral-500">{r.old_t1 ? `${r.old_t1.full_name} - ${r.old_t1.staff_id}` : '—'} → {r.new_t1 ? `${r.new_t1.full_name} - ${r.new_t1.staff_id}` : '—'}</p>
              <p className="text-xs text-neutral-500">Ngày xác nhận: {formatDate(r.step2_confirmed_at)} • Đã chờ đủ 4 ngày làm việc</p>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-3">
              <button onClick={() => onEmail(r.agent_id, r.id)} className="text-xs bg-white border border-neutral-300 text-neutral-700 px-2 py-1 rounded hover:bg-neutral-100 whitespace-nowrap">Tạo email mẫu</button>
              <button onClick={() => onConfirm(r)} className="text-xs bg-success text-white px-2 py-1 rounded hover:opacity-90">Xác nhận thay đổi</button>
              <button onClick={() => onCancel(r)} className="text-xs bg-white border border-danger text-danger px-2 py-1 rounded hover:bg-danger-light">Hủy đề xuất</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
