import { useState } from 'react'
import TextInput from '../../ui/input/TextInput'
import type { CreateFolderParams } from '../../types'
import { extractDriveId } from './utils'

interface Props {
  onSubmit: (params: CreateFolderParams) => void
  isLoading: boolean
}

export default function CreateFolderForm({ onSubmit, isLoading }: Props) {
  const [parentLink, setParentLink] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const parentFolderId = extractDriveId(parentLink)
    if (!parentFolderId) {
      setError('Vui lòng nhập link hoặc ID folder cha hợp lệ')
      return
    }
    if (!name.trim()) {
      setError('Vui lòng nhập tên folder mới')
      return
    }
    setError(null)
    onSubmit({ parentFolderId, name: name.trim() })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <TextInput
        label="Link/ID folder cha"
        value={parentLink}
        onChange={(e) => setParentLink(e.target.value)}
        placeholder="https://drive.google.com/drive/folders/..."
        required
      />

      <TextInput
        label="Tên folder mới"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Folder mới"
        required
      />

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 h-9 bg-accent text-white rounded-sm text-sm hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Đang tạo...' : 'Tạo folder'}
        </button>
      </div>
    </form>
  )
}
