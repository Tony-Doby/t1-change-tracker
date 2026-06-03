import { Inbox } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatDate } from '../../lib/date-utils'
import EmptyState from '../EmptyState'
import type { Agent } from '../../types'

export default function M1List({ m1List, rankNamesMap }: { m1List: Agent[]; rankNamesMap: Record<string, string> }) {
  if (m1List.length === 0) {
    return <EmptyState icon={<Inbox className="w-8 h-8" />} title="Agent này chưa có M1" className="py-8" />
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[500px]">
        <thead>
          <tr className="bg-neutral-50 border-b border-neutral-200">
            <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500">Mã</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500">Họ tên</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500">Cấp bậc</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500">Ngày ký HĐ</th>
          </tr>
        </thead>
        <tbody>
          {m1List.map((m) => (
            <tr key={m.id} className="border-b border-neutral-100 hover:bg-neutral-50">
              <td className="px-3 py-2">
                <Link to={`/agents/${m.id}`} className="text-primary hover:underline">{m.staff_id}</Link>
              </td>
              <td className="px-3 py-2 text-neutral-900">{m.full_name}</td>
              <td className="px-3 py-2 text-neutral-700">{m.rank_name ?? rankNamesMap[m.rank_id ?? ''] ?? '—'}</td>
              <td className="px-3 py-2 text-neutral-700">{formatDate(m.contract_signing_date)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
