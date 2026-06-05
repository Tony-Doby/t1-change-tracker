import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../components/Toast'

import { addBusinessDays } from '../lib/eligibility'
import { completeRequestAction } from '../lib/request-actions'
import { createNotificationsForAdmins } from '../lib/notifications'
import CountdownConfirmModal from '../components/CountdownConfirmModal'
import { SkeletonText } from '../components/Skeleton'
import { supabase } from '../lib/supabase'
import { useRequestDetailQuery } from '../hooks/queries/useRequestDetail'
import RequestInfoCard from '../components/request-detail/RequestInfoCard'
import RequestProgress from '../components/request-detail/RequestProgress'
import DeadlineInfo from '../components/request-detail/DeadlineInfo'
import RequestComments from '../components/request-detail/RequestComments'
import StepHistory from '../components/request-detail/StepHistory'
import NotificationChecklist from '../components/request-detail/NotificationChecklist'
import PageHeader from '../ui/layout/PageHeader'
import Badge from '../ui/display/Badge'
import Card from '../ui/layout/Card'

export default function RequestDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const { show } = useToast()
  const queryClient = useQueryClient()

  const [newComment, setNewComment] = useState('')
  const [showStep2Date, setShowStep2Date] = useState(false)
  const [step2Date, setStep2Date] = useState('')
  const [confirmModal, setConfirmModal] = useState<{ open: boolean }>({ open: false })
  const [cancelModal, setCancelModal] = useState<{ open: boolean; reason: string }>({ open: false, reason: '' })

  const { data, isLoading } = useRequestDetailQuery(id)
  const request = data?.request
  const comments = data?.comments ?? []
  const stepHistory = data?.stepHistory ?? []
  const holidays = data?.holidays ?? new Set<string>()

  const calculatedB3 = (() => {
    if (request?.step2_confirmed_at) {
      const d3 = addBusinessDays(request.step2_confirmed_at, 3, holidays)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return { deadline3: d3, isB3Ready: today >= d3, daysLeft: Math.ceil((d3.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) }
    }
    return { deadline3: null, isB3Ready: false, daysLeft: 0 }
  })()

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in max-w-4xl">
        <SkeletonText lines={2} />
        <Card className="space-y-4"><SkeletonText lines={4} /></Card>
        <Card className="space-y-4"><SkeletonText lines={6} /></Card>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <p className="text-text-tertiary">Không tìm thấy đề xuất</p>
        <Link to="/requests" className="text-accent hover:underline text-sm">Quay lại</Link>
      </div>
    )
  }

  const isCompleted = request.status === 'completed'
  const isCancelled = request.status === 'cancelled'
  const role = user?.role ?? 'viewer'

  const getUIStep = () => {
    if (isCompleted || isCancelled) return 3
    if (request.status === 'step1') return 0
    if (request.status === 'step2') return request.step2_confirmed_at ? 2 : 1
    return 2
  }
  const uiStep = getUIStep()

  const advanceStep = async () => {
    if (isCompleted || isCancelled) return
    if (request.status !== 'step1') return
    setStep2Date(new Date().toISOString().slice(0, 10))
    setShowStep2Date(true)
  }

  const confirmStep2Date = async () => {
    if (!step2Date) return
    const dateValue = new Date(step2Date).toISOString()
    const { error } = await supabase.from('t1_requests').update({ status: 'step2', step2_confirmed_at: dateValue, updated_at: new Date().toISOString() }).eq('id', request.id)
    if (error) { show('Lỗi: ' + error.message, 'error'); return }
    await supabase.from('activity_logs').insert({ request_id: request.id, action_type: 'request_step_changed', description: 'Chuyển sang B2', created_by: user?.id })
    setShowStep2Date(false)
    show('Đã chuyển sang B2', 'success')
    if (id) queryClient.invalidateQueries({ queryKey: ['request', 'detail', id] })
  }

  const handleConfirmChange = async () => {
    try {
      await completeRequestAction({ id: request.id, agent_id: request.agent_id, old_t1_id: request.old_t1_id, proposed_new_t1_id: request.proposed_new_t1_id }, user?.id)
      setConfirmModal({ open: false })
      show('Đã đồng ý thay đổi T1', 'success')
      if (id) queryClient.invalidateQueries({ queryKey: ['request', 'detail', id] })
    } catch (e: any) { show('Lỗi: ' + e.message, 'error') }
  }

  const handleCancelRequest = async () => {
    if (!cancelModal.reason.trim()) { show('Vui lòng nhập lý do hủy', 'warning'); return }
    const now = new Date().toISOString()
    const { error } = await supabase.from('t1_requests').update({ status: 'cancelled', cancelled_by: user?.id, cancelled_reason: cancelModal.reason.trim(), updated_at: now }).eq('id', request.id)
    if (error) { show('Lỗi: ' + error.message, 'error'); return }
    setCancelModal({ open: false, reason: '' })
    show('Đã hủy đề xuất', 'warning')
    createNotificationsForAdmins([{ type: 'request_cancelled', title: 'Đề xuất đã bị hủy', message: `Đề xuất #${request.id?.slice(0, 8)} đã bị hủy`, link: `/requests/${request.id}` }])
    if (id) queryClient.invalidateQueries({ queryKey: ['request', 'detail', id] })
  }

  const submitComment = async () => {
    if (!newComment.trim() || !id) return
    const { error } = await supabase.from('request_comments').insert({ request_id: request.id, content: newComment.trim(), created_by: user?.id }).select()
    if (error) { show('Lỗi: ' + error.message, 'error'); return }
    setNewComment('')
    createNotificationsForAdmins([{ type: 'comment_new', title: 'Bình luận mới', message: `Có bình luận mới trong đề xuất #${request.id?.slice(0, 8)}`, link: `/requests/${request.id}` }])
    queryClient.invalidateQueries({ queryKey: ['request', 'detail', id] })
  }

  const isAtB3 = (request.status === 'step2' && request.step2_confirmed_at) || ['step3', 'step4', 'step5'].includes(request.status)

  const requestStatusBadge = () => {
    if (isCompleted) return <Badge variant="success">Hoàn tất</Badge>
    if (isCancelled) return <Badge variant="danger">Đã hủy</Badge>
    if (request.status === 'step2' && !request.step2_confirmed_at) return <Badge variant="primary">B2 - Chờ ngày xác nhận</Badge>
    return <Badge variant="success">B3 - Quyết định</Badge>
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/requests" className="p-1.5 rounded-sm hover:bg-bg-secondary text-text-secondary shrink-0">
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          </Link>
          <div>
            <PageHeader title={`Đề xuất #${request.id?.slice(0, 8)}`} className="mb-0" />
            <div className="mt-1">{requestStatusBadge()}</div>
          </div>
        </div>
        {role !== 'viewer' && !isCompleted && !isCancelled && (
          <div className="flex items-center gap-2 shrink-0">
            {(request.status === 'step1' || (request.status === 'step2' && !request.step2_confirmed_at)) && (
              <button onClick={advanceStep} className="px-4 h-9 bg-accent text-white rounded-sm text-sm hover:bg-accent-hover transition-colors">
                {request.status === 'step1' ? 'Chuyển sang B2' : 'Nhập ngày xác nhận B2'}
              </button>
            )}
            {((request.status === 'step2' && request.step2_confirmed_at) || ['step3', 'step4', 'step5'].includes(request.status)) && (
              <>
                <button
                  onClick={() => setConfirmModal({ open: true })}
                  disabled={!calculatedB3.isB3Ready && request.status === 'step2'}
                  title={!calculatedB3.isB3Ready ? `Còn ${Math.max(0, calculatedB3.daysLeft)} ngày làm việc` : 'Xác nhận thay đổi T1'}
                  className={`px-4 h-9 rounded-sm text-sm transition-colors ${
                    calculatedB3.isB3Ready ? 'bg-success text-white hover:opacity-90' : 'bg-bg-quaternary text-text-disabled cursor-not-allowed'
                  }`}
                >
                  {calculatedB3.isB3Ready ? 'Đồng ý' : `Đồng ý (${Math.max(0, calculatedB3.daysLeft)} ngày)`}
                </button>
                <button onClick={() => setCancelModal({ open: true, reason: '' })} className="px-4 h-9 border border-danger text-danger rounded-sm text-sm hover:bg-danger-subtle transition-colors">
                  Hủy đề xuất
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <RequestInfoCard agent={request.agent} oldT1={request.old_t1} newT1={request.new_t1} />

      {request.status === 'step2' && request.step2_confirmed_at && calculatedB3.deadline3 && (
        <DeadlineInfo step2ConfirmedAt={request.step2_confirmed_at} deadline3={calculatedB3.deadline3} isB3Ready={calculatedB3.isB3Ready} daysLeft={calculatedB3.daysLeft} />
      )}

      <RequestProgress uiStep={uiStep} isCompleted={isCompleted} isCancelled={isCancelled} isB3Locked={request.status === 'step2' && request.step2_confirmed_at && !calculatedB3.isB3Ready} />

      <RequestComments
        comments={comments}
        currentUserId={user?.id}
        newComment={newComment}
        onChange={setNewComment}
        onSubmit={submitComment}
        canComment={role !== 'viewer' && !isCompleted && !isCancelled}
      />

      <StepHistory history={stepHistory.map((h) => ({ description: h.description, created_at: h.created_at }))} />

      {isAtB3 && <NotificationChecklist />}

      {showStep2Date && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card padding="lg" className="w-full max-w-md">
            <h2 className="text-lg font-semibold text-text-primary mb-1">Xác nhận chuyển sang B2</h2>
            <p className="text-sm text-text-secondary mb-4">Vui lòng nhập ngày T1 mới xác nhận đồng ý tiếp nhận.</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-secondary mb-1">Ngày xác nhận</label>
              <input
                type="date"
                value={step2Date}
                onChange={(e) => setStep2Date(e.target.value)}
                className="w-full h-10 px-3 border border-border-light rounded-sm text-sm bg-bg-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowStep2Date(false)} className="px-4 h-9 border border-border-light rounded-sm text-sm text-text-secondary hover:bg-bg-secondary transition-colors">Hủy</button>
              <button onClick={confirmStep2Date} disabled={!step2Date} className="px-4 h-9 bg-accent text-white rounded-sm text-sm hover:bg-accent-hover disabled:opacity-50 transition-colors">Xác nhận</button>
            </div>
          </Card>
        </div>
      )}

      <CountdownConfirmModal open={confirmModal.open} title="Xác nhận thay đổi T1" confirmText="Đồng ý" confirmVariant="primary"
        onConfirm={handleConfirmChange} onCancel={() => setConfirmModal({ open: false })}>
        <p>Bạn đồng ý hoàn tất đổi T1 cho <strong>{request.agent?.full_name ?? '—'}</strong>?</p>
        <p className="mt-1">{request.old_t1 ? `${request.old_t1.full_name} - ${request.old_t1.staff_id}` : '—'} → {request.new_t1 ? `${request.new_t1.full_name} - ${request.new_t1.staff_id}` : '—'}</p>
      </CountdownConfirmModal>

      <CountdownConfirmModal open={cancelModal.open} title="Hủy đề xuất" confirmText="Xác nhận hủy" confirmVariant="danger"
        onConfirm={handleCancelRequest} onCancel={() => setCancelModal({ open: false, reason: '' })}>
        <p>Bạn muốn hủy đề xuất đổi T1 của <strong>{request.agent?.full_name ?? '—'}</strong>?</p>
        <div className="mt-3">
          <label className="block text-sm font-medium text-text-secondary mb-1">Lý do hủy</label>
          <textarea
            value={cancelModal.reason}
            onChange={(e) => setCancelModal((prev) => ({ ...prev, reason: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-border-light rounded-sm text-sm bg-bg-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
          />
        </div>
      </CountdownConfirmModal>
    </div>
  )
}
