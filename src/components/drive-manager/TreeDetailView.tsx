import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, RefreshCw, Search, X } from 'lucide-react'
import Card from '../../ui/layout/Card'
import TextInput from '../../ui/input/TextInput'
import BreadcrumbNav from './BreadcrumbNav'
import DriveTreeTable, { type TreeAction } from './DriveTreeTable'
import {
  useDriveTree,
  pruneTree,
  collectMatchedParentIds,
  type DriveTreeNode,
} from './drive-tree-utils'
import type { DriveTree, ScanFolderResult } from '../../types'
import type { PresetItem } from '../apps-script/SetPermissionsForm'

interface TreeDetailViewProps {
  tree: DriveTree
  onBack: () => void
  onRefresh: () => void
  onAction: (action: TreeAction, node: DriveTreeNode) => void
  onBulkGrant: (items: PresetItem[]) => void
  isLoading: boolean
}

type DriveTypeFilter = 'all' | 'my' | 'shared'

export default function TreeDetailView({
  tree,
  onBack,
  onRefresh,
  onAction,
  onBulkGrant,
  isLoading,
}: TreeDetailViewProps) {
  const [search, setSearch] = useState('')
  const [depthFilter, setDepthFilter] = useState<Set<number>>(new Set())
  const [driveTypeFilter, setDriveTypeFilter] = useState<DriveTypeFilter>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const currentTreeData = useMemo(() => {
    const data = Array.isArray(tree.tree_data) ? (tree.tree_data as ScanFolderResult[]) : []
    return data
  }, [tree.tree_data])

  const { tree: treeNodes, expandedIds, setExpandedIds, toggleExpand, expandAll, collapseAll } =
    useDriveTree(currentTreeData)

  const availableDepths = useMemo(
    () => Array.from(new Set(currentTreeData.map((r) => r.depth))).sort((a, b) => a - b),
    [currentTreeData]
  )

  const filteredFlatRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return currentTreeData.filter((r) => {
      const matchesSearch =
        !q || r.name.toLowerCase().includes(q) || r.path.toLowerCase().includes(q)
      const matchesDepth = depthFilter.size === 0 || depthFilter.has(r.depth)
      const matchesType =
        driveTypeFilter === 'all' ||
        (driveTypeFilter === 'shared' && r.isSharedDrive) ||
        (driveTypeFilter === 'my' && !r.isSharedDrive)
      return matchesSearch && matchesDepth && matchesType
    })
  }, [currentTreeData, search, depthFilter, driveTypeFilter])

  const matchedIds = useMemo(
    () => new Set(filteredFlatRows.map((r) => r.id)),
    [filteredFlatRows]
  )

  const visibleNodes = useMemo(() => {
    if (search.trim() === '' && depthFilter.size === 0 && driveTypeFilter === 'all') {
      return treeNodes
    }
    return pruneTree(treeNodes, matchedIds)
  }, [treeNodes, matchedIds, search, depthFilter, driveTypeFilter])

  // Auto-expand parents of matched nodes when searching/filtering.
  useEffect(() => {
    if (search.trim() === '' && depthFilter.size === 0 && driveTypeFilter === 'all') return
    const parentIds = collectMatchedParentIds(treeNodes, matchedIds)
    setExpandedIds((prev) => {
      const next = new Set(prev)
      parentIds.forEach((id) => next.add(id))
      return next
    })
  }, [search, depthFilter, driveTypeFilter, treeNodes, matchedIds, setExpandedIds])

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = (ids: string[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      const allSelected = ids.length > 0 && ids.every((id) => next.has(id))
      if (allSelected) {
        ids.forEach((id) => next.delete(id))
      } else {
        ids.forEach((id) => next.add(id))
      }
      return next
    })
  }

  const handleBulkGrant = () => {
    const items = currentTreeData
      .filter((r) => selectedIds.has(r.id))
      .map((r) => ({ id: r.id, isSharedDrive: r.isSharedDrive }))
    if (items.length > 0) onBulkGrant(items)
  }

  const toggleDepth = (d: number) => {
    setDepthFilter((prev) => {
      const next = new Set(prev)
      if (next.has(d)) next.delete(d)
      else next.add(d)
      return next
    })
  }

  const clearFilters = () => {
    setSearch('')
    setDepthFilter(new Set())
    setDriveTypeFilter('all')
  }

  const hasFilters = search.trim() !== '' || depthFilter.size > 0 || driveTypeFilter !== 'all'

  const chipBase =
    'inline-flex items-center h-7 px-3 rounded-pill text-xs font-medium border transition-colors'
  const chipOn = 'bg-accent-subtle text-accent border-accent/20'
  const chipOff = 'bg-bg-secondary text-text-secondary border-border-light hover:bg-bg-tertiary'

  return (
    <div className="space-y-4">
      <BreadcrumbNav
        items={[
          { label: 'Drive Manager' },
          { label: 'Cây Drive', onClick: onBack },
          { label: tree.name || tree.root_folder_id },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 h-8 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={expandAll}
            className="px-3 h-8 text-sm border border-border-hairline rounded-sm hover:bg-bg-secondary transition-colors"
          >
            Mở rộng tất cả
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="px-3 h-8 text-sm border border-border-hairline rounded-sm hover:bg-bg-secondary transition-colors"
          >
            Thu gọn tất cả
          </button>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 h-8 text-sm border border-border-hairline rounded-sm hover:bg-bg-secondary transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Làm mới
          </button>
        </div>
      </div>

      <Card>
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[1.23rem] font-medium text-text-primary">{tree.name || tree.root_folder_id}</h2>
            <span className="text-sm text-text-secondary">
              Hiển thị {filteredFlatRows.length}/{currentTreeData.length} folder
            </span>
          </div>

          <div className="flex flex-col lg:flex-row gap-3">
            <TextInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên hoặc đường dẫn..."
              leftIcon={<Search className="w-4 h-4" />}
              rightIcon={
                search ? (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="text-text-tertiary hover:text-text-secondary"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : undefined
              }
              size="sm"
              className="lg:w-80"
            />

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-text-tertiary">Loại:</span>
              {(['all', 'my', 'shared'] as DriveTypeFilter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setDriveTypeFilter(f)}
                  className={`${chipBase} ${driveTypeFilter === f ? chipOn : chipOff}`}
                >
                  {f === 'all' ? 'Tất cả' : f === 'my' ? 'My Drive' : 'Shared Drive'}
                </button>
              ))}
            </div>

            {availableDepths.length > 1 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-text-tertiary">Cấp:</span>
                {availableDepths.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDepth(d)}
                    className={`${chipBase} ${depthFilter.has(d) ? chipOn : chipOff}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-text-tertiary hover:text-text-secondary underline transition-colors"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        {visibleNodes.length === 0 ? (
          <div className="text-sm text-text-tertiary py-8 text-center">Không có folder khớp bộ lọc.</div>
        ) : (
          <DriveTreeTable
            nodes={visibleNodes}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onSelectAll={selectAll}
            onAction={onAction}
            onToggleExpand={toggleExpand}
            expandedIds={expandedIds}
          />
        )}

        {selectedIds.size > 0 && (
          <div className="mt-4 flex items-center gap-3 p-3 rounded-sm bg-accent-subtle border border-accent/20">
            <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-pill bg-accent text-white text-xs font-medium">
              {selectedIds.size}
            </span>
            <span className="text-sm text-text-secondary">đã chọn</span>
            <button
              type="button"
              onClick={handleBulkGrant}
              className="px-3 h-8 bg-accent text-white rounded-sm text-sm hover:bg-accent-hover transition-colors"
            >
              Cấp quyền
            </button>
          </div>
        )}
      </Card>
    </div>
  )
}
