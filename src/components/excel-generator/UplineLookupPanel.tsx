import { useState, useRef, useCallback } from 'react'
import { UploadCloud, X, FileSpreadsheet, Download, Loader2, Users, Search } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../Toast'
import { loadXlsx, readCsvFile, readDataFile } from '../../lib/excel-generator'
import type { AgentUplineRankResult } from '../../types'
import Card from '../../ui/layout/Card'
import Section from '../../ui/layout/Section'
import Table from '../../ui/layout/Table'
import TableHeader from '../../ui/layout/TableHeader'
import { TableHeaderCell } from '../../ui/layout/TableHeader'
import TableRow from '../../ui/layout/TableRow'
import TableCell from '../../ui/layout/TableCell'

const MAX_ROWS = 10000
const MAX_FILE_SIZE_MB = 10

const OUTPUT_HEADERS = [
  'Staff ID',
  'T1',
  'T2',
  'T3',
  'Ngườii giới thiệu',
  'DD',
  'SDD',
  'GDD',
  'SGDD',
  'RGDD',
  'EGDD',
]

const RANK_COLUMNS: (keyof AgentUplineRankResult)[] = [
  'dd_agents',
  'sdd_agents',
  'gdd_agents',
  'sgdd_agents',
  'rgdd_agents',
  'egdd_agents',
]

