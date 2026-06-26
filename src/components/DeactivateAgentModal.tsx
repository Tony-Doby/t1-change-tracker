import { useState, useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { deactivateAgent } from '../lib/agent-actions'
import { useAuth } from '../hooks/useAuth'
import { useToast } from './Toast'
import Modal from './Modal'
import CountdownConfirmModal from './CountdownConfirmModal'
import { formatDate } from '../lib/date-utils'
import type { Agent } from '../types'

interface Props {
  agentId: string
  onClose: () => void
}

export default function DeactivateAgentModal({ agentId, onClose }: Props) {
  const { user } = useAuth()
  const { show } = useToast()
  const queryClient = useQueryClient()
  const [agent, setAgent] = useState<Agent | null>(null)
  const [m1s, setM1s] = useState<Pick<Agent, 'id' | 'full_name' | 'staff_id'>[]>([])
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Moved down

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const { data: a } = await supabase.from('agents').select('*').eq('id', agentId).single()
      setAgent(a)

      const { data: m1Data } = await supabase
        .from('agents')
        .select('id, full_name, staff_id')
        .eq('current_t1_id', agentId)
        .is('deleted_at', null)
        .eq('status', 'active')
      setM1s(m1Data ?? [])
      setLoading(false)
    }
    loadData()
  }, [agentId])

  const handleDeactivate = async () => {
    if (!reason.trim()) {
      show('Vui lòng nhập lý do chấm dứt', 'error')
      return
    }
    setShowConfirm(true)
  }

  const confirmDeactivate = async () => {
    setSubmitting(true)
    try {
      await deactivateAgent({
        agentId,
        endDate,
        reason: reason.trim(),
        userId: user?.id,
      })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'm1Transitions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] })
      show('Đã chấm dứt hoạt động agent', 'success')
      setShowConfirm(false)
      onClose()
    } catch (e: unknown) {
      show('Lỗi: ' + ((e as Error).message ?? 'Unknown'), 'error')
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <Modal onClose={onClose} title="Chấm dứt hoạt động Agent" size="md">
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Modal>
    )
  }

  return (
    <>
      <Modal onClose={onClose} title="Chấm dứt hoạt động Agent" size="md">
        <div className="space-y-5">
          <div className="bg-neutral-50 rounded-lg p-3 text-sm space-y-1">
            <p><span className="text-neutral-500">Agent:</span> <span className="font-medium text-neutral-900">{agent?.full_name} ({agent?.staff_id})</span></p>
            <p><span className="text-neutral-500">T1 hiện tại:</span> <span className="font-medium text-neutral-900">{agent?.current_t1_id ? 'Có' : 'Không có'}</span></p>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-neutral-700 mb-1.5">Ngày chấm dứt <span className="text-danger">*</span></label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full h-10 px-3 border border-neutral-300 rounded-md text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-neutral-700 mb-1.5">Lý do chấm dứt <span className="text-danger">*</span></label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-10 px-3 border border-neutral-300 rounded-md text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light bg-white mb-2"
            >
              <option value="">Chọn lý do...</option>
              <option value="Nghỉ việc">Nghỉ việc</option>
              <option value="Chuyển công ty">Chuyển công ty</option>
              <option value="Vi phạm quy định">Vi phạm quy định</option>
              <option value="Khác">Khác</option>
            </select>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Hoặc nhập lý do cụ thể..."
              rows={2}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
            />
          </div>

          {m1s.length > 0 && (
            <div className="border border-warning rounded-lg p-4 bg-warning-light/30">
              <p className="text-sm font-medium text-neutral-900 flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-4 h-4 text-warning" /> Ảnh hưởng đến downline
              </p>
              <p className="text-sm text-neutral-700 mb-2">Agent này đang là T1 của <span className="font-medium">{m1s.length}</span> agent. Hệ thống sẽ tạo M1 transition tasks.</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {m1s.map((m) => (
                  <p key={m.id} className="text-xs text-neutral-600">• {m.full_name} ({m.staff_id})</p>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-5 mt-5 border-t border-neutral-100">
          <button onClick={onClose} className="px-4 h-9 border border-neutral-300 rounded-md text-sm text-neutral-700 hover:bg-neutral-50">Hủy</button>
          <button
            onClick={handleDeactivate}
            disabled={!reason.trim() || submitting}
            className="px-4 h-9 bg-danger text-white rounded-md text-sm hover:bg-danger/90 disabled:opacity-50"
          >
            {submitting ? 'Đang xử lý...' : 'Chấm dứt hoạt động'}
          </button>
        </div>
      </Modal>

      <CountdownConfirmModal
        open={showConfirm}
        title="Xác nhận chấm dứt hoạt động"
        confirmText="Xác nhận chấm dứt"
        confirmVariant="danger"
        onConfirm={confirmDeactivate}
        onCancel={() => setShowConfirm(false)}
      >
        <p>Bạn sắp chấm dứt hoạt động của <strong>{agent?.full_name ?? '—'}</strong>.</p>
        <p className="mt-1">Ngày chấm dứt: {formatDate(endDate)}</p>
        <p className="mt-1">Lý do: {reason}</p>
        {m1s.length > 0 && (
          <p className="mt-2 text-warning text-sm">⚠️ {m1s.length} M1 sẽ bị ảnh hưởng và cần chọn T1 mới trong 30 ngày.</p>
        )}
      </CountdownConfirmModal>
    </>
  )
}
