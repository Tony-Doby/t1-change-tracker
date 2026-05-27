import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Circle, CircleDot, Clock, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../components/Toast'
import { formatDateTime } from '../lib/date-utils'
import { addBusinessDays } from '../lib/eligibility'
import { completeRequestAction } from '../lib/request-actions'
import CountdownConfirmModal from '../components/CountdownConfirmModal'

const stepNames = ['B1', 'B2', 'B3']

export default function RequestDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const { show } = useToast()
  const [request, setRequest] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [stepHistory, setStepHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showStep2Date, setShowStep2Date] = useState(false)
  const [step2Date, setStep2Date] = useState('')
  const [historyExpanded, setHistoryExpanded] = useState(false)
  const [notifications, setNotifications] = useState<Record<string, boolean>>({})

  // B3 decision state
  const [deadline3, setDeadline3] = useState<Date | null>(null)
  const [isB3Ready, setIsB3Ready] = useState(false)
  const [daysLeft, setDaysLeft] = useState(0)

  // Modals
  const [confirmModal, setConfirmModal] = useState<{ open: boolean }>({ open: false })
  const [cancelModal, setCancelModal] = useState<{ open: boolean; reason: string }>({ open: false, reason: '' })

  useEffect(() => {
    if (!id) return
    loadData()
  }, [id])

  async function loadData() {
    setLoading(true)
    try {
      const { data: req } = await supabase
        .from('t1_requests')
        .select('*, agent: agent_id(full_name, staff_id), old_t1: old_t1_id(full_name, staff_id), new_t1: proposed_new_t1_id(full_name, staff_id)')
        .eq('id', id)
        .single()
      setRequest(req)

      const { data: cmts } = await supabase.from('request_comments').select('*').eq('request_id', id).order('created_at', { ascending: true })
      setComments(cmts ?? [])

      const { data: logs } = await supabase.from('activity_logs').select('*').eq('request_id', id).eq('action_type', 'request_step_changed').order('created_at', { ascending: true })
      setStepHistory(logs ?? [])

      // Load holidays for B3 deadline calculation
      const { data: holidaysData } = await supabase.from('holidays').select('holiday_date')
      const holidaySet = new Set<string>((holidaysData ?? []).map((h: any) => h.holiday_date.slice(0, 10)))

      // Calculate B3 readiness
      if (req?.step2_confirmed_at) {
        const d3 = addBusinessDays(req.step2_confirmed_at, 3, holidaySet)
        setDeadline3(d3)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        setIsB3Ready(today >= d3)
        setDaysLeft(Math.ceil((d3.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
      } else {
        setDeadline3(null)
        setIsB3Ready(false)
        setDaysLeft(0)
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
  }

  if (!request) {
    return <div className="text-center py-12"><p className="text-neutral-500">Không tìm thấy đề xuất</p><Link to="/requests" className="text-primary hover:underline text-sm">Quay lại</Link></div>
  }

  const isCompleted = request.status === 'completed'
  const isCancelled = request.status === 'cancelled'
  const role = user?.role ?? 'viewer'

  // Map DB status to UI step (0=B1, 1=B2, 2=B3)
  const getUIStep = () => {
    if (isCompleted || isCancelled) return 3
    if (request.status === 'step1') return 0
    if (request.status === 'step2') {
      return request.step2_confirmed_at ? 2 : 1
    }
    // Legacy step3/4/5
    return 2
  }
  const uiStep = getUIStep()

  const advanceStep = async () => {
    if (isCompleted || isCancelled) return
    // Only B1 → B2 now
    if (request.status !== 'step1') return

    setStep2Date(new Date().toISOString().slice(0, 10))
    setShowStep2Date(true)
  }

  const confirmStep2Date = async () => {
    if (!step2Date) return
    const dateValue = new Date(step2Date).toISOString()
    const { error } = await supabase.from('t1_requests').update({
      status: 'step2',
      step2_confirmed_at: dateValue,
      updated_at: new Date().toISOString(),
    }).eq('id', request.id)
    if (error) { show('Lỗi: ' + error.message, 'error'); return }

    await supabase.from('activity_logs').insert({
      request_id: request.id,
      action_type: 'request_step_changed',
      description: 'Chuyển sang B2',
      created_by: user?.id,
    })
    setShowStep2Date(false)
    show('Đã chuyển sang B2', 'success')
    loadData()
  }

  const handleConfirmChange = async () => {
    try {
      await completeRequestAction(
        {
          id: request.id,
          agent_id: request.agent_id,
          old_t1_id: request.old_t1_id,
          proposed_new_t1_id: request.proposed_new_t1_id,
        },
        user?.id
      )
      setConfirmModal({ open: false })
      show('Đã đồng ý thay đổi T1', 'success')
      loadData()
    } catch (e: any) {
      show('Lỗi: ' + e.message, 'error')
    }
  }

  const handleCancelRequest = async () => {
    if (!cancelModal.reason.trim()) {
      show('Vui lòng nhập lý do hủy', 'warning')
      return
    }
    const now = new Date().toISOString()
    const { error } = await supabase.from('t1_requests').update({
      status: 'cancelled',
      cancelled_by: user?.id,
      cancelled_reason: cancelModal.reason.trim(),
      updated_at: now,
    }).eq('id', request.id)
    if (error) {
      show('Lỗi: ' + error.message, 'error')
      return
    }
    setCancelModal({ open: false, reason: '' })
    show('Đã hủy đề xuất', 'warning')
    loadData()
  }

  const submitComment = async () => {
    if (!newComment.trim()) return
    const { data, error } = await supabase.from('request_comments').insert({ request_id: request.id, content: newComment.trim(), created_by: user?.id }).select()
    if (error) { show('Lỗi: ' + error.message, 'error'); return }
    setComments((prev) => [...prev, ...(data ?? [])])
    setNewComment('')
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
            {/* B1 or B2 without date → show advance to B2 */}
            {(request.status === 'step1' || (request.status === 'step2' && !request.step2_confirmed_at)) && (
              <button onClick={advanceStep} className="px-4 h-9 bg-primary text-white rounded-md text-sm hover:bg-primary-hover">
                {request.status === 'step1' ? 'Chuyển sang B2' : 'Nhập ngày xác nhận B2'}
              </button>
            )}

            {/* B2 with date or legacy B3-B5 → show decision buttons */}
            {((request.status === 'step2' && request.step2_confirmed_at) || ['step3', 'step4', 'step5'].includes(request.status)) && (
              <>
                <button
                  onClick={() => setConfirmModal({ open: true })}
                  disabled={!isB3Ready && request.status === 'step2'}
                  title={!isB3Ready ? `Còn ${Math.max(0, daysLeft)} ngày làm việc` : 'Xác nhận thay đổi T1'}
                  className={`px-4 h-9 rounded-md text-sm ${
                    isB3Ready
                      ? 'bg-success text-white hover:opacity-90'
                      : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                  }`}
                >
                  {isB3Ready ? 'Đồng ý' : `Đồng ý (${Math.max(0, daysLeft)} ngày)`}
                </button>
                <button
                  onClick={() => setCancelModal({ open: true, reason: '' })}
                  className="px-4 h-9 border border-danger text-danger rounded-md text-sm hover:bg-danger-light"
                >
                  Hủy đề xuất
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="bg-primary-light rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
        <div><p className="text-xs text-neutral-500">Agent</p><p className="text-sm font-medium text-neutral-900">{request.agent ? `${request.agent.full_name} - ${request.agent.staff_id}` : '—'}</p></div>
        <div className="flex items-center gap-4">
          <div className="text-right"><p className="text-xs text-neutral-500">T1 CŨ</p><p className="text-sm font-medium text-neutral-900">{request.old_t1 ? `${request.old_t1.full_name} - ${request.old_t1.staff_id}` : '—'}</p></div>
          <span className="text-xl text-neutral-400">→</span>
          <div className="text-right"><p className="text-xs text-neutral-500">T1 MỚI</p><p className="text-sm font-medium text-neutral-900">{request.new_t1 ? `${request.new_t1.full_name} - ${request.new_t1.staff_id}` : '—'}</p></div>
        </div>
      </div>

      {/* Deadline info for B3 */}
      {request.status === 'step2' && request.step2_confirmed_at && deadline3 && (
        <div className="bg-white rounded-lg shadow-card p-4">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div><span className="text-neutral-500">Ngày xác nhận B2:</span> <span className="font-medium">{new Date(request.step2_confirmed_at).toLocaleDateString('vi-VN')}</span></div>
            <div><span className="text-neutral-500">Hết hạn 3 ngày LV:</span> <span className="font-medium">{deadline3.toLocaleDateString('vi-VN')}</span></div>
            <div>
              {isB3Ready ? (
                <span className="text-success font-medium">✅ Đã đủ 3 ngày làm việc</span>
              ) : (
                <span className="text-warning font-medium">⏳ Còn {Math.max(0, daysLeft)} ngày làm việc</span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-card p-5">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Tiến trình</h2>
        <div className="flex items-center gap-1">
          {stepNames.map((name, idx) => {
            const isDone = isCompleted || (uiStep > idx && !isCancelled)
            const isCurrent = !isCompleted && !isCancelled && uiStep === idx
            const isB3Locked = request.status === 'step2' && request.step2_confirmed_at && idx === 2 && !isB3Ready
            const isCancelledStep = isCancelled && idx === 2

            return (
              <div key={name} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    isDone ? 'bg-primary text-white'
                      : isCancelledStep ? 'bg-danger text-white'
                        : isB3Locked ? 'bg-neutral-100 text-neutral-400 ring-2 ring-neutral-300'
                          : isCurrent ? 'ring-2 ring-primary bg-white text-primary'
                            : 'bg-neutral-100 text-neutral-400'
                  }`}>
                    {isDone ? <CheckCircle2 className="w-5 h-5" />
                      : isCancelledStep ? <X className="w-5 h-5" />
                        : isB3Locked ? <Clock className="w-5 h-5" />
                          : isCurrent ? <CircleDot className="w-5 h-5" />
                            : <Circle className="w-5 h-5" />}
                  </div>
                  <span className={`text-xs mt-1.5 font-medium ${
                    isCancelledStep ? 'text-danger' : isCurrent ? 'text-primary' : isDone ? 'text-neutral-700' : 'text-neutral-400'
                  }`}>
                    {name}{isB3Locked ? ' (chờ)' : ''}
                  </span>
                </div>
                {idx < stepNames.length - 1 && <div className={`flex-1 h-0.5 mx-1 ${isDone ? 'bg-primary' : 'bg-neutral-200'}`} />}
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-card p-5">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">💬 Thảo luận</h2>
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
          {comments.map((c) => (
            <div key={c.id} className={`flex gap-3 ${c.created_by === user?.id ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${c.created_by === user?.id ? 'bg-primary text-white' : 'bg-neutral-200 text-neutral-700'}`}>A</div>
              <div className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${c.created_by === user?.id ? 'bg-primary-light text-neutral-900' : 'bg-neutral-50 text-neutral-900'}`}>
                <p>{c.content}</p>
                <p className={`text-[10px] mt-1 ${c.created_by === user?.id ? 'text-primary/70' : 'text-neutral-400'}`}>{formatDateTime(c.created_at)}</p>
              </div>
            </div>
          ))}
          {comments.length === 0 && <p className="text-sm text-neutral-500 italic">Chưa có bình luận nào</p>}
        </div>
        {role !== 'viewer' && !isCompleted && !isCancelled && (
          <div className="mt-4 flex gap-2">
            <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Nhập ghi chú..." rows={2} className="flex-1 px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light resize-none" />
            <button onClick={submitComment} disabled={!newComment.trim()} className="px-4 h-auto bg-primary text-white rounded-md text-sm hover:bg-primary-hover disabled:opacity-50">Gửi</button>
          </div>
        )}
      </div>

      {stepHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow-card p-5">
          <button onClick={() => setHistoryExpanded((v) => !v)} className="flex items-center gap-2 text-lg font-semibold text-neutral-900 mb-2">📝 Lịch sử chuyển bước <span className="text-xs text-neutral-500 font-normal">({historyExpanded ? 'Thu gọn' : 'Mở rộng'})</span></button>
          {historyExpanded && (
            <div className="space-y-3 mt-3">
              {stepHistory.map((h, idx) => (
                <div key={idx} className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div><p className="text-neutral-900">{h.description}</p><p className="text-xs text-neutral-500">{formatDateTime(h.created_at)}</p></div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isAtB3 && (
        <div className="bg-white rounded-lg shadow-card p-5">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Checklist thông báo hoàn tất</h2>
          <div className="space-y-2">
            {['agent', 'introducer', 'old_upline', 'new_upline', 'old_downline'].map((key) => (
              <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={notifications[key] || false} onChange={(e) => setNotifications((prev) => ({ ...prev, [key]: e.target.checked }))} className="rounded border-neutral-300" />
                <span className="text-neutral-700">{key === 'agent' ? 'Agent tự đề xuất' : key === 'introducer' ? 'Người giới thiệu' : key === 'old_upline' ? 'Tuyến trên cũ (T1, T2...)' : key === 'new_upline' ? 'Tuyến trên mới (T1, T2, T3)' : 'Tuyến dưới cũ (M1)'}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Step 2 date modal */}
      {showStep2Date && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-modal w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900">Xác nhận chuyển sang B2</h3>
            <p className="text-sm text-neutral-600">Vui lòng nhập ngày T1 mới xác nhận đồng ý tiếp nhận.</p>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-neutral-500 mb-1">Ngày xác nhận</label>
              <input
                type="date"
                value={step2Date}
                onChange={(e) => setStep2Date(e.target.value)}
                className="w-full h-10 px-3 border border-neutral-300 rounded-md text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowStep2Date(false)} className="px-4 h-9 border border-neutral-300 rounded-md text-sm text-neutral-700 hover:bg-neutral-50">Hủy</button>
              <button onClick={confirmStep2Date} disabled={!step2Date} className="px-4 h-9 bg-primary text-white rounded-md text-sm hover:bg-primary-hover disabled:opacity-50">Xác nhận</button>
            </div>
          </div>
        </div>
      )}

      <CountdownConfirmModal
        open={confirmModal.open}
        title="Xác nhận thay đổi T1"
        confirmText="Đồng ý"
        confirmVariant="primary"
        onConfirm={handleConfirmChange}
        onCancel={() => setConfirmModal({ open: false })}
      >
        <p>Bạn đồng ý hoàn tất đổi T1 cho <strong>{request.agent?.full_name ?? '—'}</strong>?</p>
        <p className="mt-1">{request.old_t1 ? `${request.old_t1.full_name} - ${request.old_t1.staff_id}` : '—'} → {request.new_t1 ? `${request.new_t1.full_name} - ${request.new_t1.staff_id}` : '—'}</p>
        <p className="mt-2 text-neutral-500">Hành động này sẽ cập nhật T1 mới, ghi lịch sử và tạo M1 transition tasks (nếu có).</p>
      </CountdownConfirmModal>

      <CountdownConfirmModal
        open={cancelModal.open}
        title="Hủy đề xuất"
        confirmText="Xác nhận hủy"
        confirmVariant="danger"
        onConfirm={handleCancelRequest}
        onCancel={() => setCancelModal({ open: false, reason: '' })}
      >
        <p>Bạn muốn hủy đề xuất đổi T1 của <strong>{request.agent?.full_name ?? '—'}</strong>?</p>
        <div className="mt-3">
          <label className="block text-xs font-medium uppercase tracking-wide text-neutral-500 mb-1">Lý do hủy</label>
          <textarea
            value={cancelModal.reason}
            onChange={(e) => setCancelModal((prev) => ({ ...prev, reason: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
          />
        </div>
      </CountdownConfirmModal>
    </div>
  )
}
