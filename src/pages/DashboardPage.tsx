import { useEffect, useMemo, useState } from 'react'
import { useToast } from '../components/Toast'
import { Users, ClipboardList, Clock, CheckCircle, AlertTriangle, Star, ArrowRight, Inbox, Search, X, Mail } from 'lucide-react'
import { SkeletonCard, SkeletonText } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { BOOKMARKS_KEY } from '../lib/constants'
import { addBusinessDays } from '../lib/eligibility'
import { completeRequestAction } from '../lib/request-actions'
import { formatDate } from '../lib/date-utils'
import CountdownConfirmModal from '../components/CountdownConfirmModal'
import ComposeTemplateModal from '../components/ComposeTemplateModal'
import CreateRequestModal from '../components/CreateRequestModal'
import type { RequestStatus } from '../types'

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
  m1_agent: { full_name: string; staff_id: string; contract_signing_date: string; rank_name: string } | null
  temp_t1_id: string | null
  temp_t1: { full_name: string; staff_id: string } | null
  departed_agent_id: string
  departed_agent: { full_name: string; staff_id: string } | null
  parent_request_id: string | null
  deadline_date: string
  status: string
  daysLeft: number
  email_sent_count: number
  last_email_sent_at: string | null
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
  const navigate = useNavigate()
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
  const [t1Changes, setT1Changes] = useState<any[]>([])
  const [m1Search, setM1Search] = useState('')
  const [b2Search, setB2Search] = useState('')
  const [emailModal, setEmailModal] = useState<{ agentId: string; taskId?: string } | null>(null)
  const [requestModalAgentId, setRequestModalAgentId] = useState<string | null>(null)
  const [confirmT2Task, setConfirmT2Task] = useState<TransitionTask | null>(null)
  const [rankNamesMap, setRankNamesMap] = useState<Map<string, string>>(new Map())

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

        // Load t1_changes for eligibility check
        const { data: changesData } = await supabase
          .from('t1_changes')
          .select('agent_id, change_date, is_counted_for_quota, deleted_at')
          .is('deleted_at', null)
        setT1Changes(changesData ?? [])

        // Load ranks map
        const { data: ranksData } = await supabase.from('ranks').select('id, name')
        const rMap = new Map<string, string>()
        ranksData?.forEach((r: any) => rMap.set(r.id, r.name))
        setRankNamesMap(rMap)

        // Load transition tasks
        const { data: tasks, error: tasksError } = await supabase
          .from('m1_transition_tasks')
          .select(`
            *,
            m1_agent:m1_agent_id(full_name, staff_id, contract_signing_date, rank_name),
            temp_t1:temp_t1_id(full_name, staff_id),
            departed_agent:departed_agent_id(full_name, staff_id)
          `)
          .in('status', ['pending', 'expired'])
          .order('deadline_date', { ascending: true })

        if (tasksError) {
          console.error('M1 Transition query error:', tasksError)
          show('Lỗi tải M1 Transition: ' + tasksError.message, 'error')
        }

        const mapped: TransitionTask[] = (tasks ?? []).map((t: any) => {
          const daysLeft = Math.ceil((new Date(t.deadline_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          return {
            id: t.id,
            m1_agent_id: t.m1_agent_id,
            m1_agent: t.m1_agent,
            temp_t1_id: t.temp_t1_id,
            temp_t1: t.temp_t1,
            departed_agent_id: t.departed_agent_id,
            departed_agent: t.departed_agent,
            parent_request_id: t.parent_request_id,
            deadline_date: t.deadline_date,
            status: t.status,
            daysLeft,
            email_sent_count: t.email_sent_count ?? 0,
            last_email_sent_at: t.last_email_sent_at,
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

    const { error: agentError } = await supabase.from('agents').update({ current_t1_id: task.temp_t1_id, referrer_id: task.temp_t1_id }).eq('id', task.m1_agent_id)
    if (agentError) { show('Lỗi cập nhật agent: ' + agentError.message, 'error'); setProcessingT2(null); return }

    const { error: taskError } = await supabase.from('m1_transition_tasks').update({ status: 't2_assigned', resolved_at: now }).eq('id', task.id)
    if (taskError) { show('Lỗi cập nhật task: ' + taskError.message, 'error'); setProcessingT2(null); return }

    await supabase.from('activity_logs').insert({
      agent_id: task.m1_agent_id,
      action_type: 'm1_stayed_with_t2',
      new_t1_id: task.temp_t1_id,
      description: `M1 ${task.m1_agent?.full_name ?? ''} ở lại với T1 tạm (${task.temp_t1?.full_name ?? 'Không có T1 tạm'})`,
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

  const filteredTransitions = useMemo(() => {
    const q = m1Search.trim().toLowerCase()
    if (!q) return transitions
    return transitions.filter((t) =>
      t.m1_agent?.full_name?.toLowerCase().includes(q) ||
      t.m1_agent?.staff_id?.toLowerCase().includes(q) ||
      t.temp_t1?.full_name?.toLowerCase().includes(q) ||
      t.temp_t1?.staff_id?.toLowerCase().includes(q) ||
      t.departed_agent?.full_name?.toLowerCase().includes(q) ||
      t.departed_agent?.staff_id?.toLowerCase().includes(q)
    )
  }, [transitions, m1Search])

  const b2Pending = b2Requests.filter((r) => today <= r.deadline3)
  const b2Alert = b2Requests.filter((r) => today > r.deadline3 && today < r.deadline4)
  const b2Eligible = b2Requests.filter((r) => today >= r.deadline4)

  const filteredB2Eligible = useMemo(() => {
    const q = b2Search.trim().toLowerCase()
    if (!q) return b2Eligible
    return b2Eligible.filter((r: any) => {
      const a = r.agent
      const old = r.old_t1
      const n = r.new_t1
      return (
        (a?.full_name && a.full_name.toLowerCase().includes(q)) ||
        (a?.staff_id && a.staff_id.toLowerCase().includes(q)) ||
        (old?.full_name && old.full_name.toLowerCase().includes(q)) ||
        (old?.staff_id && old.staff_id.toLowerCase().includes(q)) ||
        (n?.full_name && n.full_name.toLowerCase().includes(q)) ||
        (n?.staff_id && n.staff_id.toLowerCase().includes(q))
      )
    })
  }, [b2Eligible, b2Search])

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="page-title">Dashboard</div>
        <div className="page-grid-cards">
          <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 page-card-lg space-y-3">
            <SkeletonText lines={4} />
          </div>
          <div className="page-card-lg space-y-3">
            <SkeletonText lines={3} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng Agent', value: stats.totalAgents, icon: Users, href: '/agents' },
          { label: 'Tổng Requests', value: stats.totalRequests, icon: ClipboardList, href: '/requests' },
          { label: 'Đang xử lý', value: stats.pending, icon: Clock, href: '/requests?status=step1,step2,step3' },
          { label: 'Hoàn tất', value: stats.completed, icon: CheckCircle, href: '/requests?status=completed' },
        ].map((s) => (
          <button
            key={s.label}
            onClick={() => navigate(s.href)}
            className="text-left bg-white rounded-lg p-5 shadow-card cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex items-center gap-2 text-neutral-500 mb-2">
              <s.icon className="w-5 h-5 text-primary" />
              <span className="text-xs font-medium">{s.label}</span>
            </div>
            <p className="text-3xl font-bold text-neutral-900">{s.value}</p>
          </button>
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
                    {r.agent?.full_name ?? '—'} - {r.agent?.staff_id ?? '—'}
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success" /> B2 đủ điều kiện xác nhận thay đổi ({filteredB2Eligible.length})
            </h2>
            <div className="relative w-48 sm:w-56">
              <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={b2Search}
                onChange={(e) => setB2Search(e.target.value)}
                placeholder="Tìm agent..."
                className="w-full h-9 pl-9 pr-8 border border-neutral-300 rounded-md text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
              />
              {b2Search && (
                <button
                  onClick={() => setB2Search('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <div className="space-y-3 max-h-[320px] overflow-y-auto">
            {filteredB2Eligible.length === 0 && (
              <EmptyState
                icon={<Inbox className="w-12 h-12" />}
                title="Không tìm thấy kết quả"
                subtitle="Thử tìm theo tên hoặc mã nhân viên"
              />
            )}
            {filteredB2Eligible.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-md bg-success-light/30">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {r.agent?.full_name ?? '—'} - {r.agent?.staff_id ?? '—'}
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
                    onClick={() => setEmailModal({ agentId: r.agent_id })}
                    className="text-xs bg-white border border-neutral-300 text-neutral-700 px-2 py-1 rounded hover:bg-neutral-100 whitespace-nowrap"
                  >
                    Tạo email mẫu
                  </button>
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" /> M1 Transition ({filteredTransitions.length})
            </h2>
            <div className="relative w-48 sm:w-56">
              <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={m1Search}
                onChange={(e) => setM1Search(e.target.value)}
                placeholder="Tìm agent..."
                className="w-full h-9 pl-9 pr-8 border border-neutral-300 rounded-md text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
              />
              {m1Search && (
                <button
                  onClick={() => setM1Search('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {filteredTransitions.length === 0 && (
              <EmptyState
                icon={<Inbox className="w-12 h-12" />}
                title="Không có M1 nào đang trong giai đoạn transition"
                subtitle={m1Search ? 'Không tìm thấy kết quả phù hợp' : 'Tất cả M1 đã được xử lý hoặc chưa có request hoàn tất'}
              />
            )}
            {filteredTransitions.map((t) => (
              <div key={t.id} className={`flex items-start justify-between gap-4 p-3 rounded-md ${t.status === 'expired' ? 'bg-danger-light/30' : 'bg-neutral-50'}`}>
                {/* Left: Info vertical stack */}
                <div className="min-w-0 flex-1 space-y-1">
                  {/* Dòng 1: Tên agent + deadline */}
                  <div className="flex items-center gap-2">
                    <Link to={`/agents/${t.m1_agent_id}`} className="text-sm font-medium text-neutral-900 truncate hover:text-primary">
                      {t.m1_agent?.full_name ?? '—'} - {t.m1_agent?.staff_id ?? '—'}
                    </Link>
                    {t.status === 'expired' ? (
                      <span className="text-xs text-danger font-medium shrink-0">Quá hạn {Math.abs(t.daysLeft)} ngày</span>
                    ) : (
                      <span className="text-xs text-neutral-500 shrink-0">Còn {t.daysLeft} ngày</span>
                    )}
                  </div>
                  {/* Dòng 2: T1 cũ */}
                  <p className="text-xs text-neutral-500 truncate">
                    T1 cũ: {t.departed_agent ? `${t.departed_agent.full_name} - ${t.departed_agent.staff_id}` : '—'}
                  </p>
                  {/* Dòng 3: T1 tạm */}
                  <p className="text-xs text-neutral-500 truncate">
                    T1 tạm: {t.temp_t1 ? `${t.temp_t1.full_name} - ${t.temp_t1.staff_id}` : (t.temp_t1_id === null ? 'Không có' : '—')}
                  </p>
                  {/* Dòng 4: Lý do + Email */}
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      t.parent_request_id ? 'bg-primary-light text-primary' : 'bg-warning-light text-warning'
                    }`}>
                      {t.parent_request_id ? 'T1 cũ thay đổi' : 'Deactivate agent'}
                    </span>
                    {t.email_sent_count > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-neutral-500" title={`Gửi lần cuối: ${formatDate(t.last_email_sent_at)}`}>
                        <Mail className="w-3 h-3" /> Đã gửi {t.email_sent_count} lần
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-neutral-400">
                        <Mail className="w-3 h-3" /> Chưa gửi email
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setEmailModal({ agentId: t.m1_agent_id, taskId: t.id })}
                    className="text-xs bg-white border border-neutral-300 text-neutral-700 px-2 py-1 rounded hover:bg-neutral-100 whitespace-nowrap"
                  >
                    {t.email_sent_count > 0 ? 'Gửi lại email' : 'Tạo email mẫu'}
                  </button>
                  <button
                    onClick={() => setRequestModalAgentId(t.m1_agent_id)}
                    disabled={!canCreateRequest(t.m1_agent, t1Changes, rankNamesMap)}
                    className="text-xs bg-white border border-primary text-primary px-2 py-1 rounded hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    Tạo đề xuất
                  </button>
                  <button
                    onClick={() => setConfirmT2Task(t)}
                    disabled={processingT2 === t.id}
                    className="text-xs bg-white border border-neutral-300 text-neutral-700 px-2 py-1 rounded hover:bg-neutral-100 disabled:opacity-50 whitespace-nowrap"
                  >
                    {processingT2 === t.id ? 'Đang xử lý...' : 'Ở lại với T2'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg p-5 shadow-card">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-warning" /> Agent đang theo dõi
          </h2>
          <div className="space-y-3">
            {bookmarkedAgents.length === 0 && (
              <EmptyState
                icon={<Star className="w-12 h-12" />}
                title="Chưa có agent nào được đánh dấu"
                subtitle="Đánh dấu agent để theo dõi nhanh tại đây"
              />
            )}
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
          {(['step1','step2','step3','completed','cancelled'] as string[]).map((s) => {
            const count = statusCounts[s] ?? 0
            const max = Math.max(...Object.values(statusCounts), 1)
            const pct = (count / max) * 100
            return (
              <button
                key={s}
                onClick={() => navigate(`/requests?status=${s}`)}
                className="w-full flex items-center gap-3 cursor-pointer hover:bg-neutral-50 rounded-md px-1 py-1 transition-colors"
              >
                <span className="text-xs font-medium text-neutral-500 w-16 text-left">{statusLabels[s]}</span>
                <div className="flex-1 h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${statusColors[s]}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs font-medium text-neutral-700 w-6 text-right">{count}</span>
              </button>
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

      {emailModal && (
        <ComposeTemplateModal agentId={emailModal.agentId} m1TaskId={emailModal.taskId ?? undefined} onClose={() => setEmailModal(null)} />
      )}
      {requestModalAgentId && (
        <CreateRequestModal agentId={requestModalAgentId} onClose={() => setRequestModalAgentId(null)} />
      )}
      {confirmT2Task && (
        <CountdownConfirmModal
          open={true}
          title="Xác nhận ở lại với T1 tạm"
          confirmText="Xác nhận"
          onConfirm={() => { applyT2(confirmT2Task); setConfirmT2Task(null); }}
          onCancel={() => setConfirmT2Task(null)}
        >
          <p>M1 <strong>{confirmT2Task.m1_agent?.full_name ?? '—'}</strong> sẽ ở lại với T1 tạm <strong>{confirmT2Task.temp_t1?.full_name ?? 'Không có T1 tạm'}</strong>.</p>
        </CountdownConfirmModal>
      )}
    </div>
  )
}
