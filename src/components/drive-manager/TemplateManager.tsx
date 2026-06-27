import { useState } from 'react'
import { Plus, Trash2, Edit3, Check } from 'lucide-react'
import Card from '../../ui/layout/Card'
import EmptyState from '../../ui/display/EmptyState'
import Modal from '../../ui/layout/Modal'
import ConfirmationModal from '../../ui/feedback/ConfirmationModal'
import type { DriveTemplate, DriveTemplateFolder } from '../../types'

interface Props {
  templates: DriveTemplate[]
  isLoading: boolean
  onCreate: (template: { name: string; root: DriveTemplateFolder }) => void
  onUpdate: (id: string, updates: { name?: string; root?: DriveTemplateFolder }) => void
  onDelete: (id: string) => void
  createPending: boolean
  updatePending: boolean
  deletePending: boolean
}

const defaultTemplate: DriveTemplateFolder = {
  name: 'A0 - Báo cáo',
  permissions: [
    { email: 'hos@era.com.vn', role: 'reader' },
    { email: 'huu.tran@era.com.vn', role: 'organizer' },
  ],
  children: [
    {
      name: 'B1 - Public',
      permissions: [{ scope: 'anyone', role: 'reader' }],
      children: [],
    },
    {
      name: 'C1 - Marketing',
      permissions: [
        { email: 'ps@era.com.vn', role: 'fileOrganizer' },
        { email: 'mkt@era.com.vn', role: 'reader' },
      ],
      children: [
        {
          name: 'D2 - Campaign',
          permissions: [
            { email: 'mkt@era.com.vn', role: 'fileOrganizer' },
            { email: 'agent@era.com.vn', role: 'reader' },
          ],
          children: [],
        },
      ],
    },
  ],
}

export default function TemplateManager({
  templates,
  isLoading,
  onCreate,
  onUpdate,
  onDelete,
  createPending,
  updatePending,
  deletePending,
}: Props) {
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<DriveTemplate | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const openCreate = () => {
    setEditingTemplate(null)
    setEditorOpen(true)
  }

  const openEdit = (template: DriveTemplate) => {
    setEditingTemplate(template)
    setEditorOpen(true)
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[1.23rem] font-medium text-text-primary">Template tạo folder</h3>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 px-3 h-9 bg-accent text-white rounded-sm text-sm hover:bg-accent-hover transition-colors"
        >
          <Plus className="w-4 h-4" /> Thêm template
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8 text-text-tertiary">Đang tải...</div>
      ) : templates.length === 0 ? (
        <EmptyState
          context="no_data"
          title="Chưa có template"
          subtitle="Tạo template để tạo cây folder + phân quyền nhanh."
        />
      ) : (
        <div className="space-y-2">
          {templates.map((template) => (
            <div
              key={template.id}
              className="flex items-center justify-between p-3 rounded-sm border border-border-hairline hover:bg-bg-secondary/50"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{template.name}</p>
                <p className="text-xs text-text-tertiary truncate">
                  {countFolders(template.root)} folder, {countPermissions(template.root)} quyền
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => openEdit(template)}
                  className="p-1.5 rounded-sm hover:bg-bg-tertiary text-text-tertiary"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteId(template.id)}
                  className="p-1.5 rounded-sm hover:bg-bg-tertiary text-danger"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editorOpen && (
        <TemplateEditorModal
          template={editingTemplate}
          onClose={() => setEditorOpen(false)}
          onSave={(data) => {
            if (editingTemplate) {
              onUpdate(editingTemplate.id, data)
            } else {
              onCreate(data as { name: string; root: DriveTemplateFolder })
            }
            setEditorOpen(false)
          }}
          isPending={editingTemplate ? updatePending : createPending}
        />
      )}

      <ConfirmationModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) onDelete(deleteId)
          setDeleteId(null)
        }}
        title="Xác nhận xóa template"
        description="Bạn có chắc muốn xóa template này?"
        confirmText="Xóa"
        confirmType="danger"
        loading={deletePending}
      />
    </Card>
  )
}

function TemplateEditorModal({
  template,
  onClose,
  onSave,
  isPending,
}: {
  template: DriveTemplate | null
  onClose: () => void
  onSave: (data: { name: string; root: DriveTemplateFolder }) => void
  isPending: boolean
}) {
  const [name, setName] = useState(template?.name || '')
  const [jsonText, setJsonText] = useState(() =>
    JSON.stringify(template?.root || defaultTemplate, null, 2)
  )
  const [error, setError] = useState<string | null>(null)

  const handleSave = () => {
    try {
      const root = JSON.parse(jsonText) as DriveTemplateFolder
      if (!root.name) throw new Error('Root folder phải có name')
      if (!Array.isArray(root.permissions)) root.permissions = []
      if (!Array.isArray(root.children)) root.children = []
      setError(null)
      onSave({ name: name.trim() || root.name, root })
    } catch (e) {
      setError('JSON không hợp lệ: ' + (e as Error).message)
    }
  }

  return (
    <Modal
      title={template ? 'Sửa template' : 'Thêm template mới'}
      onClose={onClose}
      size="xl"
    >
      <div className="space-y-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tên template"
          className="w-full px-3 h-10 rounded-sm border border-border-hairline bg-bg-primary text-text-primary focus:outline-none focus:border-accent"
        />

        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          className="w-full h-80 px-3 py-2 rounded-sm border border-border-hairline bg-bg-primary text-text-primary font-mono text-xs focus:outline-none focus:border-accent resize-none"
          spellCheck={false}
        />

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 h-9 text-sm text-text-secondary hover:text-text-primary"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-4 h-9 bg-accent text-white rounded-sm text-sm hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {isPending ? (
              <>Đang lưu...</>
            ) : (
              <>
                <Check className="w-4 h-4" /> Lưu
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function countFolders(node: DriveTemplateFolder): number {
  return 1 + node.children.reduce((sum, child) => sum + countFolders(child), 0)
}

function countPermissions(node: DriveTemplateFolder): number {
  return (
    node.permissions.length +
    node.children.reduce((sum, child) => sum + countPermissions(child), 0)
  )
}
