import { useState, useRef, useCallback } from 'react'
import { UploadCloud, X, FileSpreadsheet } from 'lucide-react'
import Modal from '../Modal'
import { supabase } from '../../lib/supabase'
import { useToast } from '../Toast'
import { loadXlsx, detectPlaceholders } from '../../lib/excel-generator'
import type { ExcelTemplate } from '../../types'

interface Props {
  onClose: () => void
  onUploaded: (template: ExcelTemplate) => void
}

export default function TemplateUploadModal({ onClose, onUploaded }: Props) {
  const { show } = useToast()
  const [isDragOver, setIsDragOver] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [placeholders, setPlaceholders] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setFile(null)
    setName('')
    setDescription('')
    setPlaceholders([])
    if (inputRef.current) inputRef.current.value = ''
  }

  const parseFile = useCallback(async (f: File) => {
    if (!f.name.endsWith('.xlsx') && !f.name.endsWith('.xls')) {
      show('Chỉ hỗ trợ file .xlsx hoặc .xls', 'error')
      return
    }
    setFile(f)
    setName(f.name.replace(/\.xlsx?$/i, ''))
    const data = await f.arrayBuffer()
    const XLSX = await loadXlsx()
    const workbook = XLSX.read(data, { type: 'array' })
    const found = detectPlaceholders(workbook, XLSX)
    setPlaceholders(found)
  }, [show])

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
    const f = e.dataTransfer.files[0]
    if (f) parseFile(f)
  }, [parseFile])

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) parseFile(f)
  }

  const handleUpload = async () => {
    if (!file || !name.trim()) {
      show('Vui lòng chọn file và nhập tên template', 'warning')
      return
    }
    setUploading(true)

    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id

    const ext = file.name.match(/\.xlsx?$/i)?.[0] ?? '.xlsx'
    const storagePath = `${crypto.randomUUID()}${ext}`

    // Upload to Storage
    const { error: uploadError } = await supabase.storage
      .from('excel-templates')
      .upload(storagePath, file, { contentType: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

    if (uploadError) {
      show('Lỗi upload file: ' + uploadError.message, 'error')
      setUploading(false)
      return
    }

    // Insert DB
    const { data: inserted, error: dbError } = await supabase
      .from('excel_templates')
      .insert({
        name: name.trim(),
        description: description.trim() || null,
        storage_path: storagePath,
        placeholders,
        created_by: userId,
      })
      .select()
      .single()

    if (dbError) {
      show('Lỗi lưu metadata: ' + dbError.message, 'error')
      // Clean up storage
      await supabase.storage.from('excel-templates').remove([storagePath])
      setUploading(false)
      return
    }

    show('Upload template thành công', 'success')
    onUploaded(inserted as ExcelTemplate)
    reset()
    onClose()
    setUploading(false)
  }

  return (
    <Modal onClose={onClose} title="Thêm template Excel">
      <div className="space-y-4">
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
            isDragOver ? 'border-primary bg-primary-light/20' : 'border-neutral-300 bg-white hover:border-neutral-400'
          }`}
        >
          <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={onFileChange} />
          {file ? (
            <div className="flex flex-col items-center gap-2">
              <FileSpreadsheet className="w-10 h-10 text-primary" />
              <p className="text-neutral-900 font-medium text-sm">{file.name}</p>
              <button
                onClick={(e) => { e.stopPropagation(); reset() }}
                className="text-xs text-danger hover:underline flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Chọn file khác
              </button>
            </div>
          ) : (
            <>
              <UploadCloud className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
              <p className="text-neutral-700 font-medium text-sm">Kéo thả file template vào đây</p>
              <p className="text-neutral-500 text-xs mt-1">hoặc nhấp để chọn file .xlsx</p>
            </>
          )}
        </div>

        {placeholders.length > 0 && (
          <div className="bg-primary-light/30 rounded-lg p-3 text-sm">
            <p className="font-medium text-neutral-800 mb-1">Placeholder đã phát hiện:</p>
            <div className="flex flex-wrap gap-1.5">
              {placeholders.map((p) => (
                <span key={p} className="px-2 py-0.5 bg-white rounded text-xs text-primary border border-primary/20">{'{{'}{p}{'}}'}</span>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Tên template <span className="text-danger">*</span></label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-9 px-3 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Ví dụ: Báo cáo hàng tháng"
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
            disabled={!file || !name.trim() || uploading}
            onClick={handleUpload}
            className="px-4 h-9 bg-primary text-white rounded-md text-sm hover:bg-primary-hover disabled:opacity-50"
          >
            {uploading ? 'Đang upload...' : 'Lưu template'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
