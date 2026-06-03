export default function RequestInfoCard({ agent, oldT1, newT1 }: { agent?: { full_name: string; staff_id: string } | null; oldT1?: { full_name: string; staff_id: string } | null; newT1?: { full_name: string; staff_id: string } | null }) {
  return (
    <div className="bg-primary-light rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-xs text-neutral-500">Agent</p>
        <p className="text-sm font-medium text-neutral-900">{agent ? `${agent.full_name} - ${agent.staff_id}` : '—'}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-xs text-neutral-500">T1 CŨ</p>
          <p className="text-sm font-medium text-neutral-900">{oldT1 ? `${oldT1.full_name} - ${oldT1.staff_id}` : '—'}</p>
        </div>
        <span className="text-xl text-neutral-400">→</span>
        <div className="text-right">
          <p className="text-xs text-neutral-500">T1 MỚI</p>
          <p className="text-sm font-medium text-neutral-900">{newT1 ? `${newT1.full_name} - ${newT1.staff_id}` : '—'}</p>
        </div>
      </div>
    </div>
  )
}
