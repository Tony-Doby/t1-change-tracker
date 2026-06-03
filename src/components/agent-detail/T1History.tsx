import { Inbox } from 'lucide-react'
import { formatDate } from '../../lib/date-utils'
import EmptyState from '../EmptyState'

export default function T1History({
  contractSigningDate,
  agentT1Name,
  t1History,
  getAgentName,
}: {
  contractSigningDate?: string | null
  agentT1Name: string
  t1History: any[]
  getAgentName: (id: string | null) => string
}) {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="flex flex-col items-center"><div className="w-2.5 h-2.5 rounded-full bg-primary" /><div className="w-0.5 flex-1 bg-neutral-300" /></div>
        <div className="pb-4">
          <p className="text-xs text-neutral-500">{formatDate(contractSigningDate)}</p>
          <p className="text-sm text-neutral-900">Tạo tài khoản, T1: {agentT1Name}</p>
        </div>
      </div>
      {t1History.map((c) => (
        <div key={c.id} className="flex gap-4">
          <div className="flex flex-col items-center"><div className="w-2.5 h-2.5 rounded-full bg-primary" /><div className="w-0.5 flex-1 bg-neutral-300" /></div>
          <div className="pb-4">
            <p className="text-xs text-neutral-500">{formatDate(c.change_date)}</p>
            <p className="text-sm text-neutral-900">Đổi T1 từ {getAgentName(c.old_t1_id)} sang {getAgentName(c.new_t1_id)}</p>
          </div>
        </div>
      ))}
      {t1History.length === 0 && <EmptyState icon={<Inbox className="w-8 h-8" />} title="Chưa có lịch sử đổi T1" className="py-8" />}
    </div>
  )
}
