import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'
import HtmlEditor, { plainTextToHtml } from '../components/HtmlEditor'
import Modal from '../components/Modal'
import { Eye, Pencil, Plus } from 'lucide-react'

interface Template {
  id: string
  template_key: string
  name: string
  subject: string
  body: string
  placeholders: string[]
}

const defaultPlaceholders = [
  '{{agentName}}', '{{staffId}}', '{{oldT1Name}}', '{{oldT1Email}}', '{{oldT1StaffId}}',
  '{{newT1Name}}', '{{newT1Email}}', '{{newT1StaffId}}', '{{date}}', '{{deadlineDate}}', '{{notifyDate}}', '{{tempT1Name}}', '{{tempT1StaffId}}',
]

const previewData: Record<string, string> = {
  '{{agentName}}': 'Nguyễn Văn A',
  '{{staffId}}': 'ERA001',
  '{{oldT1Name}}': 'Trần Văn B',
  '{{oldT1Email}}': 'tvb@era.com',
  '{{oldT1StaffId}}': 'TV12345',
  '{{newT1Name}}': 'Lê Thị D',
  '{{newT1Email}}': 'ltd@era.com',
  '{{newT1StaffId}}': 'TV22904',
  '{{date}}': '25/05/2026',
  '{{deadlineDate}}': '24/06/2026',
  '{{notifyDate}}': '25/05/2026',
  '{{tempT1Name}}': 'Nguyễn Văn E',
  '{{tempT1StaffId}}': 'TV99999',
}

