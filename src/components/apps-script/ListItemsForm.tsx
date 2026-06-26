import { useState } from 'react'
import TextInput from '../../ui/input/TextInput'
import type { ListItemsParams } from '../../types'
import { extractDriveId } from './utils'

interface Props {
  onSubmit: (params: ListItemsParams) => void
  isLoading: boolean
}

export default function ListItemsForm({ onSubmit, isLoading }: Props) {
  const [folderLink, setFolderLink] = useState('')
  const [pageSize, setPageSize] = useState(100)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const folderId = extractDriveId(folderLink)
    if (!folderId) {
      setError('Vui lòng nhập link hoặc ID folder hợp lệ')
      return
    }
    setError(null)
    onSubmit({ folderId, pageSize: pageSize > 0 ? pageSize : undefined })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <TextInput
        label="Link/ID folder"
        value={folderLink}
        onChange={(e) => setFolderLink(e.target.value)}
        placeholder="https://drive.google.com/drive/folders/..."
        required
      />

      <TextInput
        label="Số lượng tối đa (pageSize)"
        type="number"
        min={1}
        max={1000}
        value={pageSize}
        onChange={(e) => setPageSize(Number(e.target.value))}
        hint="Mặc định 100, tối đa 1000"
      />

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 h-9 bg-accent text-white rounded-sm text-sm hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Đang liệt kê...' : 'Liệt kê items'}
        </button>
      </div>
    </form>
  )
}
