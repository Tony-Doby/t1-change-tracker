import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import {
  UploadCloud,
  X,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Download,
  Settings2,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../Toast'
import { useAuth } from '../../hooks/useAuth'
import {
  loadXlsx,
  readDataFile,
  readCsvFile,
  buildPreview,
  generateWorkbook,
  formatGenerateFileName,
  parseDateFromInput,
} from '../../lib/excel-generator'
import type { ExcelTemplate, FieldMappingValue } from '../../types'
import type * as XLSXType from 'xlsx'
import Card from '../../ui/layout/Card'
import Section from '../../ui/layout/Section'
import Table from '../../ui/layout/Table'
import TableHeader from '../../ui/layout/TableHeader'
import { TableHeaderCell } from '../../ui/layout/TableHeader'
import TableRow from '../../ui/layout/TableRow'
import TableCell from '../../ui/layout/TableCell'
import Badge from '../../ui/display/Badge'

interface Props {
  templates: ExcelTemplate[]
}

export default function GeneratePanel({ templates }: Props) {
  const { show } = useToast()
  const { user } = useAuth()
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [dataFile, setDataFile] = useState<File | null>(null)
  const [dataHeaderRow, setDataHeaderRow] = useState(0)
  const [isDragOver, setIsDragOver] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [mapping, setMapping] = useState<Record<string, FieldMappingValue>>({})
  const [showMappingPanel, setShowMappingPanel] = useState(false)
  const [preview, setPreview] = useState<{
    headers: string[]
    rows: Record<string, string | number | null>[]
    matched: { field: string; type: 'column' | 'fixed'; value: string; matched: boolean }[]
  } | null>(null)
  const [dataRows, setDataRows] = useState<Record<string, string>[]>([])
  const [dataHeaders, setDataHeaders] = useState<string[]>([])
  const [templateWorkbook, setTemplateWorkbook] = useState<XLSXType.WorkBook | null>(null)
  const [downloadingSample, setDownloadingSample] = useState(false)
  const [generateDate, setGenerateDate] = useState<string>(new Date().toISOString().split('T')[0])
  const inputRef = useRef<HTMLInputElement>(null)
  const hasPreview = preview !== null

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId),
    [templates, selectedTemplateId]
  )

  const resetData = () => {
    setDataFile(null)
    setPreview(null)
    setDataRows([])
    setDataHeaders([])
    setTemplateWorkbook(null)
    setMapping({})
    setShowMappingPanel(false)
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

  const parseDataFile = useCallback(
    async (file: File) => {
      if (!templateWorkbook || !selectedTemplate) {
        show('Vui lòng chọn template trước', 'warning')
        return
      }
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
        show('Chỉ hỗ trợ .xlsx, .xls, .csv', 'error')
        return
      }

      setDataFile(file)
      setParsing(true)
      setPreview(null)
      setShowMappingPanel(false)

      try {
        const XLSX = await loadXlsx()
        let headers: string[]
        let rows: Record<string, string>[]

        if (file.name.toLowerCase().endsWith('.csv')) {
          const text = await file.text()
          const result = readCsvFile(text, dataHeaderRow)
          headers = result.headers
          rows = result.rows
        } else {
          const arrayBuffer = await file.arrayBuffer()
          const wb = XLSX.read(arrayBuffer, { type: 'array' })
          const result = readDataFile(wb, dataHeaderRow, XLSX)
          headers = result.headers
          rows = result.rows
        }
        setDataHeaders(headers)
        setDataRows(rows)

        const savedMapping = selectedTemplate.column_mapping ?? {}
        const headerSet = new Set(headers.map((h) => h.toLowerCase().trim()))
        const savedHeaders = selectedTemplate.import_headers ?? []
        const allSavedInData = savedHeaders.every((h) => headerSet.has(h.toLowerCase().trim()))
        const hasSavedMapping = Object.keys(savedMapping).length > 0

        if (hasSavedMapping && allSavedInData) {
          const adaptedMapping: Record<string, FieldMappingValue> = {}
          for (const [field, mapVal] of Object.entries(savedMapping)) {
            if (mapVal.type === 'fixed') {
              adaptedMapping[field] = mapVal
            } else {
              const exactMatch = headers.find((h) => h === mapVal.value)
              const caseMatch = headers.find((h) => h.toLowerCase().trim() === mapVal.value.toLowerCase().trim())
              adaptedMapping[field] = { type: 'column', value: exactMatch || caseMatch || mapVal.value, uppercase: mapVal.uppercase }
            }
          }
          setMapping(adaptedMapping)
          const previewData = buildPreview(templateWorkbook, rows, adaptedMapping, selectedTemplate.template_header_row, XLSX, undefined, parseDateFromInput(generateDate))
          setPreview(previewData)
          show(`Đã đọc ${rows.length} dòng data. Mapping đã áp dụng tự động.`, 'success')
        } else {
          setShowMappingPanel(true)
          const suggested: Record<string, FieldMappingValue> = {}
          const lowerHeaders = headers.map((h) => h.toLowerCase().trim())
          for (const field of selectedTemplate.fields ?? []) {
            const lowerF = field.toLowerCase().trim()
            const idx = lowerHeaders.indexOf(lowerF)
            if (idx >= 0) {
              suggested[field] = { type: 'column', value: headers[idx] }
            }
          }
          setMapping(suggested)
          show(`Đã đọc ${rows.length} dòng data. Vui lòng kiểm tra mapping.`, 'success')
        }
      } catch (e: unknown) {
        show('Lỗi đọc file data: ' + ((e as Error).message ?? 'Unknown'), 'error')
      } finally {
        setParsing(false)
      }
    },
    [show, templateWorkbook, selectedTemplate, dataHeaderRow, generateDate]
  )

  // Keep the preview aligned with the date that will be passed to generateWorkbook.
  // Without this, a preview built before changing the date can misleadingly show the
  // previous (usually today's) expression values.
  useEffect(() => {
    if (!hasPreview || !templateWorkbook || !selectedTemplate || dataRows.length === 0) return

    let cancelled = false
    loadXlsx()
      .then((XLSX) => {
        if (cancelled) return
        setPreview(
          buildPreview(
            templateWorkbook,
            dataRows,
            mapping,
            selectedTemplate.template_header_row,
            XLSX,
            undefined,
            parseDateFromInput(generateDate)
          )
        )
      })
      .catch((e: unknown) => {
        if (!cancelled) show('Lỗi cập nhật preview: ' + ((e as Error).message ?? 'Unknown'), 'error')
      })

    return () => {
      cancelled = true
    }
  }, [dataRows, generateDate, hasPreview, mapping, selectedTemplate, show, templateWorkbook])

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

  const handleApplyMapping = async () => {
    if (!templateWorkbook || dataRows.length === 0 || !selectedTemplate) return
    setParsing(true)
    try {
      const XLSX = await loadXlsx()
      const previewData = buildPreview(templateWorkbook, dataRows, mapping, selectedTemplate.template_header_row, XLSX, undefined, parseDateFromInput(generateDate))
      setPreview(previewData)
      setShowMappingPanel(false)
    } catch (e: unknown) {
      show('Lỗi build preview: ' + ((e as Error).message ?? 'Unknown'), 'error')
    } finally {
      setParsing(false)
    }
  }

  const handleGenerate = async () => {
    if (!templateWorkbook || !selectedTemplate || dataRows.length === 0) return
    setGenerating(true)

    try {
      const XLSX = await loadXlsx()
      const newWb = generateWorkbook(
        templateWorkbook,
        dataRows,
        mapping,
        selectedTemplate.template_header_row,
        XLSX,
        parseDateFromInput(generateDate)
      )
      const generatedBlob = XLSX.write(newWb, { bookType: 'xlsx', type: 'array' })
      const generatedFileName = formatGenerateFileName(selectedTemplate.name)

      const originalPath = `originals/${crypto.randomUUID()}.xlsx`
      const { error: origErr } = await supabase.storage
        .from('excel-generations')
        .upload(originalPath, dataFile!, {
          contentType: dataFile!.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })

      if (origErr) throw origErr

      const generatedPath = `generated/${crypto.randomUUID()}.xlsx`
      const { error: genErr } = await supabase.storage
        .from('excel-generations')
        .upload(
          generatedPath,
          new Blob([generatedBlob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
          { contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
        )

      if (genErr) throw genErr

      const { error: logErr } = await supabase.from('excel_generation_logs').insert({
        template_id: selectedTemplate.id,
        original_file_name: dataFile!.name,
        original_storage_path: originalPath,
        generated_file_name: generatedFileName,
        generated_storage_path: generatedPath,
        row_count: dataRows.length,
        matched_placeholders: preview?.matched.filter((m) => m.matched).map((m) => m.field) ?? [],
        created_by: user?.id,
      })

      if (logErr) throw logErr

      const url = URL.createObjectURL(
        new Blob([generatedBlob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      )
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
    } catch (e: unknown) {
      show('Lỗi generate: ' + ((e as Error).message ?? 'Unknown'), 'error')
    } finally {
      setGenerating(false)
    }
  }

  const handleDownloadSample = async () => {
    if (!selectedTemplate?.import_template_path) {
      show('Template này không có file import mẫu', 'warning')
      return
    }
    setDownloadingSample(true)
    const { data, error } = await supabase.storage
      .from('excel-templates')
      .download(selectedTemplate.import_template_path)

    if (error || !data) {
      show('Lỗi tải file mẫu: ' + (error?.message || 'Unknown'), 'error')
      setDownloadingSample(false)
      return
    }

    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedTemplate.name}_import_mau.xlsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setDownloadingSample(false)
  }

  const allMatched = preview ? preview.matched.every((m) => m.matched) : false

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Template selector */}
      <Section gap="sm">
        <label className="block text-sm font-medium text-text-secondary">Chọn template</label>
        <select
          value={selectedTemplateId}
          onChange={(e) => handleTemplateChange(e.target.value)}
          className="w-full h-10 px-3 border border-border-light rounded-sm text-sm bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
        >
          <option value="">-- Chọn template --</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        {selectedTemplate && (
          <div className="mt-2 space-y-1">
            {selectedTemplate.fields && selectedTemplate.fields.length > 0 && (
              <p className="text-xs text-text-tertiary">
                Trường: {selectedTemplate.fields.join(', ')}
              </p>
            )}
            {Object.keys(selectedTemplate.column_mapping ?? {}).length > 0 && (
              <p className="text-xs text-text-tertiary">
                Mapping: {Object.entries(selectedTemplate.column_mapping)
                  .map(([k, v]) => `${k}→${v.type === 'column' ? v.value : `"${v.value}"`}`)
                  .join(', ')}
              </p>
            )}
            {selectedTemplate.import_template_path && (
              <button
                onClick={handleDownloadSample}
                disabled={downloadingSample}
                className="text-xs text-accent hover:underline flex items-center gap-1"
              >
                {downloadingSample ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                Tải file import mẫu
              </button>
            )}
          </div>
        )}
      </Section>

      {/* Generate date picker */}
      {selectedTemplateId && (
        <div className="flex items-center gap-2">
          <label className="text-sm text-text-secondary">Ngày áp dụng cho expression:</label>
          <input
            type="date"
            value={generateDate}
            onChange={(e) => setGenerateDate(e.target.value)}
            className="h-9 px-3 border border-border-light rounded-sm text-sm bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
          />
        </div>
      )}

      {/* Data file upload */}
      {selectedTemplateId && (
        <>
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-md p-10 text-center transition-colors cursor-pointer bg-bg-primary ${
              isDragOver ? 'border-accent bg-accent-subtle' : 'border-border-light hover:border-accent'
            }`}
          >
            <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onFileChange} />
            {dataFile ? (
              <div className="flex flex-col items-center gap-2">
                <FileSpreadsheet className="w-10 h-10 text-accent" aria-hidden="true" />
                <p className="text-text-primary font-medium text-sm">{dataFile.name}</p>
                <p className="text-text-tertiary text-xs">{dataRows.length} dòng data</p>
                <button
                  onClick={(e) => { e.stopPropagation(); resetData() }}
                  className="text-xs text-danger hover:underline flex items-center gap-1 mt-1"
                >
                  <X className="w-3 h-3" /> Chọn file khác
                </button>
              </div>
            ) : (
              <>
                <UploadCloud className="w-10 h-10 text-text-tertiary mx-auto mb-3" aria-hidden="true" />
                <p className="text-text-secondary font-medium text-sm">Kéo thả file data vào đây</p>
                <p className="text-text-tertiary text-xs mt-1">hoặc nhấp để chọn file .xlsx / .csv</p>
              </>
            )}
          </div>

          {dataFile && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-text-secondary">Row chứa tên trường trong file data (tính từ 1):</label>
              <input
                type="number"
                min={1}
                value={dataHeaderRow + 1}
                onChange={(e) => setDataHeaderRow(Math.max(0, parseInt(e.target.value || '1') - 1))}
                className="w-16 h-7 px-1 border border-border-light rounded-sm text-sm text-center text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
            </div>
          )}
        </>
      )}

      {parsing && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 text-accent animate-spin mr-2" aria-hidden="true" />
          <span className="text-sm text-text-tertiary">Đang xử lý...</span>
        </div>
      )}

      {/* Mapping Panel (manual adjust) */}
      {showMappingPanel && !parsing && selectedTemplate && (
        <Card>
          <Section gap="sm">
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-accent" aria-hidden="true" />
              <h3 className="text-sm font-medium text-text-primary">Mapping dữ liệu</h3>
            </div>
            <p className="text-xs text-text-tertiary">
              File data có cột khác với mẫu. Vui lòng chọn cột tương ứng hoặc nhập giá trị cố định.
            </p>

            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {(selectedTemplate.fields ?? []).map((field) => {
                const current = mapping[field] || { type: 'column' as const, value: '' }
                return (
                  <div key={field} className="flex items-center gap-2 py-2 px-3 rounded-sm bg-bg-secondary border border-border-hairline">
                    <span className="text-sm font-medium text-accent whitespace-nowrap min-w-[100px] truncate" title={field}>
                      {field}
                    </span>
                    <span className="text-text-tertiary text-sm">→</span>
                    <select
                      value={current.type}
                      onChange={(e) =>
                        setMapping((prev) => ({
                          ...prev,
                          [field]: { type: e.target.value as 'column' | 'fixed', value: e.target.value === 'fixed' ? '' : (prev[field]?.value || ''), uppercase: prev[field]?.uppercase },
                        }))
                      }
                      className="h-8 px-2 border border-border-light rounded-sm text-sm bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent w-[100px]"
                    >
                      <option value="column">Cột data</option>
                      <option value="fixed">Cố định</option>
                    </select>
                    {current.type === 'column' ? (
                      <select
                        value={current.value}
                        onChange={(e) => setMapping((prev) => ({ ...prev, [field]: { ...(prev[field] || { type: 'column' }), type: 'column', value: e.target.value } }))}
                        className="flex-1 h-8 px-2 border border-border-light rounded-sm text-sm bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                      >
                        <option value="">-- Chọn cột --</option>
                        {dataHeaders.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={current.value}
                        onChange={(e) => setMapping((prev) => ({ ...prev, [field]: { ...(prev[field] || { type: 'fixed' }), type: 'fixed', value: e.target.value } }))}
                        placeholder="Nhập giá trị..."
                        className="flex-1 h-8 px-2 border border-border-light rounded-sm text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                      />
                    )}
                    <label className="flex items-center gap-1 text-xs text-text-secondary whitespace-nowrap cursor-pointer">
                      <input
                        type="checkbox"
                        checked={current.uppercase || false}
                        onChange={(e) => setMapping((prev) => ({ ...prev, [field]: { ...(prev[field] || { type: current.type, value: current.value }), uppercase: e.target.checked } }))}
                        className="w-3.5 h-3.5 rounded border-border-light text-accent focus:ring-accent"
                      />
                      VIẾT HOA
                    </label>
                    {current.value ? (
                      <CheckCircle className="w-4 h-4 text-success shrink-0" aria-hidden="true" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-warning shrink-0" aria-hidden="true" />
                    )}
                  </div>
                )
              })}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => { setShowMappingPanel(false); setMapping({}); }}
                className="px-4 h-9 border border-border-light rounded-sm text-sm text-text-secondary hover:bg-bg-secondary transition-colors"
              >
                Làm lại
              </button>
              <button
                onClick={handleApplyMapping}
                disabled={parsing}
                className="px-4 h-9 bg-accent text-white rounded-sm text-sm hover:bg-accent-hover disabled:opacity-50 flex items-center gap-2 transition-colors"
              >
                {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {parsing ? 'Đang xử lý...' : 'Xác nhận mapping'}
              </button>
            </div>
          </Section>
        </Card>
      )}

      {/* Match status */}
      {preview && !parsing && (
        <Card>
          <Section gap="sm">
            <h3 className="text-sm font-medium text-text-primary flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-accent" aria-hidden="true" />
              Kiểm tra mapping
            </h3>
            <div className="flex flex-wrap gap-2">
              {preview.matched.map((m) => (
                <Badge
                  key={m.field}
                  variant={m.matched ? 'success' : 'warning'}
                  className="gap-1"
                >
                  {m.matched ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                  {m.field}
                  {m.matched && (
                    <span className="opacity-75">
                      → {m.type === 'column' ? m.value : `"${m.value}"`}
                    </span>
                  )}
                </Badge>
              ))}
            </div>
            {!allMatched && (
              <p className="text-xs text-warning">
                Một số trường chưa được map. Các trường chưa map sẽ giữ nguyên giá trị trong template.
              </p>
            )}
          </Section>
        </Card>
      )}

      {/* Preview table */}
      {preview && preview.rows.length > 0 && !parsing && (
        <Card padding="none">
          <div className="px-4 py-3 border-b border-border-hairline flex items-center justify-between">
            <h3 className="text-sm font-medium text-text-primary">Preview ({preview.rows.length} / {dataRows.length} dòng)</h3>
            <button
              onClick={() => setShowMappingPanel(true)}
              className="text-xs text-accent hover:underline flex items-center gap-1"
            >
              <Settings2 className="w-3 h-3" /> Chỉnh sửa mapping
            </button>
          </div>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <div className="min-w-max">
              <Table>
                <TableHeader>
                  {preview.headers.map((h) => (
                    <TableHeaderCell key={h}>{h}</TableHeaderCell>
                  ))}
                </TableHeader>
                <tbody>
                  {preview.rows.map((row, idx) => (
                    <TableRow key={idx}>
                      {preview.headers.map((h) => (
                        <TableCell key={h} className="whitespace-nowrap max-w-[200px] truncate">
                          {String(row[h] ?? '')}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </tbody>
              </Table>
            </div>
          </div>
        </Card>
      )}

      {/* Generate button */}
      {preview && !parsing && (
        <div className="flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={generating || dataRows.length === 0}
            className="px-5 h-10 bg-accent text-white rounded-sm text-sm hover:bg-accent-hover disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {generating ? 'Đang generate...' : 'Generate & Download'}
          </button>
        </div>
      )}
    </div>
  )
}
