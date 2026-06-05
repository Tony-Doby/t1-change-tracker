import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Star, Power, PowerOff } from 'lucide-react'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import { useAgentDetailQuery } from '../hooks/queries/useAgentDetail'
import CreateRequestModal from '../components/CreateRequestModal'
import DeactivateAgentModal from '../components/DeactivateAgentModal'
import RestoreAgentModal from '../components/RestoreAgentModal'
import { SkeletonText } from '../components/Skeleton'
import AgentInfoTab from '../components/agent-detail/AgentInfoTab'
import AgentHistoryTab from '../components/agent-detail/AgentHistoryTab'
import PageHeader from '../ui/layout/PageHeader'
import Badge from '../ui/display/Badge'
import Card from '../ui/layout/Card'

export default function AgentDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [mainTab, setMainTab] = useState<'info' | 'history'>('info')
  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const [restoreOpen, setRestoreOpen] = useState(false)

  const role = user?.role ?? 'viewer'

  const { data, isLoading } = useAgentDetailQuery(id)
  const agent = data?.agent
  const relatedMap = data?.relatedMap ?? {}
  const t1History = data?.t1History ?? []
  const asT1History = data?.asT1History ?? []
  const m1List = data?.m1List ?? []
  const deactivationHistory = data?.deactivationHistory ?? []
  const rankNamesMap = data?.rankNamesMap ?? {}
  const divisionMap = data?.divisionMap ?? {}

  const handleDeactivateClose = () => {
    setDeactivateOpen(false)
    if (id) queryClient.invalidateQueries({ queryKey: ['agent', 'detail', id] })
  }

  const handleRestoreClose = () => {
    setRestoreOpen(false)
    if (id) queryClient.invalidateQueries({ queryKey: ['agent', 'detail', id] })
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <SkeletonText lines={2} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="space-y-3"><SkeletonText lines={10} /></Card>
          <Card className="space-y-3"><SkeletonText lines={6} /></Card>
        </div>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="text-center py-12">
        <p className="text-text-tertiary">Không tìm thấy agent</p>
        <Link to="/agents" className="text-accent hover:underline text-sm">Quay lại danh sách</Link>
      </div>
    )
  }

  const getAgentName = (agentId: string | null) => {
    if (!agentId) return '—'
    if (agentId === agent.id) return `${agent.full_name} - ${agent.staff_id}`
    const ra = relatedMap[agentId]
    return ra ? `${ra.full_name} - ${ra.staff_id}` : agentId.slice(0, 8)
  }

  const agentT1Id = agent.current_t1_id ?? null
  const agentT1Name = getAgentName(agentT1Id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/agents" className="p-1.5 rounded-sm hover:bg-bg-secondary text-text-secondary shrink-0">
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          </Link>
          <PageHeader
            title={`${agent.full_name} - ${agent.staff_id}`}
            className="mb-0"
          />
          <Badge variant={agent.status === 'active' ? 'success' : 'danger'}>
            {agent.status === 'active' ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-sm hover:bg-bg-secondary text-gray-6 transition-colors" aria-label="Đánh dấu yêu thích">
            <Star className="w-5 h-5" aria-hidden="true" />
          </button>
          {agent.status === 'active' && role !== 'viewer' && (
            <button onClick={() => setShowModal(true)} className="px-4 h-9 bg-accent text-white rounded-sm text-sm hover:bg-accent-hover transition-colors">
              Tạo đề xuất đổi T1
            </button>
          )}
          {role === 'admin' && agent.status === 'active' && (
            <button onClick={() => setDeactivateOpen(true)} className="px-4 h-9 bg-danger text-white rounded-sm text-sm hover:bg-danger-hover flex items-center gap-1.5 transition-colors">
              <PowerOff className="w-4 h-4" /> Chấm dứt
            </button>
          )}
          {role === 'admin' && agent.status === 'inactive' && (
            <button onClick={() => setRestoreOpen(true)} className="px-4 h-9 bg-success text-white rounded-sm text-sm hover:bg-success-hover flex items-center gap-1.5 transition-colors">
              <Power className="w-4 h-4" /> Kích hoạt lại
            </button>
          )}
        </div>
      </div>

      <Card padding="none">
        <div className="flex border-b border-border-hairline">
          <button
            onClick={() => setMainTab('info')}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              mainTab === 'info' ? 'border-accent text-accent' : 'border-transparent text-text-tertiary hover:text-text-secondary'
            }`}
          >
            Thông tin Agent
          </button>
          <button
            onClick={() => setMainTab('history')}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              mainTab === 'history' ? 'border-accent text-accent' : 'border-transparent text-text-tertiary hover:text-text-secondary'
            }`}
          >
            Lịch sử
          </button>
        </div>
        <div className="p-5">
          {mainTab === 'info' && (
            <AgentInfoTab agent={agent} relatedMap={relatedMap} rankNamesMap={rankNamesMap} divisionMap={divisionMap} />
          )}
          {mainTab === 'history' && (
            <AgentHistoryTab
              agentId={agent.id}
              contractSigningDate={agent.contract_signing_date}
              agentT1Name={agentT1Name}
              t1History={t1History}
              asT1History={asT1History}
              m1List={m1List}
              deactivationHistory={deactivationHistory}
              getAgentName={getAgentName}
              rankNamesMap={rankNamesMap}
            />
          )}
        </div>
      </Card>

      {showModal && id && <CreateRequestModal agentId={id} onClose={() => setShowModal(false)} />}
      {deactivateOpen && id && <DeactivateAgentModal agentId={id} onClose={handleDeactivateClose} />}
      {restoreOpen && id && <RestoreAgentModal agentId={id} onClose={handleRestoreClose} />}
    </div>
  )
}
