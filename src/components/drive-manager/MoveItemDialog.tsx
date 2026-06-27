import { useState } from 'react'
import TextInput from '../../ui/input/TextInput'
import Modal from '../../ui/layout/Modal'
import { extractDriveId } from '../apps-script/utils'

interface Props {
  node: { id: string; name: string; isSharedDrive: boolean }
  open: boolean
  onClose: () => void
  onSubmit: (params: { itemId: string; destFolderId: string }) => void
  isLoading: boolean
}

export default function MoveItemDialog({ node, open, onClose, onSubmit, isLoading }: Props) {
  const [destUrl, setDestUrl] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const destFolderId = extractDriveId(destUrl)
    if (!destFolderId) {
      setError('Vui lòng nhập link hoặc ID folder đích hợp lệ')
      return
    }
    setError(null)
    onSubmit({ itemId: node.id, destFolderId })
  }

  if (!open) return null

  return (
    <Modal title={`Di chuyển "${node.name}"`} onClose={onClose} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextInput
          label="Folder đích (link/ID)"
          value={destUrl}
          onChange={(e) => setDestUrl(e.target.value)}
          placeholder="https://drive.google.com/drive/folders/..."
          required
        />

        <div className="rounded-sm border border-warning/30 bg-warning-subtle px-3 py-2 text-sm text-warning">
          {node.isSharedDrive ? (
            <>
              Item này nằm trong <strong>Shared Drive</strong>. Chỉ có thể di chuyển trong cùng Shared Drive.
              Di chuyển từ Shared Drive ra My Drive hoặc Shared Drive khác sẽ bị Google Drive từ chối.
            </>
          ) : (
            <>
              Item này nằm trong <strong>My Drive</strong>. Có thể di chuyển vào Shared Drive nếu bạn có quyền writer.
              Di chuyển từ Shared Drive ra My Drive sẽ bị từ chối nếu bạn không phải organizer.
            </>
          )}
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 h-9 text-sm text-text-secondary">Hủy</button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 h-9 bg-accent text-white rounded-sm text-sm disabled:opacity-50"
          >
            {isLoading ? 'Đang di chuyển...' : 'Di chuyển'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
