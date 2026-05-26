import { useState, useMemo, useEffect } from 'react'
import { X, Search, AlertTriangle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { checkEligibility, getT1Capacity } from '../lib/eligibility'
import { useAuth } from '../hooks/useAuth'
import { useToast } from './Toast'
import type { EligibilityResult } from '../types'
import type { T1Capacity } from '../lib/eligibility'

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
  const [selectedT1Id, setSelectedT1Id] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<EligibilityResult | null>(null)
  const [capacity, setCapacity] = useState<T1Capacity | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadData()
  }, [agentId])

  async function loadData() {
    setLoading(true)
    const [{ data: agentsData }, { data: agentData }, { data: changesData }] = await Promise.all([
      supabase.from('agents').select('*').is('deleted_at', null),
      supabase.from('agents').select('*').eq('id', agentId).single(),
      supabase.from('t1_changes').select('*').is('deleted_at', null),
    ])
    setAgents(agentsData ?? [])
    setAgent(agentData)
    setT1Changes(changesData ?? [])
    setLoading(false)
  }

  const t1Candidates = useMemo(() => {
    return agents.filter(
      (a) =>
        a.id !== agentId &&
        a.id !== agent?.current_t1_id &&
        !a.deleted_at &&
        (a.full_name.toLowerCase().includes(search.toLowerCase()) ||
          a.staff_id.toLowerCase().includes(search.toLowerCase()))
    )
  }, [agents, agentId, agent, search])

  useEffect(() => {
    if (!selectedT1Id || !agent) {
      setResult(null)
      setCapacity(null)
      return
    }
    setChecking(true)
    const timer = setTimeout(() => {
      const res = checkEligibility(agentId, selectedT1Id, agents, t1Changes)
      const cap = getT1Capacity(selectedT1Id, agents, t1Changes)
      setResult(res)
      setCapacity(cap)
      setChecking(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [agentId, selectedT1Id, agents, t1Changes, agent])

  const handleSubmit = async () => {
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
    onClose()
  }

  const getAgentName = (id: string | null) => {
    if (!id) return '—'
    const a = agents.find((x) => x.id === id)
    return a ? `${a.full_name} (${a.staff_id})` : id.slice(0, 8)
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-xl p-6"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
      </div>
    )
  }

  if (!agent) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-modal w-full max-w-[560px] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-neutral-100">
          <h2 className="text-xl font-semibold text-neutral-900">Tạo đề xuất đổi T1</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-5">
          <div className="bg-neutral-50 rounded-lg p-3 text-sm space-y-1">
            <p><span className="text-neutral-500">Agent:</span> <span className="font-medium text-neutral-900">{agent.full_name} ({agent.staff_id})</span></p>
            <p><span className="text-neutral-500">T1 hiện tại:</span> <span className="font-medium text-neutral-900">{getAgentName(agent.current_t1_id)}</span></p>
          </div>

          <div className="relative">
            <label className="block text-xs font-medium uppercase tracking-wide text-neutral-700 mb-1.5">Chọn T1 mới <span className="text-danger">*</span></label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input type="text" placeholder="Tìm theo mã hoặc tên..." value={selectedT1Id ? getAgentName(selectedT1Id) : search}
                onChange={(e) => { setSearch(e.target.value); setSelectedT1Id(null); setShowDropdown(true) }}
                onFocus={() => setShowDropdown(true)}
                className="w-full h-10 pl-9 pr-3 border border-neutral-300 rounded-md text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light" />
            </div>

            {showDropdown && !selectedT1Id && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                <div className="absolute left-0 right-0 mt-1 bg-white rounded-lg shadow-dropdown border border-neutral-300 z-20 max-h-56 overflow-y-auto">
                  {t1Candidates.length === 0 && <div className="px-3 py-2 text-sm text-neutral-500">Không tìm thấy</div>}
                  {t1Candidates.map((c) => (
                    <button key={c.id} onClick={() => { setSelectedT1Id(c.id); setShowDropdown(false); setSearch('') }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary-light text-primary flex items-center justify-center text-xs font-bold">{c.full_name.charAt(0)}</div>
                      <div><p className="font-medium text-neutral-900">{c.full_name}</p><p className="text-xs text-neutral-500">{c.staff_id} • {c.rank_name ?? '—'}</p></div>
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
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t border-neutral-100">
          <button onClick={onClose} className="px-4 h-9 border border-neutral-300 rounded-md text-sm text-neutral-700 hover:bg-neutral-50">Hủy</button>
          <button onClick={handleSubmit} disabled={!result?.eligible || !selectedT1Id || submitting}
            className="px-4 h-9 bg-primary text-white rounded-md text-sm hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting ? 'Đang tạo...' : 'Tạo đề xuất'}
          </button>
        </div>
      </div>
    </div>
  )
}
