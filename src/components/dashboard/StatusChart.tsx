import { useNavigate } from 'react-router-dom'

const statusLabels: Record<string, string> = {
  step1: 'B1', step2: 'B2', step3: 'B3', step4: 'B4', step5: 'B5',
  completed: 'Hoàn tất', cancelled: 'Đã hủy',
}

const statusColors: Record<string, string> = {
  step1: 'bg-primary-light', step2: 'bg-primary/10', step3: 'bg-warning-light',
  step4: 'bg-neutral-100', step5: 'bg-success-light',
  completed: 'bg-success-light/50', cancelled: 'bg-danger-light',
}

export default function StatusChart({ counts }: { counts: Record<string, number> }) {
  const navigate = useNavigate()
  const max = Math.max(...Object.values(counts), 1)

  return (
    <div className="bg-white rounded-lg p-5 shadow-card">
      <h2 className="text-lg font-semibold text-neutral-900 mb-4">📊 Trạng thái đề xuất</h2>
      <div className="space-y-3">
        {(['step1','step2','step3','completed','cancelled'] as string[]).map((s) => {
          const count = counts[s] ?? 0
          const pct = (count / max) * 100
          return (
            <button key={s} onClick={() => navigate(`/requests?status=${s}`)}
              className="w-full flex items-center gap-3 cursor-pointer hover:bg-neutral-50 rounded-md px-1 py-1 transition-colors">
              <span className="text-xs font-medium text-neutral-500 w-16 text-left">{statusLabels[s]}</span>
              <div className="flex-1 h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${statusColors[s]}`} style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs font-medium text-neutral-700 w-6 text-right">{count}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
