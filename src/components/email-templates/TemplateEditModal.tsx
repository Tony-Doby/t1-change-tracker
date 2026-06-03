import { useState, useEffect } from 'react'
import Modal from '../Modal'
import HtmlEditor from '../HtmlEditor'
import type { Template } from '../../hooks/queries/useEmailTemplates'

const defaultPlaceholders = [
  '{{agentName}}', '{{staffId}}', '{{oldT1Name}}', '{{oldT1Email}}', '{{oldT1StaffId}}',
  '{{newT1Name}}', '{{newT1Email}}', '{{newT1StaffId}}', '{{date}}', '{{deadlineDate}}', '{{notifyDate}}', '{{tempT1Name}}', '{{tempT1StaffId}}',
]

const previewData: Record<string, string> = {
  '{{agentName}}': 'Nguyễn Văn A', '{{staffId}}': 'ERA001',
  '{{oldT1Name}}': 'Trần Văn B', '{{oldT1Email}}': 'tvb@era.com', '{{oldT1StaffId}}': 'TV12345',
  '{{newT1Name}}': 'Lê Thị D', '{{newT1Email}}': 'ltd@era.com', '{{newT1StaffId}}': 'TV22904',
  '{{date}}': '25/05/2026', '{{deadlineDate}}': '24/06/2026', '{{notifyDate}}': '25/05/2026',
  '{{tempT1Name}}': 'Nguyễn Văn E', '{{tempT1StaffId}}': 'TV99999',
}

function slugify(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

interface Props {
  mode: 'edit' | 'create'
  template?: Template | null
  onSave: (payload: { id?: string; name: string; template_key: string; subject: string; body: string }) => void
  onClose: () => void
  saving: boolean
}

export default function TemplateEditModal({ mode, template, onSave, onClose, saving }: Props) {
  const [name, setName] = useState('')
  const [key, setKey] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [keyTouched, setKeyTouched] = useState(false)

  useEffect(() => {
    if (mode === 'edit' && template) {
      setName(template.name)
      setKey(template.template_key)
      setSubject(template.subject)
      setBody(template.body)
      setKeyTouched(true)
    } else {
      setName('')
      setKey('')
      setSubject('')
      setBody('')
      setKeyTouched(false)
    }
  }, [mode, template])

  const handleNameChange = (val: string) => {
    setName(val)
    if (!keyTouched) setKey(slugify(val))
  }

  const handleSave = () => {
    onSave({ id: template?.id, name, template_key: key, subject, body })
  }

  return (
    <Modal onClose={onClose} title={mode === 'edit' ? 'Chỉnh sửa mẫu email' : 'Thêm mẫu email'} maxWidth="max-w-3xl">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-neutral-500 mb-1">Tên mẫu</label>
            <input type="text" value={name} onChange={(e) => handleNameChange(e.target.value)}
              className="w-full h-10 px-3 border border-neutral-300 rounded-md text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light" placeholder="Ví dụ: Thông báo T1 tạm thờii" />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-neutral-500 mb-1">Template key</label>
            <input type="text" value={key} disabled={mode === 'edit'}
              onChange={(e) => { setKey(e.target.value); setKeyTouched(true) }}
              className={`w-full h-10 px-3 border border-neutral-300 rounded-md text-sm font-mono focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light ${mode === 'edit' ? 'bg-neutral-100 text-neutral-500' : ''}`}
              placeholder="Ví dụ: temp-t1-assigned" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-neutral-500 mb-1">Tiêu đề</label>
          <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
            className="w-full h-10 px-3 border border-neutral-300 rounded-md text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light" placeholder="[Thông báo] ..." />
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-neutral-500 mb-1">Nội dung</label>
          <HtmlEditor value={body} onChange={(val) => setBody(val)} placeholders={defaultPlaceholders} previewData={previewData} height="280px" />
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <button onClick={handleSave} disabled={saving} className="px-4 h-9 bg-primary text-white rounded-md text-sm hover:bg-primary-hover transition-colors disabled:opacity-60">
            {saving ? 'Đang lưu...' : mode === 'edit' ? 'Lưu mẫu' : 'Tạo mẫu'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
