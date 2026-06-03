import { AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatDate } from '../../lib/date-utils'
import type { B2Request } from '../../hooks/queries/useB2Requests'

export default function B2PendingAlert({ b2Pending, b2Alert }: { b2Pending: B2Request[]; b2Alert: B2Request[] }) {
  if (b2Pending.length === 0 && b2Alert.length === 0) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <div className="bg-white rounded-lg p-5 shadow-card">
      <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-warning" /> B2 chờ phản hồi chấp thuận (3 ngày làm việc)
      </h2>
      <div className="space-y-3 max-h-[320px] overflow-y-auto">
        {b2Pending.map((r) => {
          const daysLeft = Math.ceil((r.deadline3.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          return (
            <div key={r.id} className="flex items-center justify-between p-3 rounded-md bg-neutral-50">
              <div className="min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">{r.agent ? `${r.agent.full_name} - ${r.agent.staff_id}` : '—'}</p>
                <p className="text-xs text-neutral-500">
                  Ngày xác nhận: {formatDate(r.step2_confirmed_at)} • Hết hạn: {formatDate(r.deadline3)}
                  {daysLeft >= 0 ? <span className="text-warning font-medium"> • Còn {daysLeft} ngày</span> : null}
                </p>
              </div>
              <Link to={`/requests/${r.id}`} className="text-xs bg-white border border-neutral-300 text-neutral-700 px-2 py-1 rounded hover:bg-neutral-100 shrink-0 ml-3">Chi tiết</Link>
            </div>
          )
        })}
        {b2Alert.map((r) => (
          <div key={r.id} className="flex items-center justify-between p-3 rounded-md bg-danger-light/30">
            <div className="min-w-0">
              <p className="text-sm font-medium text-neutral-900 truncate">{r.agent?.full_name ?? '—'} - {r.agent?.staff_id ?? '—'}</p>
              <p className="text-xs text-neutral-500">
                Ngày xác nhận: {formatDate(r.step2_confirmed_at)} • Hết hạn: {formatDate(r.deadline3)}
                <span className="text-danger font-medium"> • Đã quá hạn</span>
              </p>
            </div>
            <Link to={`/requests/${r.id}`} className="text-xs bg-white border border-neutral-300 text-neutral-700 px-2 py-1 rounded hover:bg-neutral-100 shrink-0 ml-3">Chi tiết</Link>
          </div>
        ))}
      </div>
    </div>
  )
}
