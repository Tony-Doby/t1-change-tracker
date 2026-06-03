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
        <div className="page-card-lg space-y-4"><SkeletonText lines={4} /></div>
        <div className="page-card-lg space-y-4"><SkeletonText lines={6} /></div>
      </div>
    )
  }

  if (!request) {
    return <div className="text-center py-12"><p className="text-neutral-500">Không tìm thấy đề xuất</p><Link to="/requests" className="text-primary hover:underline text-sm">Quay lại</Link></div>
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

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link to="/requests" className="p-1.5 rounded-md hover:bg-neutral-200 text-neutral-700"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Đề xuất #{request.id?.slice(0, 8)}</h1>
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${request.status === 'completed' ? 'bg-success-light text-success' : request.status === 'cancelled' ? 'bg-danger-light text-danger' : request.status === 'step2' && !request.step2_confirmed_at ? 'bg-primary-light text-primary' : 'bg-success-light text-success'}`}>
              {isCompleted ? 'Hoàn tất' : isCancelled ? 'Đã hủy' : request.status === 'step2' && !request.step2_confirmed_at ? 'B2 - Chờ ngày xác nhận' : 'B3 - Quyết định'}
            </span>
          </div>
        </div>
        {role !== 'viewer' && !isCompleted && !isCancelled && (
          <div className="flex items-center gap-2">
            {(request.status === 'step1' || (request.status === 'step2' && !request.step2_confirmed_at)) && (
              <button onClick={advanceStep} className="px-4 h-9 bg-primary text-white rounded-md text-sm hover:bg-primary-hover">
                {request.status === 'step1' ? 'Chuyển sang B2' : 'Nhập ngày xác nhận B2'}
              </button>
            )}
            {((request.status === 'step2' && request.step2_confirmed_at) || ['step3', 'step4', 'step5'].includes(request.status)) && (
              <>
                <button onClick={() => setConfirmModal({ open: true })} disabled={!calculatedB3.isB3Ready && request.status === 'step2'}
                  title={!calculatedB3.isB3Ready ? `Còn ${Math.max(0, calculatedB3.daysLeft)} ngày làm việc` : 'Xác nhận thay đổi T1'}
                  className={`px-4 h-9 rounded-md text-sm ${calculatedB3.isB3Ready ? 'bg-success text-white hover:opacity-90' : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'}`}>
                  {calculatedB3.isB3Ready ? 'Đồng ý' : `Đồng ý (${Math.max(0, calculatedB3.daysLeft)} ngày)`}
                </button>
                <button onClick={() => setCancelModal({ open: true, reason: '' })} className="px-4 h-9 border border-danger text-danger rounded-md text-sm hover:bg-danger-light">Hủy đề xuất</button>
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
          <div className="bg-white rounded-xl shadow-modal w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900">Xác nhận chuyển sang B2</h3>
            <p className="text-sm text-neutral-600">Vui lòng nhập ngày T1 mới xác nhận đồng ý tiếp nhận.</p>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-neutral-500 mb-1">Ngày xác nhận</label>
              <input type="date" value={step2Date} onChange={(e) => setStep2Date(e.target.value)}
                className="w-full h-10 px-3 border border-neutral-300 rounded-md text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light" />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowStep2Date(false)} className="px-4 h-9 border border-neutral-300 rounded-md text-sm text-neutral-700 hover:bg-neutral-50">Hủy</button>
              <button onClick={confirmStep2Date} disabled={!step2Date} className="px-4 h-9 bg-primary text-white rounded-md text-sm hover:bg-primary-hover disabled:opacity-50">Xác nhận</button>
            </div>
          </div>
        </div>
      )}

      <CountdownConfirmModal open={confirmModal.open} title="Xác nhận thay đổi T1" confirmText="Đồng ý" confirmVariant="primary"
        onConfirm={handleConfirmChange} onCancel={() => setConfirmModal({ open: false })}>
        <p>Bạn đồng ý hoàn tất đổi T1 cho <strong>{request.agent?.full_name ?? '—'}</strong>?</p>
        <p className="mt-1">{request.old_t1 ? `${request.old_t1.full_name} - ${request.old_t1.staff_id}` : '—'} → {request.new_t1 ? `${request.new_t1.full_name} - ${request.new_t1.staff_id}` : '—'}</p>
        <p className="mt-2 text-neutral-500">Hành động này sẽ cập nhật T1 mới, ghi lịch sử và tạo M1 transition tasks (nếu có).</p>
      </CountdownConfirmModal>

      <CountdownConfirmModal open={cancelModal.open} title="Hủy đề xuất" confirmText="Xác nhận hủy" confirmVariant="danger"
        onConfirm={handleCancelRequest} onCancel={() => setCancelModal({ open: false, reason: '' })}>
        <p>Bạn muốn hủy đề xuất đổi T1 của <strong>{request.agent?.full_name ?? '—'}</strong>?</p>
        <div className="mt-3">
          <label className="block text-xs font-medium uppercase tracking-wide text-neutral-500 mb-1">Lý do hủy</label>
          <textarea value={cancelModal.reason} onChange={(e) => setCancelModal((prev) => ({ ...prev, reason: e.target.value }))} rows={3}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light" />
        </div>
      </CountdownConfirmModal>
    </div>
  )
}
