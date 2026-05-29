import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Star, Inbox, Power, PowerOff } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { formatDate } from '../lib/date-utils'
import { useAuth } from '../hooks/useAuth'
import CreateRequestModal from '../components/CreateRequestModal'
import DeactivateAgentModal from '../components/DeactivateAgentModal'
import RestoreAgentModal from '../components/RestoreAgentModal'
import { SkeletonText } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'

export default function AgentDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [mainTab, setMainTab] = useState<'info' | 'history'>('info')
  const [historySubTab, setHistorySubTab] = useState<'t1_history' | 'm1' | 'as_t1' | 'deactivation'>('t1_history')
  const [agent, setAgent] = useState<any>(null)
  const [relatedMap, setRelatedMap] = useState<Record<string, { full_name: string; staff_id: string }>>({})
  const [t1History, setT1History] = useState<any[]>([])
  const [asT1History, setAsT1History] = useState<any[]>([])
  const [m1List, setM1List] = useState<any[]>([])
  const [deactivationHistory, setDeactivationHistory] = useState<any[]>([])
  const [rankNamesMap, setRankNamesMap] = useState<Record<string, string>>({})
  const [divisionMap, setDivisionMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const [restoreOpen, setRestoreOpen] = useState(false)

  const role = user?.role ?? 'viewer'

  useEffect(() => {
    if (!id) return
    loadData()
  }, [id])

  async function loadData() {
    setLoading(true)
    const { data: agentData } = await supabase.from('agents').select('*').eq('id', id).single()
    setAgent(agentData)

    const relatedIds = new Set<string>()
    const t1Id = agentData?.referrer_id ?? agentData?.current_t1_id ?? null
    if (t1Id) relatedIds.add(t1Id)
    if (agentData?.introducing_agent_id) relatedIds.add(agentData.introducing_agent_id)

    const { data: m1Data } = await supabase.from('agents').select('*').or(`referrer_id.eq.${id},current_t1_id.eq.${id}`).is('deleted_at', null)
    setM1List(m1Data ?? [])

    const { data: histData } = await supabase.from('t1_changes').select('*').eq('agent_id', id).is('deleted_at', null).order('change_date', { ascending: false })
    setT1History(histData ?? [])
    histData?.forEach((c: any) => {
      if (c.old_t1_id) relatedIds.add(c.old_t1_id)
      if (c.new_t1_id) relatedIds.add(c.new_t1_id)
    })

    const { data: asT1Data } = await supabase.from('t1_changes').select('*').or(`old_t1_id.eq.${id},new_t1_id.eq.${id}`).is('deleted_at', null).order('change_date', { ascending: false })
    setAsT1History(asT1Data ?? [])
    asT1Data?.forEach((c: any) => {
      if (c.agent_id) relatedIds.add(c.agent_id)
    })

    if (relatedIds.size > 0) {
      const { data: related } = await supabase
        .from('agents')
        .select('id, full_name, staff_id')
        .in('id', Array.from(relatedIds))
      const map: Record<string, { full_name: string; staff_id: string }> = {}
      related?.forEach((a: any) => { map[a.id] = a })
      setRelatedMap(map)
    }

    const { data: ranksData } = await supabase.from('ranks').select('id, name')
    const rMap: Record<string, string> = {}
    ranksData?.forEach((r: any) => { rMap[r.id] = r.name })
    setRankNamesMap(rMap)

    const { data: divData } = await supabase.from('divisions').select('id, name')
    const dMap: Record<string, string> = {}
    divData?.forEach((d: any) => { dMap[d.id] = d.name })
    setDivisionMap(dMap)

    const { data: deactData } = await supabase
      .from('agent_deactivation_snapshots')
      .select('*')
      .eq('agent_id', id)
      .order('deactivated_at', { ascending: false })
    setDeactivationHistory(deactData ?? [])

    setLoading(false)
  }

  if (loading) {
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

  const agentT1Id = agent.referrer_id ?? agent.current_t1_id ?? null
  const rankDisplay = agent.rank_name ?? rankNamesMap[agent.rank_id] ?? '—'

  const historyTabs: { key: 't1_history' | 'm1' | 'as_t1' | 'deactivation'; label: string }[] = [
    { key: 't1_history', label: 'Lịch sử T1' },
    { key: 'm1', label: `M1 (${m1List.length})` },
    { key: 'as_t1', label: `Lịch sử làm T1 (${asT1History.length})` },
  ]
  if (deactivationHistory.length > 0) {
    historyTabs.push({ key: 'deactivation', label: `Lịch sử chấm dứt (${deactivationHistory.length})` })
  }

  const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex gap-3 text-sm">
      <span className="w-36 text-neutral-500 shrink-0">{label}</span>
      <span className="text-neutral-900 font-medium">{value}</span>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link to="/agents" className="p-1.5 rounded-md hover:bg-neutral-200 text-neutral-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
            {agent.full_name} - {agent.staff_id}
            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${agent.status === 'active' ? 'bg-success-light text-success' : 'bg-danger-light text-danger'}`}>
              {agent.status === 'active' ? 'Active' : 'Inactive'}
            </span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-md hover:bg-neutral-100 text-neutral-300">
            <Star className="w-5 h-5" />
          </button>
          {agent.status === 'active' && role !== 'viewer' && (
            <button onClick={() => setShowModal(true)} className="px-4 h-9 bg-primary text-white rounded-md text-sm hover:bg-primary-hover">
              Tạo đề xuất đổi T1
            </button>
          )}
          {role === 'admin' && agent.status === 'active' && (
            <button onClick={() => setDeactivateOpen(true)} className="px-4 h-9 bg-danger text-white rounded-md text-sm hover:bg-danger/90 flex items-center gap-1.5">
              <PowerOff className="w-4 h-4" /> Chấm dứt
            </button>
          )}
          {role === 'admin' && agent.status === 'inactive' && (
            <button onClick={() => setRestoreOpen(true)} className="px-4 h-9 bg-success text-white rounded-md text-sm hover:bg-success/90 flex items-center gap-1.5">
              <Power className="w-4 h-4" /> Kích hoạt lại
            </button>
          )}
        </div>
      </div>

      {/* Main Tabs */}
      <div className="bg-white rounded-lg shadow-card">
        <div className="flex border-b border-neutral-200">
          <button onClick={() => setMainTab('info')} className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${mainTab === 'info' ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}>
            Thông tin Agent
          </button>
          <button onClick={() => setMainTab('history')} className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${mainTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}>
            Lịch sử
          </button>
        </div>

        <div className="p-5">
          {mainTab === 'info' && (
            <div className="flex flex-col lg:flex-row gap-x-12 gap-y-2">
              {/* Left column */}
              <div className="space-y-2">
                <InfoRow label="Tên" value={agent.full_name} />
                <InfoRow label="Mã NV" value={agent.staff_id} />
                {agent.agent_code && agent.agent_code !== agent.staff_id && (
                  <InfoRow label="Mã Agent" value={agent.agent_code} />
                )}
                <InfoRow label="Cấp bậc" value={rankDisplay} />
                {agent.email && <InfoRow label="Email" value={agent.email} />}
                {agent.business_email && <InfoRow label="Email công việc" value={agent.business_email} />}
                {agent.phone && <InfoRow label="SĐT" value={agent.phone} />}
                <InfoRow label="Ngày ký HĐ" value={formatDate(agent.contract_signing_date)} />
                {agent.register_date && <InfoRow label="Ngày đăng ký" value={formatDate(agent.register_date)} />}
                {agent.agent_start_date && <InfoRow label="Ngày bắt đầu" value={formatDate(agent.agent_start_date)} />}
                {agent.end_date && <InfoRow label="Ngày chấm dứt" value={formatDate(agent.end_date)} />}
                {agent.deactivation_reason && <InfoRow label="Lý do chấm dứt" value={agent.deactivation_reason} />}
                {agent.source && <InfoRow label="Nguồn" value={agent.source} />}
                {agent.id_card_number && <InfoRow label="CCCD/CMND" value={agent.id_card_number} />}
                {agent.date_of_birth && <InfoRow label="Ngày sinh" value={formatDate(agent.date_of_birth)} />}
                {agent.gender && <InfoRow label="Giới tính" value={agent.gender} />}
                {agent.id_card_issue_date && <InfoRow label="Ngày cấp CCCD" value={formatDate(agent.id_card_issue_date)} />}
                {agent.id_card_issue_place && <InfoRow label="Nơi cấp CCCD" value={agent.id_card_issue_place} />}
                {agent.place_of_origin && <InfoRow label="Nguyên quán" value={agent.place_of_origin} />}
                {agent.permanent_address && <InfoRow label="Địa chỉ thường trú" value={agent.permanent_address} />}
                {agent.bank_name && <InfoRow label="Ngân hàng" value={agent.bank_name} />}
                {agent.bank_account_number && <InfoRow label="Số TK" value={agent.bank_account_number} />}
                {agent.bank_branch_name && <InfoRow label="Chi nhánh" value={agent.bank_branch_name} />}
                {agent.tax_code && <InfoRow label="Mã số thuế" value={agent.tax_code} />}
                {agent.cumulative_personal_revenue != null && (
                  <InfoRow label="Doanh số tích lũy" value={agent.cumulative_personal_revenue.toLocaleString('vi-VN')} />
                )}
              </div>

              {/* Right column */}
              <div className="space-y-2">
                <InfoRow label="Người giới thiệu" value={getAgentName(agent.introducing_agent_id)} />
                <InfoRow label="T1 hiện tại" value={getAgentName(agentT1Id)} />
                <InfoRow label="Division" value={divisionMap[agent.division_id] ?? '—'} />
                {agent.active_area && <InfoRow label="Khu vực hoạt động" value={agent.active_area} />}
                {agent.real_estate_experience && <InfoRow label="Kinh nghiệm BĐS" value={agent.real_estate_experience} />}
                {agent.broker_licence_number && <InfoRow label="Số chứng chỉ MG" value={agent.broker_licence_number} />}
                {agent.broker_licence_expiry_date && <InfoRow label="Hết hạn chứng chỉ" value={formatDate(agent.broker_licence_expiry_date)} />}
                {agent.success_seminar_date && <InfoRow label="Ngày seminar" value={formatDate(agent.success_seminar_date)} />}
              </div>
            </div>
          )}

          {mainTab === 'history' && (
            <div className="space-y-4">
              {/* Sub-tabs */}
              <div className="flex border-b border-neutral-200">
                {historyTabs.map((tab) => (
                  <button key={tab.key} onClick={() => setHistorySubTab(tab.key)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${historySubTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}>
                    {tab.label}
                  </button>
                ))}
              </div>

              <div>
                {historySubTab === 't1_history' && (
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center"><div className="w-2.5 h-2.5 rounded-full bg-primary" /><div className="w-0.5 flex-1 bg-neutral-300" /></div>
                      <div className="pb-4">
                        <p className="text-xs text-neutral-500">{formatDate(agent.contract_signing_date)}</p>
                        <p className="text-sm text-neutral-900">Tạo tài khoản, T1: {getAgentName(agentT1Id)}</p>
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
                )}

                {historySubTab === 'm1' && (
                  m1List.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm min-w-[500px]">
                        <thead><tr className="bg-neutral-50 border-b border-neutral-200"><th className="px-3 py-2 text-left text-xs font-medium text-neutral-500">Mã</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-500">Họ tên</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-500">Cấp bậc</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-500">Ngày ký HĐ</th></tr></thead>
                        <tbody>{m1List.map((m) => (<tr key={m.id} className="border-b border-neutral-100 hover:bg-neutral-50"><td className="px-3 py-2"><Link to={`/agents/${m.id}`} className="text-primary hover:underline">{m.staff_id}</Link></td><td className="px-3 py-2 text-neutral-900">{m.full_name}</td><td className="px-3 py-2 text-neutral-700">{m.rank_name ?? rankNamesMap[m.rank_id] ?? '—'}</td><td className="px-3 py-2 text-neutral-700">{formatDate(m.contract_signing_date)}</td></tr>))}</tbody>
                      </table>
                    </div>
                  ) : <EmptyState icon={<Inbox className="w-8 h-8" />} title="Agent này chưa có M1" className="py-8" />
                )}

                {historySubTab === 'as_t1' && (
                  asT1History.length > 0 ? (
                    <div className="space-y-4">
                      {asT1History.map((c) => (
                        <div key={c.id} className="flex gap-4">
                          <div className="flex flex-col items-center"><div className="w-2.5 h-2.5 rounded-full bg-primary" /><div className="w-0.5 flex-1 bg-neutral-300" /></div>
                          <div className="pb-4">
                            <p className="text-xs text-neutral-500">{formatDate(c.change_date)}</p>
                            <p className="text-sm text-neutral-900">{c.new_t1_id === id ? `Nhận agent ${getAgentName(c.agent_id)}` : `Agent ${getAgentName(c.agent_id)} chuyển đi`}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <EmptyState icon={<Inbox className="w-8 h-8" />} title="Agent này chưa từng làm T1 của ai" className="py-8" />
                )}

                {historySubTab === 'deactivation' && (
                  deactivationHistory.length > 0 ? (
                    <div className="space-y-4">
                      {deactivationHistory.map((d) => (
                        <div key={d.id} className="border border-neutral-200 rounded-lg p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-neutral-900">{formatDate(d.deactivated_at)}</p>
                            {d.restored_at && <span className="text-xs bg-success-light text-success px-2 py-0.5 rounded-full">Đã khôi phục</span>}
                          </div>
                          <p className="text-sm text-neutral-700"><span className="text-neutral-500">Ngày chấm dứt:</span> {formatDate(d.end_date)}</p>
                          <p className="text-sm text-neutral-700"><span className="text-neutral-500">Lý do:</span> {d.deactivation_reason}</p>
                          {d.restored_at && <p className="text-sm text-neutral-700"><span className="text-neutral-500">Ngày khôi phục:</span> {formatDate(d.restored_at)}</p>}
                        </div>
                      ))}
                    </div>
                  ) : <EmptyState icon={<Inbox className="w-8 h-8" />} title="Chưa có lịch sử chấm dứt" className="py-8" />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showModal && id && <CreateRequestModal agentId={id} onClose={() => setShowModal(false)} />}
      {deactivateOpen && id && <DeactivateAgentModal agentId={id} onClose={() => { setDeactivateOpen(false); loadData() }} />}
      {restoreOpen && id && <RestoreAgentModal agentId={id} onClose={() => { setRestoreOpen(false); loadData() }} />}
    </div>
  )
}
