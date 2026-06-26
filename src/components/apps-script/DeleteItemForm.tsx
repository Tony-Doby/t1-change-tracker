import { useState } from 'react'
import TextInput from '../../ui/input/TextInput'
import type { DeleteItemParams } from '../../types'
import { extractDriveId } from './utils'

interface Props {
  onSubmit: (params: DeleteItemParams) => void
  isLoading: boolean
}

export default function DeleteItemForm({ onSubmit, isLoading }: Props) {
  const [itemLink, setItemLink] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const itemId = extractDriveId(itemLink)
    if (!itemId) {
      setError('Vui lòng nhập link hoặc ID item hợp lệ')
      return
    }
    setError(null)
    onSubmit({ itemId })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <TextInput
        label="Link/ID item cần xóa"
        value={itemLink}
        onChange={(e) => setItemLink(e.target.value)}
        placeholder="https://drive.google.com/file/d/... hoặc /folders/..."
        required
      />

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 h-9 bg-danger text-white rounded-sm text-sm hover:bg-danger-hover transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Đang xóa...' : 'Xóa item'}
        </button>
      </div>
    </form>
  )
}
