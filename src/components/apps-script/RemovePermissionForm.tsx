import { useState } from 'react'
import TextInput from '../../ui/input/TextInput'
import type { RemovePermissionParams } from '../../types'
import { extractDriveId } from './utils'

interface Props {
  onSubmit: (params: RemovePermissionParams) => void
  isLoading: boolean
}

export default function RemovePermissionForm({ onSubmit, isLoading }: Props) {
  const [itemLink, setItemLink] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const itemId = extractDriveId(itemLink)
    if (!itemId) {
      setError('Vui lòng nhập link hoặc ID item hợp lệ')
      return
    }
    if (!email.trim()) {
      setError('Vui lòng nhập email cần xóa quyền')
      return
    }
    setError(null)
    onSubmit({ itemId, email: email.trim() })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <TextInput
        label="Link/ID item"
        value={itemLink}
        onChange={(e) => setItemLink(e.target.value)}
        placeholder="https://drive.google.com/drive/folders/..."
        required
      />

      <TextInput
        label="Email cần xóa quyền"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email@example.com"
        required
      />

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 h-9 bg-accent text-white rounded-sm text-sm hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Đang xóa quyền...' : 'Xóa quyền'}
        </button>
      </div>
    </form>
  )
}
