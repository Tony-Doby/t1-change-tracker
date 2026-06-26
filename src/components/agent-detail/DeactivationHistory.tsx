import { Inbox } from 'lucide-react'
import { formatDate } from '../../lib/date-utils'
import EmptyState from '../EmptyState'

import type { AgentDeactivationSnapshot } from '../../types'

export default function DeactivationHistory({ history }: { history: AgentDeactivationSnapshot[] }) {
  if (history.length === 0) {
    return <EmptyState icon={<Inbox className="w-8 h-8" />} title="Chưa có lịch sử chấm dứt" className="py-8" />
  }
  return (
    <div className="space-y-4">
      {history.map((d) => (
        <div key={d.id} className="border border-neutral-200 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-neutral-900">{formatDate(d.deactivated_at)}</p>
            {d.restored_at && <span className="text-xs bg-success-light text-success px-2 py-0.5 rounded-full">Đã khôi phục</span>}
          </div>
          <p className="text-sm text-neutral-700"><span className="text-neutral-500">Ngày chấm dứt:</span> {formatDate(d.end_date)}</p>
          <p className="text-sm text-neutral-700"><span className="text-neutral-500">Lý do:</span> {d.deactivation_reason}</p>
          {d.restored_at && <p className="text-sm text-neutral-700"><span className="text-neutral-500">Ngày khôi phục:</span> {formatDate(d.restored_at)}</p>}
        </div>
      ))}
    </div>
  )
}
