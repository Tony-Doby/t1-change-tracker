import { Users, ClipboardList, Clock, CheckCircle } from 'lucide-react'
import type { DashboardStats as Stats } from '../../hooks/queries/useDashboardStats'

export default function DashboardStats({ stats, onNavigate }: { stats?: Stats; onNavigate: (href: string) => void }) {
  const items = [
    { label: 'Tổng Agent', value: stats?.totalAgents ?? 0, icon: Users, href: '/agents' },
    { label: 'Tổng Requests', value: stats?.totalRequests ?? 0, icon: ClipboardList, href: '/requests' },
    { label: 'Đang xử lý', value: stats?.pending ?? 0, icon: Clock, href: '/requests?status=step1,step2,step3' },
    { label: 'Hoàn tất', value: stats?.completed ?? 0, icon: CheckCircle, href: '/requests?status=completed' },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((s) => (
        <button
          key={s.label}
          onClick={() => onNavigate(s.href)}
          className="text-left bg-white rounded-lg p-5 shadow-card cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
        >
          <div className="flex items-center gap-2 text-neutral-500 mb-2">
            <s.icon className="w-5 h-5 text-primary" />
            <span className="text-xs font-medium">{s.label}</span>
          </div>
          <p className="text-3xl font-bold text-neutral-900">{s.value}</p>
        </button>
      ))}
    </div>
  )
}
