import { useState, useCallback } from 'react'
import { FileSpreadsheet, Trash2, Plus, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../Toast'
import type { ExcelTemplate } from '../../types'
import TemplateUploadModal from './TemplateUploadModal'

interface Props {
  templates: ExcelTemplate[]
  loading: boolean
  onChange: () => void
}

export default function TemplateManager({ templates, loading, onChange }: Props) {
  const { show } = useToast()
  const [showUpload, setShowUpload] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = useCallback(async (template: ExcelTemplate) => {
    if (!confirm(`Xóa template "${template.name}"?`)) return
    setDeletingId(template.id)

    // Delete from storage first
    if (template.storage_path) {
      await supabase.storage.from('excel-templates').remove([template.storage_path])
    }

    const { error } = await supabase.from('excel_templates').delete().eq('id', template.id)
    if (error) {
      show('Lỗi xóa template: ' + error.message, 'error')
    } else {
      show('Đã xóa template', 'success')
      onChange()
    }
    setDeletingId(null)
  }, [show, onChange])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900">Quản lý Template</h2>
        <button
          onClick={() => setShowUpload(true)}
          className="px-3 h-8 bg-primary text-white rounded-md text-sm hover:bg-primary-hover flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Thêm template
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-card">
          <FileSpreadsheet className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-500 text-sm">Chưa có template nào</p>
          <p className="text-neutral-400 text-xs mt-1">Bấm "Thêm template" để upload file mẫu Excel</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  <th className="px-4 py-3 text-left text-neutral-500 font-medium">Tên template</th>
                  <th className="px-4 py-3 text-left text-neutral-500 font-medium">Mô tả</th>
                  <th className="px-4 py-3 text-left text-neutral-500 font-medium">Placeholder</th>
                  <th className="px-4 py-3 text-left text-neutral-500 font-medium">Ngày tạo</th>
                  <th className="px-4 py-3 text-right text-neutral-500 font-medium">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => (
                  <tr key={t.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-primary shrink-0" />
                        <span className="font-medium text-neutral-900">{t.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{t.description || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(t.placeholders ?? []).slice(0, 3).map((p) => (
                          <span key={p} className="px-1.5 py-0.5 bg-neutral-100 rounded text-xs text-neutral-600">{'{{'}{p}{'}}'}</span>
                        ))}
                        {(t.placeholders ?? []).length > 3 && (
                          <span className="px-1.5 py-0.5 bg-neutral-100 rounded text-xs text-neutral-500">+{(t.placeholders ?? []).length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">
                      {new Date(t.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(t)}
                        disabled={deletingId === t.id}
                        className="p-1.5 rounded-md text-neutral-400 hover:text-danger hover:bg-danger-light transition-colors"
                        title="Xóa"
                      >
                        {deletingId === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showUpload && (
        <TemplateUploadModal
          onClose={() => setShowUpload(false)}
          onUploaded={() => { onChange() }}
        />
      )}
    </div>
  )
}
