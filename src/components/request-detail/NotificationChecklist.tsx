import { useState } from 'react'

const labels: Record<string, string> = {
  agent: 'Agent tự đề xuất',
  introducer: 'Ngưới giới thiệu',
  old_upline: 'Tuyến trên cũ (T1, T2...)',
  new_upline: 'Tuyến trên mới (T1, T2, T3)',
  old_downline: 'Tuyến dưới cũ (M1)',
}

export default function NotificationChecklist() {
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  return (
    <div className="bg-white rounded-lg shadow-card p-5">
      <h2 className="text-lg font-semibold text-neutral-900 mb-4">Checklist thông báo hoàn tất</h2>
      <div className="space-y-2">
        {Object.entries(labels).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={checked[key] || false} onChange={(e) => setChecked((prev) => ({ ...prev, [key]: e.target.checked }))} className="rounded border-neutral-300" />
            <span className="text-neutral-700">{label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
