import { useMemo, useState } from 'react'
import { Check, Plus, Trash2, Eye, Code } from 'lucide-react'
import Modal from '../../ui/layout/Modal'
import Badge from '../../ui/display/Badge'
import type { DriveTemplate, DriveTemplateFolder, DriveTemplatePermission } from '../../types'
import {
  createEmptyFolder,
  findNode,
  updateNode,
  addChild,
  removeNode,
  validateTemplate,
  roleLabel,
  DRIVE_ROLES,
  countFolders,
  countPermissions,
} from './template-editor-utils'

const defaultTemplateRoot: DriveTemplateFolder = {
  name: 'A0 - Báo cáo',
  permissions: [
    { email: 'hos@era.com.vn', role: 'reader' },
    { email: 'huu.tran@era.com.vn', role: 'fileOrganizer' },
  ],
  children: [
    {
      name: 'B1 - Public',
      permissions: [{ scope: 'anyone', role: 'reader' }],
      children: [],
    },
    {
      name: 'C1 - Marketing',
      permissions: [
        { email: 'ps@era.com.vn', role: 'fileOrganizer' },
        { email: 'mkt@era.com.vn', role: 'reader' },
      ],
      children: [
        {
          name: 'D2 - Campaign',
          permissions: [
            { email: 'mkt@era.com.vn', role: 'fileOrganizer' },
            { email: 'agent@era.com.vn', role: 'reader' },
          ],
          children: [],
        },
      ],
    },
  ],
}

interface TemplateEditorModalProps {
  template: DriveTemplate | null
  onClose: () => void
  onSave: (data: { name: string; root: DriveTemplateFolder }) => void
  isPending: boolean
}

