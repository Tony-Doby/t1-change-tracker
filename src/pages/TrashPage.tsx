import { useState } from 'react'
import { Search, RotateCcw, Trash2, AlertTriangle, Inbox } from 'lucide-react'
import { useToast } from '../components/Toast'
import { formatDate } from '../lib/date-utils'
import { useTrashQuery, useRestoreTrashMutation, usePermanentDeleteTrashMutation } from '../hooks/queries/useTrash'
import EmptyState from '../components/EmptyState'

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

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-neutral-900">Thùng rác</h1>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input type="text" placeholder="Tìm kiếm..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 h-9 w-[240px] border border-neutral-300 rounded-md text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value as any)}
          className="h-9 px-3 border border-neutral-300 rounded-md text-sm text-neutral-700 bg-white">
          <option value="all">Tất cả</option>
          <option value="agent">Agent</option>
          <option value="request">Request</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-300">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">Loại</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">Tên / Mã</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">Ngày xóa</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {allItems.map((item) => (
              <tr key={`${item.type}-${item.id}`} className="border-b border-neutral-100 hover:bg-neutral-50 group">
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${item.type === 'agent' ? 'bg-primary-light text-primary' : 'bg-warning-light text-warning'}`}>
                    {item.type === 'agent' ? 'Agent' : 'Request'}
                  </span>
                </td>
                <td className="px-4 py-3 text-neutral-900">{item.name}</td>
                <td className="px-4 py-3 text-neutral-500">{formatDate(item.deletedAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => restore(item)} className="flex items-center gap-1 px-2 py-1 text-xs border border-primary text-primary rounded hover:bg-primary-light">
                      <RotateCcw className="w-3 h-3" /> Khôi phục
                    </button>
                    <button onClick={() => setConfirmDelete(`${item.type}-${item.id}`)}
                      className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 text-xs border border-danger text-danger rounded hover:bg-danger-light transition-opacity">
                      <Trash2 className="w-3 h-3" /> Xóa vĩnh viễn
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {allItems.length === 0 && (
              <tr><td colSpan={4}><EmptyState icon={<Inbox className="w-12 h-12" />} title="Thùng rác trống" /></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-modal w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-2 text-danger">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Xác nhận xóa vĩnh viễn</h3>
            </div>
            <p className="text-sm text-neutral-600">Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDelete(null)} className="px-4 h-9 border border-neutral-300 rounded-md text-sm text-neutral-700 hover:bg-neutral-50">Hủy</button>
              <button onClick={() => {
                const item = allItems.find((i) => `${i.type}-${i.id}` === confirmDelete)
                if (item) permanentDelete(item)
              }} className="px-4 h-9 bg-danger text-white rounded-md text-sm hover:bg-danger/90">Xóa vĩnh viễn</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
