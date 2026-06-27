import { ArrowLeft, Edit3, Trash2 } from 'lucide-react'
import Card from '../../ui/layout/Card'
import BreadcrumbNav from './BreadcrumbNav'
import Badge from '../../ui/display/Badge'
import type { DriveTemplate, DriveTemplateFolder } from '../../types'

interface TemplateDetailViewProps {
  template: DriveTemplate
  onBack: () => void
  onEdit: () => void
  onDelete: () => void
}

export default function TemplateDetailView({
  template,
  onBack,
  onEdit,
  onDelete,
}: TemplateDetailViewProps) {
  return (
    <div className="space-y-4">
      <BreadcrumbNav
        items={[
          { label: 'Drive Manager' },
          { label: 'Template', onClick: onBack },
          { label: template.name },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 h-8 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 px-3 h-8 text-sm border border-border-hairline rounded-sm hover:bg-bg-secondary transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" /> Sửa
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-1.5 px-3 h-8 text-sm border border-border-hairline rounded-sm text-danger hover:bg-danger-subtle transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Xóa
          </button>
        </div>
      </div>

      <Card>
        <h2 className="text-[1.23rem] font-medium text-text-primary mb-4">{template.name}</h2>
        <div className="font-mono text-xs text-text-primary overflow-auto max-h-[32rem] border border-border-hairline rounded-sm p-3 bg-bg-secondary">
          <PreviewTree node={template.root} depth={0} />
        </div>
      </Card>
    </div>
  )
}

function PreviewTree({ node, depth }: { node: DriveTemplateFolder; depth: number }) {
  return (
    <div style={{ paddingLeft: `${depth * 1}rem` }}>
      <div className="flex items-start gap-2 py-0.5">
        <span className="text-text-primary">{node.name}</span>
        <div className="flex flex-wrap items-center gap-1">
          {node.permissions.map((perm, idx) => (
            <Badge key={idx} variant="neutral" className="text-[10px]">
              {perm.scope === 'anyone' ? 'anyone' : perm.email} → {perm.role}
            </Badge>
          ))}
        </div>
      </div>
      {node.children.map((child, idx) => (
        <PreviewTree key={idx} node={child} depth={depth + 1} />
      ))}
    </div>
  )
}
