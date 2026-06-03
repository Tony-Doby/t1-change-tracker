import { formatDate } from '../../lib/date-utils'

interface Agent {
  id: string
  full_name: string
  staff_id: string
  agent_code?: string | null
  rank_name?: string | null
  rank_id?: string | null
  email?: string | null
  business_email?: string | null
  phone?: string | null
  contract_signing_date?: string | null
  register_date?: string | null
  agent_start_date?: string | null
  end_date?: string | null
  deactivation_reason?: string | null
  source?: string | null
  id_card_number?: string | null
  date_of_birth?: string | null
  gender?: string | null
  id_card_issue_date?: string | null
  id_card_issue_place?: string | null
  place_of_origin?: string | null
  permanent_address?: string | null
  bank_name?: string | null
  bank_account_number?: string | null
  bank_branch_name?: string | null
  tax_code?: string | null
  cumulative_personal_revenue?: number | null
  introducing_agent_id?: string | null
  current_t1_id?: string | null
  division_id?: string | null
  active_area?: string | null
  real_estate_experience?: string | null
  broker_licence_number?: string | null
  broker_licence_expiry_date?: string | null
  success_seminar_date?: string | null
}

export default function AgentInfoTab({
  agent,
  relatedMap,
  rankNamesMap,
  divisionMap,
}: {
  agent: Agent
  relatedMap: Record<string, { full_name: string; staff_id: string }>
  rankNamesMap: Record<string, string>
  divisionMap: Record<string, string>
}) {
  const getAgentName = (agentId: string | null | undefined) => {
    if (!agentId) return '—'
    if (agentId === agent.id) return `${agent.full_name} - ${agent.staff_id}`
    const ra = relatedMap[agentId]
    return ra ? `${ra.full_name} - ${ra.staff_id}` : agentId.slice(0, 8)
  }

  const agentT1Id = agent.current_t1_id ?? null
  const rankDisplay = agent.rank_name ?? rankNamesMap[agent.rank_id ?? ''] ?? '—'

  const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex gap-3 text-sm">
      <span className="w-36 text-neutral-500 shrink-0">{label}</span>
      <span className="text-neutral-900 font-medium">{value}</span>
    </div>
  )

  return (
    <div className="flex flex-col lg:flex-row gap-x-32 gap-y-2">
      <div className="space-y-2">
        <InfoRow label="Tên" value={agent.full_name} />
        <InfoRow label="Mã NV" value={agent.staff_id} />
        {agent.agent_code && agent.agent_code !== agent.staff_id && <InfoRow label="Mã Agent" value={agent.agent_code} />}
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
      <div className="space-y-2">
        <InfoRow label="Ngưới giới thiệu" value={getAgentName(agent.introducing_agent_id)} />
        <InfoRow label="T1 hiện tại" value={getAgentName(agentT1Id)} />
        <InfoRow label="Division" value={divisionMap[agent.division_id ?? ''] ?? '—'} />
        {agent.active_area && <InfoRow label="Khu vực hoạt động" value={agent.active_area} />}
        {agent.real_estate_experience && <InfoRow label="Kinh nghiệm BĐS" value={agent.real_estate_experience} />}
        {agent.broker_licence_number && <InfoRow label="Số chứng chỉ MG" value={agent.broker_licence_number} />}
        {agent.broker_licence_expiry_date && <InfoRow label="Hết hạn chứng chỉ" value={formatDate(agent.broker_licence_expiry_date!)} />}
        {agent.success_seminar_date && <InfoRow label="Ngày seminar" value={formatDate(agent.success_seminar_date!)} />}
      </div>
    </div>
  )
}
