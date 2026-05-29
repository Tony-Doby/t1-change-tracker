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
  const [activeTab, setActiveTab] = useState<'history' | 'm1' | 'as_t1' | 'deactivation'>('history')
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

    // Load related agents (T1, introducer, and history agents)
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

    // Load ranks
    const { data: ranksData } = await supabase.from('ranks').select('id, name')
    const rMap: Record<string, string> = {}
    ranksData?.forEach((r: any) => { rMap[r.id] = r.name })
    setRankNamesMap(rMap)

    // Load divisions
    const { data: divData } = await supabase.from('divisions').select('id, name')
    const dMap: Record<string, string> = {}
    divData?.forEach((d: any) => { dMap[d.id] = d.name })
    setDivisionMap(dMap)

    // Load deactivation history
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
          <div className="page-card-lg space-y-3"><SkeletonText lines={5} /></div>
          <div className="page-card-lg space-y-3"><SkeletonText lines={4} /></div>
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

  const tabs: { key: 'history' | 'm1' | 'as_t1' | 'deactivation'; label: string }[] = [
    { key: 'history', label: 'Lịch sử T1' },
    { key: 'm1', label: `M1 (${m1List.length})` },
    { key: 'as_t1', label: `Lịch sử làm T1 (${asT1History.length})` },
  ]
  if (deactivationHistory.length > 0) {
    tabs.push({ key: 'deactivation', label: `Lịch sử chấm dứt (${deactivationHistory.length})` })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/agents" className="p-1.5 rounded-md hover:bg-neutral-200 text-neutral-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-neutral-900">Agent: {agent.full_name} - {agent.staff_id}</h1>
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
            <button
              onClick={() => setDeactivateOpen(true)}
              className="px-4 h-9 bg-danger text-white rounded-md text-sm hover:bg-danger/90 flex items-center gap-1.5"
            >
              <PowerOff className="w-4 h-4" /> Chấm dứt
            </button>
          )}
          {role === 'admin' && agent.status === 'inactive' && (
            <button
              onClick={() => setRestoreOpen(true)}
              className="px-4 h-9 bg-success text-white rounded-md text-sm hover:bg-success/90 flex items-center gap-1.5"
            >
              <Power className="w-4 h-4" /> Kích hoạt lại
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-5 shadow-card">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Thông tin Agent</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-neutral-500">Mã NV</span><span className="text-neutral-900 font-medium">{agent.staff_id}</span></div>
            {agent.agent_code && agent.agent_code !== agent.staff_id && (
              <div className="flex justify-between"><span className="text-neutral-500">Mã Agent</span><span className="text-neutral-900 font-medium">{agent.agent_code}</span></div>
            )}
            <div className="flex justify-between"><span className="text-neutral-500">Cấp bậc</span><span className="text-neutral-900 font-medium">{rankDisplay}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Ngày ký HĐ</span><span className="text-neutral-900 font-medium">{formatDate(agent.contract_signing_date)}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Trạng thái</span><span className={`font-medium ${agent.status === 'active' ? 'text-success' : 'text-neutral-500'}`}>{agent.status === 'active' ? 'Active' : 'Inactive'}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Division</span><span className="text-neutral-900 font-medium">{divisionMap[agent.division_id] ?? '—'}</span></div>
            {agent.end_date && (
              <div className="flex justify-between"><span className="text-neutral-500">Ngày chấm dứt</span><span className="text-neutral-900 font-medium">{formatDate(agent.end_date)}</span></div>
            )}
            {agent.deactivation_reason && (
              <div className="flex justify-between"><span className="text-neutral-500">Lý do chấm dứt</span><span className="text-neutral-900 font-medium">{agent.deactivation_reason}</span></div>
            )}
            {agent.email && <div className="flex justify-between"><span className="text-neutral-500">Email</span><span className="text-neutral-900 font-medium">{agent.email}</span></div>}
            {agent.business_email && <div className="flex justify-between"><span className="text-neutral-500">Email công việc</span><span className="text-neutral-900 font-medium">{agent.business_email}</span></div>}
            {agent.phone && <div className="flex justify-between"><span className="text-neutral-500">SĐT</span><span className="text-neutral-900 font-medium">{agent.phone}</span></div>}
            {agent.register_date && <div className="flex justify-between"><span className="text-neutral-500">Ngày đăng ký</span><span className="text-neutral-900 font-medium">{formatDate(agent.register_date)}</span></div>}
            {agent.agent_start_date && <div className="flex justify-between"><span className="text-neutral-500">Ngày bắt đầu</span><span className="text-neutral-900 font-medium">{formatDate(agent.agent_start_date)}</span></div>}
            {agent.source && <div className="flex justify-between"><span className="text-neutral-500">Nguồn</span><span className="text-neutral-900 font-medium">{agent.source}</span></div>}

            {(agent.id_card_number || agent.date_of_birth || agent.gender || agent.id_card_issue_date || agent.id_card_issue_place || agent.place_of_origin || agent.permanent_address) && (
              <div className="pt-2 mt-2 border-t border-neutral-100">
                <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-2">Thông tin cá nhân</p>
                {agent.id_card_number && <div className="flex justify-between"><span className="text-neutral-500">CCCD/CMND</span><span className="text-neutral-900 font-medium">{agent.id_card_number}</span></div>}
                {agent.date_of_birth && <div className="flex justify-between"><span className="text-neutral-500">Ngày sinh</span><span className="text-neutral-900 font-medium">{formatDate(agent.date_of_birth)}</span></div>}
                {agent.gender && <div className="flex justify-between"><span className="text-neutral-500">Giới tính</span><span className="text-neutral-900 font-medium">{agent.gender}</span></div>}
                {agent.id_card_issue_date && <div className="flex justify-between"><span className="text-neutral-500">Ngày cấp CCCD</span><span className="text-neutral-900 font-medium">{formatDate(agent.id_card_issue_date)}</span></div>}
                {agent.id_card_issue_place && <div className="flex justify-between"><span className="text-neutral-500">Nơi cấp CCCD</span><span className="text-neutral-900 font-medium">{agent.id_card_issue_place}</span></div>}
                {agent.place_of_origin && <div className="flex justify-between"><span className="text-neutral-500">Nguyên quán</span><span className="text-neutral-900 font-medium">{agent.place_of_origin}</span></div>}
                {agent.permanent_address && <div className="flex justify-between"><span className="text-neutral-500">Địa chỉ thường trú</span><span className="text-neutral-900 font-medium">{agent.permanent_address}</span></div>}
              </div>
            )}

            {(agent.bank_name || agent.bank_account_number || agent.bank_branch_name || agent.tax_code) && (
              <div className="pt-2 mt-2 border-t border-neutral-100">
                <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-2">Ngân hàng & Thuế</p>
                {agent.bank_name && <div className="flex justify-between"><span className="text-neutral-500">Ngân hàng</span><span className="text-neutral-900 font-medium">{agent.bank_name}</span></div>}
                {agent.bank_account_number && <div className="flex justify-between"><span className="text-neutral-500">Số TK</span><span className="text-neutral-900 font-medium">{agent.bank_account_number}</span></div>}
                {agent.bank_branch_name && <div className="flex justify-between"><span className="text-neutral-500">Chi nhánh</span><span className="text-neutral-900 font-medium">{agent.bank_branch_name}</span></div>}
                {agent.tax_code && <div className="flex justify-between"><span className="text-neutral-500">Mã số thuế</span><span className="text-neutral-900 font-medium">{agent.tax_code}</span></div>}
              </div>
            )}

            {(agent.active_area || agent.real_estate_experience || agent.broker_licence_number || agent.broker_licence_expiry_date || agent.success_seminar_date) && (
              <div className="pt-2 mt-2 border-t border-neutral-100">
                <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-2">Nghề nghiệp</p>
                {agent.active_area && <div className="flex justify-between"><span className="text-neutral-500">Khu vực hoạt động</span><span className="text-neutral-900 font-medium">{agent.active_area}</span></div>}
                {agent.real_estate_experience && <div className="flex justify-between"><span className="text-neutral-500">Kinh nghiệm BĐS</span><span className="text-neutral-900 font-medium">{agent.real_estate_experience}</span></div>}
                {agent.broker_licence_number && <div className="flex justify-between"><span className="text-neutral-500">Số chứng chỉ MG</span><span className="text-neutral-900 font-medium">{agent.broker_licence_number}</span></div>}
                {agent.broker_licence_expiry_date && <div className="flex justify-between"><span className="text-neutral-500">Hết hạn chứng chỉ</span><span className="text-neutral-900 font-medium">{formatDate(agent.broker_licence_expiry_date)}</span></div>}
                {agent.success_seminar_date && <div className="flex justify-between"><span className="text-neutral-500">Ngày seminar</span><span className="text-neutral-900 font-medium">{formatDate(agent.success_seminar_date)}</span></div>}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg p-5 shadow-card">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">T1 Hiện tại</h2>
            <p className="text-neutral-900 font-medium">{getAgentName(agentT1Id)}</p>
          </div>
          <div className="bg-white rounded-lg p-5 shadow-card">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Ngưởi giới thiệu</h2>
            <p className="text-neutral-900 font-medium">{getAgentName(agent.introducing_agent_id)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-card">
        <div className="flex border-b border-neutral-200">
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeTab === 'history' && (
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

          {activeTab === 'm1' && (
            m1List.length > 0 ? (
              <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[500px]">
                <thead><tr className="bg-neutral-50 border-b border-neutral-200"><th className="px-3 py-2 text-left text-xs font-medium text-neutral-500">Mã</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-500">Họ tên</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-500">Cấp bậc</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-500">Ngày ký HĐ</th></tr></thead>
                <tbody>{m1List.map((m) => (<tr key={m.id} className="border-b border-neutral-100 hover:bg-neutral-50"><td className="px-3 py-2"><Link to={`/agents/${m.id}`} className="text-primary hover:underline">{m.staff_id}</Link></td><td className="px-3 py-2 text-neutral-900">{m.full_name}</td><td className="px-3 py-2 text-neutral-700">{m.rank_name ?? rankNamesMap[m.rank_id] ?? '—'}</td><td className="px-3 py-2 text-neutral-700">{formatDate(m.contract_signing_date)}</td></tr>))}</tbody>
              </table>
              </div>
            ) : <EmptyState icon={<Inbox className="w-8 h-8" />} title="Agent này chưa có M1" className="py-8" />
          )}

          {activeTab === 'as_t1' && (
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
            ) : (
              <EmptyState icon={<Inbox className="w-8 h-8" />} title="Agent này chưa từng làm T1 của ai" className="py-8" />
            )
          )}

          {activeTab === 'deactivation' && (
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
            ) : (
              <EmptyState icon={<Inbox className="w-8 h-8" />} title="Chưa có lịch sử chấm dứt" className="py-8" />
            )
          )}
        </div>
      </div>

      {showModal && id && <CreateRequestModal agentId={id} onClose={() => setShowModal(false)} />}
      {deactivateOpen && id && <DeactivateAgentModal agentId={id} onClose={() => { setDeactivateOpen(false); loadData() }} />}
      {restoreOpen && id && <RestoreAgentModal agentId={id} onClose={() => { setRestoreOpen(false); loadData() }} />}
    </div>
  )
}
