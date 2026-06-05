import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Search, AlertTriangle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { checkEligibilityRpc, getT1Capacity, getM1ImpactSummary } from '../lib/eligibility'
import { createNotificationsForAdmins } from '../lib/notifications'
import { useAuth } from '../hooks/useAuth'
import { useToast } from './Toast'
import Modal from './Modal'
import { createRequestSchema, type CreateRequestFormData } from '../lib/form-schemas'
import type { EligibilityResult } from '../types'
import type { T1Capacity, M1ImpactSummary } from '../lib/eligibility'

interface Props {
  agentId: string
  onClose: () => void
}

export default function CreateRequestModal({ agentId, onClose }: Props) {
  const { show } = useToast()
  const { user } = useAuth()
  const [agents, setAgents] = useState<any[]>([])
  const [agent, setAgent] = useState<any>(null)
  const [t1Changes, setT1Changes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [dropdownAgents, setDropdownAgents] = useState<any[]>([])
  const [searchingDropdown, setSearchingDropdown] = useState(false)
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<EligibilityResult | null>(null)
  const [capacity, setCapacity] = useState<T1Capacity | null>(null)
  const [m1Impact, setM1Impact] = useState<M1ImpactSummary | null>(null)
  const [showM1Detail, setShowM1Detail] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [rankNamesMap, setRankNamesMap] = useState<Map<string, string>>(new Map())

  const {
    setValue,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateRequestFormData>({
    resolver: zodResolver(createRequestSchema),
    defaultValues: { selectedT1Id: '' },
  })

  const selectedT1Id = watch('selectedT1Id')

  useEffect(() => {
    loadData()
  }, [agentId])

  async function loadData() {
    setLoading(true)
    const [
      { data: agentsData },
      { data: agentData },
      { data: changesData },
      { data: m1Agents },
      { data: ranksData },
    ] = await Promise.all([
      supabase.from('agents').select('*').is('deleted_at', null).limit(10000),
      supabase.from('agents').select('*').eq('id', agentId).single(),
      supabase.from('t1_changes').select('*').is('deleted_at', null).limit(10000),
      supabase.from('agents').select('*').eq('current_t1_id', agentId).is('deleted_at', null),
      supabase.from('ranks').select('id, name'),
    ])
    const merged = new Map<string, any>()
    ;(agentsData ?? []).forEach((a) => merged.set(a.id, a))
    ;(m1Agents ?? []).forEach((a) => merged.set(a.id, a))
    if (agentData) merged.set(agentData.id, agentData)
    const allAgents = Array.from(merged.values())

    const rMap = new Map<string, string>()
    ranksData?.forEach((r: any) => rMap.set(r.id, r.name))
    setRankNamesMap(rMap)

    setAgents(allAgents)
    setAgent(agentData)
    setT1Changes(changesData ?? [])
    if (agentData && changesData) {
      setM1Impact(getM1ImpactSummary(agentData.id, allAgents, changesData ?? [], rMap))
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!showDropdown || search.trim().length < 1) {
      setDropdownAgents([])
      return
    }
    const timer = setTimeout(async () => {
      setSearchingDropdown(true)
      const q = search.trim()
      const { data } = await supabase
        .from('agents')
        .select('*')
        .is('deleted_at', null)
        .or(`full_name.ilike.%${q}%,staff_id.ilike.%${q}%`)
        .limit(20)
      const filtered = (data ?? []).filter(
        (a) => a.id !== agentId && a.id !== agent?.current_t1_id
      )
      setDropdownAgents(filtered)
      setSearchingDropdown(false)
    }, 200)
    return () => clearTimeout(timer)
  }, [search, showDropdown, agentId, agent])

  useEffect(() => {
    if (!selectedT1Id) {
      setResult(null)
      setCapacity(null)
      return
    }
    const ensureAgent = async () => {
      if (!agents.find((a) => a.id === selectedT1Id)) {
        const { data } = await supabase.from('agents').select('*').eq('id', selectedT1Id).single()
        if (data) {
          setAgents((prev) => [...prev, data])
        }
      }
    }
    ensureAgent()
  }, [selectedT1Id])

  useEffect(() => {
    if (!selectedT1Id || !agent) {
      setResult(null)
      setCapacity(null)
      return
    }
    setChecking(true)
    const timer = setTimeout(async () => {
      const res = await checkEligibilityRpc(agentId, selectedT1Id)
      const cap = getT1Capacity(selectedT1Id, agents, t1Changes)
      setResult(res)
      setCapacity(cap)
      setChecking(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [agentId, selectedT1Id, agents, t1Changes, agent])

  const onSubmit = async (_data: CreateRequestFormData) => {
    if (!result?.eligible || !selectedT1Id || !agent) return
    setSubmitting(true)
    const { error } = await supabase.from('t1_requests').insert({
      agent_id: agentId,
      old_t1_id: agent.current_t1_id,
      proposed_new_t1_id: selectedT1Id,
      status: 'step1',
      created_by: user?.id,
    })
    setSubmitting(false)
    if (error) {
      show('Lỗi tạo đề xuất: ' + error.message, 'error')
      return
    }
    show('Đã tạo đề xuất đổi T1', 'success')
    createNotificationsForAdmins([{
      type: 'request_new',
      title: 'Đề xuất đổi T1 mới',
      message: `${agent.full_name} (${agent.staff_id}) vừa được tạo đề xuất đổi T1`,
      link: `/requests`,
    }])
    onClose()
  }

  const getAgentName = (id: string | null) => {
    if (!id) return '—'
    const a = agents.find((x) => x.id === id)
    return a ? `${a.full_name} (${a.staff_id})` : id.slice(0, 8)
  }

  if (loading) {
    return (
      <Modal onClose={onClose} title="Tạo đề xuất đổi T1" size="md">
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Modal>
    )
  }

  if (!agent) return null

  return (
    <Modal onClose={onClose} title="Tạo đề xuất đổi T1" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="bg-neutral-50 rounded-lg p-3 text-sm space-y-1">
          <p><span className="text-neutral-500">Agent:</span> <span className="font-medium text-neutral-900">{agent.full_name} ({agent.staff_id})</span></p>
          <p><span className="text-neutral-500">T1 hiện tại:</span> <span className="font-medium text-neutral-900">{getAgentName(agent.current_t1_id)}</span></p>
        </div>

        <div className="relative">
          <label className="block text-xs font-medium uppercase tracking-wide text-neutral-700 mb-1.5">
            Chọn T1 mới <span className="text-danger">*</span>
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Tìm theo mã hoặc tên..."
              value={selectedT1Id ? getAgentName(selectedT1Id) : search}
              onChange={(e) => { setSearch(e.target.value); setValue('selectedT1Id', '', { shouldValidate: true }); setShowDropdown(true) }}
              onFocus={() => setShowDropdown(true)}
              className={`w-full h-10 pl-9 pr-3 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-light ${errors.selectedT1Id ? 'border-danger' : 'border-neutral-300'}`}
            />
          </div>
          {errors.selectedT1Id && <p className="text-sm text-danger mt-1">{errors.selectedT1Id.message}</p>}

          {showDropdown && !selectedT1Id && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
              <div className="absolute left-0 right-0 mt-1 bg-white rounded-lg shadow-dropdown border border-neutral-300 z-20 max-h-56 overflow-y-auto">
                {searchingDropdown && (
                  <div className="px-3 py-2 text-sm text-neutral-500 flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /> Đang tìm...
                  </div>
                )}
                {!searchingDropdown && dropdownAgents.length === 0 && (
                  <div className="px-3 py-2 text-sm text-neutral-500">{search.trim().length < 1 ? 'Nhập để tìm kiếm...' : 'Không tìm thấy'}</div>
                )}
                {dropdownAgents.map((c) => (
                  <button type="button" key={c.id} onClick={() => { setValue('selectedT1Id', c.id, { shouldValidate: true }); setShowDropdown(false); setSearch('') }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary-light text-primary flex items-center justify-center text-xs font-bold">{c.full_name.charAt(0)}</div>
                    <div><p className="font-medium text-neutral-900">{c.full_name}</p><p className="text-xs text-neutral-500">{c.staff_id} • {c.rank_name ?? rankNamesMap.get(c.rank_id) ?? '—'}</p></div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {capacity && (
          <div className={`rounded-lg p-3 text-sm space-y-1 ${capacity.warning ? 'bg-warning-light' : 'bg-neutral-50'}`}>
            <p className="font-medium text-neutral-900 flex items-center gap-1.5">T1 Capacity {capacity.warning && <AlertTriangle className="w-4 h-4 text-warning" />}</p>
            <p className="text-neutral-700">Số agent đang dưới trướng: <span className="font-medium">{capacity.menteeCount}</span></p>
            <p className="text-neutral-700">Số lần nhận agent trong 30 ngày qua: <span className="font-medium">{capacity.recentAcceptCount}</span></p>
            {capacity.warning && <p className="text-warning text-xs font-medium">⚠️ Cảnh báo: T1 này có thể đang quá tải</p>}
          </div>
        )}

        {selectedT1Id && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-700 mb-2">Kiểm tra điều kiện</p>
            <div className="border border-neutral-200 rounded-lg divide-y divide-neutral-100">
              {checking ? (
                <div className="px-4 py-6 flex items-center justify-center gap-2 text-sm text-neutral-500">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /> Đang kiểm tra...
                </div>
              ) : result ? (
                result.reasons.map((reason, idx) => (
                  <div key={idx} className="px-4 py-2.5 text-sm flex items-center gap-2">
                    <span className="text-base">{reason.startsWith('✅') ? '✅' : reason.startsWith('❌') ? '❌' : '•'}</span>
                    <span className={reason.startsWith('❌') ? 'text-danger' : 'text-neutral-700'}>{reason.replace(/^[✅❌]\s*/, '')}</span>
                  </div>
                ))
              ) : null}
            </div>
          </div>
        )}

        {m1Impact && m1Impact.total > 0 && (
          <div className="border border-neutral-200 rounded-lg p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-700 mb-2">Tác động đến ngưởi dưới line</p>
            <p className="text-xs text-neutral-500 mb-2">
              ℹ️ Agent trong 90 ngày đầu không bị giới hạn cấp bậc (ASC vẫn được phép đổi T1).
            </p>
            <p className="text-sm text-neutral-700">
              Agent này đang là T1 của: <span className="font-medium text-neutral-900">{m1Impact.total} ngưởi</span>
            </p>
            <p className="text-sm text-neutral-700">
              <span className="text-success font-medium">{m1Impact.eligibleCount} ngưởi</span> đủ điều kiện chọn T1 mới
            </p>
            <p className="text-sm text-neutral-700">
              <span className="text-danger font-medium">{m1Impact.ineligibleCount} ngưởi</span> không đủ điều kiện (sẽ ở lại với T2)
            </p>
            <button
              type="button"
              onClick={() => setShowM1Detail((v) => !v)}
              className="mt-2 text-xs text-primary hover:underline"
            >
              {showM1Detail ? 'Thu gọn' : 'Xem chi tiết'}
            </button>
            {showM1Detail && (
              <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto">
                {m1Impact.details.map((d) => (
                  <div key={d.agent.id} className="flex items-start gap-2 text-sm">
                    <span>{d.eligible ? '✅' : '❌'}</span>
                    <div>
                      <p className="font-medium text-neutral-900">
                        {d.agent.full_name ?? '—'} ({d.agent.staff_id ?? '—'})
                      </p>
                      {d.reasons.length > 0 && (
                        <p className="text-xs text-red-600">
                          {d.reasons.join('; ')}
                        </p>
                      )}
                      {d.notes.length > 0 && (
                        <p className="text-xs text-primary">
                          {d.notes.join('; ')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-5 mt-5 border-t border-neutral-100">
          <button type="button" onClick={onClose} className="px-4 h-9 border border-neutral-300 rounded-md text-sm text-neutral-700 hover:bg-neutral-50">Hủy</button>
          <button type="submit" disabled={!result?.eligible || !selectedT1Id || submitting}
            className="px-4 h-9 bg-primary text-white rounded-md text-sm hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting ? 'Đang tạo...' : 'Tạo đề xuất'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
