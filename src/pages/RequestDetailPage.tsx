import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Circle, CircleDot } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../components/Toast'

const stepOrder = ['step1', 'step2', 'step3', 'step4', 'step5']
const stepNames = ['B1', 'B2', 'B3', 'B4', 'B5']

export default function RequestDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const { show } = useToast()
  const [request, setRequest] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [stepHistory, setStepHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCancel, setShowCancel] = useState(false)
  const [showComplete, setShowComplete] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [historyExpanded, setHistoryExpanded] = useState(false)
  const [notifications, setNotifications] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!id) return
    loadData()
  }, [id])

  async function loadData() {
    setLoading(true)
    const { data: req } = await supabase.from('t1_requests').select('*, agent: agent_id(full_name, staff_id)').eq('id', id).single()
    setRequest(req)

    const { data: cmts } = await supabase.from('request_comments').select('*').eq('request_id', id).order('created_at', { ascending: true })
    setComments(cmts ?? [])

    const { data: logs } = await supabase.from('activity_logs').select('*').eq('request_id', id).eq('action_type', 'request_step_changed').order('created_at', { ascending: true })
    setStepHistory(logs ?? [])
    setLoading(false)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
  }

  if (!request) {
    return <div className="text-center py-12"><p className="text-neutral-500">Không tìm thấy đề xuất</p><Link to="/requests" className="text-primary hover:underline text-sm">Quay lại</Link></div>
  }

  const currentStepIndex = stepOrder.indexOf(request.status)
  const isCompleted = request.status === 'completed'
  const isCancelled = request.status === 'cancelled'
  const isAtStep5 = request.status === 'step5'
  const role = user?.role ?? 'viewer'

  const advanceStep = async () => {
    if (isCompleted || isCancelled) return
    const nextIdx = currentStepIndex + 1
    if (nextIdx >= stepOrder.length) return
    const nextStatus = stepOrder[nextIdx]
    const now = new Date().toISOString()
    const updateData: any = { status: nextStatus, updated_at: now }
    if (nextStatus === 'step2') updateData.step2_confirmed_at = now
    if (nextStatus === 'step3') updateData.step3_era_notified_at = now
    if (nextStatus === 'step4') updateData.step4_agent_confirmed_at = now
    if (nextStatus === 'step5') updateData.step5_completed_at = now

    const { error } = await supabase.from('t1_requests').update(updateData).eq('id', request.id)
    if (error) { show('Lỗi: ' + error.message, 'error'); return }

    await supabase.from('activity_logs').insert({ request_id: request.id, action_type: 'request_step_changed', description: `Chuyển sang ${stepNames[nextIdx]}`, created_by: user?.id })
    show(`Đã chuyển sang ${stepNames[nextIdx]}`, 'success')
    loadData()
  }

  const completeRequest = async () => {
    if (!isAtStep5) return
    const now = new Date().toISOString()
    const { error } = await supabase.from('t1_requests').update({ status: 'completed', step5_completed_at: now, updated_at: now }).eq('id', request.id)
    if (error) { show('Lỗi: ' + error.message, 'error'); return }

    await supabase.from('t1_changes').insert({ agent_id: request.agent_id, old_t1_id: request.old_t1_id, new_t1_id: request.proposed_new_t1_id, request_id: request.id, change_date: now, reason: 'agent_request' })
    await supabase.from('agents').update({ current_t1_id: request.proposed_new_t1_id }).eq('id', request.agent_id)
    await supabase.from('activity_logs').insert({ agent_id: request.agent_id, action_type: 't1_changed', old_t1_id: request.old_t1_id, new_t1_id: request.proposed_new_t1_id, request_id: request.id, description: 'Hoàn tất đổi T1', created_by: user?.id })

    // Create m1_transition_tasks for each M1 of the departed agent
    const { data: m1s } = await supabase.from('agents').select('id').eq('current_t1_id', request.agent_id).is('deleted_at', null)
    if (m1s && m1s.length > 0) {
      const deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      const tasks = m1s.map((m1) => ({
        parent_request_id: request.id,
        departed_agent_id: request.agent_id,
        m1_agent_id: m1.id,
        temp_t1_id: request.old_t1_id,
        notify_date: now,
        deadline_date: deadline,
        status: 'pending',
        depth: 1,
      }))
      const { error: taskError } = await supabase.from('m1_transition_tasks').insert(tasks)
      if (taskError) show('Lỗi tạo M1 transition tasks: ' + taskError.message, 'error')
    }

    setShowComplete(false)
    show('Đã hoàn tất đề xuất', 'success')
    loadData()
  }

  const cancelRequest = async () => {
    if (!cancelReason.trim()) return
    const now = new Date().toISOString()
    const { error } = await supabase.from('t1_requests').update({ status: 'cancelled', cancelled_by: user?.id, cancelled_reason: cancelReason, updated_at: now }).eq('id', request.id)
    if (error) { show('Lỗi: ' + error.message, 'error'); return }
    setShowCancel(false)
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

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link to="/requests" className="p-1.5 rounded-md hover:bg-neutral-200 text-neutral-700"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Đề xuất #{request.id?.slice(0, 8)}</h1>
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${request.status === 'completed' ? 'bg-success-light text-success' : request.status === 'cancelled' ? 'bg-danger-light text-danger' : request.status === 'step5' ? 'bg-success-light text-success' : 'bg-primary-light text-primary'}`}>{request.status}</span>
          </div>
        </div>
        {role !== 'viewer' && !isCompleted && !isCancelled && (
          <div className="flex items-center gap-2">
            <button onClick={() => setShowCancel(true)} className="px-4 h-9 border border-danger text-danger rounded-md text-sm hover:bg-danger-light">Hủy</button>
            {isAtStep5 ? <button onClick={() => setShowComplete(true)} className="px-4 h-9 bg-success text-white rounded-md text-sm hover:opacity-90">Hoàn tất</button>
              : <button onClick={advanceStep} className="px-4 h-9 bg-primary text-white rounded-md text-sm hover:bg-primary-hover">Chuyển sang {stepNames[currentStepIndex + 1]}</button>}
          </div>
        )}
      </div>

      <div className="bg-primary-light rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
        <div><p className="text-xs text-neutral-500">Agent</p><p className="text-sm font-medium text-neutral-900">{request.agent?.full_name ?? '—'} ({request.agent?.staff_id ?? '—'})</p></div>
        <div className="flex items-center gap-4">
          <div className="text-right"><p className="text-xs text-neutral-500">T1 CŨ</p><p className="text-sm font-medium text-neutral-900">{request.old_t1_id?.slice(0, 8) ?? '—'}</p></div>
          <span className="text-xl text-neutral-400">→</span>
          <div className="text-right"><p className="text-xs text-neutral-500">T1 MỚI</p><p className="text-sm font-medium text-neutral-900">{request.proposed_new_t1_id?.slice(0, 8) ?? '—'}</p></div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-card p-5">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Tiến trình</h2>
        <div className="flex items-center gap-1">
          {stepNames.map((name, idx) => {
            const isDone = isCompleted || idx < currentStepIndex
            const isCurrent = !isCompleted && !isCancelled && idx === currentStepIndex
            return (
              <div key={name} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${isDone ? 'bg-primary text-white' : isCurrent ? 'ring-2 ring-primary bg-white text-primary' : 'bg-neutral-100 text-neutral-400'}`}>
                    {isDone ? <CheckCircle2 className="w-5 h-5" /> : isCurrent ? <CircleDot className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                  </div>
                  <span className={`text-xs mt-1.5 font-medium ${isCurrent ? 'text-primary' : isDone ? 'text-neutral-700' : 'text-neutral-400'}`}>{name}</span>
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
                <p className={`text-[10px] mt-1 ${c.created_by === user?.id ? 'text-primary/70' : 'text-neutral-400'}`}>{new Date(c.created_at).toLocaleString('vi-VN')}</p>
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
                  <div><p className="text-neutral-900">{h.description}</p><p className="text-xs text-neutral-500">{new Date(h.created_at).toLocaleString('vi-VN')}</p></div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isAtStep5 && (
        <div className="bg-white rounded-lg shadow-card p-5">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Checklist thông báo hoàn tất</h2>
          <div className="space-y-2">
            {['agent', 'introducer', 'old_upline', 'new_upline', 'old_downline'].map((key) => (
              <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={notifications[key] || false} onChange={(e) => setNotifications((prev) => ({ ...prev, [key]: e.target.checked }))} className="rounded border-neutral-300" />
                <span className="text-neutral-700">{key === 'agent' ? 'Agent tự đề xuất' : key === 'introducer' ? 'Ngưởi giới thiệu' : key === 'old_upline' ? 'Tuyến trên cũ (T1, T2...)' : key === 'new_upline' ? 'Tuyến trên mới (T1, T2, T3)' : 'Tuyến dưới cũ (M1)'}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {showCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-modal w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900">Xác nhận hủy đề xuất</h3>
            <p className="text-sm text-neutral-600">Bạn có chắc muốn hủy đề xuất này? Hành động này không thể hoàn tác.</p>
            <div><label className="block text-xs font-medium uppercase tracking-wide text-neutral-500 mb-1">Lý do hủy</label><textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} rows={3} className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light" /></div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowCancel(false)} className="px-4 h-9 border border-neutral-300 rounded-md text-sm text-neutral-700 hover:bg-neutral-50">Hủy thao tác</button>
              <button onClick={cancelRequest} disabled={!cancelReason.trim()} className="px-4 h-9 bg-danger text-white rounded-md text-sm hover:bg-danger/90 disabled:opacity-50">Xác nhận hủy</button>
            </div>
          </div>
        </div>
      )}

      {showComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-modal w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900">Xác nhận hoàn tất</h3>
            <p className="text-sm text-neutral-600">Xác nhận hoàn tất đề xuất? Hệ thống sẽ cập nhật T1 mới cho agent và ghi nhận lịch sử.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowComplete(false)} className="px-4 h-9 border border-neutral-300 rounded-md text-sm text-neutral-700 hover:bg-neutral-50">Hủy</button>
              <button onClick={completeRequest} className="px-4 h-9 bg-success text-white rounded-md text-sm hover:opacity-90">Xác nhận hoàn tất</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
