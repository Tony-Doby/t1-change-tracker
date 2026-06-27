import { useMemo, useState } from 'react'
import { ChevronRight, ChevronDown, Folder, MoreVertical } from 'lucide-react'
import type { ScanFolderResult } from '../../types'

export interface DriveTreeNode extends ScanFolderResult {
  children: DriveTreeNode[]
}

export type TreeAction = 'grant' | 'createFromTemplate' | 'copy' | 'move' | 'delete'

interface Props {
  nodes: DriveTreeNode[]
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onSelectAll: (ids: string[]) => void
  onAction: (action: TreeAction, node: DriveTreeNode) => void
  onToggleExpand: (id: string) => void
  expandedIds: Set<string>
}

export function buildTree(results: ScanFolderResult[]): DriveTreeNode[] {
  const rootNodes: DriveTreeNode[] = []
  const nodeMap = new Map<string, DriveTreeNode>()

  // Create nodes.
  results.forEach((r) => {
    nodeMap.set(r.id, { ...r, children: [] })
  })

  // Build parent-child relationships based on path.
  results.forEach((r) => {
    const node = nodeMap.get(r.id)
    if (!node) return

    if (r.depth === 0) {
      rootNodes.push(node)
      return
    }

    // Find parent: the folder whose path is the immediate parent of this node's path.
    const parentPath = r.path.split('/').slice(0, -1).join('/')
    const parent = results.find(
      (candidate) =>
        candidate.depth === r.depth - 1 &&
        (candidate.path === parentPath || (parentPath === '' && candidate.depth === 0))
    )

    if (parent) {
      const parentNode = nodeMap.get(parent.id)
      if (parentNode) parentNode.children.push(node)
    } else {
      // Fallback: attach to root if parent not found.
      rootNodes.push(node)
    }
  })

  return rootNodes
}

export function useDriveTree(results: ScanFolderResult[]) {
  const tree = useMemo(() => buildTree(results), [results])
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const allIds = new Set<string>()
    results.forEach((r) => allIds.add(r.id))
    return allIds
  })

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const expandAll = () => {
    const allIds = new Set<string>()
    results.forEach((r) => allIds.add(r.id))
    setExpandedIds(allIds)
  }

  const collapseAll = () => setExpandedIds(new Set())

  return { tree, expandedIds, toggleExpand, expandAll, collapseAll }
}

export default function DriveTreeTable({
  nodes,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onAction,
  onToggleExpand,
  expandedIds,
}: Props) {
  const allIds = useMemo(() => collectIds(nodes), [nodes])

  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id))

  return (
    <div className="border border-border-hairline rounded-sm overflow-auto max-h-[32rem]">
      <table className="w-full text-left text-sm">
        <thead className="bg-bg-secondary sticky top-0 z-10">
          <tr>
            <th className="px-3 py-2 w-10 border-b border-border-hairline">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() => (allSelected ? onSelectAll([]) : onSelectAll(allIds))}
                aria-label="Chọn tất cả"
                className="accent-accent w-4 h-4 align-middle"
              />
            </th>
            <th className="px-3 py-2 font-medium text-text-tertiary border-b border-border-hairline">Tên</th>
            <th className="px-3 py-2 font-medium text-text-tertiary border-b border-border-hairline">Loại Drive</th>
            <th className="px-3 py-2 font-medium text-text-tertiary border-b border-border-hairline w-16">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {nodes.map((node) => (
            <TreeRow
              key={node.id}
              node={node}
              depth={0}
              selectedIds={selectedIds}
              onToggleSelect={onToggleSelect}
              onAction={onAction}
              onToggleExpand={onToggleExpand}
              expandedIds={expandedIds}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TreeRow({
  node,
  depth,
  selectedIds,
  onToggleSelect,
  onAction,
  onToggleExpand,
  expandedIds,
}: {
  node: DriveTreeNode
  depth: number
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onAction: (action: TreeAction, node: DriveTreeNode) => void
  onToggleExpand: (id: string) => void
  expandedIds: Set<string>
}) {
  const isExpanded = expandedIds.has(node.id)
  const hasChildren = node.children.length > 0

  return (
    <>
      <tr className="border-b border-border-hairline hover:bg-bg-secondary/50 group">
        <td className="px-3 py-2">
          <input
            type="checkbox"
            checked={selectedIds.has(node.id)}
            onChange={() => onToggleSelect(node.id)}
            aria-label={`Chọn ${node.name}`}
            className="accent-accent w-4 h-4 align-middle"
          />
        </td>
        <td className="px-3 py-2">
          <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 1.5}rem` }}>
            {hasChildren ? (
              <button
                type="button"
                onClick={() => onToggleExpand(node.id)}
                className="p-0.5 rounded-sm hover:bg-bg-tertiary text-text-tertiary"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : (
              <span className="w-5" />
            )}
            <Folder className="w-4 h-4 text-accent flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-text-primary block truncate" title={node.name}>
                {node.name}
              </span>
              <span className="text-xs text-text-tertiary block truncate" title={node.path}>
                {node.path}
              </span>
            </div>
          </div>
        </td>
        <td className="px-3 py-2">
          {node.isSharedDrive ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-pill text-xs font-medium bg-primary-subtle text-primary">
              Shared Drive
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-pill text-xs font-medium bg-neutral-subtle text-text-secondary">
              My Drive
            </span>
          )}
        </td>
        <td className="px-3 py-2">
          <div className="relative inline-block">
            <TreeActionMenu node={node} onAction={onAction} />
          </div>
        </td>
      </tr>
      {isExpanded &&
        node.children.map((child) => (
          <TreeRow
            key={child.id}
            node={child}
            depth={depth + 1}
            selectedIds={selectedIds}
            onToggleSelect={onToggleSelect}
            onAction={onAction}
            onToggleExpand={onToggleExpand}
            expandedIds={expandedIds}
          />
        ))}
    </>
  )
}

function TreeActionMenu({
  node,
  onAction,
}: {
  node: DriveTreeNode
  onAction: (action: TreeAction, node: DriveTreeNode) => void
}) {
  const [open, setOpen] = useState(false)

  const handleClick = (action: TreeAction) => {
    onAction(action, node)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-sm hover:bg-bg-tertiary text-text-tertiary"
        aria-label="Thao tác"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-30 mt-1 w-48 rounded-sm border border-border-hairline bg-bg-primary shadow-lg py-1">
            <ActionItem label="Cấp quyền" onClick={() => handleClick('grant')} />
            <ActionItem label="Tạo từ template" onClick={() => handleClick('createFromTemplate')} />
            <ActionItem label="Copy" onClick={() => handleClick('copy')} />
            <ActionItem label="Di chuyển" onClick={() => handleClick('move')} />
            <div className="my-1 border-t border-border-hairline" />
            <ActionItem label="Xóa" danger onClick={() => handleClick('delete')} />
          </div>
        </>
      )}
    </div>
  )
}

function ActionItem({
  label,
  onClick,
  danger,
}: {
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-3 py-1.5 text-sm hover:bg-bg-secondary ${
        danger ? 'text-danger hover:text-danger' : 'text-text-primary'
      }`}
    >
      {label}
    </button>
  )
}

function collectIds(nodes: DriveTreeNode[]): string[] {
  const ids: string[] = []
  nodes.forEach((n) => {
    ids.push(n.id)
    ids.push(...collectIds(n.children))
  })
  return ids
}
