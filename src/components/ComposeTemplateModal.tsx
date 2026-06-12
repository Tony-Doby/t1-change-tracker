import { useState, useMemo, useEffect } from 'react'
import { Copy, Mail } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useToast } from './Toast'
import { formatDate } from '../lib/date-utils'
import { addBusinessDays } from '../lib/eligibility'
import Modal from './Modal'
import Select from '../ui/input/Select'
import type { EmailTemplate } from '../types'
import SendEmailModal from './SendEmailModal'

interface Props {
  agentId: string
  requestId?: string
  m1TaskId?: string
  onClose: () => void
}

const defaultTemplates = [
  {
    key: 'transfer_complete',
    name: 'Thông báo chuyển line',
    subject: '[Thông báo] Agent {{agentName}} đã chuyển T1',
    body: `Kính gửi {{agentName}},

Bạn đã được chuyển sang T1 mới là {{newT1Name}}.
T1 cũ của bạn: {{oldT1Name}}.

Trân trọng,
Phòng Vận Hành ERA`,
  },
  {
    key: '30_days_notice',
    name: 'Thông báo 30 ngày suy nghĩ',
    subject: '[Thông báo] Hạn chót chọn T1 mới',
    body: `Kính gửi {{agentName}},

Bạn có 30 ngày kể từ {{notifyDate}} để chọn T1 mới. Hạn chót: {{deadlineDate}}.
Nếu không chọn, T2 {{tempT1Name}} sẽ chính thức trở thành T1 của bạn.

Trân trọng,
Phòng Vận Hành ERA`,
  },
  {
    key: 'temp_t1_assigned',
    name: 'Thông báo T1 tạm thờivàichỉ định',
    subject: '[Thông báo] T1 tạm thờivàichỉ định',
    body: `Kính gửi {{agentName}},

Do T1 cũ {{oldT1Name}} đã chuyển line, T2 {{tempT1Name}} sẽ đóng vai trò T1 tạm thờitrong 30 ngày.

Trân trọng,
Phòng Vận Hành ERA`,
  },
]

