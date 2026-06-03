import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/Toast'
import { SkeletonCard, SkeletonText } from '../components/Skeleton'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { completeRequestAction } from '../lib/request-actions'
import CountdownConfirmModal from '../components/CountdownConfirmModal'
import ComposeTemplateModal from '../components/ComposeTemplateModal'
import CreateRequestModal from '../components/CreateRequestModal'
import { useDashboardStatsQuery } from '../hooks/queries/useDashboardStats'
import { useStatusCountsQuery } from '../hooks/queries/useStatusCounts'
import { useB2RequestsQuery } from '../hooks/queries/useB2Requests'
import { useM1TransitionsQuery } from '../hooks/queries/useM1Transitions'
import { useBookmarkedAgentsQuery } from '../hooks/queries/useBookmarkedAgents'
import { useT1ChangesQuery } from '../hooks/queries/useT1Changes'
import { useRanksMapQuery } from '../hooks/queries/useRanks'
import type { B2Request } from '../hooks/queries/useB2Requests'
import type { TransitionTask } from '../hooks/queries/useM1Transitions'
import DashboardStats from '../components/dashboard/DashboardStats'
import B2PendingAlert from '../components/dashboard/B2PendingAlert'
import B2EligibleList from '../components/dashboard/B2EligibleList'
import M1TransitionList from '../components/dashboard/M1TransitionList'
import BookmarkedAgentsCard from '../components/dashboard/BookmarkedAgentsCard'
import StatusChart from '../components/dashboard/StatusChart'

