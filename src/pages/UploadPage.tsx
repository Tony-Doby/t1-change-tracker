import { useCallback, useState, useRef } from 'react'
import { UploadCloud, X, CheckCircle, AlertTriangle, FileSpreadsheet } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'

const REQUIRED_HEADERS = ['staff_id', 'full_name', 'email', 'phone', 'rank_name', 'contract_signing_date', 'current_t1_id', 'introducing_agent_id', 'status']
const OPTIONAL_HEADERS = ['agent_code', 'referrer_id', 'rank_id', 'register_date', 'agent_start_date', 'end_date', 'deactivation_reason', 'business_email', 'id_card_number', 'date_of_birth', 'id_card_issue_date', 'id_card_issue_place', 'permanent_address', 'place_of_origin', 'gender', 'tax_code', 'bank_name', 'bank_account_number', 'bank_branch_name', 'active_area', 'real_estate_experience', 'broker_licence_number', 'broker_licence_expiry_date', 'success_seminar_date', 'source']
const ALL_HEADERS = [...REQUIRED_HEADERS, ...OPTIONAL_HEADERS]

interface ParsedRow {
  row: number
  data: Record<string, string | number | null>
  errors: string[]
}

interface ImportReport {
  newCount: number
  updateCount: number
  errors: number
  warnings: { type: string; count: number; rows: number[] }[]
}

