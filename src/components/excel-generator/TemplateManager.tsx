import { useState, useCallback } from 'react'
import { FileSpreadsheet, Trash2, Plus, Loader2, Download, FileCheck, AlertTriangle, Pencil } from 'lucide-react'
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
  const [editingTemplate, setEditingTemplate] = useState<ExcelTemplate | undefined>(undefined)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const handleDelete = useCallback(async (template: ExcelTemplate) => {
    if (!confirm(`Xóa template "${template.name}"?`)) return
    setDeletingId(template.id)

    const pathsToRemove: string[] = []
    if (template.storage_path) pathsToRemove.push(template.storage_path)
    if (template.import_template_path) pathsToRemove.push(template.import_template_path)
    if (pathsToRemove.length > 0) {
      await supabase.storage.from('excel-templates').remove(pathsToRemove)
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

  const handleDownloadImportTemplate = useCallback(async (template: ExcelTemplate) => {
    if (!template.import_template_path) {
      show('Template này không có file import mẫu', 'warning')
      return
    }
    setDownloadingId(template.id)
    const { data, error } = await supabase.storage
      .from('excel-templates')
      .download(template.import_template_path)

    if (error || !data) {
      show('Lỗi tải file: ' + (error?.message || 'Unknown'), 'error')
      setDownloadingId(null)
      return
    }

    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = `${template.name}_import_mau.xlsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setDownloadingId(null)
  }, [show])

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
                  <th className="px-4 py-3 text-left text-neutral-500 font-medium">Trường</th>
                  <th className="px-4 py-3 text-left text-neutral-500 font-medium">Mapping</th>
                  <th className="px-4 py-3 text-left text-neutral-500 font-medium">Ngày tạo</th>
                  <th className="px-4 py-3 text-right text-neutral-500 font-medium">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => {
                  const mappingCount = Object.keys(t.column_mapping ?? {}).length
                  const fieldCount = (t.fields ?? []).length
                  const hasImport = !!t.import_template_path
                  return (
                    <tr key={t.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="w-4 h-4 text-primary shrink-0" />
                          <div>
                            <span className="font-medium text-neutral-900 block">{t.name}</span>
                            <span className="text-xs text-neutral-400">
                              {hasImport ? '2 files' : '1 file'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-neutral-600">{t.description || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(t.fields ?? []).slice(0, 4).map((f) => (
                            <span key={f} className="px-1.5 py-0.5 bg-neutral-100 rounded text-xs text-neutral-600">{f}</span>
                          ))}
                          {(t.fields ?? []).length > 4 && (
                            <span className="px-1.5 py-0.5 bg-neutral-100 rounded text-xs text-neutral-500">+{(t.fields ?? []).length - 4}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {fieldCount > 0 ? (
                          <div className="flex items-center gap-1.5">
                            {mappingCount === fieldCount ? (
                              <FileCheck className="w-3.5 h-3.5 text-success" />
                            ) : (
                              <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                            )}
                            <span className={`text-xs ${mappingCount === fieldCount ? 'text-success' : 'text-warning'}`}>
                              {mappingCount}/{fieldCount}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-neutral-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">
                        {new Date(t.created_at).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setEditingTemplate(t); setShowUpload(true); }}
                            className="p-1.5 rounded-md text-neutral-400 hover:text-primary hover:bg-primary-light transition-colors"
                            title="Sửa"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {hasImport && (
                            <button
                              onClick={() => handleDownloadImportTemplate(t)}
                              disabled={downloadingId === t.id}
                              className="p-1.5 rounded-md text-neutral-400 hover:text-primary hover:bg-primary-light transition-colors"
                              title="Tải file import mẫu"
                            >
                              {downloadingId === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(t)}
                            disabled={deletingId === t.id}
                            className="p-1.5 rounded-md text-neutral-400 hover:text-danger hover:bg-danger-light transition-colors"
                            title="Xóa"
                          >
                            {deletingId === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showUpload && (
        <TemplateUploadModal
          onClose={() => { setShowUpload(false); setEditingTemplate(undefined); }}
          onUploaded={() => { onChange(); setEditingTemplate(undefined); }}
          editTemplate={editingTemplate}
        />
      )}
    </div>
  )
}
