import { Inbox } from 'lucide-react'
import { formatDate } from '../../lib/date-utils'
import EmptyState from '../EmptyState'

export default function AsT1History({ asT1History, agentId, getAgentName }: { asT1History: any[]; agentId: string; getAgentName: (id: string | null) => string }) {
  if (asT1History.length === 0) {
    return <EmptyState icon={<Inbox className="w-8 h-8" />} title="Agent này chưa từng làm T1 của ai" className="py-8" />
  }
  return (
    <div className="space-y-4">
      {asT1History.map((c) => (
        <div key={c.id} className="flex gap-4">
          <div className="flex flex-col items-center"><div className="w-2.5 h-2.5 rounded-full bg-primary" /><div className="w-0.5 flex-1 bg-neutral-300" /></div>
          <div className="pb-4">
            <p className="text-xs text-neutral-500">{formatDate(c.change_date)}</p>
            <p className="text-sm text-neutral-900">{c.new_t1_id === agentId ? `Nhận agent ${getAgentName(c.agent_id)}` : `Agent ${getAgentName(c.agent_id)} chuyển đi`}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