export default function UploadPage() {
  const { show } = useToast()
  const [isDragOver, setIsDragOver] = useState(false)
  const [fileName, setFileName] = useState('')
  const [parsing, setParsing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [preview, setPreview] = useState<ParsedRow[]>([])
  const [allRows, setAllRows] = useState<ParsedRow[]>([])
  const [report, setReport] = useState<ImportReport | null>(null)
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setFileName('')
    setPreview([])
    setAllRows([])
    setReport(null)
    setProgress(0)
    setImporting(false)
    setDetectedHeaders([])
    if (inputRef.current) inputRef.current.value = ''
  }

  const parseFile = useCallback(async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      show('File vượt quá 10MB', 'error')
      return
    }

    setParsing(true)
    setProgress(0)
    setFileName(file.name)

    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 10, 80))
    }, 100)

    const data = await file.arrayBuffer()
    const XLSX = await import('xlsx')
    const workbook = XLSX.read(data, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const json = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: '' })

    clearInterval(progressInterval)
    setProgress(90)

    if (json.length > 10001) {
      show('File vượt quá 10.000 dòng. Vui lòng chia nhỏ.', 'error')
      setParsing(false)
      return
    }

    const headers = (json[0] as unknown as string[]).map((h) => String(h).trim().toLowerCase())
    const missingHeaders = REQUIRED_HEADERS.filter((h) => !headers.includes(h))

    if (missingHeaders.length > 0) {
      show(`Thiếu cột: ${missingHeaders.join(', ')}`, 'error')
      setParsing(false)
      return
    }

    setDetectedHeaders(headers)

    const rows: ParsedRow[] = []
    const warnings: ImportReport['warnings'] = []
    let errorCount = 0

    const addWarning = (type: string, rowIndex: number) => {
      const existing = warnings.find((w) => w.type === type)
      if (existing) {
        existing.count++
        existing.rows.push(rowIndex + 1)
      } else {
        warnings.push({ type, count: 1, rows: [rowIndex + 1] })
      }
    }

    for (let i = 1; i < json.length; i++) {
      const raw = json[i] as unknown as (string | number)[]
      const rowData: Record<string, string | number | null> = {}
      headers.forEach((h, idx) => {
        rowData[h] = raw[idx] ?? null
      })

      const errors: string[] = []
      if (!String(rowData['staff_id'] || '').trim()) errors.push('Thiếu mã NV')
      if (!String(rowData['full_name'] || '').trim()) errors.push('Thiếu họ tên')

      if (errors.length > 0) errorCount++

      if (!rowData['email']) addWarning('Thiếu email', i)
      if (!rowData['phone']) addWarning('Thiếu SĐT', i)
      if (!rowData['current_t1_id']) addWarning('Chưa có T1', i)

      rows.push({ row: i, data: rowData, errors })
    }

    setPreview(rows.slice(0, 10))
    setAllRows(rows)
    setReport({ newCount: 0, updateCount: 0, errors: errorCount, warnings })
    setProgress(100)
    setParsing(false)
    show(`Đã đọc ${rows.length} dòng`, 'success')
  }, [show])

  const confirmImport = async () => {
    const validRows = allRows.filter((r) => r.errors.length === 0)
    if (validRows.length === 0) {
      show('Không có dòng hợp lệ để import', 'warning')
      return
    }
    setImporting(true)

    // Get existing staff_ids to determine new vs update
    const codes = validRows.map((r) => String(r.data['staff_id']).trim())
    const { data: existing } = await supabase.from('agents').select('staff_id').in('staff_id', codes)
    const existingSet = new Set((existing ?? []).map((e) => e.staff_id))

    const payload = validRows.map((r) => {
      const d = r.data
      const base: Record<string, any> = {
        staff_id: String(d['staff_id'] || '').trim(),
        full_name: String(d['full_name'] || '').trim(),
        email: d['email'] ? String(d['email']).trim() : null,
        phone: d['phone'] ? String(d['phone']).trim() : null,
        rank_name: d['rank_name'] ? String(d['rank_name']).trim() : null,
        contract_signing_date: d['contract_signing_date'] ? String(d['contract_signing_date']).trim() : null,
        current_t1_id: d['current_t1_id'] ? String(d['current_t1_id']).trim() : null,
        introducing_agent_id: d['introducing_agent_id'] ? String(d['introducing_agent_id']).trim() : null,
        status: String(d['status'] || 'active').trim(),
      }
      // Add optional fields if present
      OPTIONAL_HEADERS.forEach((h) => {
        if (d[h] !== undefined && d[h] !== null && d[h] !== '') {
          base[h] = String(d[h]).trim()
        }
      })
      // Sync referrer_id with current_t1_id
      if (base.referrer_id) {
        base.current_t1_id = base.referrer_id
      } else if (base.current_t1_id) {
        base.referrer_id = base.current_t1_id
      }
      // If rank_id is provided but rank_name is not, we can't resolve it here easily
      // The DB trigger or app will handle it
      return base
    })

    const { error } = await supabase.from('agents').upsert(payload, { onConflict: 'staff_id' })
    if (error) {
      show('Lỗi import: ' + error.message, 'error')
      setImporting(false)
      return
    }

    const newCount = payload.filter((p) => !existingSet.has(p.staff_id)).length
    const updateCount = payload.filter((p) => existingSet.has(p.staff_id)).length

    setReport((prev) => prev ? { ...prev, newCount, updateCount } : prev)
    setImporting(false)
    show(`Import thành công: ${newCount} mới, ${updateCount} cập nhật`, 'success')
  }

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) parseFile(file)
  }, [parseFile])

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) parseFile(file)
  }

  const downloadTemplate = async (format: 'csv' | 'xlsx') => {
    const XLSX = await import('xlsx')
    const rows = [ALL_HEADERS, ['NV001', 'Nguyễn Văn A', 'a@era.vn', '0901234567', 'Consultant Specialist', '2026-01-01', '', '', 'active', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']]
    const ws = XLSX.utils.aoa_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Agents')
    XLSX.writeFile(wb, `template_agents.${format}`)
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold text-neutral-900">Upload dữ liệu Agent</h1>

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
          isDragOver ? 'border-primary bg-primary-light/20' : 'border-neutral-300 bg-white hover:border-neutral-400'
        }`}
      >
        <input ref={inputRef} type="file" accept=".csv,.xlsx" className="hidden" onChange={onFileChange} />
        {fileName ? (
          <div className="flex flex-col items-center gap-2">
            <FileSpreadsheet className="w-12 h-12 text-primary" />
            <p className="text-neutral-900 font-medium">{fileName}</p>
            <button onClick={(e) => { e.stopPropagation(); reset() }} className="text-xs text-danger hover:underline flex items-center gap-1">
              <X className="w-3 h-3" /> Xóa file
            </button>
          </div>
        ) : (
          <>
            <UploadCloud className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
            <p className="text-neutral-700 font-medium">Kéo thả file Excel/CSV vào đây</p>
            <p className="text-neutral-500 text-sm mt-1">hoặc nhấp để chọn file</p>
            <p className="text-neutral-400 text-xs mt-3">Hỗ trợ: .csv (khuyến nghị), .xlsx — tối đa 10.000 dòng / 10MB</p>
          </>
        )}
      </div>

      {parsing && (
        <div className="space-y-2">
          <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-neutral-500 text-center">Đang đọc file... {progress}%</p>
        </div>
      )}

      <div className="flex gap-4">
        <button onClick={() => downloadTemplate('csv')} className="text-sm text-primary hover:underline">📥 Tải file CSV mẫu</button>
        <button onClick={() => downloadTemplate('xlsx')} className="text-sm text-primary hover:underline">📥 Tải file Excel mẫu</button>
      </div>

      {preview.length > 0 && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-card overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-900">Preview ({preview.length} dòng đầu)</h3>
              {preview.some((r) => r.errors.length > 0) && (
                <span className="text-xs text-danger flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Có lỗi validation</span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200">
                    <th className="px-3 py-2 text-left text-neutral-500 font-medium">Dòng</th>
                    {REQUIRED_HEADERS.map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-neutral-500 font-medium whitespace-nowrap">{h}</th>
                    ))}
                    {OPTIONAL_HEADERS.filter((h) => detectedHeaders.includes(h)).map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-neutral-500 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((r) => (
                    <tr key={r.row} className={`border-b border-neutral-100 ${r.errors.length > 0 ? 'bg-danger-light/30' : ''}`}>
                      <td className="px-3 py-2 text-neutral-500">{r.row}</td>
                      {REQUIRED_HEADERS.map((h) => (
                        <td key={h} className="px-3 py-2 text-neutral-700 whitespace-nowrap max-w-[150px] truncate">{String(r.data[h] ?? '')}</td>
                      ))}
                      {OPTIONAL_HEADERS.filter((h) => detectedHeaders.includes(h)).map((h) => (
                        <td key={h} className="px-3 py-2 text-neutral-700 whitespace-nowrap max-w-[150px] truncate">{String(r.data[h] ?? '')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={reset} className="px-4 h-9 border border-neutral-300 rounded-md text-sm text-neutral-700 hover:bg-neutral-50">Hủy</button>
            <button
              disabled={preview.some((r) => r.errors.length > 0) || importing}
              onClick={confirmImport}
              className="px-4 h-9 bg-primary text-white rounded-md text-sm hover:bg-primary-hover disabled:opacity-50 flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" /> {importing ? 'Đang import...' : 'Xác nhận import'}
            </button>
          </div>
        </div>
      )}

      {report && (
        <div className="bg-white rounded-lg shadow-card p-5 space-y-3">
          <h3 className="text-lg font-semibold text-neutral-900">📋 Báo cáo nhập liệu</h3>
          <div className="space-y-1 text-sm">
            <p className="text-success">✅ Đã nhập: {report.newCount} agent mới</p>
            <p className="text-primary">🔄 Đã cập nhật: {report.updateCount} agent</p>
            <p className="text-neutral-500">📄 Tổng dòng hợp lệ: {allRows.filter((r) => r.errors.length === 0).length} / {allRows.length}</p>
            {report.errors > 0 && <p className="text-danger">❌ Dòng lỗi (bỏ qua): {report.errors}</p>}
          </div>
          {report.warnings.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-warning">⚠️ Cảnh báo (không ngăn import):</p>
              <ul className="space-y-1 text-sm text-neutral-700">
                {report.warnings.map((w) => (
                  <li key={w.type}>• {w.count} agent {w.type.toLowerCase()}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
