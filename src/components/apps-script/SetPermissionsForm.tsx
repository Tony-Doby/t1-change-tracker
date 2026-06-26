import { useState } from 'react'
import TextArea from '../../ui/input/TextArea'
import Select from '../../ui/input/Select'
import type { SetPermissionsParams } from '../../types'
import { parseList } from './utils'

interface Props {
  onSubmit: (params: SetPermissionsParams) => void
  isLoading: boolean
}

const roleOptions = [
  { value: 'reader', label: 'Ngườii xem (reader)' },
  { value: 'commenter', label: 'Ngườii bình luận (commenter)' },
  { value: 'writer', label: 'Ngườii chỉnh sửa (writer)' },
]

export default function SetPermissionsForm({ onSubmit, isLoading }: Props) {
  const [itemIdsText, setItemIdsText] = useState('')
  const [emailsText, setEmailsText] = useState('')
  const [role, setRole] = useState<SetPermissionsParams['role']>('reader')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const itemIds = parseList(itemIdsText)
    const emails = parseList(emailsText)

    if (itemIds.length === 0) {
      setError('Vui lòng nhập ít nhất một ID/link item')
      return
    }
    if (emails.length === 0) {
      setError('Vui lòng nhập ít nhất một email')
      return
    }

    setError(null)
    onSubmit({ itemIds, emails, role })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <TextArea
        label="Danh sách item (ID hoặc link)"
        value={itemIdsText}
        onChange={(e) => setItemIdsText(e.target.value)}
        placeholder="Mỗi dòng một ID hoặc link Google Drive..."
        required
        hint="Có thể nhập nhiều item, phân cách bằng dấu xuống dòng hoặc dấu phẩy"
      />

      <TextArea
        label="Danh sách email được cấp quyền"
        value={emailsText}
        onChange={(e) => setEmailsText(e.target.value)}
        placeholder="email1@example.com, email2@example.com"
        required
        hint="Mỗi dòng một email, hoặc phân cách bằng dấu phẩy"
      />

      <Select
        label="Quyền"
        options={roleOptions}
        value={role}
        onChange={(e) => setRole(e.target.value as SetPermissionsParams['role'])}
      />

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 h-9 bg-accent text-white rounded-sm text-sm hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Đang cấp quyền...' : 'Cấp quyền'}
        </button>
      </div>
    </form>
  )
}
