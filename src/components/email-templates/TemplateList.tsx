import { Eye, Pencil } from 'lucide-react'
import type { Template } from '../../hooks/queries/useEmailTemplates'

interface Props {
  templates: Template[]
  onPreview: (id: string) => void
  onEdit: (template: Template) => void
}

export default function TemplateList({ templates, onPreview, onEdit }: Props) {
  if (templates.length === 0) {
    return <p className="text-sm text-neutral-500">Chưa có mẫu email nào</p>
  }
  return (
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
                  <button onClick={() => onPreview(template.id)} className="inline-flex items-center gap-1 px-2.5 h-8 border border-neutral-300 text-neutral-600 rounded-md text-xs hover:bg-neutral-50 transition-colors">
                    <Eye className="w-3.5 h-3.5" /> Xem trước
                  </button>
                  <button onClick={() => onEdit(template)} className="inline-flex items-center gap-1 px-2.5 h-8 bg-primary text-white rounded-md text-xs hover:bg-primary-hover transition-colors">
                    <Pencil className="w-3.5 h-3.5" /> Chỉnh sửa
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