export default function ComposeTemplateModal({ agentId, requestId, m1TaskId, onClose }: Props) {
  const { show } = useToast()
  const queryClient = useQueryClient()
  const [agent, setAgent] = useState<any>(null)
  const [t1Old, setT1Old] = useState<any>(null)
  const [newT1, setNewT1] = useState<any>(null)
  const [tempT1, setTempT1] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [templates, setTemplates] = useState(defaultTemplates)
  const [selectedKey, setSelectedKey] = useState(defaultTemplates[0].key)
  const [showSendModal, setShowSendModal] = useState(false)
  const [b3Deadline, setB3Deadline] = useState('')

  useEffect(() => {
    loadData()
    loadTemplates()
  }, [agentId, requestId, m1TaskId])

  async function loadTemplates() {
    const { data, error } = await supabase.from('email_templates').select('*').order('created_at', { ascending: true })
    if (error) {
      console.error('Lỗi load templates:', error)
      return
    }

    if (data && data.length > 0) {
      const dbTemplates = (data as EmailTemplate[]).map((t) => ({
        key: t.template_key,
        name: t.name,
        subject: t.subject,
        body: t.body,
      }))
      setTemplates(dbTemplates)
      // Đảm bảo selectedKey hợp lệ với danh sách từ DB
      if (!dbTemplates.some((t) => t.key === selectedKey)) {
        setSelectedKey(dbTemplates[0].key)
      }
    } else {
      setTemplates(defaultTemplates)
      if (!defaultTemplates.some((t) => t.key === selectedKey)) {
        setSelectedKey(defaultTemplates[0].key)
      }
    }
  }

  async function loadData() {
    setLoading(true)

    const { data: holidaysData } = await supabase.from('holidays').select('holiday_date')
    const holidays = new Set<string>((holidaysData ?? []).map((h: any) => h.holiday_date.slice(0, 10)))

    const { data: a } = await supabase.from('agents').select('*').eq('id', agentId).single()
    setAgent(a)

    let b3Date = ''

    if (requestId) {
      // Load directly from request ID
      const { data: req } = await supabase
        .from('t1_requests')
        .select('id, old_t1_id, proposed_new_t1_id, step2_confirmed_at')
        .eq('id', requestId)
        .single()

      if (req?.old_t1_id) {
        const { data: t1 } = await supabase.from('agents').select('*').eq('id', req.old_t1_id).single()
        setT1Old(t1)
      } else {
        setT1Old(null)
      }

      if (req?.proposed_new_t1_id) {
        const { data: t1New } = await supabase.from('agents').select('*').eq('id', req.proposed_new_t1_id).single()
        setNewT1(t1New)
      } else {
        setNewT1(null)
      }

      // Load tempT1 from m1_transition_tasks (t1_requests does not have temp_t1_id)
      const { data: task } = await supabase
        .from('m1_transition_tasks')
        .select('temp_t1_id')
        .eq('parent_request_id', requestId)
        .maybeSingle()

      if (task?.temp_t1_id) {
        const { data: t1Temp } = await supabase.from('agents').select('*').eq('id', task.temp_t1_id).single()
        setTempT1(t1Temp)
      } else {
        setTempT1(null)
      }

      if (req?.step2_confirmed_at) {
        const d = addBusinessDays(req.step2_confirmed_at.slice(0, 10), 3, holidays)
        b3Date = formatDate(d)
      }
    } else if (m1TaskId) {
      // Load from M1 transition task
      const { data: task } = await supabase
        .from('m1_transition_tasks')
        .select('temp_t1_id, departed_agent_id, parent_request_id')
        .eq('id', m1TaskId)
        .single()

      if (task?.departed_agent_id) {
        const { data: t1 } = await supabase.from('agents').select('*').eq('id', task.departed_agent_id).single()
        setT1Old(t1)
      } else {
        setT1Old(null)
      }

      if (task?.temp_t1_id) {
        const { data: t1Temp } = await supabase.from('agents').select('*').eq('id', task.temp_t1_id).single()
        setTempT1(t1Temp)
      } else {
        setTempT1(null)
      }

      if (task?.parent_request_id) {
        const { data: req } = await supabase
          .from('t1_requests')
          .select('proposed_new_t1_id, step2_confirmed_at')
          .eq('id', task.parent_request_id)
          .single()

        if (req?.proposed_new_t1_id) {
          const { data: t1New } = await supabase.from('agents').select('*').eq('id', req.proposed_new_t1_id).single()
          setNewT1(t1New)
        } else {
          setNewT1(null)
        }

        if (req?.step2_confirmed_at) {
          const d = addBusinessDays(req.step2_confirmed_at.slice(0, 10), 3, holidays)
          b3Date = formatDate(d)
        }
      } else {
        setNewT1(null)
      }
    } else if (a?.id) {
      // Load from active request
      const { data: req } = await supabase
        .from('t1_requests')
        .select('id, old_t1_id, proposed_new_t1_id, step2_confirmed_at')
        .eq('agent_id', a.id)
        .not('status', 'in', '("completed","cancelled")')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (req?.old_t1_id) {
        const { data: t1 } = await supabase.from('agents').select('*').eq('id', req.old_t1_id).single()
        setT1Old(t1)
      } else {
        setT1Old(null)
      }

      if (req?.proposed_new_t1_id) {
        const { data: t1New } = await supabase.from('agents').select('*').eq('id', req.proposed_new_t1_id).single()
        setNewT1(t1New)
      } else {
        setNewT1(null)
      }

      // Load tempT1 from m1_transition_tasks (t1_requests does not have temp_t1_id)
      if (req?.id) {
        const { data: task } = await supabase
          .from('m1_transition_tasks')
          .select('temp_t1_id')
          .eq('parent_request_id', req.id)
          .maybeSingle()

        if (task?.temp_t1_id) {
          const { data: t1Temp } = await supabase.from('agents').select('*').eq('id', task.temp_t1_id).single()
          setTempT1(t1Temp)
        } else {
          setTempT1(null)
        }
      } else {
        setTempT1(null)
      }

      if (req?.step2_confirmed_at) {
        const d = addBusinessDays(req.step2_confirmed_at.slice(0, 10), 3, holidays)
        b3Date = formatDate(d)
      }
    }

    setB3Deadline(b3Date)
    setLoading(false)
  }

  const template = templates.find((t) => t.key === selectedKey) ?? templates[0]

  const rendered = useMemo(() => {
    return template.body
      .replace(/{{agentName}}/g, agent?.full_name ?? '')
      .replace(/{{staffId}}/g, agent?.staff_id ?? '')
      .replace(/{{oldT1Name}}/g, t1Old?.full_name ?? '')
      .replace(/{{oldT1Email}}/g, t1Old?.email ?? '')
      .replace(/{{oldT1StaffId}}/g, t1Old?.staff_id ?? '')
      .replace(/{{newT1Name}}/g, newT1?.full_name ?? '')
      .replace(/{{newT1Email}}/g, newT1?.email ?? '')
      .replace(/{{newT1StaffId}}/g, newT1?.staff_id ?? '')
      .replace(/{{date}}/g, formatDate(new Date()))
      .replace(/{{deadlineDate}}/g, formatDate(new Date(Date.now() + 30 * 86400000)))
      .replace(/{{notifyDate}}/g, formatDate(new Date()))
      .replace(/{{tempT1Name}}/g, tempT1?.full_name ?? '')
      .replace(/{{tempT1StaffId}}/g, tempT1?.staff_id ?? '')
      .replace(/{{b3Deadline}}/g, b3Deadline)
  }, [template, agent, t1Old, newT1, b3Deadline])

  const copyContent = async () => {
    const tmp = document.createElement('div')
    tmp.innerHTML = rendered
    const plain = tmp.innerText || tmp.textContent || ''
    navigator.clipboard.writeText(plain)
    show('Đã copy nội dung', 'success')

    if (m1TaskId) {
      try {
        const preview = plain.replace(/<[^>]*>/g, '').slice(0, 200)
        const { data: { user } } = await supabase.auth.getUser()
        await supabase.from('email_activities').insert({
          task_id: m1TaskId,
          action_type: 'copy_content',
          content_preview: preview || null,
          created_by: user?.id ?? null,
        })
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'm1Transitions'] })
      } catch (err) {
        console.error('Lỗi ghi email activity:', err)
      }
    }
  }

  const copyEmails = () => {
    const emails = [agent?.email, newT1?.email, t1Old?.email].filter(Boolean).join(', ')
    navigator.clipboard.writeText(emails)
    show('Đã copy email', 'success')
  }

  if (loading) {
    return (
      <Modal onClose={onClose} title="Soạn mẫu thông báo" size="lg">
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Modal>
    )
  }

  if (!agent) return null

  return (
    <>
      <Modal onClose={onClose} title="Soạn mẫu thông báo" size="lg">
        <div className="space-y-5">
          <div className="text-sm"><span className="text-neutral-500">Agent:</span>{' '}<span className="font-medium text-neutral-900">{agent.full_name} ({agent.staff_id})</span></div>

          <div>
            <Select
              label="Chọn loại mẫu"
              required
              value={selectedKey}
              onChange={(e) => setSelectedKey(e.target.value)}
              options={templates.map((t) => ({ value: t.key, label: t.name }))}
              placeholder="Chọn mẫu email..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-neutral-500 mb-1.5">Email liên quan</label>
            <div className="space-y-2">
              {[
                { label: 'Agent', email: agent?.email },
                { label: 'T1 mới', email: newT1?.email },
                { label: 'T1 cũ', email: t1Old?.email },
                { label: 'T1 tạm', email: tempT1?.email },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between bg-neutral-50 rounded-lg p-3 text-sm">
                  <div>
                    <p className="text-xs text-neutral-500 mb-0.5">{item.label}</p>
                    <p className="text-neutral-900 font-medium">{item.email ?? '—'}</p>
                  </div>
                  {item.email && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(item.email)
                        show('Đã copy email', 'success')
                      }}
                      className="p-1.5 rounded-md hover:bg-neutral-200 text-neutral-500 hover:text-neutral-700 transition-colors"
                      title="Copy email"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-neutral-500 mb-1.5">Nội dung đã soạn</label>
            <div
              className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm bg-neutral-50 text-neutral-800 prose prose-sm max-w-none overflow-y-auto"
              style={{ maxHeight: '240px' }}
              dangerouslySetInnerHTML={{ __html: rendered }}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-5 mt-5 border-t border-neutral-100">
          <button onClick={copyContent} className="px-4 h-9 border border-neutral-300 rounded-md text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"><Copy className="w-4 h-4" /> Copy nội dung</button>
          <button onClick={copyEmails} className="px-4 h-9 border border-neutral-300 rounded-md text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"><Mail className="w-4 h-4" /> Copy email</button>
        </div>
      </Modal>

      {showSendModal && agent && (
        <SendEmailModal
          agent={agent}
          t1Old={t1Old}
          newT1={newT1}
          templateSubject={template.subject}
          templateBody={template.body}
          templateKey={selectedKey}
          b3Deadline={b3Deadline}
          tempT1={tempT1}
          onClose={() => setShowSendModal(false)}
        />
      )}
    </>
  )
}
