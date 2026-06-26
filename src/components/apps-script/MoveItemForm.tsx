import { useState } from 'react'
import TextInput from '../../ui/input/TextInput'
import type { MoveItemParams } from '../../types'
import { extractDriveId } from './utils'

interface Props {
  onSubmit: (params: MoveItemParams) => void
  isLoading: boolean
}

export default function MoveItemForm({ onSubmit, isLoading }: Props) {
  const [itemLink, setItemLink] = useState('')
  const [destLink, setDestLink] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const itemId = extractDriveId(itemLink)
    const destFolderId = extractDriveId(destLink)

    if (!itemId) {
      setError('Vui lòng nhập link hoặc ID item cần di chuyển')
      return
    }
    if (!destFolderId) {
      setError('Vui lòng nhập link hoặc ID folder đích')
      return
    }

    setError(null)
    onSubmit({ itemId, destFolderId })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <TextInput
        label="Link/ID item cần di chuyển"
        value={itemLink}
        onChange={(e) => setItemLink(e.target.value)}
        placeholder="https://drive.google.com/file/d/... hoặc /folders/..."
        required
      />

      <TextInput
        label="Link/ID folder đích"
        value={destLink}
        onChange={(e) => setDestLink(e.target.value)}
        placeholder="https://drive.google.com/drive/folders/..."
        required
      />

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 h-9 bg-accent text-white rounded-sm text-sm hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Đang di chuyển...' : 'Di chuyển item'}
        </button>
      </div>
    </form>
  )
}
