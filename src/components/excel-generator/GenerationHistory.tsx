import { useState, useCallback } from 'react'
import { Download, Loader2, FileSpreadsheet, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../Toast'
import type { ExcelGenerationLog, ExcelTemplate } from '../../types'
import Table from '../../ui/layout/Table'
import TableHeader from '../../ui/layout/TableHeader'
import { TableHeaderCell } from '../../ui/layout/TableHeader'
import TableRow from '../../ui/layout/TableRow'
import TableCell from '../../ui/layout/TableCell'
import EmptyState from '../../ui/display/EmptyState'

interface Props {
  logs: ExcelGenerationLog[]
  templates: ExcelTemplate[]
  loading: boolean
  onChange: () => void
  isAdmin: boolean
}

export default function GenerationHistory({ logs, templates, loading, onChange, isAdmin }: Props) {
  const { show } = useToast()
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const getTemplateName = useCallback((templateId: string) => {
    return templates.find((t) => t.id === templateId)?.name || '—'
  }, [templates])

  const handleDownload = useCallback(async (log: ExcelGenerationLog) => {
    setDownloadingId(log.id)
    const { data, error } = await supabase.storage
      .from('excel-generations')
      .download(log.generated_storage_path)

    if (error || !data) {
      show('Không thể tải file: ' + (error?.message || 'Unknown'), 'error')
      setDownloadingId(null)
      return
    }

    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = log.generated_file_name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setDownloadingId(null)
  }, [show])

  const handleDelete = useCallback(async (log: ExcelGenerationLog) => {
    if (!confirm('Xóa bản ghi lịch sử này?')) return
    setDeletingId(log.id)

    const pathsToRemove: string[] = []
    if (log.generated_storage_path) pathsToRemove.push(log.generated_storage_path)
    if (log.original_storage_path) pathsToRemove.push(log.original_storage_path)
    if (pathsToRemove.length > 0) {
      await supabase.storage.from('excel-generations').remove(pathsToRemove)
    }

    const { error } = await supabase.from('excel_generation_logs').delete().eq('id', log.id)
    if (error) {
      show('Lỗi xóa: ' + error.message, 'error')
    } else {
      show('Đã xóa bản ghi', 'success')
      onChange()
    }
    setDeletingId(null)
  }, [show, onChange])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-accent animate-spin" aria-hidden="true" />
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <EmptyState
        context="no_data"
        icon={<FileSpreadsheet className="w-12 h-12" />}
        title="Chưa có lịch sử generate"
      />
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableHeaderCell>Template</TableHeaderCell>
        <TableHeaderCell>File gốc</TableHeaderCell>
        <TableHeaderCell>File generate</TableHeaderCell>
        <TableHeaderCell>Số dòng</TableHeaderCell>
        <TableHeaderCell>Ngày tạo</TableHeaderCell>
        <TableHeaderCell className="text-right">Hành động</TableHeaderCell>
      </TableHeader>
      <tbody>
        {logs.map((log) => (
          <TableRow key={log.id}>
            <TableCell className="font-medium">{getTemplateName(log.template_id)}</TableCell>
            <TableCell className="text-text-secondary text-xs max-w-[160px] truncate">{log.original_file_name}</TableCell>
            <TableCell className="text-text-secondary text-xs max-w-[160px] truncate">{log.generated_file_name}</TableCell>
            <TableCell>{log.row_count}</TableCell>
            <TableCell className="text-text-tertiary whitespace-nowrap text-xs">
              {new Date(log.created_at).toLocaleDateString('vi-VN')} {new Date(log.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </TableCell>
            <TableCell align="right">
              <div className="flex items-center justify-end gap-1">
                <button
                  onClick={() => handleDownload(log)}
                  disabled={downloadingId === log.id}
                  className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded-sm text-text-tertiary hover:text-accent hover:bg-accent-subtle transition-colors"
                  title="Tải xuống"
                  aria-label="Tải xuống"
                >
                  {downloadingId === log.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                </button>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(log)}
                    disabled={deletingId === log.id}
                    className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded-sm text-text-tertiary hover:text-danger hover:bg-danger-subtle transition-colors"
                    title="Xóa"
                    aria-label="Xóa"
                  >
                    {deletingId === log.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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
