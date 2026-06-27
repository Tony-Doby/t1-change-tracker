import { useState } from 'react'
import { Search, Loader2 } from 'lucide-react'
import Card from '../../ui/layout/Card'
import TextInput from '../../ui/input/TextInput'
import EmptyState from '../../ui/display/EmptyState'
import Badge from '../../ui/display/Badge'
import type { AppsScriptLog } from '../../types'

type StatusFilter = 'all' | 'success' | 'failed'

interface LogsViewProps {
  logs?: AppsScriptLog[]
  isLoading: boolean
  onRefresh: () => void
}

export default function LogsView({ logs, isLoading, onRefresh }: LogsViewProps) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const filtered = (logs || []).filter((log) => {
    const matchesQuery =
      !query ||
      log.action.toLowerCase().includes(query.toLowerCase()) ||
      (log.error_message?.toLowerCase() || '').includes(query.toLowerCase())
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'success' && log.success) ||
      (statusFilter === 'failed' && !log.success)
    return matchesQuery && matchesStatus
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-[1.23rem] font-medium text-text-primary">Lịch sử thao tác</h2>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="text-sm text-accent hover:text-accent-hover disabled:opacity-50"
        >
          {isLoading ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <TextInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tác vụ hoặc lỗi..."
            leftIcon={<Search className="w-4 h-4" />}
            size="sm"
            className="sm:w-80"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="h-8 px-2 rounded-sm border border-border-hairline bg-bg-primary text-text-primary text-sm focus:outline-none focus:border-accent"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="success">Thành công</option>
            <option value="failed">Thất bại</option>
          </select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-text-tertiary">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải lịch sử...
          </div>
        ) : !logs || logs.length === 0 ? (
          <EmptyState context="no_data" title="Chưa có lịch sử" subtitle="Các thao tác sẽ được ghi lại ở đây." />
        ) : filtered.length === 0 ? (
          <EmptyState context="filter_empty" title="Không có log khớp" subtitle="Thử đổi từ khóa hoặc bộ lọc." />
        ) : (
          <div className="overflow-auto max-h-[32rem] border border-border-hairline rounded-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-bg-secondary sticky top-0">
                <tr>
                  <th className="px-3 py-2 font-medium text-text-tertiary border-b border-border-hairline">Thờii gian</th>
                  <th className="px-3 py-2 font-medium text-text-tertiary border-b border-border-hairline">Tác vụ</th>
                  <th className="px-3 py-2 font-medium text-text-tertiary border-b border-border-hairline">Trạng thái</th>
                  <th className="px-3 py-2 font-medium text-text-tertiary border-b border-border-hairline">Lỗi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr key={log.id} className="border-b border-border-hairline">
                    <td className="px-3 py-2 text-text-secondary whitespace-nowrap">
                      {log.created_at ? new Date(log.created_at).toLocaleString('vi-VN') : '-'}
                    </td>
                    <td className="px-3 py-2 text-text-primary">{log.action}</td>
                    <td className="px-3 py-2">
                      {log.success ? (
                        <Badge variant="success">Thành công</Badge>
                      ) : (
                        <Badge variant="danger">Thất bại</Badge>
                      )}
                    </td>
                    <td className="px-3 py-2 text-text-secondary max-w-xs truncate" title={log.error_message || ''}>
                      {log.error_message || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