export default function TemplateEditorModal({
  template,
  onClose,
  onSave,
  isPending,
}: TemplateEditorModalProps) {
  const [name, setName] = useState(template?.name || '')
  const [root, setRoot] = useState<DriveTemplateFolder>(template?.root || defaultTemplateRoot)
  const [selectedPath, setSelectedPath] = useState<number[]>([])
  const [showJson, setShowJson] = useState(false)
  const [errors, setErrors] = useState<ReturnType<typeof validateTemplate>>([])

  const selectedNode = useMemo(() => findNode(root, selectedPath) || root, [root, selectedPath])

  const handleUpdateSelected = (updater: (node: DriveTemplateFolder) => DriveTemplateFolder) => {
    setRoot((prev) => updateNode(prev, selectedPath, updater))
  }

  const handleAddChild = () => {
    setRoot((prev) => addChild(prev, selectedPath, createEmptyFolder('Folder mới')))
  }

  const handleDeleteSelected = () => {
    if (selectedPath.length === 0) return
    const parentPath = selectedPath.slice(0, -1)
    setRoot((prev) => removeNode(prev, selectedPath))
    setSelectedPath(parentPath)
  }

  const handleAddPermission = () => {
    handleUpdateSelected((node) => ({
      ...node,
      permissions: [...(node.permissions || []), { email: '', role: 'reader' }],
    }))
  }

  const handleUpdatePermission = (
    index: number,
    updates: Partial<DriveTemplatePermission>
  ) => {
    handleUpdateSelected((node) => {
      const permissions = [...(node.permissions || [])]
      permissions[index] = { ...permissions[index], ...updates }
      return { ...node, permissions }
    })
  }

  const handleRemovePermission = (index: number) => {
    handleUpdateSelected((node) => {
      const permissions = (node.permissions || []).filter((_, i) => i !== index)
      return { ...node, permissions }
    })
  }

  const handleSave = () => {
    const validationErrors = validateTemplate(root)
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }
    setErrors([])
    onSave({ name: name.trim() || root.name, root })
  }

  return (
    <Modal
      title={template ? 'Sửa template' : 'Thêm template mới'}
      onClose={onClose}
      size="xl"
    >
      <div className="space-y-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tên template"
          className="w-full px-3 h-10 rounded-sm border border-border-hairline bg-bg-primary text-text-primary focus:outline-none focus:border-accent"
        />

        {errors.length > 0 && (
          <div className="rounded-sm border border-danger/30 bg-danger-subtle px-3 py-2 text-sm text-danger">
            <p className="font-medium">Vui lòng sửa các lỗi sau:</p>
            <ul className="list-disc list-inside mt-1">
              {errors.slice(0, 5).map((err, i) => (
                <li key={i}>{err.message}</li>
              ))}
              {errors.length > 5 && <li>...và {errors.length - 5} lỗi khác</li>}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
          <div className="border border-border-hairline rounded-sm p-3 bg-bg-secondary">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-text-primary">Cây folder</span>
              <span className="text-xs text-text-tertiary">
                {countFolders(root)} folder, {countPermissions(root)} quyền
              </span>
            </div>
            <div className="overflow-auto max-h-80">
              <TreeNav
                node={root}
                path={[]}
                selectedPath={selectedPath}
                onSelect={setSelectedPath}
              />
            </div>
            <div className="flex items-center gap-2 mt-3">
              <button
                type="button"
                onClick={handleAddChild}
                className="inline-flex items-center gap-1 px-2 h-8 text-xs border border-border-hairline rounded-sm hover:bg-bg-tertiary transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm con
              </button>
              <button
                type="button"
                onClick={handleDeleteSelected}
                disabled={selectedPath.length === 0}
                className="inline-flex items-center gap-1 px-2 h-8 text-xs border border-border-hairline rounded-sm text-danger hover:bg-danger-subtle transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" /> Xóa
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {showJson ? (
              <div className="space-y-2">
                <textarea
                  value={JSON.stringify(root, null, 2)}
                  readOnly
                  className="w-full h-96 px-3 py-2 rounded-sm border border-border-hairline bg-bg-secondary text-text-primary font-mono text-xs resize-none"
                />
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <label className="block">
                    <span className="block text-sm font-medium text-text-secondary mb-1">Tên folder</span>
                    <input
                      type="text"
                      value={selectedNode.name}
                      onChange={(e) =>
                        handleUpdateSelected((node) => ({ ...node, name: e.target.value }))
                      }
                      className="w-full px-3 h-10 rounded-sm border border-border-hairline bg-bg-primary text-text-primary focus:outline-none focus:border-accent"
                    />
                  </label>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-text-secondary">Quyền truy cập</span>
                      <button
                        type="button"
                        onClick={handleAddPermission}
                        className="inline-flex items-center gap-1 px-2 h-7 text-xs border border-border-hairline rounded-sm hover:bg-bg-tertiary transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> Thêm quyền
                      </button>
                    </div>

                    {(selectedNode.permissions || []).length === 0 ? (
                      <p className="text-sm text-text-tertiary">Chưa có quyền nào. Kế thừa từ folder cha khi tạo.</p>
                    ) : (
                      <div className="space-y-2">
                        {(selectedNode.permissions || []).map((perm, idx) => (
                          <PermissionRow
                            key={idx}
                            permission={perm}
                            onChange={(updates) => handleUpdatePermission(idx, updates)}
                            onDelete={() => handleRemovePermission(idx)}
                          />
                        ))}
                      </div>
                    )}

                    {/* BUG-041: Giải thích giới hạn role của Google cho folder con. */}
                    <p className="text-xs text-text-tertiary">
                      Quyền tối đa cho folder là <strong>Người quản lý nội dung</strong>. Vai trò{' '}
                      <strong>Người quản lý</strong> chỉ gán được ở cấp Shared Drive (cả ổ), không gán cho
                      folder con — đây là giới hạn của Google Drive.
                    </p>
                  </div>
                </div>

                <div className="border border-border-hairline rounded-sm p-3 bg-bg-secondary">
                  <p className="text-xs font-medium text-text-tertiary mb-2">Xem trước cây:</p>
                  <div className="font-mono text-xs text-text-primary overflow-auto max-h-48">
                    <PreviewTree node={root} depth={0} />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border-hairline">
          <button
            type="button"
            onClick={() => setShowJson((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 h-9 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            {showJson ? <Eye className="w-4 h-4" /> : <Code className="w-4 h-4" />}
            {showJson ? 'Xem UI' : 'Xem JSON'}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-9 text-sm text-text-secondary hover:text-text-primary"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-4 h-9 bg-accent text-white rounded-sm text-sm hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              {isPending ? (
                <>Đang lưu...</>
              ) : (
                <>
                  <Check className="w-4 h-4" /> Lưu
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

function TreeNav({
  node,
  path,
  selectedPath,
  onSelect,
}: {
  node: DriveTemplateFolder
  path: number[]
  selectedPath: number[]
  onSelect: (path: number[]) => void
}) {
  const isSelected = path.length === selectedPath.length && path.every((p, i) => p === selectedPath[i])
  const hasChildren = (node.children || []).length > 0

  return (
    <div>
      <button
        type="button"
        onClick={() => onSelect(path)}
        className={`w-full text-left px-2 py-1.5 rounded-sm text-sm truncate transition-colors ${
          isSelected
            ? 'bg-accent-subtle text-accent font-medium'
            : 'text-text-secondary hover:bg-bg-tertiary'
        }`}
        title={node.name}
      >
        {hasChildren && <span className="inline-block w-4">▾</span>}
        {!hasChildren && <span className="inline-block w-4"></span>}
        {node.name}
      </button>
      {hasChildren && (
        <div className="pl-4">
          {(node.children || []).map((child, idx) => (
            <TreeNav
              key={idx}
              node={child}
              path={[...path, idx]}
              selectedPath={selectedPath}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function PermissionRow({
  permission,
  onChange,
  onDelete,
}: {
  permission: DriveTemplatePermission
  onChange: (updates: Partial<DriveTemplatePermission>) => void
  onDelete: () => void
}) {
  const isAnyone = permission.scope === 'anyone'

  return (
    <div className="flex flex-wrap items-center gap-2 p-2 rounded-sm border border-border-hairline bg-bg-primary">
      <select
        value={isAnyone ? 'anyone' : 'user'}
        onChange={(e) => {
          const scope = e.target.value as 'user' | 'anyone'
          onChange({ scope, email: scope === 'anyone' ? undefined : '' })
        }}
        className="h-8 px-2 rounded-sm border border-border-hairline bg-bg-primary text-text-primary text-sm focus:outline-none focus:border-accent"
      >
        <option value="user">Người dùng</option>
        <option value="anyone">Bất kỳ ai có link</option>
      </select>

      {isAnyone ? (
        <span className="text-sm text-text-secondary">Ai có link</span>
      ) : (
        <input
          type="email"
          value={permission.email || ''}
          onChange={(e) => onChange({ email: e.target.value })}
          placeholder="email@example.com"
          className="flex-1 min-w-[8rem] px-2 h-8 rounded-sm border border-border-hairline bg-bg-primary text-text-primary text-sm focus:outline-none focus:border-accent"
        />
      )}

      <select
        value={permission.role}
        onChange={(e) => onChange({ role: e.target.value as DriveTemplatePermission['role'] })}
        className="h-8 px-2 rounded-sm border border-border-hairline bg-bg-primary text-text-primary text-sm focus:outline-none focus:border-accent"
      >
        {DRIVE_ROLES.map((role) => (
          <option key={role} value={role}>
            {roleLabel(role)}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={onDelete}
        className="p-1.5 rounded-sm hover:bg-bg-tertiary text-danger"
        aria-label="Xóa quyền"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

function PreviewTree({ node, depth }: { node: DriveTemplateFolder; depth: number }) {
  return (
    <div style={{ paddingLeft: `${depth * 1}rem` }}>
      <div className="flex items-start gap-2 py-0.5">
        <span className="text-text-primary">{node.name}</span>
        <div className="flex flex-wrap items-center gap-1">
          {(node.permissions || []).map((perm, idx) => (
            <Badge key={idx} variant="neutral" className="text-[10px]">
              {perm.scope === 'anyone' ? 'anyone' : perm.email} → {perm.role}
            </Badge>
          ))}
        </div>
      </div>
      {(node.children || []).map((child, idx) => (
        <PreviewTree key={idx} node={child} depth={depth + 1} />
      ))}
    </div>
  )
}
