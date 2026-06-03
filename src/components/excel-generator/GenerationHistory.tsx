import { useState, useCallback } from 'react'
import { Download, Loader2, FileSpreadsheet, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../Toast'
import type { ExcelGenerationLog, ExcelTemplate } from '../../types'

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

    // Remove files from storage
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
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-card">
        <FileSpreadsheet className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
        <p className="text-neutral-500 text-sm">Chưa có lịch sử generate</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="px-4 py-3 text-left text-neutral-500 font-medium">Template</th>
              <th className="px-4 py-3 text-left text-neutral-500 font-medium">File gốc</th>
              <th className="px-4 py-3 text-left text-neutral-500 font-medium">File generate</th>
              <th className="px-4 py-3 text-left text-neutral-500 font-medium">Số dòng</th>
              <th className="px-4 py-3 text-left text-neutral-500 font-medium">Ngày tạo</th>
              <th className="px-4 py-3 text-right text-neutral-500 font-medium">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                <td className="px-4 py-3 font-medium text-neutral-900">{getTemplateName(log.template_id)}</td>
                <td className="px-4 py-3 text-neutral-600 text-xs max-w-[160px] truncate">{log.original_file_name}</td>
                <td className="px-4 py-3 text-neutral-600 text-xs max-w-[160px] truncate">{log.generated_file_name}</td>
                <td className="px-4 py-3 text-neutral-700">{log.row_count}</td>
                <td className="px-4 py-3 text-neutral-500 whitespace-nowrap text-xs">
                  {new Date(log.created_at).toLocaleDateString('vi-VN')} {new Date(log.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleDownload(log)}
                      disabled={downloadingId === log.id}
                      className="p-1.5 rounded-md text-neutral-400 hover:text-primary hover:bg-primary-light transition-colors"
                      title="Tải xuống"
                    >
                      {downloadingId === log.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(log)}
                        disabled={deletingId === log.id}
                        className="p-1.5 rounded-md text-neutral-400 hover:text-danger hover:bg-danger-light transition-colors"
                        title="Xóa"
                      >
                        {deletingId === log.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
