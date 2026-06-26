import { useState } from 'react'
import TextInput from '../../ui/input/TextInput'
import Select from '../../ui/input/Select'
import type { ScanFoldersParams } from '../../types'
import { extractDriveId } from './utils'

interface Props {
  onSubmit: (params: ScanFoldersParams) => void
  isLoading: boolean
}

const matchOptions = [
  { value: 'exact', label: 'Khớp chính xác' },
  { value: 'contains', label: 'Chứa từ khóa' },
  { value: 'startsWith', label: 'Bắt đầu bằng' },
  { value: 'endsWith', label: 'Kết thúc bằng' },
  { value: 'regex', label: 'Biểu thức chính quy (regex)' },
]

export default function ScanFoldersForm({ onSubmit, isLoading }: Props) {
  const [rootFolderLink, setRootFolderLink] = useState('')
  const [depth, setDepth] = useState(1)
  const [matchType, setMatchType] = useState<ScanFoldersParams['matchType']>('contains')
  const [pattern, setPattern] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const rootFolderId = extractDriveId(rootFolderLink)
    if (!rootFolderId) {
      setError('Vui lòng nhập link hoặc ID folder gốc hợp lệ')
      return
    }
    setError(null)
    onSubmit({ rootFolderId, depth, matchType, pattern: pattern || undefined })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <TextInput
        label="Link/ID folder gốc"
        value={rootFolderLink}
        onChange={(e) => setRootFolderLink(e.target.value)}
        placeholder="https://drive.google.com/drive/folders/..."
        required
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextInput
          label="Độ sâu quét"
          type="number"
          min={0}
          max={10}
          value={depth}
          onChange={(e) => setDepth(Math.max(0, Math.min(10, Number(e.target.value))))}
          required
          hint="0 = chỉ folder gốc, 1 = cấp con, tối đa 10"
        />
        <Select
          label="Kiểu so khớp tên"
          options={matchOptions}
          value={matchType}
          onChange={(e) => setMatchType(e.target.value as ScanFoldersParams['matchType'])}
        />
      </div>

      <TextInput
        label="Mẫu tên folder cần tìm"
        value={pattern}
        onChange={(e) => setPattern(e.target.value)}
        placeholder="VD: Báo cáo, Team A, .*2025"
        hint="Để trống nếu muốn liệt kê toàn bộ folder trong phạm vi độ sâu"
      />

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 h-9 bg-accent text-white rounded-sm text-sm hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Đang quét...' : 'Quét folder'}
        </button>
      </div>
    </form>
  )
}
