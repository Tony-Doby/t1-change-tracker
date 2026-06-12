import { Eye, Pencil, Trash2 } from 'lucide-react'
import type { Template } from '../../hooks/queries/useEmailTemplates'
import { useAuth } from '../../hooks/useAuth'
import Table from '../../ui/layout/Table'
import TableHeader from '../../ui/layout/TableHeader'
import { TableHeaderCell } from '../../ui/layout/TableHeader'
import TableRow from '../../ui/layout/TableRow'
import TableCell from '../../ui/layout/TableCell'
import EmptyState from '../../ui/display/EmptyState'

interface Props {
  templates: Template[]
  onPreview: (id: string) => void
  onEdit: (template: Template) => void
  onDelete?: (template: Template) => void
}

export default function TemplateList({ templates, onPreview, onEdit, onDelete }: Props) {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  if (templates.length === 0) {
    return (
      <EmptyState
        context="no_data"
        title="Chưa có mẫu email"
        subtitle="Bấm 'Thêm mẫu' để tạo mẫu email mới."
      />
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableHeaderCell className="w-12">#</TableHeaderCell>
        <TableHeaderCell>Tên mẫu</TableHeaderCell>
        <TableHeaderCell>Template key</TableHeaderCell>
        <TableHeaderCell>Tiêu đề</TableHeaderCell>
        <TableHeaderCell className="text-right">Hành động</TableHeaderCell>
      </TableHeader>
      <tbody>
        {templates.map((template, idx) => (
          <TableRow key={template.id}>
            <TableCell className="text-text-tertiary">{idx + 1}</TableCell>
            <TableCell className="font-medium">{template.name}</TableCell>
            <TableCell className="font-mono text-xs text-text-secondary">{template.template_key}</TableCell>
            <TableCell className="max-w-xs truncate">{template.subject}</TableCell>
            <TableCell align="right">
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => onPreview(template.id)}
                  className="inline-flex items-center gap-1 px-2.5 h-8 border border-border-light text-text-secondary rounded-sm text-xs hover:bg-bg-secondary transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" aria-hidden="true" /> Xem trước
                </button>
                <button
                  onClick={() => onEdit(template)}
                  className="inline-flex items-center gap-1 px-2.5 h-8 bg-accent text-white rounded-sm text-xs hover:bg-accent-hover transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" aria-hidden="true" /> Chỉnh sửa
                </button>
                {isAdmin && onDelete && (
                  <button
                    onClick={() => onDelete(template)}
                    className="inline-flex items-center gap-1 px-2.5 h-8 border border-danger text-danger rounded-sm text-xs hover:bg-danger-subtle transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> Xóa
                  </button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </tbody>
    </Table>
  )
}
