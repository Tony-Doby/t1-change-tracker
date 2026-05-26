import { useState, useMemo, useEffect } from 'react'
import { X, Copy, Mail } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useToast } from './Toast'

interface Props {
  agentId: string
  onClose: () => void
}

const templates = [
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
    name: 'Thông báo T1 tạm thời',
    subject: '[Thông báo] T1 tạm thời được chỉ định',
    body: `Kính gửi {{agentName}},

Do T1 cũ {{oldT1Name}} đã chuyển line, T2 {{tempT1Name}} sẽ đóng vai trò T1 tạm thời trong 30 ngày.

Trân trọng,
Phòng Vận Hành ERA`,
  },
]

export default function ComposeTemplateModal({ agentId, onClose }: Props) {
  const { show } = useToast()
  const [agent, setAgent] = useState<any>(null)
  const [t1Old, setT1Old] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedKey, setSelectedKey] = useState(templates[0].key)

  useEffect(() => {
    loadData()
  }, [agentId])

  async function loadData() {
    setLoading(true)
    const { data: a } = await supabase.from('agents').select('*').eq('id', agentId).single()
    setAgent(a)
    if (a?.current_t1_id) {
      const { data: t1 } = await supabase.from('agents').select('*').eq('id', a.current_t1_id).single()
      setT1Old(t1)
    }
    setLoading(false)
  }

  const template = templates.find((t) => t.key === selectedKey)!

  const rendered = useMemo(() => {
    return template.body
      .replace(/{{agentName}}/g, agent?.full_name ?? '')
      .replace(/{{staffId}}/g, agent?.staff_id ?? '')
      .replace(/{{oldT1Name}}/g, t1Old?.full_name ?? '')
      .replace(/{{oldT1Email}}/g, t1Old?.email ?? '')
      .replace(/{{newT1Name}}/g, 'Lê Thị D')
      .replace(/{{newT1Email}}/g, 'ltd@era.com')
      .replace(/{{date}}/g, new Date().toLocaleDateString('vi-VN'))
      .replace(/{{deadlineDate}}/g, new Date(Date.now() + 30 * 86400000).toLocaleDateString('vi-VN'))
      .replace(/{{notifyDate}}/g, new Date().toLocaleDateString('vi-VN'))
      .replace(/{{tempT1Name}}/g, t1Old?.full_name ?? '')
  }, [template, agent, t1Old])

  const copyContent = () => {
    navigator.clipboard.writeText(rendered)
    show('Đã copy nội dung', 'success')
  }

  const copyEmails = () => {
    const emails = [agent?.email, t1Old?.email].filter(Boolean).join(', ')
    navigator.clipboard.writeText(emails)
    show('Đã copy email', 'success')
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-xl p-6"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
      </div>
    )
  }

  if (!agent) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-modal w-full max-w-[640px] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-neutral-100">
          <h2 className="text-xl font-semibold text-neutral-900">Soạn mẫu thông báo</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-5">
          <div className="text-sm"><span className="text-neutral-500">Agent:</span>{' '}<span className="font-medium text-neutral-900">{agent.full_name} ({agent.staff_id})</span></div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-neutral-500 mb-1.5">Chọn loại mẫu <span className="text-danger">*</span></label>
            <select value={selectedKey} onChange={(e) => setSelectedKey(e.target.value)}
              className="w-full h-10 px-3 border border-neutral-300 rounded-md text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light bg-white">
              {templates.map((t) => (<option key={t.key} value={t.key}>{t.name}</option>))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-neutral-50 rounded-lg p-3 text-sm"><p className="text-xs text-neutral-500 mb-1">Agent</p><p className="text-neutral-900 font-medium">{agent.email ?? '—'}</p></div>
            <div className="bg-neutral-50 rounded-lg p-3 text-sm"><p className="text-xs text-neutral-500 mb-1">T1 Cũ</p><p className="text-neutral-900 font-medium">{t1Old?.email ?? '—'}</p></div>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-neutral-500 mb-1.5">Nội dung đã soạn</label>
            <textarea readOnly value={rendered} rows={10} className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm font-mono bg-neutral-50 text-neutral-800 resize-none" />
          </div>
        </div>

        <div className="flex justify-end gap-3 p-5 border-t border-neutral-100">
          <button onClick={copyContent} className="px-4 h-9 border border-neutral-300 rounded-md text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"><Copy className="w-4 h-4" /> Copy nội dung</button>
          <button onClick={copyEmails} className="px-4 h-9 bg-primary text-white rounded-md text-sm hover:bg-primary-hover flex items-center gap-2"><Mail className="w-4 h-4" /> Copy email</button>
        </div>
      </div>
    </div>
  )
}
