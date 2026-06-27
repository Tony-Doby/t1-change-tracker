import { useState } from 'react'
import TextInput from '../../ui/input/TextInput'
import Modal from '../../ui/layout/Modal'
import { extractDriveId } from '../apps-script/utils'

interface Props {
  node: { id: string; name: string }
  open: boolean
  onClose: () => void
  onSubmit: (params: { sourceFolderId: string; destFolderId: string; newName: string }) => void
  isLoading: boolean
}

export default function CopyFolderDialog({ node, open, onClose, onSubmit, isLoading }: Props) {
  const [destUrl, setDestUrl] = useState('')
  const [newName, setNewName] = useState(`${node.name} (copy)`)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const destFolderId = extractDriveId(destUrl)
    if (!destFolderId) {
      setError('Vui lòng nhập link hoặc ID folder đích hợp lệ')
      return
    }
    if (!newName.trim()) {
      setError('Vui lòng nhập tên folder mới')
      return
    }
    setError(null)
    onSubmit({ sourceFolderId: node.id, destFolderId, newName: newName.trim() })
  }

  if (!open) return null

  return (
    <Modal title={`Copy folder "${node.name}"`} onClose={onClose} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextInput
          label="Folder đích (link/ID)"
          value={destUrl}
          onChange={(e) => setDestUrl(e.target.value)}
          placeholder="https://drive.google.com/drive/folders/..."
          required
        />

        <TextInput
          label="Tên folder copy"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          required
        />

        <p className="text-xs text-text-tertiary">
          Folder copy sẽ kế thừa permission từ folder đích, không giữ permission của folder nguồn.
        </p>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 h-9 text-sm text-text-secondary">Hủy</button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 h-9 bg-accent text-white rounded-sm text-sm disabled:opacity-50"
          >
            {isLoading ? 'Đang copy...' : 'Copy'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
