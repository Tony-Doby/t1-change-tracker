import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, Check, X, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../Toast'
import { formatDate } from '../../lib/date-utils'
import { agentInfoSchema, type AgentInfoFormData } from '../../lib/form-schemas'
import TextInput from '../../ui/input/TextInput'
import FormSection from '../FormSection'
import type { Agent } from '../../types'

interface Props {
  agent: Agent
  relatedMap: Record<string, { full_name: string; staff_id: string }>
  rankNamesMap: Record<string, string>
  divisionMap: Record<string, string>
}

export default function AgentInfoTab({ agent, relatedMap, rankNamesMap, divisionMap }: Props) {
  const { show } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [ranks, setRanks] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('ranks').select('id, name').then(({ data }) => {
      const map: Record<string, string> = {}
      data?.forEach((r: any) => { map[r.id] = r.name })
      setRanks(map)
    })
  }, [])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<AgentInfoFormData>({
    resolver: zodResolver(agentInfoSchema),
    defaultValues: {
      full_name: agent.full_name ?? '',
      staff_id: agent.staff_id ?? '',
      email: agent.email ?? '',
      business_email: agent.business_email ?? '',
      phone: agent.phone ?? '',
      rank_id: agent.rank_id ?? '',
      contract_signing_date: agent.contract_signing_date ?? '',
      register_date: agent.register_date ?? '',
      agent_start_date: agent.agent_start_date ?? '',
      end_date: agent.end_date ?? '',
      deactivation_reason: agent.deactivation_reason ?? '',
      source: agent.source ?? '',
      id_card_number: agent.id_card_number ?? '',
      date_of_birth: agent.date_of_birth ?? '',
      gender: agent.gender ?? '',
      id_card_issue_date: agent.id_card_issue_date ?? '',
      id_card_issue_place: agent.id_card_issue_place ?? '',
      place_of_origin: agent.place_of_origin ?? '',
      permanent_address: agent.permanent_address ?? '',
      bank_name: agent.bank_name ?? '',
      bank_account_number: agent.bank_account_number ?? '',
      bank_branch_name: agent.bank_branch_name ?? '',
      tax_code: agent.tax_code ?? '',
      active_area: agent.active_area ?? '',
      real_estate_experience: agent.real_estate_experience ?? '',
      broker_licence_number: agent.broker_licence_number ?? '',
      broker_licence_expiry_date: agent.broker_licence_expiry_date ?? '',
      success_seminar_date: agent.success_seminar_date ?? '',
    },
  })

  useEffect(() => {
    if (!isEditing) {
      reset({
        full_name: agent.full_name ?? '',
        staff_id: agent.staff_id ?? '',
        email: agent.email ?? '',
        business_email: agent.business_email ?? '',
        phone: agent.phone ?? '',
        rank_id: agent.rank_id ?? '',
        contract_signing_date: agent.contract_signing_date ?? '',
        register_date: agent.register_date ?? '',
        agent_start_date: agent.agent_start_date ?? '',
        end_date: agent.end_date ?? '',
        deactivation_reason: agent.deactivation_reason ?? '',
        source: agent.source ?? '',
        id_card_number: agent.id_card_number ?? '',
        date_of_birth: agent.date_of_birth ?? '',
        gender: agent.gender ?? '',
        id_card_issue_date: agent.id_card_issue_date ?? '',
        id_card_issue_place: agent.id_card_issue_place ?? '',
        place_of_origin: agent.place_of_origin ?? '',
        permanent_address: agent.permanent_address ?? '',
        bank_name: agent.bank_name ?? '',
        bank_account_number: agent.bank_account_number ?? '',
        bank_branch_name: agent.bank_branch_name ?? '',
        tax_code: agent.tax_code ?? '',
        active_area: agent.active_area ?? '',
        real_estate_experience: agent.real_estate_experience ?? '',
        broker_licence_number: agent.broker_licence_number ?? '',
        broker_licence_expiry_date: agent.broker_licence_expiry_date ?? '',
        success_seminar_date: agent.success_seminar_date ?? '',
      })
    }
  }, [agent, isEditing, reset])

  const onSubmit = async (data: AgentInfoFormData) => {
    setSaving(true)
    const payload: Record<string, any> = {}
    Object.entries(data).forEach(([key, value]) => {
      if (value === '' || value == null) {
        payload[key] = null
      } else {
        payload[key] = value
      }
    })
    // Sync rank_name when rank_id changes
    if (payload.rank_id && ranks[payload.rank_id]) {
      payload.rank_name = ranks[payload.rank_id]
    } else if (payload.rank_id === null || payload.rank_id === undefined) {
      payload.rank_name = null
    }
    const { error } = await supabase.from('agents').update(payload).eq('id', agent.id)
    setSaving(false)
    if (error) {
      show('Lỗi lưu: ' + error.message, 'error')
      return
    }
    show('Đã cập nhật thông tin agent', 'success')
    setIsEditing(false)
  }

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

  if (!isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex justify-end">
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-1.5 px-3 h-8 text-sm border border-border-light rounded-sm hover:bg-bg-secondary transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" /> Sửa
          </button>
        </div>
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
            {agent.broker_licence_expiry_date && <InfoRow label="Hết hạn chứng chỉ" value={formatDate(agent.broker_licence_expiry_date)} />}
            {agent.success_seminar_date && <InfoRow label="Ngày seminar" value={formatDate(agent.success_seminar_date)} />}
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-3 h-8 text-sm border border-border-light rounded-sm hover:bg-bg-secondary transition-colors disabled:opacity-50"
        >
          <X className="w-3.5 h-3.5" /> Hủy
        </button>
        <button
          type="submit"
          disabled={saving || !isDirty}
          className="inline-flex items-center gap-1.5 px-3 h-8 text-sm bg-accent text-white rounded-sm hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          Lưu
        </button>
      </div>

      <FormSection title="Thông tin cơ bản">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextInput label="Tên" error={errors.full_name?.message} {...register('full_name')} />
          <TextInput label="Mã NV" error={errors.staff_id?.message} {...register('staff_id')} />
          <TextInput label="Email" error={errors.email?.message} {...register('email')} />
          <TextInput label="Email công việc" error={errors.business_email?.message} {...register('business_email')} />
          <TextInput label="SĐT" error={errors.phone?.message} {...register('phone')} />
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Cấp bậc</label>
            <select
              {...register('rank_id')}
              className="w-full h-10 px-3 border border-border-light rounded-sm text-sm bg-bg-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            >
              <option value="">— Chọn cấp bậc —</option>
              {Object.entries(ranks).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>
          <TextInput label="Ngày ký HĐ" type="date" error={errors.contract_signing_date?.message} {...register('contract_signing_date')} />
          <TextInput label="Ngày đăng ký" type="date" error={errors.register_date?.message} {...register('register_date')} />
          <TextInput label="Ngày bắt đầu" type="date" error={errors.agent_start_date?.message} {...register('agent_start_date')} />
          <TextInput label="Ngày chấm dứt" type="date" error={errors.end_date?.message} {...register('end_date')} />
          <TextInput label="Lý do chấm dứt" error={errors.deactivation_reason?.message} {...register('deactivation_reason')} />
          <TextInput label="Nguồn" error={errors.source?.message} {...register('source')} />
        </div>
      </FormSection>

      <FormSection title="Thông tin cá nhân">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextInput label="CCCD/CMND" error={errors.id_card_number?.message} {...register('id_card_number')} />
          <TextInput label="Ngày sinh" type="date" error={errors.date_of_birth?.message} {...register('date_of_birth')} />
          <TextInput label="Giới tính" error={errors.gender?.message} {...register('gender')} />
          <TextInput label="Ngày cấp CCCD" type="date" error={errors.id_card_issue_date?.message} {...register('id_card_issue_date')} />
          <TextInput label="Nơi cấp CCCD" error={errors.id_card_issue_place?.message} {...register('id_card_issue_place')} />
          <TextInput label="Nguyên quán" error={errors.place_of_origin?.message} {...register('place_of_origin')} />
          <TextInput label="Địa chỉ thường trú" error={errors.permanent_address?.message} {...register('permanent_address')} />
        </div>
      </FormSection>

      <FormSection title="Ngân hàng & Thuế">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextInput label="Ngân hàng" error={errors.bank_name?.message} {...register('bank_name')} />
          <TextInput label="Số TK" error={errors.bank_account_number?.message} {...register('bank_account_number')} />
          <TextInput label="Chi nhánh" error={errors.bank_branch_name?.message} {...register('bank_branch_name')} />
          <TextInput label="Mã số thuế" error={errors.tax_code?.message} {...register('tax_code')} />
        </div>
      </FormSection>

      <FormSection title="Nghề nghiệp">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextInput label="Khu vực hoạt động" error={errors.active_area?.message} {...register('active_area')} />
          <TextInput label="Kinh nghiệm BĐS" error={errors.real_estate_experience?.message} {...register('real_estate_experience')} />
          <TextInput label="Số chứng chỉ MG" error={errors.broker_licence_number?.message} {...register('broker_licence_number')} />
          <TextInput label="Hết hạn chứng chỉ" type="date" error={errors.broker_licence_expiry_date?.message} {...register('broker_licence_expiry_date')} />
          <TextInput label="Ngày seminar" type="date" error={errors.success_seminar_date?.message} {...register('success_seminar_date')} />
        </div>
      </FormSection>
    </form>
  )
}
