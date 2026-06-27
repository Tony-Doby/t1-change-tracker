import { useState } from 'react'
import TextInput from '../../ui/input/TextInput'
import Modal from '../../ui/layout/Modal'
import { extractDriveId } from '../apps-script/utils'

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (params: { name: string; rootFolderId: string; rootUrl: string; depth: number }) => void
  isLoading: boolean
}

export default function CreateTreeDialog({ open, onClose, onSubmit, isLoading }: Props) {
  const [name, setName] = useState('')
  const [rootUrl, setRootUrl] = useState('')
  const [depth, setDepth] = useState(2)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const rootFolderId = extractDriveId(rootUrl)
    if (!rootFolderId) {
      setError('Vui lòng nhập link hoặc ID folder gốc hợp lệ')
      return
    }
    setError(null)
    onSubmit({
      name: name.trim() || rootFolderId,
      rootFolderId,
      rootUrl: rootUrl.trim(),
      depth,
    })
  }

  const handleClose = () => {
    setName('')
    setRootUrl('')
    setDepth(2)
    setError(null)
    onClose()
  }

  if (!open) return null

  return (
    <Modal title="Thêm cây Drive mới" onClose={handleClose} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextInput
          label="Tên cây"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="VD: Báo cáo 2026"
          hint="Để trống để dùng ID folder gốc làm tên"
        />

        <TextInput
          label="Link/ID folder gốc"
          value={rootUrl}
          onChange={(e) => setRootUrl(e.target.value)}
          placeholder="https://drive.google.com/drive/folders/..."
          required
        />

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

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 h-9 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 h-9 bg-accent text-white rounded-sm text-sm hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Đang quét...' : 'Thêm cây'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
