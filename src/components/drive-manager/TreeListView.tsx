import { HardDrive, RefreshCw, Search, Trash2, Edit3, FolderOpen } from 'lucide-react'
import Card from '../../ui/layout/Card'
import EmptyState from '../../ui/display/EmptyState'
import Badge from '../../ui/display/Badge'
import type { DriveTree } from '../../types'

interface TreeListViewProps {
  trees: DriveTree[]
  isLoading: boolean
  onSelect: (id: string) => void
  onRefresh: (tree: DriveTree) => void
  onQuickScan: (tree: DriveTree) => void
  onRename: (tree: DriveTree) => void
  onDelete: (id: string) => void
  onCreate: () => void
}

export default function TreeListView({
  trees,
  isLoading,
  onSelect,
  onRefresh,
  onQuickScan,
  onRename,
  onDelete,
  onCreate,
}: TreeListViewProps) {
  if (isLoading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12 text-text-tertiary">Đang tải danh sách cây Drive...</div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[1.23rem] font-medium text-text-primary">Danh sách cây Drive</h2>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-1.5 px-4 h-9 bg-accent text-white rounded-sm text-sm hover:bg-accent-hover transition-colors"
        >
          <HardDrive className="w-4 h-4" /> Thêm cây mới
        </button>
      </div>

      {trees.length === 0 ? (
        <Card>
          <EmptyState
            context="no_data"
            title="Chưa có cây Drive"
            subtitle="Thêm cây mới hoặc quét folder để bắt đầu."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {trees.map((tree) => (
            <Card key={tree.id} className="group relative hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-medium text-text-primary truncate" title={tree.name || tree.root_folder_id}>
                    {tree.name || tree.root_folder_id}
                  </h3>
                  <p className="text-xs text-text-tertiary truncate mt-0.5" title={tree.root_url}>{tree.root_url}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    {tree.is_shared_drive ? (
                      <Badge variant="primary">Shared Drive</Badge>
                    ) : (
                      <Badge variant="neutral">My Drive</Badge>
                    )}
                    <span className="text-xs text-text-tertiary">Depth: {tree.depth}</span>
                    <span className="text-xs text-text-tertiary">{Array.isArray(tree.tree_data) ? tree.tree_data.length : 0} folder</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => onQuickScan(tree)}
                    className="p-1.5 rounded-sm hover:bg-bg-tertiary text-text-tertiary"
                    title="Quét lại"
                  >
                    <Search className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRefresh(tree)}
                    className="p-1.5 rounded-sm hover:bg-bg-tertiary text-text-tertiary"
                    title="Làm mới cây"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRename(tree)}
                    className="p-1.5 rounded-sm hover:bg-bg-tertiary text-text-tertiary"
                    title="Đổi tên"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(tree.id)}
                    className="p-1.5 rounded-sm hover:bg-bg-tertiary text-danger"
                    title="Xóa"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelect(tree.id)}
                className="mt-4 w-full inline-flex items-center justify-center gap-1.5 px-3 h-8 border border-border-hairline rounded-sm text-sm text-text-secondary hover:bg-bg-secondary transition-colors"
              >
                <FolderOpen className="w-3.5 h-3.5" /> Mở cây
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
