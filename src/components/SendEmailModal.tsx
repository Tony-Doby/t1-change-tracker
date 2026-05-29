import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { X, Send, Plus, Trash2, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useToast } from './Toast'
import HtmlEditor from './HtmlEditor'
import type { Agent } from '../types'

interface Props {
  agent: Agent
  t1Old: Agent | null
  newT1: Agent | null
  templateSubject: string
  templateBody: string
  templateKey: string
  m1TaskId?: string
  onClose: () => void
}

const defaultPlaceholders = [
  '{{agentName}}', '{{staffId}}', '{{oldT1Name}}', '{{oldT1Email}}',
  '{{newT1Name}}', '{{newT1Email}}', '{{newT1StaffId}}', '{{date}}',
  '{{deadlineDate}}', '{{notifyDate}}', '{{tempT1Name}}',
]

export default function SendEmailModal({
  agent,
  t1Old,
  newT1,
  templateSubject,
  templateBody,
  templateKey,
  m1TaskId,
  onClose,
}: Props) {
  const { show } = useToast()
  const [to, setTo] = useState(agent.email ?? '')
  const [ccList, setCcList] = useState<string[]>([''])
  const [subject] = useState(templateSubject)
  const [sending, setSending] = useState(false)

  const previewData = useMemo(() => ({
    '{{agentName}}': agent.full_name ?? '',
    '{{staffId}}': agent.staff_id ?? '',
    '{{oldT1Name}}': t1Old?.full_name ?? '',
    '{{oldT1Email}}': t1Old?.email ?? '',
    '{{newT1Name}}': newT1?.full_name ?? '',
    '{{newT1Email}}': newT1?.email ?? '',
    '{{newT1StaffId}}': newT1?.staff_id ?? '',
    '{{date}}': new Date().toLocaleDateString('vi-VN'),
    '{{deadlineDate}}': new Date(Date.now() + 30 * 86400000).toLocaleDateString('vi-VN'),
    '{{notifyDate}}': new Date().toLocaleDateString('vi-VN'),
    '{{tempT1Name}}': t1Old?.full_name ?? '',
  }), [agent, t1Old, newT1])

  const renderedSubject = useMemo(() => {
    let s = subject
    Object.entries(previewData).forEach(([k, v]) => {
      s = s.replace(new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), v)
    })
    return s
  }, [subject, previewData])

  const renderedBody = useMemo(() => {
    let b = templateBody
    Object.entries(previewData).forEach(([k, v]) => {
      b = b.replace(new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), v)
    })
    return b
  }, [templateBody, previewData])

  const addCc = () => setCcList((prev) => [...prev, ''])
  const removeCc = (idx: number) => setCcList((prev) => prev.filter((_, i) => i !== idx))
  const updateCc = (idx: number, val: string) => {
    setCcList((prev) => prev.map((v, i) => (i === idx ? val : v)))
  }

  const handleSend = async () => {
    if (!to) {
      show('Vui lòng nhập email ngườii nhận', 'error')
      return
    }
    const validCc = ccList.filter((c) => c.trim() !== '').map((c) => c.trim())

    setSending(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token

      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: to.trim(),
          cc: validCc.length > 0 ? validCc : undefined,
          from: 'onboarding@resend.dev',
          subject: renderedSubject,
          html: renderedBody,
          template_key: templateKey,
          agent_id: agent.id,
        },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })

      if (error || !data?.success) {
        show('Gửi email thất bại: ' + (error?.message ?? data?.error ?? 'Unknown'), 'error')
      } else {
        show('Đã gửi email thành công', 'success')

        // FEAT-013: Update email sent count for M1 transition task
        if (m1TaskId) {
          try {
            const { data: taskData } = await supabase
              .from('m1_transition_tasks')
              .select('email_sent_count')
              .eq('id', m1TaskId)
              .single()

            const currentCount = taskData?.email_sent_count ?? 0
            const { error: updateErr } = await supabase
              .from('m1_transition_tasks')
              .update({
                email_sent_count: currentCount + 1,
                last_email_sent_at: new Date().toISOString(),
              })
              .eq('id', m1TaskId)

            if (updateErr) console.error('Lỗi update email count:', updateErr)
          } catch (err) {
            console.error('Lỗi cập nhật email count:', err)
          }
        }

        onClose()
      }
    } catch (err: any) {
      show('Lỗi gửi email: ' + (err.message ?? 'Unknown'), 'error')
    } finally {
      setSending(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-modal w-full max-w-[720px] my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-100">
          <h2 className="text-xl font-semibold text-neutral-900">Gửi email</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Agent info */}
          <div className="text-sm">
            <span className="text-neutral-500">Gửi cho:</span>{' '}
            <span className="font-medium text-neutral-900">{agent.full_name} ({agent.staff_id})</span>
          </div>

          {/* To */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-neutral-500 mb-1.5">To</label>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full h-10 px-3 border border-neutral-300 rounded-md text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
              placeholder="email@example.com"
            />
          </div>

          {/* CC */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium uppercase tracking-wide text-neutral-500">CC</label>
              <button type="button" onClick={addCc} className="text-xs text-primary hover:text-primary-hover flex items-center gap-1">
                <Plus className="w-3 h-3" /> Thêm CC
              </button>
            </div>
            <div className="space-y-2">
              {ccList.map((cc, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="email"
                    value={cc}
                    onChange={(e) => updateCc(idx, e.target.value)}
                    className="flex-1 h-10 px-3 border border-neutral-300 rounded-md text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
                    placeholder="cc@example.com"
                  />
                  {ccList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCc(idx)}
                      className="h-10 w-10 flex items-center justify-center text-danger hover:bg-danger-light rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-neutral-500 mb-1.5">Tiêu đề</label>
            <input
              type="text"
              value={renderedSubject}
              readOnly
              className="w-full h-10 px-3 border border-neutral-300 rounded-md text-sm bg-neutral-50 text-neutral-700"
            />
          </div>

          {/* Body preview */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-neutral-500 mb-1.5">Nội dung</label>
            <HtmlEditor
              value={renderedBody}
              onChange={() => {}}
              placeholders={defaultPlaceholders}
              previewData={previewData}
              height="240px"
              readOnly
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-5 border-t border-neutral-100">
          <button
            onClick={onClose}
            className="px-4 h-9 border border-neutral-300 rounded-md text-sm text-neutral-700 hover:bg-neutral-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !to}
            className="px-4 h-9 bg-primary text-white rounded-md text-sm hover:bg-primary-hover flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sending ? 'Đang gửi...' : 'Gửi email'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
