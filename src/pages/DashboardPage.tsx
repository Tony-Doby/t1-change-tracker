import { useEffect, useState } from 'react'
import { useToast } from '../components/Toast'
import { Users, ClipboardList, Clock, CheckCircle, AlertTriangle, Star, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { BOOKMARKS_KEY } from '../lib/constants'
import { addBusinessDays } from '../lib/eligibility'
import { completeRequestAction } from '../lib/request-actions'
import { formatDate } from '../lib/date-utils'
import CountdownConfirmModal from '../components/CountdownConfirmModal'
import type { RequestStatus } from '../types'

const statusLabels: Record<RequestStatus | string, string> = {
  step1: 'B1', step2: 'B2', step3: 'B3', step4: 'B4', step5: 'B5',
  completed: 'Hoàn tất', cancelled: 'Đã hủy',
}

const statusColors: Record<string, string> = {
  step1: 'bg-primary-light', step2: 'bg-primary/10', step3: 'bg-warning-light',
  step4: 'bg-neutral-100', step5: 'bg-success-light',
  completed: 'bg-success-light/50', cancelled: 'bg-danger-light',
}

interface TransitionTask {
  id: string
  m1_agent_id: string
  m1_agent: { full_name: string; staff_id: string } | null
  temp_t1_id: string
  temp_t1: { full_name: string; staff_id: string } | null
  deadline_date: string
  status: string
  daysLeft: number
}

interface B2Request {
  id: string
  agent_id: string
  agent: { full_name: string; staff_id: string } | null
  old_t1_id: string | null
  old_t1: { full_name: string; staff_id: string } | null
  proposed_new_t1_id: string
  new_t1: { full_name: string; staff_id: string } | null
  step2_confirmed_at: string
  deadline3: Date
  deadline4: Date
}

export default function DashboardPage() {
  const { show } = useToast()
  const [stats, setStats] = useState({ totalAgents: 0, totalRequests: 0, pending: 0, completed: 0 })
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({})
  const [transitions, setTransitions] = useState<TransitionTask[]>([])
  const [bookmarkedAgents, setBookmarkedAgents] = useState<any[]>([])
  const [b2Requests, setB2Requests] = useState<B2Request[]>([])
  const [loading, setLoading] = useState(true)
  const [processingT2, setProcessingT2] = useState<string | null>(null)

  const [confirmModal, setConfirmModal] = useState<{ open: boolean; req: B2Request | null }>({ open: false, req: null })
  const [cancelModal, setCancelModal] = useState<{ open: boolean; req: B2Request | null; reason: string }>({ open: false, req: null, reason: '' })

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        // Stats
        const { count: totalAgents } = await supabase.from('agents').select('*', { count: 'exact', head: true }).is('deleted_at', null)
        const { count: totalRequests } = await supabase.from('t1_requests').select('*', { count: 'exact', head: true }).is('deleted_at', null)
        const { count: pending } = await supabase.from('t1_requests').select('*', { count: 'exact', head: true }).is('deleted_at', null).in('status', ['step1', 'step2', 'step3', 'step4', 'step5'])
        const { count: completed } = await supabase.from('t1_requests').select('*', { count: 'exact', head: true }).is('deleted_at', null).eq('status', 'completed')
        setStats({
          totalAgents: totalAgents ?? 0,
          totalRequests: totalRequests ?? 0,
          pending: pending ?? 0,
          completed: completed ?? 0,
        })

        // Status counts
        const { data: statusData } = await supabase.from('t1_requests').select('status').is('deleted_at', null)
        const counts: Record<string, number> = {}
        statusData?.forEach((r) => { counts[r.status] = (counts[r.status] ?? 0) + 1 })
        setStatusCounts(counts)

        // Holidays
        const { data: holidaysData } = await supabase.from('holidays').select('holiday_date')
        const holidays = new Set<string>((holidaysData ?? []).map((h: any) => h.holiday_date.slice(0, 10)))

        // Step 2 requests
        const { data: step2Data } = await supabase
          .from('t1_requests')
          .select(`
            id, agent_id, old_t1_id, proposed_new_t1_id, step2_confirmed_at,
            agent:agent_id(full_name, staff_id),
            old_t1:old_t1_id(full_name, staff_id),
            new_t1:proposed_new_t1_id(full_name, staff_id)
          `)
          .eq('status', 'step2')
          .is('deleted_at', null)

        const mappedB2: B2Request[] = (step2Data ?? []).map((r: any) => {
          const confirmed = r.step2_confirmed_at ?? r.created_at
          return {
            id: r.id,
            agent_id: r.agent_id,
            agent: r.agent,
            old_t1_id: r.old_t1_id,
            old_t1: r.old_t1,
            proposed_new_t1_id: r.proposed_new_t1_id,
            new_t1: r.new_t1,
            step2_confirmed_at: confirmed,
            deadline3: addBusinessDays(confirmed, 3, holidays),
            deadline4: addBusinessDays(confirmed, 4, holidays),
          }
        })
        setB2Requests(mappedB2)

        // Process expired M1 transitions (lazy processing)
        await supabase.rpc('process_expired_m1_transitions')

        // Load transition tasks
        const { data: tasks } = await supabase
          .from('m1_transition_tasks')
          .select('*, m1_agent: m1_agent_id(full_name, staff_id), temp_t1: temp_t1_id(full_name, staff_id)')
          .in('status', ['pending', 'expired'])
          .order('deadline_date', { ascending: true })

        const mapped: TransitionTask[] = (tasks ?? []).map((t: any) => {
          const daysLeft = Math.ceil((new Date(t.deadline_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          return {
            id: t.id,
            m1_agent_id: t.m1_agent_id,
            m1_agent: t.m1_agent,
            temp_t1_id: t.temp_t1_id,
            temp_t1: t.temp_t1,
            deadline_date: t.deadline_date,
            status: t.status,
            daysLeft,
          }
        })
        setTransitions(mapped)

        // Bookmarks
        const bookmarks = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]')
        if (bookmarks.length > 0) {
          const { data: bmAgents } = await supabase.from('agents').select('*').in('id', bookmarks).is('deleted_at', null)
          setBookmarkedAgents(bmAgents ?? [])
        }
      } catch (e) {
        console.error(e)
      }
      setLoading(false)
    }
    load()
  }, [])

  const applyT2 = async (task: TransitionTask) => {
    setProcessingT2(task.id)
    const now = new Date().toISOString()

    const { error: agentError } = await supabase.from('agents').update({ current_t1_id: task.temp_t1_id }).eq('id', task.m1_agent_id)
    if (agentError) { show('Lỗi cập nhật agent: ' + agentError.message, 'error'); setProcessingT2(null); return }

    const { error: taskError } = await supabase.from('m1_transition_tasks').update({ status: 't2_assigned', resolved_at: now }).eq('id', task.id)
    if (taskError) { show('Lỗi cập nhật task: ' + taskError.message, 'error'); setProcessingT2(null); return }

    await supabase.from('activity_logs').insert({
      agent_id: task.m1_agent_id,
      action_type: 'm1_stayed_with_t2',
      new_t1_id: task.temp_t1_id,
      description: `M1 ${task.m1_agent?.full_name ?? ''} ở lại với T2 (${task.temp_t1?.full_name ?? ''})`,
      created_at: now,
    })

    setTransitions((prev) => prev.filter((t) => t.id !== task.id))
    setProcessingT2(null)
  }

  const handleConfirmChange = async () => {
    const req = confirmModal.req
    if (!req) return
    try {
      await completeRequestAction(
        {
          id: req.id,
          agent_id: req.agent_id,
          old_t1_id: req.old_t1_id,
          proposed_new_t1_id: req.proposed_new_t1_id,
        },
        undefined
      )
      setB2Requests((prev) => prev.filter((r) => r.id !== req.id))
      setConfirmModal({ open: false, req: null })
      show('Đã xác nhận thay đổi T1', 'success')
    } catch (e: any) {
      show('Lỗi: ' + e.message, 'error')
    }
  }

  const handleCancelRequest = async () => {
    const req = cancelModal.req
    if (!req || !cancelModal.reason.trim()) return
    const now = new Date().toISOString()
    const { error } = await supabase.from('t1_requests').update({
      status: 'cancelled',
      cancelled_by: (await supabase.auth.getUser()).data.user?.id,
      cancelled_reason: cancelModal.reason.trim(),
      updated_at: now,
    }).eq('id', req.id)
    if (error) {
      show('Lỗi: ' + error.message, 'error')
      return
    }
    setB2Requests((prev) => prev.filter((r) => r.id !== req.id))
    setCancelModal({ open: false, req: null, reason: '' })
    show('Đã hủy đề xuất', 'warning')
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const b2Pending = b2Requests.filter((r) => today <= r.deadline3)
  const b2Alert = b2Requests.filter((r) => today > r.deadline3 && today < r.deadline4)
  const b2Eligible = b2Requests.filter((r) => today >= r.deadline4)

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng Agent', value: stats.totalAgents, icon: Users },
          { label: 'Tổng Requests', value: stats.totalRequests, icon: ClipboardList },
          { label: 'Đang xử lý', value: stats.pending, icon: Clock },
          { label: 'Hoàn tất', value: stats.completed, icon: CheckCircle },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-lg p-5 shadow-card">
            <div className="flex items-center gap-2 text-neutral-500 mb-2">
              <s.icon className="w-5 h-5 text-primary" />
              <span className="text-xs font-medium">{s.label}</span>
            </div>
            <p className="text-3xl font-bold text-neutral-900">{s.value}</p>
          </div>
        ))}
      </div>

      {(b2Pending.length > 0 || b2Alert.length > 0) && (
        <div className="bg-white rounded-lg p-5 shadow-card">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" /> B2 chờ phản hồi chấp thuận (3 ngày làm việc)
          </h2>
          <div className="space-y-3 max-h-[320px] overflow-y-auto">
            {b2Pending.map((r) => {
              const daysLeft = Math.ceil((r.deadline3.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
              return (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-md bg-neutral-50">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">
                      {r.agent ? `${r.agent.full_name} - ${r.agent.staff_id}` : '—'}
                    </p>
                    <p className="text-xs text-neutral-500">
                      Ngày xác nhận: {formatDate(r.step2_confirmed_at)} • Hết hạn: {formatDate(r.deadline3)}
                      {daysLeft >= 0 ? <span className="text-warning font-medium"> • Còn {daysLeft} ngày</span> : null}
                    </p>
                  </div>
                  <Link to={`/requests/${r.id}`} className="text-xs bg-white border border-neutral-300 text-neutral-700 px-2 py-1 rounded hover:bg-neutral-100 shrink-0 ml-3">Chi tiết</Link>
                </div>
              )
            })}
            {b2Alert.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-md bg-danger-light/30">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {r.agent?.full_name ?? '—'} ({r.agent?.staff_id ?? '—'})
                  </p>
                  <p className="text-xs text-neutral-500">
                    Ngày xác nhận: {formatDate(r.step2_confirmed_at)} • Hết hạn: {formatDate(r.deadline3)}
                    <span className="text-danger font-medium"> • Đã quá hạn</span>
                  </p>
                </div>
                <Link to={`/requests/${r.id}`} className="text-xs bg-white border border-neutral-300 text-neutral-700 px-2 py-1 rounded hover:bg-neutral-100 shrink-0 ml-3">Chi tiết</Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {b2Eligible.length > 0 && (
        <div className="bg-white rounded-lg p-5 shadow-card">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-success" /> B2 đủ điều kiện xác nhận thay đổi (từ ngày thứ 4)
          </h2>
          <div className="space-y-3 max-h-[320px] overflow-y-auto">
            {b2Eligible.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-md bg-success-light/30">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {r.agent?.full_name ?? '—'} ({r.agent?.staff_id ?? '—'})
                  </p>
                  <p className="text-xs text-neutral-500">
                    {r.old_t1 ? `${r.old_t1.full_name} - ${r.old_t1.staff_id}` : '—'} → {r.new_t1 ? `${r.new_t1.full_name} - ${r.new_t1.staff_id}` : '—'}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Ngày xác nhận: {formatDate(r.step2_confirmed_at)} • Đã chờ đủ 4 ngày làm việc
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <button
                    onClick={() => setConfirmModal({ open: true, req: r })}
                    className="text-xs bg-success text-white px-2 py-1 rounded hover:opacity-90"
                  >
                    Xác nhận thay đổi
                  </button>
                  <button
                    onClick={() => setCancelModal({ open: true, req: r, reason: '' })}
                    className="text-xs bg-white border border-danger text-danger px-2 py-1 rounded hover:bg-danger-light"
                  >
                    Hủy đề xuất
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg p-5 shadow-card">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" /> M1 Transition ({transitions.length})
          </h2>
          <div className="space-y-3 max-h-[320px] overflow-y-auto">
            {transitions.length === 0 && <p className="text-sm text-neutral-500 italic">Không có M1 nào đang trong giai đoạn transition</p>}
            {transitions.map((t) => (
              <div key={t.id} className={`flex items-center justify-between p-3 rounded-md ${t.status === 'expired' ? 'bg-danger-light/30' : 'bg-neutral-50'}`}>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {t.m1_agent?.full_name ?? '—'} ({t.m1_agent?.staff_id ?? '—'})
                  </p>
                  <p className="text-xs text-neutral-500">
                    T2 tạm: {t.temp_t1?.full_name ?? '—'} •
                    {t.status === 'expired'
                      ? <span className="text-danger font-medium"> Đã quá hạn {Math.abs(t.daysLeft)} ngày</span>
                      : <span> Còn {t.daysLeft} ngày</span>
                    }
                  </p>
                </div>
                {t.status === 'expired' && (
                  <button
                    onClick={() => applyT2(t)}
                    disabled={processingT2 === t.id}
                    className="text-xs bg-white border border-neutral-300 text-neutral-700 px-2 py-1 rounded hover:bg-neutral-100 shrink-0 ml-3 disabled:opacity-50"
                  >
                    {processingT2 === t.id ? 'Đang xử lý...' : 'Áp dụng T2'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg p-5 shadow-card">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-warning" /> Agent đang theo dõi
          </h2>
          <div className="space-y-3">
            {bookmarkedAgents.length === 0 && <p className="text-sm text-neutral-500 italic">Chưa có agent nào được đánh dấu</p>}
            {bookmarkedAgents.slice(0, 5).map((a: any) => (
              <Link key={a.id} to={`/agents/${a.id}`} className="flex items-center justify-between p-2 rounded-md hover:bg-neutral-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-neutral-900">{a.full_name}</p>
                  <p className="text-xs text-neutral-500">{a.staff_id}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-300" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-5 shadow-card">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">📊 Trạng thái đề xuất</h2>
        <div className="space-y-3">
          {(['step1','step2','step3','step4','step5','completed','cancelled'] as string[]).map((s) => {
            const count = statusCounts[s] ?? 0
            const max = Math.max(...Object.values(statusCounts), 1)
            const pct = (count / max) * 100
            return (
              <div key={s} className="flex items-center gap-3">
                <span className="text-xs font-medium text-neutral-500 w-16">{statusLabels[s]}</span>
                <div className="flex-1 h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${statusColors[s]}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs font-medium text-neutral-700 w-6 text-right">{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      <CountdownConfirmModal
        open={confirmModal.open}
        title="Xác nhận thay đổi T1"
        confirmText="Xác nhận thay đổi"
        confirmVariant="primary"
        onConfirm={handleConfirmChange}
        onCancel={() => setConfirmModal({ open: false, req: null })}
      >
        <p>Bạn sắp hoàn tất đổi T1 cho <strong>{confirmModal.req?.agent?.full_name ?? '—'}</strong>:</p>
        <p className="mt-1">{confirmModal.req?.old_t1?.full_name ?? '—'} → {confirmModal.req?.new_t1?.full_name ?? '—'}</p>
        <p className="mt-2 text-neutral-500">Hành động này sẽ cập nhật T1 mới, ghi lịch sử và tạo M1 transition tasks (nếu có).</p>
      </CountdownConfirmModal>

      <CountdownConfirmModal
        open={cancelModal.open}
        title="Hủy đề xuất"
        confirmText="Xác nhận hủy"
        confirmVariant="danger"
        onConfirm={handleCancelRequest}
        onCancel={() => setCancelModal({ open: false, req: null, reason: '' })}
      >
        <p>Bạn muốn hủy đề xuất đổi T1 của <strong>{cancelModal.req?.agent?.full_name ?? '—'}</strong>?</p>
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