function slugify(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function EmailTemplatesPage() {
  const { show } = useToast()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [previewId, setPreviewId] = useState<string | null>(null)

  // Modal state
  const [modalMode, setModalMode] = useState<'edit' | 'create' | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formName, setFormName] = useState('')
  const [formKey, setFormKey] = useState('')
  const [formSubject, setFormSubject] = useState('')
  const [formBody, setFormBody] = useState('')
  const [keyTouched, setKeyTouched] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadTemplates()
  }, [])

  async function loadTemplates() {
    setLoading(true)
    const { data, error } = await supabase.from('email_templates').select('*').order('created_at', { ascending: true })
    if (error) { show('Lỗi tải mẫu: ' + error.message, 'error'); setLoading(false); return }
    setTemplates((data ?? []).map((t: any) => ({
      id: t.id,
      template_key: t.template_key,
      name: t.name,
      subject: t.subject,
      body: t.body,
      placeholders: t.placeholders ?? defaultPlaceholders,
    })))
    setLoading(false)
  }

  const openCreate = useCallback(() => {
    setEditingId(null)
    setFormName('')
    setFormKey('')
    setFormSubject('')
    setFormBody('')
    setKeyTouched(false)
    setModalMode('create')
  }, [])

  const openEdit = useCallback((template: Template) => {
    setEditingId(template.id)
    setFormName(template.name)
    setFormKey(template.template_key)
    setFormSubject(template.subject)
    setFormBody(template.body)
    setKeyTouched(true)
    setModalMode('edit')
  }, [])

  const closeModal = useCallback(() => {
    setModalMode(null)
    setEditingId(null)
  }, [])

  const handleNameChange = (val: string) => {
    setFormName(val)
    if (!keyTouched) {
      setFormKey(slugify(val))
    }
  }

  const saveTemplate = async () => {
    if (!formName.trim()) { show('Vui lòng nhập tên mẫu', 'error'); return }
    if (!formKey.trim()) { show('Vui lòng nhập template key', 'error'); return }
    if (!formSubject.trim()) { show('Vui lòng nhập tiêu đề', 'error'); return }

    setSaving(true)
    if (modalMode === 'edit' && editingId) {
      const { error } = await supabase.from('email_templates').update({
        name: formName,
        subject: formSubject,
        body: formBody,
      }).eq('id', editingId)
      if (error) { show('Lỗi lưu: ' + error.message, 'error'); setSaving(false); return }
      show('Đã lưu mẫu email', 'success')
    } else {
      const { error } = await supabase.from('email_templates').insert({
        template_key: formKey,
        name: formName,
        subject: formSubject,
        body: formBody,
        version: 1,
      })
      if (error) {
        if (error.message.includes('duplicate') || error.code === '23505') {
          show('Template key đã tồn tại, vui lòng chọn key khác', 'error')
        } else {
          show('Lỗi tạo mẫu: ' + error.message, 'error')
        }
        setSaving(false)
        return
      }
      show('Đã tạo mẫu email mới', 'success')
    }
    setSaving(false)
    closeModal()
    await loadTemplates()
  }

  const getPreviewHtml = (template: Template) => {
    let html = plainTextToHtml(template.body)
    Object.entries(previewData).forEach(([k, v]) => {
      html = html.replace(new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), v)
    })
    return html
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Quản lý mẫu email</h1>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 px-4 h-9 bg-primary text-white rounded-md text-sm hover:bg-primary-hover transition-colors"
        >
          <Plus className="w-4 h-4" /> Thêm mẫu
        </button>
      </div>

      {templates.length === 0 ? (
        <p className="text-sm text-neutral-500">Chưa có mẫu email nào</p>
      ) : (
        <div className="bg-white rounded-lg shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-neutral-500 w-12">#</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-500">Tên mẫu</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-500">Template key</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-500">Tiêu đề</th>
                <th className="px-4 py-3 text-right font-medium text-neutral-500">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {templates.map((template, idx) => (
                <tr key={template.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-4 py-3 text-neutral-500">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-neutral-900">{template.name}</td>
                  <td className="px-4 py-3 text-neutral-600 font-mono text-xs">{template.template_key}</td>
                  <td className="px-4 py-3 text-neutral-700 max-w-xs truncate">{template.subject}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setPreviewId(template.id)}
                        className="inline-flex items-center gap-1 px-2.5 h-8 border border-neutral-300 text-neutral-600 rounded-md text-xs hover:bg-neutral-50 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> Xem trước
                      </button>
                      <button
                        onClick={() => openEdit(template)}
                        className="inline-flex items-center gap-1 px-2.5 h-8 bg-primary text-white rounded-md text-xs hover:bg-primary-hover transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Chỉnh sửa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit / Create Modal */}
      {modalMode && (
        <Modal
          onClose={closeModal}
          title={modalMode === 'edit' ? 'Chỉnh sửa mẫu email' : 'Thêm mẫu email'}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-neutral-500 mb-1">Tên mẫu</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full h-10 px-3 border border-neutral-300 rounded-md text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
                  placeholder="Ví dụ: Thông báo T1 tạm thờii"
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-neutral-500 mb-1">Template key</label>
                <input
                  type="text"
                  value={formKey}
                  disabled={modalMode === 'edit'}
                  onChange={(e) => { setFormKey(e.target.value); setKeyTouched(true) }}
                  className={`w-full h-10 px-3 border border-neutral-300 rounded-md text-sm font-mono focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light ${modalMode === 'edit' ? 'bg-neutral-100 text-neutral-500' : ''}`}
                  placeholder="Ví dụ: temp-t1-assigned"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-neutral-500 mb-1">Tiêu đề</label>
              <input
                type="text"
                value={formSubject}
                onChange={(e) => setFormSubject(e.target.value)}
                className="w-full h-10 px-3 border border-neutral-300 rounded-md text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
                placeholder="[Thông báo] ..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-neutral-500 mb-1">Nội dung</label>
              <HtmlEditor
                value={formBody}
                onChange={(val) => setFormBody(val)}
                placeholders={defaultPlaceholders}
                previewData={previewData}
                height="280px"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  const t = templates.find((x) => x.id === editingId)
                  if (t) setPreviewId(t.id)
                }}
                disabled={modalMode === 'create'}
                className={`px-4 h-9 border border-primary text-primary rounded-md text-sm hover:bg-primary-light transition-colors ${modalMode === 'create' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Xem trước
              </button>
              <button
                onClick={saveTemplate}
                disabled={saving}
                className="px-4 h-9 bg-primary text-white rounded-md text-sm hover:bg-primary-hover transition-colors disabled:opacity-60"
              >
                {saving ? 'Đang lưu...' : modalMode === 'edit' ? 'Lưu mẫu' : 'Tạo mẫu'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Preview Modal */}
      {previewId && (
        <Modal onClose={() => setPreviewId(null)} title="Xem trước mẫu" maxWidth="max-w-2xl">
          <div className="border border-neutral-200 rounded-lg overflow-hidden">
            <div className="bg-neutral-50 px-4 py-2 border-b border-neutral-200 text-xs text-neutral-500">
              Subject: {templates.find((t) => t.id === previewId)?.subject.replace(/{{(\w+)}}/g, (m) => previewData[m] ?? m)}
            </div>
            <div
              className="p-4 text-sm text-neutral-800 prose prose-sm max-w-none bg-white"
              dangerouslySetInnerHTML={{
                __html: (() => {
                  const t = templates.find((x) => x.id === previewId)
                  return t ? getPreviewHtml(t) : ''
                })()
              }}
            />
          </div>
        </Modal>
      )}
    </div>
  )
}
