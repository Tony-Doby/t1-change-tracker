import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import Modal from '../../ui/layout/Modal'
import type { DriveTemplate, DriveTemplateFolder } from '../../types'

interface Props {
  node: { id: string; name: string }
  templates: DriveTemplate[]
  isLoading: boolean
  onClose: () => void
  onSubmit: (params: { parentFolderId: string; templateId: string }) => void
}

export default function CreateFromTemplateModal({
  node,
  templates,
  isLoading,
  onClose,
  onSubmit,
}: Props) {
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id || '')

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId)

  return (
    <Modal title="Tạo folder từ template" onClose={onClose} size="lg">
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          Tạo cây folder từ template bên trong{' '}
          <strong className="text-text-primary">{node.name}</strong>.
        </p>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-primary">Chọn template</label>
          <select
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            className="w-full px-3 h-10 rounded-sm border border-border-hairline bg-bg-primary text-text-primary focus:outline-none focus:border-accent"
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {selectedTemplate && (
          <div className="rounded-sm border border-border-hairline bg-bg-secondary p-3">
            <p className="text-xs font-medium text-text-tertiary mb-2">Xem trước cấu trúc:</p>
            <div className="font-mono text-xs text-text-primary overflow-auto max-h-48">
              <PreviewTree node={selectedTemplate.root} depth={0} />
            </div>
          </div>
        )}

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
            onClick={() => onSubmit({ parentFolderId: node.id, templateId: selectedTemplateId })}
            disabled={isLoading || !selectedTemplateId}
            className="inline-flex items-center gap-1.5 px-4 h-9 bg-accent text-white rounded-sm text-sm hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Đang tạo...
              </>
            ) : (
              'Tạo folder'
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function PreviewTree({ node, depth }: { node: DriveTemplateFolder; depth: number }) {
  return (
    <div style={{ paddingLeft: `${depth * 1}rem` }}>
      <div className="flex items-center gap-2 py-0.5">
        <span className="text-text-primary">{node.name}</span>
        {node.permissions.length > 0 && (
          <span className="text-text-tertiary">({node.permissions.length} quyền)</span>
        )}
      </div>
      {node.children.map((child, idx) => (
        <PreviewTree key={idx} node={child} depth={depth + 1} />
      ))}
    </div>
  )
}
