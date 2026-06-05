import { useState } from 'react'
import { Search, RotateCcw, Trash2 } from 'lucide-react'
import { useToast } from '../components/Toast'
import { formatDate } from '../lib/date-utils'
import { useTrashQuery, useRestoreTrashMutation, usePermanentDeleteTrashMutation } from '../hooks/queries/useTrash'
import PageHeader from '../ui/layout/PageHeader'
import Table from '../ui/layout/Table'
import TableHeader from '../ui/layout/TableHeader'
import { TableHeaderCell } from '../ui/layout/TableHeader'
import TableRow from '../ui/layout/TableRow'
import TableCell from '../ui/layout/TableCell'
import TextInput from '../ui/input/TextInput'
import Badge from '../ui/display/Badge'
import EmptyState from '../ui/display/EmptyState'
import ConfirmationModal from '../ui/feedback/ConfirmationModal'
import { useColumnResize } from '../hooks/useColumnResize'

export default function TrashPage() {
  const { show } = useToast()
  const { data: items = [], isLoading } = useTrashQuery()
  const restoreMut = useRestoreTrashMutation()
  const deleteMut = usePermanentDeleteTrashMutation()

  const [filter, setFilter] = useState<'all' | 'agent' | 'request'>('all')
  const [search, setSearch] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const allItems = items.filter((item) => {
    if (filter !== 'all' && item.type !== filter) return false
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }).sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime())

  const hasFilters = filter !== 'all' || !!search

  const restore = async (item: typeof items[0]) => {
    try {
      await restoreMut.mutateAsync(item)
      show('Đã khôi phục', 'success')
    } catch (e: any) {
      show('Lỗi khôi phục: ' + e.message, 'error')
    }
  }

  const permanentDelete = async (item: typeof items[0]) => {
    try {
      await deleteMut.mutateAsync(item)
      setConfirmDelete(null)
      show('Đã xóa vĩnh viễn', 'warning')
    } catch (e: any) {
      show('Lỗi xóa: ' + e.message, 'error')
    }
  }

  const { widths, startResize } = useColumnResize([120, 300, 160, 200])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Thùng rác" />

      <div className="flex flex-wrap items-center gap-3">
        <TextInput
          leftIcon={<Search className="w-4 h-4" />}
          placeholder="Tìm kiếm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-[240px]"
          size="sm"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="h-9 px-3 border border-border-light rounded-sm text-sm text-text-secondary bg-bg-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
        >
          <option value="all">Tất cả</option>
          <option value="agent">Agent</option>
          <option value="request">Request</option>
        </select>
      </div>

      <Table>
        <TableHeader>
          <TableHeaderCell width={widths[0]} resizable onResizeStart={(e) => startResize(0, e)}>Loại</TableHeaderCell>
          <TableHeaderCell width={widths[1]} resizable onResizeStart={(e) => startResize(1, e)}>Tên / Mã</TableHeaderCell>
          <TableHeaderCell width={widths[2]} resizable onResizeStart={(e) => startResize(2, e)}>Ngày xóa</TableHeaderCell>
          <TableHeaderCell width={widths[3]} resizable onResizeStart={(e) => startResize(3, e)}>Hành động</TableHeaderCell>
        </TableHeader>
        <tbody>
          {allItems.map((item) => (
            <TableRow key={`${item.type}-${item.id}`}>
              <TableCell>
                <Badge variant={item.type === 'agent' ? 'primary' : 'warning'}>
                  {item.type === 'agent' ? 'Agent' : 'Request'}
                </Badge>
              </TableCell>
              <TableCell>{item.name}</TableCell>
              <TableCell className="text-text-secondary">{formatDate(item.deletedAt)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => restore(item)}
                    className="flex items-center gap-1 px-2 py-1 text-xs border border-accent text-accent rounded-sm hover:bg-accent-subtle transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" /> Khôi phục
                  </button>
                  <button
                    onClick={() => setConfirmDelete(`${item.type}-${item.id}`)}
                    className="flex items-center gap-1 px-2 py-1 text-xs border border-danger text-danger rounded-sm hover:bg-danger-subtle transition-colors"
                  >
                    <Trash2 className="w-3 h-3" aria-hidden="true" /> Xóa vĩnh viễn
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {allItems.length === 0 && (
            <tr>
              <td colSpan={4}>
                <EmptyState
                  context={hasFilters ? 'filter_empty' : 'soft_delete'}
                  action={
                    hasFilters ? (
                      <button
                        onClick={() => { setSearch(''); setFilter('all') }}
                        className="px-3 h-8 border border-border-light rounded-sm text-sm text-text-secondary hover:bg-bg-secondary transition-colors"
                      >
                        Xóa bộ lọc
                      </button>
                    ) : undefined
                  }
                />
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      <ConfirmationModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={async () => {
          const item = allItems.find((i) => `${i.type}-${i.id}` === confirmDelete)
          if (item) await permanentDelete(item)
        }}
        title="Xác nhận xóa vĩnh viễn"
        description="Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa?"
        confirmText="Xóa vĩnh viễn"
        confirmType="danger"
      />
    </div>
  )
}