export default function UplineLookupPanel() {
  const { show } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<AgentUplineRankResult[] | null>(null)
  const [downloadLoading, setDownloadLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const reset = useCallback(() => {
    setFile(null)
    setResults(null)
    if (inputRef.current) inputRef.current.value = ''
  }, [])

  const findStaffIdColumn = (headers: string[]): string | null => {
    const normalized = headers.map((h) => h.toLowerCase().trim())
    const exact = headers.find((_, i) => normalized[i] === 'staff_id')
    if (exact) return exact
    const fuzzy = headers.find((_, i) => normalized[i].includes('staff'))
    return fuzzy ?? null
  }

  const handleFile = useCallback(
    async (selectedFile: File) => {
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls') && !selectedFile.name.endsWith('.csv')) {
        show('Chỉ hỗ trợ .xlsx, .xls, .csv', 'error')
        return
      }
      if (selectedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        show(`File vượt quá ${MAX_FILE_SIZE_MB}MB`, 'error')
        return
      }

      setFile(selectedFile)
      setResults(null)
      setLoading(true)

      try {
        const XLSX = await loadXlsx()
        let headers: string[]
        let rows: Record<string, string>[]

        if (selectedFile.name.toLowerCase().endsWith('.csv')) {
          const text = await selectedFile.text()
          const result = readCsvFile(text, 0)
          headers = result.headers
          rows = result.rows
        } else {
          const arrayBuffer = await selectedFile.arrayBuffer()
          const wb = XLSX.read(arrayBuffer, { type: 'array' })
          const result = readDataFile(wb, 0, XLSX)
          headers = result.headers
          rows = result.rows
        }

        if (rows.length === 0) {
          show('File không có dữ liệu', 'warning')
          setLoading(false)
          return
        }
        if (rows.length > MAX_ROWS) {
          show(`Tối đa ${MAX_ROWS.toLocaleString()} dòng. File hiện tại có ${rows.length.toLocaleString()} dòng.`, 'error')
          setLoading(false)
          return
        }

        const staffIdCol = findStaffIdColumn(headers)
        if (!staffIdCol) {
          show('Không tìm thấy cột "staff_id" trong file. Vui lòng kiểm tra header.', 'error')
          setLoading(false)
          return
        }

        const staffIds = Array.from(
          new Set(
            rows
              .map((r) => r[staffIdCol]?.trim() ?? '')
              .filter((id) => id.length > 0)
          )
        )

        if (staffIds.length === 0) {
          show('Không tìm thấy Staff ID hợp lệ trong file.', 'warning')
          setLoading(false)
          return
        }

        const { data, error } = await supabase.rpc('get_agent_upline_ranks', {
          p_staff_ids: staffIds,
        })

        if (error) {
          show('Lỗi tra cứu upline: ' + error.message, 'error')
          setLoading(false)
          return
        }

        const typed = (data ?? []) as AgentUplineRankResult[]
        setResults(typed)
        show(`Đã tra cứu xong ${typed.length}/${staffIds.length} Staff ID.`, 'success')
      } catch (e: any) {
        show('Lỗi đọc file: ' + e.message, 'error')
      } finally {
        setLoading(false)
      }
    },
    [show]
  )

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const f = e.dataTransfer.files[0]
      if (f) handleFile(f)
    },
    [handleFile]
  )

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }

  const handleDownload = async () => {
    if (!results || results.length === 0) return
    setDownloadLoading(true)
    try {
      const XLSX = await loadXlsx()
      const aoa: (string | null)[][] = [OUTPUT_HEADERS]
      for (const r of results) {
        aoa.push([
          r.staff_id,
          r.t1_staff_id,
          r.t2_staff_id,
          r.t3_staff_id,
          r.referrer_staff_id,
          r.dd_agents,
          r.sdd_agents,
          r.gdd_agents,
          r.sgdd_agents,
          r.rgdd_agents,
          r.egdd_agents,
        ])
      }
      const ws = XLSX.utils.aoa_to_sheet(aoa)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Upline Ranks')
      XLSX.writeFile(wb, `upline-ranks-${new Date().toISOString().split('T')[0]}.xlsx`)
    } catch (e: any) {
      show('Lỗi tạo file Excel: ' + e.message, 'error')
    } finally {
      setDownloadLoading(false)
    }
  }

  return (
    <Section gap="md">
      <Card>
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-sm bg-accent-subtle text-accent">
            <Users className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-medium text-text-primary">Tra cứu upline theo rank</h3>
            <p className="text-sm text-text-tertiary mt-1">
              Upload file CSV/Excel chỉ chứa cột <code className="text-xs bg-bg-secondary px-1 py-0.5 rounded">staff_id</code>. Hệ thống sẽ trả về T1, T2, T3, ngườii giới thiệu và các agent tuyến trên có rank DD/SDD/GDD/SGDD/RGDD/EGDD.
            </p>
          </div>
        </div>
      </Card>

      {!file ? (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer border-2 border-dashed rounded-sm p-8 text-center transition-colors ${
            isDragOver
              ? 'border-accent bg-accent-subtle'
              : 'border-border-light hover:border-accent hover:bg-bg-secondary/50'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={onFileChange}
          />
          <UploadCloud className={`w-10 h-10 mx-auto mb-3 ${isDragOver ? 'text-accent' : 'text-text-tertiary'}`} />
          <p className="text-sm font-medium text-text-primary">
            Kéo thả file vào đây hoặc click để chọn
          </p>
          <p className="text-xs text-text-tertiary mt-1">
            Hỗ trợ .csv, .xlsx, .xls • Tối đa {MAX_FILE_SIZE_MB}MB • {MAX_ROWS.toLocaleString()} dòng
          </p>
        </div>
      ) : (
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-8 h-8 text-accent" />
              <div>
                <p className="text-sm font-medium text-text-primary">{file.name}</p>
                <p className="text-xs text-text-tertiary">
                  {(file.size / 1024).toFixed(1)} KB • {results ? `${results.length} kết quả` : 'Đang xử lý...'}
                </p>
              </div>
            </div>
            <button
              onClick={reset}
              className="p-2 text-text-tertiary hover:text-text-primary hover:bg-bg-secondary rounded-sm transition-colors"
              aria-label="Xóa file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </Card>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-2 py-10 text-text-tertiary">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Đang tra cứu upline...</span>
        </div>
      )}

      {results && results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-text-primary flex items-center gap-2">
              <Search className="w-4 h-4 text-accent" />
              Kết quả tra cứu ({results.length})
            </h4>
            <button
              onClick={handleDownload}
              disabled={downloadLoading}
              className="px-4 h-9 bg-accent text-white rounded-sm text-sm hover:bg-accent-hover disabled:opacity-50 flex items-center gap-2 transition-colors"
            >
              {downloadLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Tải xuống Excel
            </button>
          </div>

          <div className="overflow-x-auto">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableHeaderCell>Staff ID</TableHeaderCell>
                <TableHeaderCell>T1</TableHeaderCell>
                <TableHeaderCell>T2</TableHeaderCell>
                <TableHeaderCell>T3</TableHeaderCell>
                <TableHeaderCell>Ngườii giới thiệu</TableHeaderCell>
                <TableHeaderCell>DD</TableHeaderCell>
                <TableHeaderCell>SDD</TableHeaderCell>
                <TableHeaderCell>GDD</TableHeaderCell>
                <TableHeaderCell>SGDD</TableHeaderCell>
                <TableHeaderCell>RGDD</TableHeaderCell>
                <TableHeaderCell>EGDD</TableHeaderCell>
              </TableHeader>
              <tbody>
                {results.map((r) => (
                  <TableRow key={r.staff_id}>
                    <TableCell className="font-medium">{r.staff_id}</TableCell>
                    <TableCell>{r.t1_staff_id ?? <span className="text-text-tertiary">—</span>}</TableCell>
                    <TableCell>{r.t2_staff_id ?? <span className="text-text-tertiary">—</span>}</TableCell>
                    <TableCell>{r.t3_staff_id ?? <span className="text-text-tertiary">—</span>}</TableCell>
                    <TableCell>{r.referrer_staff_id ?? <span className="text-text-tertiary">—</span>}</TableCell>
                    {RANK_COLUMNS.map((col) => (
                      <TableCell key={col}>
                        {r[col] ?? <span className="text-text-tertiary">—</span>}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </tbody>
            </Table>
          </div>
        </div>
      )}

      {results && results.length === 0 && !loading && (
        <div className="text-center py-10 text-text-tertiary">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Không tìm thấy agent nào khớp với Staff ID trong file.</p>
        </div>
      )}
    </Section>
  )
}
