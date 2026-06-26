import { useState, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { useToast } from '../components/Toast'
import { useEmailTemplatesQuery, useSaveEmailTemplateMutation, useDeleteEmailTemplateMutation } from '../hooks/queries/useEmailTemplates'
import type { Template } from '../hooks/queries/useEmailTemplates'
import PageHeader from '../ui/layout/PageHeader'
import TableSkeletonLoader from '../ui/feedback/TableSkeletonLoader'
import ConfirmationModal from '../ui/feedback/ConfirmationModal'
import TemplateList from '../components/email-templates/TemplateList'
import TemplateEditModal from '../components/email-templates/TemplateEditModal'
import TemplatePreviewModal from '../components/email-templates/TemplatePreviewModal'

export default function EmailTemplatesPage() {
  const { show } = useToast()
  const { data: templates = [], isLoading } = useEmailTemplatesQuery()
  const saveMut = useSaveEmailTemplateMutation()
  const deleteMut = useDeleteEmailTemplateMutation()

  const [previewId, setPreviewId] = useState<string | null>(null)
  const [modalMode, setModalMode] = useState<'edit' | 'create' | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingTemplate, setDeletingTemplate] = useState<Template | null>(null)
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

  const handleDelete = async () => {
    if (!deletingTemplate) return
    try {
      await deleteMut.mutateAsync(deletingTemplate.id)
      show('Đã xóa mẫu email', 'success')
      setDeletingTemplate(null)
    } catch (e: unknown) {
      show('Lỗi xóa mẫu: ' + ((e as Error).message ?? 'Unknown'), 'error')
    }
  }

  const handleSave = async (payload: { id?: string; name: string; template_key: string; subject: string; body: string }) => {
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
    } catch (e: unknown) {
      const err = e as Error & { code?: string }
      if (err.message?.includes('duplicate') || err.code === '23505') {
        show('Template key đã tồn tại, vui lòng chọn key khác', 'error')
      } else {
        show(payload.id ? 'Lỗi lưu: ' + (err.message ?? 'Unknown') : 'Lỗi tạo mẫu: ' + (err.message ?? 'Unknown'), 'error')
      }
      setSaving(false)
    }
  }

  const editingTemplate = editingId ? templates.find((t) => t.id === editingId) ?? null : null
  const previewTemplate = previewId ? templates.find((t) => t.id === previewId) ?? null : null

  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader title="Quản lý mẫu email">
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 px-4 h-9 bg-accent text-white rounded-sm text-sm hover:bg-accent-hover transition-colors"
        >
          <Plus className="w-4 h-4" aria-hidden="true" /> Thêm mẫu
        </button>
      </PageHeader>

      {isLoading ? (
        <TableSkeletonLoader rows={5} cols={5} />
      ) : (
        <TemplateList templates={templates} onPreview={setPreviewId} onEdit={openEdit} onDelete={setDeletingTemplate} />
      )}

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

      <ConfirmationModal
        open={!!deletingTemplate}
        onClose={() => setDeletingTemplate(null)}
        onConfirm={handleDelete}
        title="Xóa mẫu email"
        description={
          deletingTemplate
            ? `Bạn có chắc muốn xóa mẫu "${deletingTemplate.name}" (${deletingTemplate.template_key})? Hành động này không thể hoàn tác.`
            : ''
        }
        confirmText="Xóa"
        confirmType="danger"
        loading={deleteMut.isPending}
      />
    </div>
  )
}