function canCreateRequest(agent: any, allChanges: any[], rMap?: Map<string, string>): boolean {
  if (!agent?.contract_signing_date) return false
  const days = Math.floor((Date.now() - new Date(agent.contract_signing_date).getTime()) / (1000 * 60 * 60 * 24))
  const changes = allChanges.filter((c: any) => c.agent_id === agent.id && c.is_counted_for_quota && !c.deleted_at)
  if (days <= 90) return changes.length < 1
  if (changes.length >= 3) return false
  const lastChange = changes.sort((a: any, b: any) => new Date(b.change_date).getTime() - new Date(a.change_date).getTime())[0]
  if (lastChange) {
    const daysSinceLast = Math.floor((Date.now() - new Date(lastChange.change_date).getTime()) / (1000 * 60 * 60 * 24))
    if (daysSinceLast < 180) return false
  }
  const rankName = agent.rank_name ?? (agent.rank_id && rMap ? rMap.get(agent.rank_id) : null)
  if (rankName?.toLowerCase().trim() === 'asc') return false
  return true
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { show } = useToast()
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const [processingT2, setProcessingT2] = useState<string | null>(null)
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; req: B2Request | null }>({ open: false, req: null })
  const [cancelModal, setCancelModal] = useState<{ open: boolean; req: B2Request | null; reason: string }>({ open: false, req: null, reason: '' })
  const [emailModal, setEmailModal] = useState<{ agentId: string; taskId?: string } | null>(null)
  const [requestModalAgentId, setRequestModalAgentId] = useState<string | null>(null)
  const [confirmT2Task, setConfirmT2Task] = useState<TransitionTask | null>(null)

  const { data: stats, isLoading: statsLoading } = useDashboardStatsQuery()
  const { data: statusCounts = {}, isLoading: countsLoading } = useStatusCountsQuery()
  const { data: b2Requests = [], isLoading: b2Loading } = useB2RequestsQuery()
  const { data: transitions = [], isLoading: transitionsLoading, error: transitionsError } = useM1TransitionsQuery()
  const { data: bookmarkedAgents = [], isLoading: bookmarksLoading } = useBookmarkedAgentsQuery()
  const { data: t1Changes = [] } = useT1ChangesQuery()
  const { data: rankNamesMap = {} } = useRanksMapQuery()

  if (transitionsError) {
    show('Lỗi tải M1 Transition: ' + (transitionsError as Error).message, 'error')
  }

  const isLoading = statsLoading || countsLoading || b2Loading || transitionsLoading || bookmarksLoading

  const applyT2 = async (task: TransitionTask) => {
    setProcessingT2(task.id)
    const now = new Date().toISOString()
    const { error: agentError } = await supabase.from('agents').update({ current_t1_id: task.temp_t1_id }).eq('id', task.m1_agent_id)
    if (agentError) { show('Lỗi cập nhật agent: ' + agentError.message, 'error'); setProcessingT2(null); return }
    const { error: taskError } = await supabase.from('m1_transition_tasks').update({ status: 't2_assigned', resolved_at: now }).eq('id', task.id)
    if (taskError) { show('Lỗi cập nhật task: ' + taskError.message, 'error'); setProcessingT2(null); return }
    await supabase.from('activity_logs').insert({
      agent_id: task.m1_agent_id, action_type: 'm1_stayed_with_t2', new_t1_id: task.temp_t1_id,
      description: `M1 ${task.m1_agent?.full_name ?? ''} ở lại với T1 tạm (${task.temp_t1?.full_name ?? 'Không có T1 tạm'})`, created_at: now,
    })
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'm1Transitions'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] })
    setProcessingT2(null)
  }

  const handleConfirmChange = async () => {
    const req = confirmModal.req
    if (!req) return
    try {
      await completeRequestAction({ id: req.id, agent_id: req.agent_id, old_t1_id: req.old_t1_id, proposed_new_t1_id: req.proposed_new_t1_id }, undefined)
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'b2Requests'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'statusCounts'] })
      setConfirmModal({ open: false, req: null })
      show('Đã xác nhận thay đổi T1', 'success')
    } catch (e: any) { show('Lỗi: ' + e.message, 'error') }
  }

  const handleCancelRequest = async () => {
    const req = cancelModal.req
    if (!req || !cancelModal.reason.trim()) return
    const now = new Date().toISOString()
    const { error } = await supabase.from('t1_requests').update({ status: 'cancelled', cancelled_by: user?.id, cancelled_reason: cancelModal.reason.trim(), updated_at: now }).eq('id', req.id)
    if (error) { show('Lỗi: ' + error.message, 'error'); return }
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'b2Requests'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'statusCounts'] })
    setCancelModal({ open: false, req: null, reason: '' })
    show('Đã hủy đề xuất', 'warning')
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const b2Pending = b2Requests.filter((r) => today <= r.deadline3)
  const b2Alert = b2Requests.filter((r) => today > r.deadline3 && today < r.deadline4)
  const b2Eligible = b2Requests.filter((r) => today >= r.deadline4)

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="page-title">Dashboard</div>
        <div className="page-grid-cards"><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 page-card-lg space-y-3"><SkeletonText lines={4} /></div>
          <div className="page-card-lg space-y-3"><SkeletonText lines={3} /></div>
        </div>
      </div>
    )
  }

  const rankMap = new Map(Object.entries(rankNamesMap))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
      </div>

      <DashboardStats stats={stats} onNavigate={navigate} />
      <B2PendingAlert b2Pending={b2Pending} b2Alert={b2Alert} />
      <B2EligibleList
        items={b2Eligible}
        onConfirm={(req) => setConfirmModal({ open: true, req })}
        onCancel={(req) => setCancelModal({ open: true, req, reason: '' })}
        onEmail={(agentId) => setEmailModal({ agentId })}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <M1TransitionList
            tasks={transitions}
            processingId={processingT2}
            canCreateRequest={(agent) => canCreateRequest(agent, t1Changes, rankMap)}
            onEmail={(agentId, taskId) => setEmailModal({ agentId, taskId })}
            onCreateRequest={(agentId) => setRequestModalAgentId(agentId)}
            onApplyT2={(task) => setConfirmT2Task(task)}
          />
        </div>
        <BookmarkedAgentsCard agents={bookmarkedAgents} />
      </div>

      <StatusChart counts={statusCounts} />

      <CountdownConfirmModal open={confirmModal.open} title="Xác nhận thay đổi T1" confirmText="Xác nhận thay đổi" confirmVariant="primary"
        onConfirm={handleConfirmChange} onCancel={() => setConfirmModal({ open: false, req: null })}>
        <p>Bạn sắp hoàn tất đổi T1 cho <strong>{confirmModal.req?.agent?.full_name ?? '—'}</strong>:</p>
        <p className="mt-1">{confirmModal.req?.old_t1?.full_name ?? '—'} → {confirmModal.req?.new_t1?.full_name ?? '—'}</p>
        <p className="mt-2 text-neutral-500">Hành động này sẽ cập nhật T1 mới, ghi lịch sử và tạo M1 transition tasks (nếu có).</p>
      </CountdownConfirmModal>

      <CountdownConfirmModal open={cancelModal.open} title="Hủy đề xuất" confirmText="Xác nhận hủy" confirmVariant="danger"
        onConfirm={handleCancelRequest} onCancel={() => setCancelModal({ open: false, req: null, reason: '' })}>
        <p>Bạn muốn hủy đề xuất đổi T1 của <strong>{cancelModal.req?.agent?.full_name ?? '—'}</strong>?</p>
        <div className="mt-3">
          <label className="block text-xs font-medium uppercase tracking-wide text-neutral-500 mb-1">Lý do hủy</label>
          <textarea value={cancelModal.reason} onChange={(e) => setCancelModal((prev) => ({ ...prev, reason: e.target.value }))} rows={3}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light" />
        </div>
      </CountdownConfirmModal>

      {emailModal && <ComposeTemplateModal agentId={emailModal.agentId} m1TaskId={emailModal.taskId ?? undefined} onClose={() => setEmailModal(null)} />}
      {requestModalAgentId && <CreateRequestModal agentId={requestModalAgentId} onClose={() => setRequestModalAgentId(null)} />}
      {confirmT2Task && (
        <CountdownConfirmModal open={true} title="Xác nhận ở lại với T1 tạm" confirmText="Xác nhận"
          onConfirm={() => { applyT2(confirmT2Task); setConfirmT2Task(null); }} onCancel={() => setConfirmT2Task(null)}>
          <p>M1 <strong>{confirmT2Task.m1_agent?.full_name ?? '—'}</strong> sẽ ở lại với T1 tạm <strong>{confirmT2Task.temp_t1?.full_name ?? 'Không có T1 tạm'}</strong>.</p>
        </CountdownConfirmModal>
      )}
    </div>
  )
}
