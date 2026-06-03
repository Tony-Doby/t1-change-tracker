import { Star, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import EmptyState from '../EmptyState'

export default function BookmarkedAgentsCard({ agents }: { agents: any[] }) {
  return (
    <div className="bg-white rounded-lg p-5 shadow-card">
      <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
        <Star className="w-5 h-5 text-warning" /> Agent đang theo dõi
      </h2>
      <div className="space-y-3">
        {agents.length === 0 && (
          <EmptyState icon={<Star className="w-12 h-12" />} title="Chưa có agent nào được đánh dấu" subtitle="Đánh dấu agent để theo dõi nhanh tại đây" />
        )}
        {agents.slice(0, 5).map((a) => (
          <Link key={a.id} to={`/agents/${a.id}`} className="flex items-center justify-between p-2 rounded-md hover:bg-neutral-50 transition-colors">
            <div>
              <p className="text-sm font-medium text-neutral-900">{a.full_name}</p>
              <p className="text-xs text-neutral-500">{a.staff_id}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-neutral-300" />
          </Link>
        ))}
      </div>
    </div>
  )
}
