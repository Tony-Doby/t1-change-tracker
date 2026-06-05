import { useState } from 'react'
import { Search, Filter, Plus, Download } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { formatDate } from '../lib/date-utils'
import { useDebounce } from '../hooks/useDebounce'
import { useRequestsQuery } from '../hooks/queries/useRequests'
import ExportModal from '../components/ExportModal'
import { SkeletonTable } from '../components/Skeleton'
import PageHeader from '../ui/layout/PageHeader'
import Table from '../ui/layout/Table'
import TableHeader from '../ui/layout/TableHeader'
import { TableHeaderCell } from '../ui/layout/TableHeader'
import TableRow from '../ui/layout/TableRow'
import TableCell from '../ui/layout/TableCell'
import TextInput from '../ui/input/TextInput'
import FilterChips from '../ui/input/FilterChips'
import Badge from '../ui/display/Badge'
import EmptyState from '../ui/display/EmptyState'
import { useColumnResize } from '../hooks/useColumnResize'
import type { RequestStatus } from '../types'

const allStatuses: RequestStatus[] = ['step1', 'step2', 'step3', 'completed', 'cancelled']

const statusLabels: Record<string, string> = {
  step1: 'B1', step2: 'B2', step3: 'B3',
  completed: 'Hoàn tất', cancelled: 'Đã hủy',
}

const statusBadgeVariant: Record<string, 'primary' | 'warning' | 'success' | 'danger' | 'neutral'> = {
  step1: 'primary',
  step2: 'primary',
  step3: 'warning',
  completed: 'success',
  cancelled: 'danger',
}

