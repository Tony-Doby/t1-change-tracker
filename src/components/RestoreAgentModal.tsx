import { useState, useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { restoreAgent } from '../lib/agent-actions'
import { useAuth } from '../hooks/useAuth'
import { useToast } from './Toast'
import Modal from './Modal'
import CountdownConfirmModal from './CountdownConfirmModal'
import type { Agent } from '../types'

interface Props {
  agentId: string
  onClose: () => void
}

export default function RestoreAgentModal({ agentId, onClose }: Props) {
  const { user } = useAuth()
  const { show } = useToast()
  const [agent, setAgent] = useState<Agent | null>(null)
  const [affectedM1s, setAffectedM1s] = useState<Pick<Agent, 'id' | 'full_name' | 'staff_id' | 'current_t1_id'>[]>([])
  const [mode, setMode] = useState<'full' | 'light'>('light')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Moved down

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const { data: a } = await supabase.from('agents').select('*').eq('id', agentId).single()
      setAgent(a)

      const { data: tasks } = await supabase
        .from('m1_transition_tasks')
        .select('m1_agent_id, status')
        .eq('departed_agent_id', agentId)

      if (tasks && tasks.length > 0) {
        const m1Ids = [...new Set(tasks.map((t) => t.m1_agent_id))]
        const { data: m1Data } = await supabase
          .from('agents')
          .select('id, full_name, staff_id, current_t1_id')
          .in('id', m1Ids)
        setAffectedM1s(m1Data ?? [])
      } else {
        setAffectedM1s([])
      }

      setLoading(false)
    }
    loadData()
  }, [agentId])

  const handleRestore = () => {
    setShowConfirm(true)
  }

  const confirmRestore = async () => {
    setSubmitting(true)
    try {
      await restoreAgent({
        agentId,
        mode,
        userId: user?.id,
      })
      show('Đã kích hoạt lại agent', 'success')
      setShowConfirm(false)
      onClose()
    } catch (e: unknown) {
      show('Lỗi: ' + ((e as Error).message ?? 'Unknown'), 'error')
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <Modal onClose={onClose} title="Kích hoạt lại Agent" size="md">
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Modal>
    )
  }

  return (
    <>
      <Modal onClose={onClose} title="Kích hoạt lại Agent" size="md">
        <div className="space-y-5">
          <div className="bg-neutral-50 rounded-lg p-3 text-sm space-y-1">
            <p><span className="text-neutral-500">Agent:</span> <span className="font-medium text-neutral-900">{agent?.full_name} ({agent?.staff_id})</span></p>
          </div>

          <div className="border border-warning rounded-lg p-4 bg-warning-light/30">
            <p className="text-sm font-medium text-neutral-900 flex items-center gap-1.5 mb-2">
              <AlertTriangle className="w-4 h-4 text-warning" /> Cảnh báo
            </p>
            <p className="text-sm text-neutral-700">Kích hoạt lại agent có thể ảnh hưởng đến cấu trúc downline. Hãy chọn chế độ khôi phục phù hợp.</p>
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 p-3 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50">
              <input
                type="radio"
                name="restoreMode"
                value="light"
                checked={mode === 'light'}
                onChange={() => setMode('light')}
                className="mt-1"
              />
              <div>
                <p className="text-sm font-medium text-neutral-900">Khôi phục nhẹ</p>
                <p className="text-xs text-neutral-500">Chỉ kích hoạt lại agent. M1 đã chọn T1 mới sẽ giữ nguyên.</p>
              </div>
            </label>
            <label className="flex items-start gap-3 p-3 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50">
              <input
                type="radio"
                name="restoreMode"
                value="full"
                checked={mode === 'full'}
                onChange={() => setMode('full')}
                className="mt-1"
              />
              <div>
                <p className="text-sm font-medium text-neutral-900">Khôi phục toàn bộ</p>
                <p className="text-xs text-neutral-500">Kéo tất cả M1 cũ về dưới agent này (override cả M1 đã chọn T1 mới).</p>
              </div>
            </label>
          </div>

          {affectedM1s.length > 0 && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-700 mb-2">M1 bị ảnh hưởng</p>
              <div className="space-y-1 max-h-32 overflow-y-auto border border-neutral-200 rounded-lg p-3">
                {affectedM1s.map((m) => (
                  <p key={m.id} className="text-xs text-neutral-600">
                    • {m.full_name} ({m.staff_id}) — T1 hiện tại: {m.current_t1_id ? 'Có' : 'Không'}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-5 mt-5 border-t border-neutral-100">
          <button onClick={onClose} className="px-4 h-9 border border-neutral-300 rounded-md text-sm text-neutral-700 hover:bg-neutral-50">Hủy</button>
          <button
            onClick={handleRestore}
            disabled={submitting}
            className="px-4 h-9 bg-success text-white rounded-md text-sm hover:bg-success/90 disabled:opacity-50"
          >
            {submitting ? 'Đang xử lý...' : 'Kích hoạt lại'}
          </button>
        </div>
      </Modal>

      <CountdownConfirmModal
        open={showConfirm}
        title="Xác nhận kích hoạt lại"
        confirmText="Xác nhận kích hoạt"
        confirmVariant="primary"
        onConfirm={confirmRestore}
        onCancel={() => setShowConfirm(false)}
      >
        <p>Bạn sắp kích hoạt lại <strong>{agent?.full_name ?? '—'}</strong>.</p>
        <p className="mt-1">Chế độ: <strong>{mode === 'full' ? 'Khôi phục toàn bộ' : 'Khôi phục nhẹ'}</strong></p>
        {affectedM1s.length > 0 && (
          <p className="mt-2 text-warning text-sm">⚠️ {affectedM1s.length} M1 sẽ bị ảnh hưởng.</p>
        )}
      </CountdownConfirmModal>
    </>
  )
}
