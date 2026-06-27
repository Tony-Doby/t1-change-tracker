import { useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import TextArea from '../../ui/input/TextArea'
import Select from '../../ui/input/Select'
import Badge from '../../ui/display/Badge'
import type {
  SetPermissionsParams,
  DriveRole,
  DriveScope,
  DetectDriveTypeResult,
} from '../../types'
import { parseList, extractDriveId } from './utils'

// FEAT-031/032: presetItems đến từ bảng kết quả quét (đã biết loại Drive) nên bỏ qua ô nhập tay.
export interface PresetItem {
  id: string
  isSharedDrive: boolean
}

interface Props {
  onSubmit: (params: SetPermissionsParams) => void
  isLoading: boolean
  presetItems?: PresetItem[]
  // FEAT-031: phát hiện loại Drive cho các item nhập tay (mở khóa role chỉ-Shared-Drive).
  onDetectDriveTypes?: (itemIds: string[]) => Promise<DetectDriveTypeResult[]>
}

type Composition = 'unknown' | 'allMy' | 'allShared' | 'mixed'

const scopeOptions = [
  { value: 'user', label: 'Người dùng cụ thể (theo email)' },
  { value: 'anyone', label: 'Bất kỳ ai có link' },
]

// Role hợp lệ trên cả My Drive lẫn Shared Drive.
const UNIVERSAL_ROLES: DriveRole[] = ['reader', 'commenter', 'writer']
// Role chỉ áp dụng cho item trong Shared Drive.
const SHARED_ONLY_ROLES: DriveRole[] = ['fileOrganizer', 'organizer']

function roleLabel(role: DriveRole, composition: Composition): string {
  switch (role) {
    case 'reader':
      return 'Người xem (reader)'
    case 'commenter':
      return 'Người nhận xét (commenter)'
    case 'writer':
      return composition === 'allShared'
        ? 'Người đóng góp (writer)'
        : 'Người chỉnh sửa (writer)'
    case 'fileOrganizer':
      return 'Người quản lý nội dung (fileOrganizer)'
    case 'organizer':
      return 'Người quản lý (organizer)'
    default:
      return role
  }
}

export default function SetPermissionsForm({
  onSubmit,
  isLoading,
  presetItems,
  onDetectDriveTypes,
}: Props) {
  const isPreset = Array.isArray(presetItems) && presetItems.length > 0

  const [itemIdsText, setItemIdsText] = useState('')
  const [emailsText, setEmailsText] = useState('')
  const [selectedRole, setSelectedRole] = useState<DriveRole>('reader')
  const [scope, setScope] = useState<DriveScope>('user')
  const [error, setError] = useState<string | null>(null)

  // Kết quả phát hiện loại Drive cho item nhập tay.
  const [detected, setDetected] = useState<DetectDriveTypeResult[] | null>(null)
  const [detecting, setDetecting] = useState(false)

  // Tập item hiệu lực kèm loại Drive.
  const effectiveItems: PresetItem[] = useMemo(() => {
    if (isPreset) return presetItems as PresetItem[]
    if (detected) {
      return detected
        .filter((d) => !d.error)
        .map((d) => ({ id: d.id, isSharedDrive: d.isSharedDrive }))
    }
    return []
  }, [isPreset, presetItems, detected])

  const composition: Composition = useMemo(() => {
    if (effectiveItems.length === 0) return 'unknown'
    const hasShared = effectiveItems.some((i) => i.isSharedDrive)
    const hasMy = effectiveItems.some((i) => !i.isSharedDrive)
    if (hasShared && hasMy) return 'mixed'
    if (hasShared) return 'allShared'
    return 'allMy'
  }, [effectiveItems])

  // Chỉ mở khóa 5 role khi CHẮC CHẮN toàn bộ item nằm trong Shared Drive.
  const availableRoles: DriveRole[] = useMemo(
    () => (composition === 'allShared' ? [...UNIVERSAL_ROLES, ...SHARED_ONLY_ROLES] : UNIVERSAL_ROLES),
    [composition]
  )

  // Nếu role đã chọn không còn hợp lệ (đổi composition), fallback về reader.
  const role = availableRoles.includes(selectedRole) ? selectedRole : 'reader'

  const roleOptions = availableRoles.map((r) => ({ value: r, label: roleLabel(r, composition) }))

  const runDetect = async (ids: string[]) => {
    if (!onDetectDriveTypes || ids.length === 0) return
    setDetecting(true)
    try {
      const res = await onDetectDriveTypes(ids)
      setDetected(res)
    } catch {
      setDetected(null)
    } finally {
      setDetecting(false)
    }
  }

  const handleItemsBlur = () => {
    if (isPreset) return
    const ids = parseList(itemIdsText).map(extractDriveId).filter(Boolean)
    if (ids.length > 0) void runDetect(ids)
    else setDetected(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const itemIds = isPreset
      ? (presetItems as PresetItem[]).map((i) => i.id)
      : parseList(itemIdsText).map(extractDriveId).filter(Boolean)

    if (itemIds.length === 0) {
      setError('Vui lòng nhập ít nhất một ID/link item')
      return
    }

    const emails = scope === 'user' ? parseList(emailsText) : []
    if (scope === 'user' && emails.length === 0) {
      setError('Vui lòng nhập ít nhất một email khi cấp cho người dùng cụ thể')
      return
    }

    // Chặn sớm role chỉ-Shared khi tập item có lẫn My Drive (backend cũng validate lại từng item).
    if (SHARED_ONLY_ROLES.includes(role) && composition !== 'allShared') {
      setError('Role này chỉ áp dụng cho item trong Shared Drive. Hãy bỏ các item My Drive khỏi danh sách.')
      return
    }

    setError(null)
    onSubmit({ itemIds, emails, role, scope })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isPreset ? (
        <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
          <span>Đã chọn <strong className="text-text-primary">{effectiveItems.length}</strong> item</span>
          {composition === 'allShared' && <Badge variant="primary">Shared Drive</Badge>}
          {composition === 'allMy' && <Badge variant="neutral">My Drive</Badge>}
          {composition === 'mixed' && <Badge variant="warning">Lẫn 2 loại Drive</Badge>}
        </div>
      ) : (
        <TextArea
          label="Danh sách item (ID hoặc link)"
          value={itemIdsText}
          onChange={(e) => setItemIdsText(e.target.value)}
          onBlur={handleItemsBlur}
          placeholder="Mỗi dòng một ID hoặc link Google Drive..."
          required
          hint="Mỗi dòng một item, hoặc phân cách bằng dấu phẩy. Loại Drive được phát hiện tự động khi rời ô."
        />
      )}

      {/* Trạng thái phát hiện loại Drive */}
      {!isPreset && detecting && (
        <p className="flex items-center gap-2 text-sm text-text-tertiary">
          <Loader2 className="w-4 h-4 animate-spin" /> Đang phát hiện loại Drive...
        </p>
      )}
      {!isPreset && !detecting && composition !== 'unknown' && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
          <span>Đã phát hiện:</span>
          {composition === 'allShared' && <Badge variant="primary">Toàn bộ Shared Drive</Badge>}
          {composition === 'allMy' && <Badge variant="neutral">Toàn bộ My Drive</Badge>}
          {composition === 'mixed' && <Badge variant="warning">Lẫn 2 loại Drive</Badge>}
        </div>
      )}

      {composition === 'mixed' && (
        <div className="rounded-sm border border-warning/30 bg-warning-subtle px-3 py-2 text-sm text-warning">
          Danh sách có cả My Drive và Shared Drive. Chỉ các quyền dùng chung (xem / nhận xét / chỉnh sửa)
          khả dụng. Để cấp quyền quản lý, hãy tách riêng các item Shared Drive.
        </div>
      )}

      <Select
        label="Đối tượng"
        options={scopeOptions}
        value={scope}
        onChange={(e) => setScope(e.target.value as DriveScope)}
      />

      {scope === 'user' ? (
        <TextArea
          label="Danh sách email được cấp quyền"
          value={emailsText}
          onChange={(e) => setEmailsText(e.target.value)}
          placeholder="email1@example.com, email2@example.com"
          required
          hint="Mỗi dòng một email, hoặc phân cách bằng dấu phẩy"
        />
      ) : (
        <p className="rounded-sm border border-border-hairline bg-bg-secondary px-3 py-2 text-sm text-text-secondary">
          Bất kỳ ai có link sẽ được quyền <strong>{roleLabel(role, composition)}</strong>.
          Liên kết không bị lập chỉ mục công khai (allowFileDiscovery=false).
        </p>
      )}

      <Select
        label="Quyền"
        options={roleOptions}
        value={role}
        onChange={(e) => setSelectedRole(e.target.value as DriveRole)}
        hint={
          composition === 'allShared'
            ? 'Item Shared Drive: có thêm quyền quản lý nội dung / quản lý.'
            : 'Có thêm quyền quản lý khi toàn bộ item nằm trong Shared Drive.'
        }
      />

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading || detecting}
          className="px-4 h-9 bg-accent text-white rounded-sm text-sm hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Đang cấp quyền...' : 'Cấp quyền'}
        </button>
      </div>
    </form>
  )
}
