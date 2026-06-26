import { useState } from 'react'
import TextInput from '../../ui/input/TextInput'
import type { CopyFolderParams } from '../../types'
import { extractDriveId } from './utils'

interface Props {
  onSubmit: (params: CopyFolderParams) => void
  isLoading: boolean
}

export default function CopyFolderForm({ onSubmit, isLoading }: Props) {
  const [sourceLink, setSourceLink] = useState('')
  const [destLink, setDestLink] = useState('')
  const [newName, setNewName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const sourceFolderId = extractDriveId(sourceLink)
    const destFolderId = extractDriveId(destLink)

    if (!sourceFolderId) {
      setError('Vui lòng nhập link hoặc ID folder nguồn hợp lệ')
      return
    }
    if (!destFolderId) {
      setError('Vui lòng nhập link hoặc ID folder đích hợp lệ')
      return
    }
    if (!newName.trim()) {
      setError('Vui lòng nhập tên folder sao chép')
      return
    }

    setError(null)
    onSubmit({ sourceFolderId, destFolderId, newName: newName.trim() })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <TextInput
        label="Link/ID folder nguồn"
        value={sourceLink}
        onChange={(e) => setSourceLink(e.target.value)}
        placeholder="https://drive.google.com/drive/folders/..."
        required
      />

      <TextInput
        label="Link/ID folder đích"
        value={destLink}
        onChange={(e) => setDestLink(e.target.value)}
        placeholder="https://drive.google.com/drive/folders/..."
        required
      />

      <TextInput
        label="Tên folder sao chép"
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        placeholder="Bản sao folder"
        required
      />

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 h-9 bg-accent text-white rounded-sm text-sm hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Đang sao chép...' : 'Sao chép folder'}
        </button>
      </div>
    </form>
  )
}
