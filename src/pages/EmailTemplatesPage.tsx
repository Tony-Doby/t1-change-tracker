import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'

interface Template {
  id: string
  name: string
  subject: string
  body: string
  placeholders: string[]
}

const defaultPlaceholders = [
  '{{agentName}}', '{{staffId}}', '{{oldT1Name}}', '{{oldT1Email}}',
  '{{newT1Name}}', '{{newT1Email}}', '{{newT1StaffId}}', '{{date}}', '{{deadlineDate}}', '{{notifyDate}}', '{{tempT1Name}}',
]

export default function EmailTemplatesPage() {
  const { show } = useToast()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({})

  useEffect(() => {
    loadTemplates()
  }, [])

  async function loadTemplates() {
    setLoading(true)
    const { data, error } = await supabase.from('email_templates').select('*').order('created_at', { ascending: true })
    if (error) { show('Lỗi tải mẫu: ' + error.message, 'error'); setLoading(false); return }
    setTemplates((data ?? []).map((t: any) => ({
      id: t.id,
      name: t.name,
      subject: t.subject,
      body: t.body,
      placeholders: t.placeholders ?? defaultPlaceholders,
    })))
    setLoading(false)
  }

  const updateTemplate = (id: string, field: 'subject' | 'body', value: string) => {
    setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)))
  }

  const saveTemplate = async (template: Template) => {
    const { error } = await supabase.from('email_templates').update({ subject: template.subject, body: template.body }).eq('id', template.id)
    if (error) { show('Lỗi lưu: ' + error.message, 'error'); return }
    show('Đã lưu mẫu email', 'success')
  }

  const getPreview = (template: Template) => {
    return template.body
      .replace(/{{agentName}}/g, 'Nguyễn Văn A')
      .replace(/{{staffId}}/g, 'ERA001')
      .replace(/{{oldT1Name}}/g, 'Trần Văn B')
      .replace(/{{oldT1Email}}/g, 'tvb@era.com')
      .replace(/{{newT1Name}}/g, 'Lê Thị D')
      .replace(/{{newT1Email}}/g, 'ltd@era.com')
      .replace(/{{newT1StaffId}}/g, 'TV22904')
      .replace(/{{date}}/g, '25/05/2026')
      .replace(/{{deadlineDate}}/g, '24/06/2026')
      .replace(/{{notifyDate}}/g, '25/05/2026')
      .replace(/{{tempT1Name}}/g, 'Nguyễn Văn E')
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-neutral-900">Quản lý mẫu email</h1>

      {templates.map((template, idx) => (
        <div key={template.id} className="bg-white rounded-lg shadow-card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-neutral-900">{idx + 1}. {template.name}</h2>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-neutral-500 mb-1">Tiêu đề</label>
            <input type="text" value={template.subject} onChange={(e) => updateTemplate(template.id, 'subject', e.target.value)}
              className="w-full h-10 px-3 border border-neutral-300 rounded-md text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light" />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-neutral-500 mb-1">Nội dung</label>
            <textarea
              ref={(el) => { textareaRefs.current[template.id] = el }}
              value={template.body}
              onChange={(e) => updateTemplate(template.id, 'body', e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm font-mono focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {defaultPlaceholders.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    const ta = textareaRefs.current[template.id]
                    if (!ta) return
                    ta.focus()
                    const start = ta.selectionStart
                    const end = ta.selectionEnd
                    const newBody = template.body.slice(0, start) + p + template.body.slice(end)
                    updateTemplate(template.id, 'body', newBody)
                    requestAnimationFrame(() => {
                      ta.selectionStart = ta.selectionEnd = start + p.length
                    })
                  }}
                  className="text-xs px-2 py-0.5 bg-neutral-100 text-neutral-500 rounded hover:bg-primary-light hover:text-primary cursor-pointer transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setPreviewId(template.id)} className="px-4 h-9 border border-primary text-primary rounded-md text-sm hover:bg-primary-light">Xem trước</button>
            <button onClick={() => saveTemplate(template)} className="px-4 h-9 bg-primary text-white rounded-md text-sm hover:bg-primary-hover">Lưu mẫu</button>
          </div>
        </div>
      ))}

      {templates.length === 0 && <p className="text-sm text-neutral-500">Chưa có mẫu email nào</p>}

      {previewId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-modal w-full max-w-lg mx-4 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-neutral-900">Xem trước mẫu</h3>
              <button onClick={() => setPreviewId(null)} className="text-neutral-500 hover:text-neutral-700">✕</button>
            </div>
            <div className="bg-neutral-50 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap text-neutral-800 border border-neutral-200">
              {getPreview(templates.find((t) => t.id === previewId)!)}
            </div>
            <div className="flex justify-end">
              <button onClick={() => setPreviewId(null)} className="px-4 h-9 bg-primary text-white rounded-md text-sm hover:bg-primary-hover">Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
