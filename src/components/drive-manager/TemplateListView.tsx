import { Plus, Trash2, Eye } from 'lucide-react'
import Card from '../../ui/layout/Card'
import EmptyState from '../../ui/display/EmptyState'
import type { DriveTemplate } from '../../types'
import { countFolders, countPermissions } from './template-editor-utils'

interface TemplateListViewProps {
  templates: DriveTemplate[]
  isLoading: boolean
  onSelect: (id: string) => void
  onCreate: () => void
  onDelete: (id: string) => void
}

export default function TemplateListView({
  templates,
  isLoading,
  onSelect,
  onCreate,
  onDelete,
}: TemplateListViewProps) {
  if (isLoading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12 text-text-tertiary">Đang tải danh sách template...</div>
      </Card>
    )
  }

  if (templates.length === 0) {
    return (
      <Card>
        <EmptyState
          context="no_data"
          title="Chưa có template"
          subtitle="Tạo template để tạo cây folder + phân quyền nhanh."
        />
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[1.23rem] font-medium text-text-primary">Danh sách template</h2>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-1.5 px-4 h-9 bg-accent text-white rounded-sm text-sm hover:bg-accent-hover transition-colors"
        >
          <Plus className="w-4 h-4" /> Thêm template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card key={template.id} className="group relative hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-medium text-text-primary truncate" title={template.name}>
                  {template.name}
                </h3>
                <p className="text-xs text-text-tertiary mt-3">
                  {countFolders(template.root)} folder, {countPermissions(template.root)} quyền
                </p>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => onDelete(template.id)}
                  className="p-1.5 rounded-sm hover:bg-bg-tertiary text-danger"
                  title="Xóa"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelect(template.id)}
              className="mt-4 w-full inline-flex items-center justify-center gap-1.5 px-3 h-8 border border-border-hairline rounded-sm text-sm text-text-secondary hover:bg-bg-secondary transition-colors"
            >
              <Eye className="w-3.5 h-3.5" /> Xem chi tiết
            </button>
          </Card>
        ))}
      </div>
    </div>
  )
}
