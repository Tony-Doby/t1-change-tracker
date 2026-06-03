import { useState } from 'react'
import { formatDateTime } from '../../lib/date-utils'

interface StepHistoryItem {
  description: string
  created_at: string
}

export default function StepHistory({ history }: { history: StepHistoryItem[] }) {
  const [expanded, setExpanded] = useState(false)
  if (history.length === 0) return null
  return (
    <div className="bg-white rounded-lg shadow-card p-5">
      <button onClick={() => setExpanded((v) => !v)} className="flex items-center gap-2 text-lg font-semibold text-neutral-900 mb-2">
        📝 Lịch sử chuyển bước <span className="text-xs text-neutral-500 font-normal">({expanded ? 'Thu gọn' : 'Mở rộng'})</span>
      </button>
      {expanded && (
        <div className="space-y-3 mt-3">
          {history.map((h, idx) => (
            <div key={idx} className="flex items-start gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
              <div><p className="text-neutral-900">{h.description}</p><p className="text-xs text-neutral-500">{formatDateTime(h.created_at)}</p></div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
