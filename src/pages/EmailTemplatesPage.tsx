import { useState, useCallback } from 'react'
import { useToast } from '../components/Toast'
import { useEmailTemplatesQuery, useSaveEmailTemplateMutation } from '../hooks/queries/useEmailTemplates'
import type { Template } from '../hooks/queries/useEmailTemplates'
import { Plus } from 'lucide-react'
import TemplateList from '../components/email-templates/TemplateList'
import TemplateEditModal from '../components/email-templates/TemplateEditModal'
import TemplatePreviewModal from '../components/email-templates/TemplatePreviewModal'

export default function EmailTemplatesPage() {
  const { show } = useToast()
  const { data: templates = [], isLoading } = useEmailTemplatesQuery()
  const saveMut = useSaveEmailTemplateMutation()

  const [previewId, setPreviewId] = useState<string | null>(null)
  const [modalMode, setModalMode] = useState<'edit' | 'create' | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const openCreate = useCallback(() => {
    setEditingId(null)
    setModalMode('create')
  }, [])

  const openEdit = useCallback((template: Template) => {
    setEditingId(template.id)
    setModalMode('edit')
  }, [])

  const closeModal = useCallback(() => {
    setModalMode(null)
    setEditingId(null)
  }, [])

  const handleSave = async (payload: { id?: string; name: string; template_key: string; subject: string; body: string }) => {
    if (!payload.name.trim()) { show('Vui lòng nhập tên mẫu', 'error'); return }
    if (!payload.template_key.trim()) { show('Vui lòng nhập template key', 'error'); return }
    if (!payload.subject.trim()) { show('Vui lòng nhập tiêu đề', 'error'); return }

    setSaving(true)
    try {
      await saveMut.mutateAsync({
        id: payload.id,
        payload: {
          template_key: payload.template_key,
          name: payload.name.trim(),
          subject: payload.subject.trim(),
          body: payload.body,
          version: 1,
        },
      })
      show(payload.id ? 'Đã lưu mẫu email' : 'Đã tạo mẫu email mới', 'success')
      setSaving(false)
      closeModal()
    } catch (e: any) {
      if (e.message?.includes('duplicate') || e.code === '23505') {
        show('Template key đã tồn tại, vui lòng chọn key khác', 'error')
      } else {
        show(payload.id ? 'Lỗi lưu: ' + e.message : 'Lỗi tạo mẫu: ' + e.message, 'error')
      }
      setSaving(false)
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
  }

  const editingTemplate = editingId ? templates.find((t) => t.id === editingId) ?? null : null
  const previewTemplate = previewId ? templates.find((t) => t.id === previewId) ?? null : null

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Quản lý mẫu email</h1>
        <button onClick={openCreate} className="inline-flex items-center gap-1.5 px-4 h-9 bg-primary text-white rounded-md text-sm hover:bg-primary-hover transition-colors">
          <Plus className="w-4 h-4" /> Thêm mẫu
        </button>
      </div>

      <TemplateList templates={templates} onPreview={setPreviewId} onEdit={openEdit} />

      {modalMode && (
        <TemplateEditModal
          mode={modalMode}
          template={editingTemplate}
          onSave={handleSave}
          onClose={closeModal}
          saving={saving}
        />
      )}

      {previewTemplate && (
        <TemplatePreviewModal template={previewTemplate} onClose={() => setPreviewId(null)} />
      )}
    </div>
  )
}
