import { useState, useRef, useCallback } from 'react'
import { UploadCloud, X, FileSpreadsheet, CheckCircle, AlertTriangle, Loader2, Settings2, Pencil } from 'lucide-react'
import Modal from '../Modal'
import { supabase } from '../../lib/supabase'
import { useToast } from '../Toast'
import { loadXlsx, detectFields, readDataFile } from '../../lib/excel-generator'
import type { ExcelTemplate, FieldMappingValue } from '../../types'

interface Props {
  onClose: () => void
  onUploaded: (template: ExcelTemplate) => void
  editTemplate?: ExcelTemplate
}

export default function TemplateUploadModal({ onClose, onUploaded, editTemplate }: Props) {
  const { show } = useToast()
  const isEdit = !!editTemplate
  const [exportFile, setExportFile] = useState<File | null>(null)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [replaceExport, setReplaceExport] = useState(false)
  const [replaceImport, setReplaceImport] = useState(false)
  const [isDragOverExport, setIsDragOverExport] = useState(false)
  const [isDragOverImport, setIsDragOverImport] = useState(false)
  const [name, setName] = useState(editTemplate?.name ?? '')
  const [description, setDescription] = useState(editTemplate?.description ?? '')
  const [templateHeaderRow, setTemplateHeaderRow] = useState(editTemplate?.template_header_row ?? 2)
  const [importHeaderRow, setImportHeaderRow] = useState(editTemplate?.import_header_row ?? 0)
  const [fields, setFields] = useState<string[]>(editTemplate?.fields ?? [])
  const [importHeaders, setImportHeaders] = useState<string[]>(editTemplate?.import_headers ?? [])
  const [mapping, setMapping] = useState<Record<string, FieldMappingValue>>(editTemplate?.column_mapping ?? {})
  const [uploading, setUploading] = useState(false)
  const exportInputRef = useRef<HTMLInputElement>(null)
  const importInputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setExportFile(null)
    setImportFile(null)
    setReplaceExport(false)
    setReplaceImport(false)
    setName(editTemplate?.name ?? '')
    setDescription(editTemplate?.description ?? '')
    setTemplateHeaderRow(editTemplate?.template_header_row ?? 2)
    setImportHeaderRow(editTemplate?.import_header_row ?? 0)
    setFields(editTemplate?.fields ?? [])
    setImportHeaders(editTemplate?.import_headers ?? [])
    setMapping(editTemplate?.column_mapping ?? {})
    if (exportInputRef.current) exportInputRef.current.value = ''
    if (importInputRef.current) importInputRef.current.value = ''
  }

  const parseExportFile = useCallback(async (f: File) => {
    if (!f.name.endsWith('.xlsx') && !f.name.endsWith('.xls')) {
      show('File template chỉ hỗ trợ .xlsx hoặc .xls', 'error')
      return
    }
    setExportFile(f)
    if (!name) setName(f.name.replace(/\.xlsx?$/i, ''))
  }, [show, name])

  const detectExportFields = useCallback(async () => {
    if (!exportFile) return
    try {
      const data = await exportFile.arrayBuffer()
      const XLSX = await loadXlsx()
      const workbook = XLSX.read(data, { type: 'array' })
      const detected = detectFields(workbook, templateHeaderRow, XLSX)
      setFields(detected)
    } catch {
      show('Không thể đọc file export template', 'error')
    }
  }, [exportFile, templateHeaderRow, show])

  const parseImportFile = useCallback(async (f: File) => {
    if (!f.name.endsWith('.xlsx') && !f.name.endsWith('.xls') && !f.name.endsWith('.csv')) {
      show('File import mẫu chỉ hỗ trợ .xlsx, .xls, .csv', 'error')
      return
    }
    setImportFile(f)
  }, [show])

  const detectImportHeaders = useCallback(async () => {
    if (!importFile) return
    try {
      const data = await importFile.arrayBuffer()
      const XLSX = await loadXlsx()
      const workbook = XLSX.read(data, { type: 'array' })
      const { headers } = readDataFile(workbook, importHeaderRow, XLSX)
      setImportHeaders(headers)

      // Auto-suggest mapping
      const suggested: Record<string, FieldMappingValue> = {}
      const lowerHeaders = headers.map((h) => h.toLowerCase().trim())
      for (const f of fields) {
        const lowerF = f.toLowerCase().trim()
        const idx = lowerHeaders.indexOf(lowerF)
        if (idx >= 0) {
          suggested[f] = { type: 'column', value: headers[idx] }
        }
      }
      setMapping(suggested)
    } catch {
      show('Không thể đọc file import mẫu', 'error')
    }
  }, [importFile, importHeaderRow, fields, show])

  // Drag/drop handlers for export template
  const onExportDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOverExport(true) }, [])
  const onExportDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOverExport(false) }, [])
  const onExportDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragOverExport(false)
    const f = e.dataTransfer.files[0]
    if (f) parseExportFile(f)
  }, [parseExportFile])
  const onExportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) parseExportFile(f)
  }

  // Drag/drop handlers for import template
  const onImportDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOverImport(true) }, [])
  const onImportDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOverImport(false) }, [])
  const onImportDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragOverImport(false)
    const f = e.dataTransfer.files[0]
    if (f) parseImportFile(f)
  }, [parseImportFile])
  const onImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) parseImportFile(f)
  }

  const handleSave = async () => {
    if (!isEdit && (!exportFile || !importFile || !name.trim())) {
      show('Vui lòng chọn cả 2 file và nhập tên template', 'warning')
      return
    }
    if (isEdit && !name.trim()) {
      show('Vui lòng nhập tên template', 'warning')
      return
    }
    if (fields.length === 0) {
      show('Vui lòng detect trường từ file export template trước', 'warning')
      return
    }
    setUploading(true)

    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id

    let exportStoragePath = editTemplate?.storage_path ?? ''
    let importStoragePath = editTemplate?.import_template_path ?? ''

    // Upload new export file if replacing
    if (exportFile) {
      const ext = exportFile.name.match(/\.xlsx?$/i)?.[0] ?? '.xlsx'
      exportStoragePath = `export/${crypto.randomUUID()}${ext}`
      const { error: exportUploadError } = await supabase.storage
        .from('excel-templates')
        .upload(exportStoragePath, exportFile, { contentType: exportFile.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

      if (exportUploadError) {
        show('Lỗi upload file template: ' + exportUploadError.message, 'error')
        setUploading(false)
        return
      }

      // Remove old export file
      if (editTemplate?.storage_path) {
        await supabase.storage.from('excel-templates').remove([editTemplate.storage_path])
      }
    }

    // Upload new import file if replacing
    if (importFile) {
      const importExt = importFile.name.match(/\.xlsx?$/i)?.[0] ?? '.xlsx'
      importStoragePath = `import/${crypto.randomUUID()}${importExt}`
      const { error: importUploadError } = await supabase.storage
        .from('excel-templates')
        .upload(importStoragePath, importFile, { contentType: importFile.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

      if (importUploadError) {
        show('Lỗi upload file import mẫu: ' + importUploadError.message, 'error')
        if (exportFile && exportStoragePath) {
          await supabase.storage.from('excel-templates').remove([exportStoragePath])
        }
        setUploading(false)
        return
      }

      // Remove old import file
      if (editTemplate?.import_template_path) {
        await supabase.storage.from('excel-templates').remove([editTemplate.import_template_path])
      }
    }

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      storage_path: exportStoragePath,
      import_template_path: importStoragePath,
      template_header_row: templateHeaderRow,
      import_header_row: importHeaderRow,
      fields,
      import_headers: importHeaders,
      column_mapping: mapping,
    }

    if (isEdit) {
      const { data: updated, error: dbError } = await supabase
        .from('excel_templates')
        .update(payload)
        .eq('id', editTemplate.id)
        .select()
        .single()

      if (dbError) {
        show('Lỗi cập nhật template: ' + dbError.message, 'error')
        setUploading(false)
        return
      }

      show('Cập nhật template thành công', 'success')
      onUploaded(updated as ExcelTemplate)
      onClose()
    } else {
      const { data: inserted, error: dbError } = await supabase
        .from('excel_templates')
        .insert({ ...payload, created_by: userId })
        .select()
        .single()

      if (dbError) {
        show('Lỗi lưu metadata: ' + dbError.message, 'error')
        await supabase.storage.from('excel-templates').remove([exportStoragePath, importStoragePath])
        setUploading(false)
        return
      }

      show('Upload template thành công', 'success')
      onUploaded(inserted as ExcelTemplate)
      reset()
      onClose()
    }
    setUploading(false)
  }

  const mappingComplete = fields.length > 0 && fields.every((f) => mapping[f]?.value !== undefined)

  return (
    <Modal onClose={onClose} title={isEdit ? 'Sửa template Excel' : 'Thêm template Excel'}>
      <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
        {/* Export Template */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            📄 File export template (mẫu xuất) {!isEdit && <span className="text-danger">*</span>}
          </label>
          <div
            onDragOver={onExportDragOver}
            onDragLeave={onExportDragLeave}
            onDrop={onExportDrop}
            onClick={() => { if (!isEdit || replaceExport) exportInputRef.current?.click() }}
            className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors ${
              isDragOverExport ? 'border-primary bg-primary-light/20' : 'border-neutral-300 bg-white hover:border-neutral-400'
            } ${(!isEdit || replaceExport) ? 'cursor-pointer' : ''}`}
          >
            <input ref={exportInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={onExportFileChange} />
            {exportFile ? (
              <div className="flex flex-col items-center gap-1">
                <FileSpreadsheet className="w-8 h-8 text-primary" />
                <p className="text-neutral-900 font-medium text-sm">{exportFile.name}</p>
                <button onClick={(e) => { e.stopPropagation(); setExportFile(null); if (isEdit) setReplaceExport(false); }} className="text-xs text-danger hover:underline flex items-center gap-1">
                  <X className="w-3 h-3" /> Chọn file khác
                </button>
              </div>
            ) : isEdit && editTemplate?.storage_path && !replaceExport ? (
              <div className="flex flex-col items-center gap-1">
                <FileSpreadsheet className="w-8 h-8 text-primary" />
                <p className="text-neutral-900 font-medium text-sm">File hiện tại: {editTemplate.name}_export.xlsx</p>
                <button onClick={(e) => { e.stopPropagation(); setReplaceExport(true); }} className="text-xs text-primary hover:underline flex items-center gap-1">
                  <Pencil className="w-3 h-3" /> Thay file mới
                </button>
              </div>
            ) : (
              <>
                <UploadCloud className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                <p className="text-neutral-700 font-medium text-sm">Kéo thả file template vào đây</p>
                <p className="text-neutral-500 text-xs mt-0.5">hoặc nhấp để chọn file .xlsx</p>
              </>
            )}
          </div>

          {exportFile && (
            <div className="mt-2 flex items-center gap-2">
              <label className="text-xs text-neutral-600">Row chứa tên trường (tính từ 1):</label>
              <input
                type="number"
                min={1}
                value={templateHeaderRow + 1}
                onChange={(e) => setTemplateHeaderRow(Math.max(0, parseInt(e.target.value || '1') - 1))}
                className="w-16 h-7 px-1 border border-neutral-300 rounded text-sm text-center"
              />
              <button
                onClick={detectExportFields}
                className="px-2 h-7 bg-primary text-white rounded text-xs hover:bg-primary-hover"
              >
                Detect trường
              </button>
            </div>
          )}

          {fields.length > 0 && (
            <div className="mt-2 bg-primary-light/30 rounded-lg p-2 text-sm">
              <p className="font-medium text-neutral-800 mb-1">Trường đã phát hiện:</p>
              <div className="flex flex-wrap gap-1.5">
                {fields.map((f) => (
                  <span key={f} className="px-2 py-0.5 bg-white rounded text-xs text-primary border border-primary/20">{f}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Import Template */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            📄 File import mẫu (dữ liệu thô) {!isEdit && <span className="text-danger">*</span>}
          </label>
          <div
            onDragOver={onImportDragOver}
            onDragLeave={onImportDragLeave}
            onDrop={onImportDrop}
            onClick={() => { if (!isEdit || replaceImport) importInputRef.current?.click() }}
            className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors ${
              isDragOverImport ? 'border-primary bg-primary-light/20' : 'border-neutral-300 bg-white hover:border-neutral-400'
            } ${(!isEdit || replaceImport) ? 'cursor-pointer' : ''}`}
          >
            <input ref={importInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onImportFileChange} />
            {importFile ? (
              <div className="flex flex-col items-center gap-1">
                <FileSpreadsheet className="w-8 h-8 text-primary" />
                <p className="text-neutral-900 font-medium text-sm">{importFile.name}</p>
                <button onClick={(e) => { e.stopPropagation(); setImportFile(null); if (isEdit) setReplaceImport(false); }} className="text-xs text-danger hover:underline flex items-center gap-1">
                  <X className="w-3 h-3" /> Chọn file khác
                </button>
              </div>
            ) : isEdit && editTemplate?.import_template_path && !replaceImport ? (
              <div className="flex flex-col items-center gap-1">
                <FileSpreadsheet className="w-8 h-8 text-primary" />
                <p className="text-neutral-900 font-medium text-sm">File hiện tại: {editTemplate.name}_import.xlsx</p>
                <button onClick={(e) => { e.stopPropagation(); setReplaceImport(true); }} className="text-xs text-primary hover:underline flex items-center gap-1">
                  <Pencil className="w-3 h-3" /> Thay file mới
                </button>
              </div>
            ) : (
              <>
                <UploadCloud className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                <p className="text-neutral-700 font-medium text-sm">Kéo thả file import mẫu vào đây</p>
                <p className="text-neutral-500 text-xs mt-0.5">hoặc nhấp để chọn file .xlsx / .csv</p>
              </>
            )}
          </div>

          {importFile && (
            <div className="mt-2 flex items-center gap-2">
              <label className="text-xs text-neutral-600">Row chứa tên trường (tính từ 1):</label>
              <input
                type="number"
                min={1}
                value={importHeaderRow + 1}
                onChange={(e) => setImportHeaderRow(Math.max(0, parseInt(e.target.value || '1') - 1))}
                className="w-16 h-7 px-1 border border-neutral-300 rounded text-sm text-center"
              />
              <button
                onClick={detectImportHeaders}
                className="px-2 h-7 bg-primary text-white rounded text-xs hover:bg-primary-hover"
              >
                Detect cột
              </button>
            </div>
          )}

          {importHeaders.length > 0 && (
            <div className="mt-2 bg-success-light/30 rounded-lg p-2 text-sm">
              <p className="font-medium text-neutral-800 mb-1">Cột đã phát hiện:</p>
              <div className="flex flex-wrap gap-1.5">
                {importHeaders.map((h) => (
                  <span key={h} className="px-2 py-0.5 bg-white rounded text-xs text-success border border-success/20">{h}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mapping Panel */}
        {fields.length > 0 && importHeaders.length > 0 && (
          <div className="bg-white rounded-lg border border-neutral-200 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-neutral-900">🧩 Mapping dữ liệu</h3>
            </div>
            <p className="text-xs text-neutral-500">
              Chọn cột trong file import mẫu hoặc nhập giá trị cố định cho từng trường.
            </p>
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {fields.map((field) => {
                const current = mapping[field] || { type: 'column' as const, value: '' }
                return (
                  <div key={field} className="flex items-center gap-2 py-2 px-3 rounded-md bg-neutral-50 border border-neutral-100">
                    <span className="text-sm font-medium text-primary whitespace-nowrap min-w-[100px] truncate" title={field}>
                      {field}
                    </span>
                    <span className="text-neutral-400 text-sm">→</span>
                    <select
                      value={current.type}
                      onChange={(e) =>
                        setMapping((prev) => ({
                          ...prev,
                          [field]: { type: e.target.value as 'column' | 'fixed', value: e.target.value === 'fixed' ? '' : (prev[field]?.value || ''), uppercase: prev[field]?.uppercase },
                        }))
                      }
                      className="h-8 px-2 border border-neutral-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 w-[100px]"
                    >
                      <option value="column">Cột data</option>
                      <option value="fixed">Cố định</option>
                    </select>
                    {current.type === 'column' ? (
                      <select
                        value={current.value}
                        onChange={(e) =>
                          setMapping((prev) => ({
                            ...prev,
                            [field]: { ...(prev[field] || { type: 'column' }), type: 'column', value: e.target.value },
                          }))
                        }
                        className="flex-1 h-8 px-2 border border-neutral-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        <option value="">-- Chọn cột --</option>
                        {importHeaders.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={current.value}
                        onChange={(e) =>
                          setMapping((prev) => ({
                            ...prev,
                            [field]: { ...(prev[field] || { type: 'fixed' }), type: 'fixed', value: e.target.value },
                          }))
                        }
                        placeholder="Nhập giá trị cố định..."
                        className="flex-1 h-8 px-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    )}
                    <label className="flex items-center gap-1 text-xs text-neutral-600 whitespace-nowrap cursor-pointer">
                      <input
                        type="checkbox"
                        checked={current.uppercase || false}
                        onChange={(e) =>
                          setMapping((prev) => ({
                            ...prev,
                            [field]: { ...(prev[field] || { type: current.type, value: current.value }), uppercase: e.target.checked },
                          }))
                        }
                        className="w-3.5 h-3.5 rounded border-neutral-300 text-primary focus:ring-primary"
                      />
                      VIẾT HOA
                    </label>
                    {current.value ? (
                      <CheckCircle className="w-4 h-4 text-success shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Name & Description */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Tên template <span className="text-danger">*</span></label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-9 px-3 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Ví dụ: Hợp đồng nguyên tắc"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Mô tả</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            placeholder="Mô tả ngắn về mục đích template..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 h-9 border border-neutral-300 rounded-md text-sm text-neutral-700 hover:bg-neutral-50">Hủy</button>
          <button
            disabled={(!isEdit && (!exportFile || !importFile || !name.trim())) || (isEdit && !name.trim()) || uploading || !mappingComplete}
            onClick={handleSave}
            className="px-4 h-9 bg-primary text-white rounded-md text-sm hover:bg-primary-hover disabled:opacity-50 flex items-center gap-2"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {uploading ? 'Đang lưu...' : (isEdit ? 'Cập nhật template' : 'Lưu template')}
          </button>
        </div>
      </div>
    </Modal>
  )
}
