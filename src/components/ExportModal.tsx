import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { useToast } from './Toast'
import Modal from './Modal'

interface Props {
  title: string
  onClose: () => void
  data: Record<string, unknown>[]
  filename: string
  hasFilter?: boolean
  fetchData?: () => Promise<Record<string, unknown>[]>
}

export default function ExportModal({ title, onClose, data, filename, hasFilter = false, fetchData }: Props) {
  const { show } = useToast()
  const [mode, setMode] = useState<'all' | 'filtered'>('all')
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const XLSX = await import('xlsx')
      let exportData = data
      if (fetchData) {
        exportData = await fetchData()
      }
      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
      XLSX.writeFile(wb, `${filename}.xlsx`)
      show('Đã xuất Excel', 'success')
    } catch {
      show('Lỗi xuất Excel', 'error')
    } finally {
      setExporting(false)
      onClose()
    }
  }

  return (
    <Modal onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <div className="space-y-3">
          <label className="flex items-start gap-3 p-3 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50">
            <input
              type="radio"
              name="exportMode"
              checked={mode === 'all'}
              onChange={() => setMode('all')}
              className="mt-0.5"
            />
            <div>
              <p className="text-sm font-medium text-neutral-900">Export toàn bộ</p>
              <p className="text-xs text-neutral-500">Tất cả record trong bảng</p>
            </div>
          </label>

          <label className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer ${
            hasFilter ? 'border-neutral-200 hover:bg-neutral-50' : 'border-neutral-100 bg-neutral-50 cursor-not-allowed opacity-60'
          }`}>
            <input
              type="radio"
              name="exportMode"
              checked={mode === 'filtered'}
              onChange={() => hasFilter && setMode('filtered')}
              disabled={!hasFilter}
              className="mt-0.5"
            />
            <div>
              <p className="text-sm font-medium text-neutral-900">Export theo bộ lọc hiện tại</p>
              <p className="text-xs text-neutral-500">
                {hasFilter ? 'Chỉ record đang hiển thị sau search + filter' : 'Chưa có bộ lọc nào được áp dụng'}
              </p>
            </div>
          </label>
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 h-9 border border-neutral-300 rounded-md text-sm text-neutral-700 hover:bg-neutral-50">
            Hủy
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-4 h-9 bg-primary text-white rounded-md text-sm hover:bg-primary-hover flex items-center gap-2 disabled:opacity-50"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {exporting ? 'Đang xuất...' : 'Xuất'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
