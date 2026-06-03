import { useState, useRef, useCallback, useMemo } from 'react'
import { UploadCloud, X, FileSpreadsheet, CheckCircle, AlertTriangle, Loader2, Download, FileCheck } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../Toast'
import { useAuth } from '../../hooks/useAuth'
import {
  loadXlsx,
  readDataFile,
  buildPreview,
  generateWorkbook,
  formatGenerateFileName,
} from '../../lib/excel-generator'
import type { ExcelTemplate } from '../../types'
import type * as XLSXType from 'xlsx'

interface Props {
  templates: ExcelTemplate[]
}

export default function GeneratePanel({ templates }: Props) {
  const { show } = useToast()
  const { user } = useAuth()
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [dataFile, setDataFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [preview, setPreview] = useState<{
    headers: string[]
    rows: Record<string, string | number | null>[]
    matched: { placeholder: string; key: string; matched: boolean }[]
  } | null>(null)
  const [dataRows, setDataRows] = useState<Record<string, string>[]>([])
  const [, setDataHeaders] = useState<string[]>([])
  const [templateWorkbook, setTemplateWorkbook] = useState<XLSXType.WorkBook | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedTemplate = useMemo(() => templates.find((t) => t.id === selectedTemplateId), [templates, selectedTemplateId])

  const resetData = () => {
    setDataFile(null)
    setPreview(null)
    setDataRows([])
    setDataHeaders([])
    setTemplateWorkbook(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleTemplateChange = async (id: string) => {
    setSelectedTemplateId(id)
    resetData()
    if (!id) return

    const template = templates.find((t) => t.id === id)
    if (!template) return

    setParsing(true)
    const { data: blobData, error } = await supabase.storage
      .from('excel-templates')
      .download(template.storage_path)

    if (error || !blobData) {
      show('Không thể tải template: ' + (error?.message || 'Unknown'), 'error')
      setParsing(false)
      return
    }

    const arrayBuffer = await blobData.arrayBuffer()
    const XLSX = await loadXlsx()
    const wb = XLSX.read(arrayBuffer, { type: 'array' })
    setTemplateWorkbook(wb)
    setParsing(false)
  }

  const parseDataFile = useCallback(async (file: File) => {
    if (!templateWorkbook) {
      show('Vui lòng chọn template trước', 'warning')
      return
    }
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
      show('Chỉ hỗ trợ .xlsx, .xls, .csv', 'error')
      return
    }

    setDataFile(file)
    setParsing(true)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const XLSX = await loadXlsx()
      const wb = XLSX.read(arrayBuffer, { type: 'array' })
      const { headers, rows } = readDataFile(wb, XLSX)
      setDataHeaders(headers)
      setDataRows(rows)

      const previewData = buildPreview(templateWorkbook, rows, headers, XLSX, 10)
      setPreview(previewData)
      show(`Đã đọc ${rows.length} dòng data`, 'success')
    } catch (e: any) {
      show('Lỗi đọc file data: ' + e.message, 'error')
    } finally {
      setParsing(false)
    }
  }, [show, templateWorkbook])

  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true) }, [])
  const onDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false) }, [])
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) parseDataFile(f)
  }, [parseDataFile])
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) parseDataFile(f)
  }

  const handleGenerate = async () => {
    if (!templateWorkbook || !selectedTemplate || dataRows.length === 0) return
    setGenerating(true)

    try {
      const XLSX = await loadXlsx()
      const newWb = generateWorkbook(templateWorkbook, dataRows, XLSX)
      const generatedBlob = XLSX.write(newWb, { bookType: 'xlsx', type: 'array' })
      const generatedFileName = formatGenerateFileName(selectedTemplate.name)

      // Upload original data file
      const originalPath = `originals/${crypto.randomUUID()}.xlsx`
      const { error: origErr } = await supabase.storage
        .from('excel-generations')
        .upload(originalPath, dataFile!, { contentType: dataFile!.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

      if (origErr) throw origErr

      // Upload generated file
      const generatedPath = `generated/${crypto.randomUUID()}.xlsx`
      const { error: genErr } = await supabase.storage
        .from('excel-generations')
        .upload(generatedPath, new Blob([generatedBlob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), { contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

      if (genErr) throw genErr

      // Insert log
      const { error: logErr } = await supabase.from('excel_generation_logs').insert({
        template_id: selectedTemplate.id,
        original_file_name: dataFile!.name,
        original_storage_path: originalPath,
        generated_file_name: generatedFileName,
        generated_storage_path: generatedPath,
        row_count: dataRows.length,
        matched_placeholders: preview?.matched.filter((m) => m.matched).map((m) => m.key) ?? [],
        created_by: user?.id,
      })

      if (logErr) throw logErr

      // Auto download
      const url = URL.createObjectURL(new Blob([generatedBlob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
      const a = document.createElement('a')
      a.href = url
      a.download = generatedFileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      show(`Đã generate file ${generatedFileName}`, 'success')
      resetData()
      setSelectedTemplateId('')
    } catch (e: any) {
      show('Lỗi generate: ' + e.message, 'error')
    } finally {
      setGenerating(false)
    }
  }

  const allMatched = preview ? preview.matched.every((m) => m.matched) : false

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Template selector */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1.5">Chọn template</label>
        <select
          value={selectedTemplateId}
          onChange={(e) => handleTemplateChange(e.target.value)}
          className="w-full h-10 px-3 border border-neutral-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">-- Chọn template --</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        {selectedTemplate && selectedTemplate.placeholders && selectedTemplate.placeholders.length > 0 && (
          <p className="text-xs text-neutral-500 mt-1.5">
            Placeholder: {selectedTemplate.placeholders.map((p) => `{{${p}}}`).join(', ')}
          </p>
        )}
      </div>

      {/* Data file upload */}
      {selectedTemplateId && (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${
            isDragOver ? 'border-primary bg-primary-light/20' : 'border-neutral-300 bg-white hover:border-neutral-400'
          }`}
        >
          <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onFileChange} />
          {dataFile ? (
            <div className="flex flex-col items-center gap-2">
              <FileSpreadsheet className="w-10 h-10 text-primary" />
              <p className="text-neutral-900 font-medium text-sm">{dataFile.name}</p>
              <p className="text-neutral-500 text-xs">{dataRows.length} dòng data</p>
              <button
                onClick={(e) => { e.stopPropagation(); resetData() }}
                className="text-xs text-danger hover:underline flex items-center gap-1 mt-1"
              >
                <X className="w-3 h-3" /> Chọn file khác
              </button>
            </div>
          ) : (
            <>
              <UploadCloud className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
              <p className="text-neutral-700 font-medium text-sm">Kéo thả file data vào đây</p>
              <p className="text-neutral-500 text-xs mt-1">hoặc nhấp để chọn file .xlsx / .csv</p>
            </>
          )}
        </div>
      )}

      {parsing && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 text-primary animate-spin mr-2" />
          <span className="text-sm text-neutral-500">Đang xử lý...</span>
        </div>
      )}

      {/* Match status */}
      {preview && !parsing && (
        <div className="bg-white rounded-lg shadow-card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-primary" />
            Kiểm tra placeholder
          </h3>
          <div className="flex flex-wrap gap-2">
            {preview.matched.map((m) => (
              <span
                key={m.key}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                  m.matched ? 'bg-success-light text-success' : 'bg-warning-light text-warning'
                }`}
              >
                {m.matched ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                {m.placeholder}
              </span>
            ))}
          </div>
          {!allMatched && (
            <p className="text-xs text-warning">
              Một số placeholder không khớp với cột trong file data. Các giá trị không khớp sẽ giữ nguyên placeholder.
            </p>
          )}
        </div>
      )}

      {/* Preview table */}
      {preview && preview.rows.length > 0 && !parsing && (
        <div className="bg-white rounded-lg shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-900">Preview ({preview.rows.length} dòng đầu)</h3>
          </div>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-neutral-50">
                <tr className="border-b border-neutral-200">
                  {preview.headers.map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-neutral-500 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row, idx) => (
                  <tr key={idx} className="border-b border-neutral-100 hover:bg-neutral-50">
                    {preview.headers.map((h) => (
                      <td key={h} className="px-3 py-2 text-neutral-700 whitespace-nowrap max-w-[200px] truncate">
                        {String(row[h] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Generate button */}
      {preview && !parsing && (
        <div className="flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={generating || dataRows.length === 0}
            className="px-5 h-10 bg-primary text-white rounded-md text-sm hover:bg-primary-hover disabled:opacity-50 flex items-center gap-2"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {generating ? 'Đang generate...' : 'Generate & Download'}
          </button>
        </div>
      )}
    </div>
  )
}
