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
          <div className="page-card-lg space-y-3"><SkeletonText lines={10} /></div>
          <div className="page-card-lg space-y-3"><SkeletonText lines={6} /></div>
        </div>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500">Không tìm thấy agent</p>
        <Link to="/agents" className="text-primary hover:underline text-sm">Quay lại danh sách</Link>
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
        <div className="flex items-center gap-3">
          <Link to="/agents" className="p-1.5 rounded-md hover:bg-neutral-200 text-neutral-700"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
            {agent.full_name} - {agent.staff_id}
            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${agent.status === 'active' ? 'bg-success-light text-success' : 'bg-danger-light text-danger'}`}>
              {agent.status === 'active' ? 'Active' : 'Inactive'}
            </span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-md hover:bg-neutral-100 text-neutral-300"><Star className="w-5 h-5" /></button>
          {agent.status === 'active' && role !== 'viewer' && (
            <button onClick={() => setShowModal(true)} className="px-4 h-9 bg-primary text-white rounded-md text-sm hover:bg-primary-hover">Tạo đề xuất đổi T1</button>
          )}
          {role === 'admin' && agent.status === 'active' && (
            <button onClick={() => setDeactivateOpen(true)} className="px-4 h-9 bg-danger text-white rounded-md text-sm hover:bg-danger/90 flex items-center gap-1.5"><PowerOff className="w-4 h-4" /> Chấm dứt</button>
          )}
          {role === 'admin' && agent.status === 'inactive' && (
            <button onClick={() => setRestoreOpen(true)} className="px-4 h-9 bg-success text-white rounded-md text-sm hover:bg-success/90 flex items-center gap-1.5"><Power className="w-4 h-4" /> Kích hoạt lại</button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-card">
        <div className="flex border-b border-neutral-200">
          <button onClick={() => setMainTab('info')} className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${mainTab === 'info' ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}>Thông tin Agent</button>
          <button onClick={() => setMainTab('history')} className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${mainTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}>Lịch sử</button>
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
      </div>

      {showModal && id && <CreateRequestModal agentId={id} onClose={() => setShowModal(false)} />}
      {deactivateOpen && id && <DeactivateAgentModal agentId={id} onClose={handleDeactivateClose} />}
      {restoreOpen && id && <RestoreAgentModal agentId={id} onClose={handleRestoreClose} />}
    </div>
  )
}
