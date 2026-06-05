import { useState, useCallback } from 'react'
import { FileSpreadsheet, Trash2, Plus, Loader2, Download, FileCheck, AlertTriangle, Pencil } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../Toast'
import type { ExcelTemplate } from '../../types'
import TemplateUploadModal from './TemplateUploadModal'
import Table from '../../ui/layout/Table'
import TableHeader from '../../ui/layout/TableHeader'
import { TableHeaderCell } from '../../ui/layout/TableHeader'
import TableRow from '../../ui/layout/TableRow'
import TableCell from '../../ui/layout/TableCell'
import Badge from '../../ui/display/Badge'
import EmptyState from '../../ui/display/EmptyState'

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
        <h2 className="text-[1.23rem] font-medium text-text-primary">Quản lý Template</h2>
        <button
          onClick={() => setShowUpload(true)}
          className="inline-flex items-center gap-1.5 px-4 h-9 bg-accent text-white rounded-sm text-sm hover:bg-accent-hover transition-colors"
        >
          <Plus className="w-4 h-4" aria-hidden="true" /> Thêm template
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-accent animate-spin" aria-hidden="true" />
        </div>
      ) : templates.length === 0 ? (
        <EmptyState
          context="no_data"
          icon={<FileSpreadsheet className="w-12 h-12" />}
          title="Chưa có template nào"
          subtitle='Bấm "Thêm template" để upload file mẫu Excel'
        />
      ) : (
        <Table>
          <TableHeader>
            <TableHeaderCell>Tên template</TableHeaderCell>
            <TableHeaderCell>Mô tả</TableHeaderCell>
            <TableHeaderCell>Trường</TableHeaderCell>
            <TableHeaderCell>Mapping</TableHeaderCell>
            <TableHeaderCell>Ngày tạo</TableHeaderCell>
            <TableHeaderCell className="text-right">Hành động</TableHeaderCell>
          </TableHeader>
          <tbody>
            {templates.map((t) => {
              const mappingCount = Object.keys(t.column_mapping ?? {}).length
              const fieldCount = (t.fields ?? []).length
              const hasImport = !!t.import_template_path
              return (
                <TableRow key={t.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-accent shrink-0" aria-hidden="true" />
                      <div>
                        <span className="font-medium block">{t.name}</span>
                        <span className="text-xs text-text-tertiary">
                          {hasImport ? '2 files' : '1 file'}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-text-secondary">{t.description || '—'}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(t.fields ?? []).slice(0, 4).map((f) => (
                        <Badge key={f} variant="neutral" className="h-auto px-1.5 py-0.5 text-[10px]">{f}</Badge>
                      ))}
                      {(t.fields ?? []).length > 4 && (
                        <Badge variant="neutral" className="h-auto px-1.5 py-0.5 text-[10px]">+{(t.fields ?? []).length - 4}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {fieldCount > 0 ? (
                      <div className="flex items-center gap-1.5">
                        {mappingCount === fieldCount ? (
                          <FileCheck className="w-3.5 h-3.5 text-success" aria-hidden="true" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-warning" aria-hidden="true" />
                        )}
                        <span className={`text-xs ${mappingCount === fieldCount ? 'text-success' : 'text-warning'}`}>
                          {mappingCount}/{fieldCount}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-text-tertiary">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-text-tertiary whitespace-nowrap text-xs">
                    {new Date(t.created_at).toLocaleDateString('vi-VN')}
                  </TableCell>
                  <TableCell align="right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setEditingTemplate(t); setShowUpload(true); }}
                        className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded-sm text-text-tertiary hover:text-accent hover:bg-accent-subtle transition-colors"
                        title="Sửa"
                        aria-label="Sửa"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {hasImport && (
                        <button
                          onClick={() => handleDownloadImportTemplate(t)}
                          disabled={downloadingId === t.id}
                          className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded-sm text-text-tertiary hover:text-accent hover:bg-accent-subtle transition-colors"
                          title="Tải file import mẫu"
                          aria-label="Tải file import mẫu"
                        >
                          {downloadingId === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(t)}
                        disabled={deletingId === t.id}
                        className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded-sm text-text-tertiary hover:text-danger hover:bg-danger-subtle transition-colors"
                        title="Xóa"
                        aria-label="Xóa"
                      >
                        {deletingId === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </tbody>
        </Table>
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