export default function RequestsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [statusFilter, setStatusFilter] = useState<RequestStatus[]>(() => {
    const statusParam = searchParams.get('status')
    if (statusParam) {
      return statusParam.split(',').filter((s): s is RequestStatus => allStatuses.includes(s as RequestStatus))
    }
    return []
  })
  const [showExport, setShowExport] = useState(false)

  const { data, isLoading } = useRequestsQuery({ statusFilter })

  const requests = data?.requests ?? []
  const t1Map = data?.t1Map ?? {}

  const filtered = requests.filter((r) => {
    if (!debouncedSearch.trim()) return true
    const q = debouncedSearch.toLowerCase()
    return r.id?.toLowerCase().includes(q) || (r.agent as any)?.full_name?.toLowerCase().includes(q)
  })

  const counts: Record<string, number> = {}
  allStatuses.forEach((s) => { counts[s] = requests.filter((r) => r.status === s).length })

  const toggleStatus = (s: RequestStatus) => {
    setStatusFilter((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    )
  }

  const handleSetStatusFilter = (next: RequestStatus[]) => {
    setStatusFilter(next)
    if (next.length > 0) {
      setSearchParams({ status: next.join(',') }, { replace: true })
    } else {
      setSearchParams({}, { replace: true })
    }
  }

  const { widths, startResize } = useColumnResize([120, 240, 320, 100, 140])

  const activeChips = [
    ...(debouncedSearch ? [{ id: 'search', label: `Tìm: "${debouncedSearch}"` }] : []),
    ...statusFilter.map((s) => ({ id: `status-${s}`, label: statusLabels[s] })),
  ]

  const removeChip = (id: string) => {
    if (id === 'search') {
      setSearch('')
    } else if (id.startsWith('status-')) {
      const s = id.replace('status-', '') as RequestStatus
      handleSetStatusFilter(statusFilter.filter((x) => x !== s))
    }
  }

  const clearAll = () => {
    setSearch('')
    handleSetStatusFilter([])
  }

  const hasActiveFilters = debouncedSearch || statusFilter.length > 0

  return (
    <div className="space-y-4">
      <PageHeader title="Đề xuất đổi T1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExport(true)}
            className="flex items-center gap-1.5 px-3 h-9 border border-accent text-accent rounded-sm text-sm hover:bg-accent-subtle transition-colors"
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <button className="flex items-center gap-1.5 px-3 h-9 bg-accent text-white rounded-sm text-sm hover:bg-accent-hover transition-colors">
            <Plus className="w-4 h-4" /> Tạo đề xuất
          </button>
        </div>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-3">
        <TextInput
          leftIcon={<Search className="w-4 h-4" />}
          placeholder="Tìm kiếm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-[240px]"
          size="sm"
        />
        <button
          onClick={() => handleSetStatusFilter([])}
          className={`flex items-center gap-1.5 px-3 h-9 border rounded-sm text-sm transition-colors ${
            statusFilter.length === 0
              ? 'border-accent text-accent bg-accent-subtle'
              : 'border-border-light text-text-secondary hover:bg-bg-secondary'
          }`}
        >
          <Filter className="w-4 h-4" /> Tất cả
        </button>
        <FilterChips
          chips={activeChips}
          onRemove={removeChip}
          onClearAll={hasActiveFilters ? clearAll : undefined}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        {allStatuses.map((s) => (
          <button
            key={s}
            onClick={() => toggleStatus(s)}
            className={`px-4 py-2 rounded-sm text-sm font-medium transition-colors ${
              statusFilter.includes(s)
                ? 'ring-2 ring-offset-1 ring-gray-6'
                : 'hover:opacity-90'
            }`}
          >
            <Badge variant={statusBadgeVariant[s]}>{statusLabels[s]}: {counts[s] ?? 0}</Badge>
          </button>
        ))}
      </div>

      <Table>
        <TableHeader>
          <TableHeaderCell width={widths[0]} resizable onResizeStart={(e) => startResize(0, e)}>Mã</TableHeaderCell>
          <TableHeaderCell width={widths[1]} resizable onResizeStart={(e) => startResize(1, e)}>Agent</TableHeaderCell>
          <TableHeaderCell width={widths[2]} resizable onResizeStart={(e) => startResize(2, e)}>T1 cũ → T1 mới</TableHeaderCell>
          <TableHeaderCell width={widths[3]} resizable onResizeStart={(e) => startResize(3, e)}>Bước</TableHeaderCell>
          <TableHeaderCell width={widths[4]} resizable onResizeStart={(e) => startResize(4, e)}>Ngày tạo</TableHeaderCell>
        </TableHeader>
        <tbody>
          {isLoading ? (
            <SkeletonTable rows={5} cols={5} />
          ) : (
            filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <Link to={`/requests/${r.id}`} className="text-accent hover:underline font-medium">
                    #{r.id.slice(0, 8)}
                  </Link>
                </TableCell>
                <TableCell>
                  {r.agent ? (
                    <Link to={`/agents/${r.agent_id}`} className="hover:text-accent hover:underline">
                      {r.agent.full_name} - {r.agent.staff_id}
                    </Link>
                  ) : '—'}
                </TableCell>
                <TableCell className="text-text-secondary">
                  {r.old_t1_id ? (
                    <Link to={`/agents/${r.old_t1_id}`} className="text-text-primary font-medium hover:text-text-primary hover:underline">
                      {t1Map[r.old_t1_id] ? `${t1Map[r.old_t1_id].full_name} - ${t1Map[r.old_t1_id].staff_id}` : r.old_t1_id.slice(0, 8)}
                    </Link>
                  ) : (
                    <span className="text-text-tertiary italic">Không có T1</span>
                  )}
                  <span className="mx-1 text-text-tertiary">→</span>
                  {r.proposed_new_t1_id ? (
                    <Link to={`/agents/${r.proposed_new_t1_id}`} className="text-accent font-medium hover:underline">
                      {t1Map[r.proposed_new_t1_id] ? `${t1Map[r.proposed_new_t1_id].full_name} - ${t1Map[r.proposed_new_t1_id].staff_id}` : r.proposed_new_t1_id.slice(0, 8)}
                    </Link>
                  ) : (
                    <span className="text-text-tertiary italic">Không có T1</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={statusBadgeVariant[r.status]}>{statusLabels[r.status]}</Badge>
                </TableCell>
                <TableCell className="text-text-secondary">{formatDate(r.created_at)}</TableCell>
              </TableRow>
            ))
          )}
          {!isLoading && filtered.length === 0 && (
            <tr>
              <td colSpan={5}>
                <EmptyState
                  context={hasActiveFilters ? 'filter_empty' : 'no_data'}
                  action={
                    hasActiveFilters ? (
                      <button
                        onClick={clearAll}
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

      {showExport && (
        <ExportModal
          title="Xuất danh sách Requests"
          onClose={() => setShowExport(false)}
          data={filtered.map((r) => ({
            'Mã': r.id.slice(0, 8),
            'Agent': r.agent ? `${r.agent.full_name} - ${r.agent.staff_id}` : '—',
            'T1 cũ': r.old_t1_id ? (t1Map[r.old_t1_id] ? `${t1Map[r.old_t1_id].full_name} - ${t1Map[r.old_t1_id].staff_id}` : r.old_t1_id) : '—',
            'T1 mới': r.proposed_new_t1_id ? (t1Map[r.proposed_new_t1_id] ? `${t1Map[r.proposed_new_t1_id].full_name} - ${t1Map[r.proposed_new_t1_id].staff_id}` : r.proposed_new_t1_id) : '—',
            'Bước': statusLabels[r.status],
            'Ngày tạo': formatDate(r.created_at),
          }))}
          filename="requests"
          hasFilter={statusFilter.length > 0 || !!search}
        />
      )}
    </div>
  )
}
