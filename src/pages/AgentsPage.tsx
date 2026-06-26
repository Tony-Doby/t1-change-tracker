import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Search, Filter, Download, Mail, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../components/Toast'
import { useAgentsQuery } from '../hooks/queries/useAgents'
import { useRanksMapQuery } from '../hooks/queries/useRanks'
import { useDivisionsMapQuery } from '../hooks/queries/useDivisions'
import ExportModal from '../components/ExportModal'
import ComposeTemplateModal from '../components/ComposeTemplateModal'
import DeactivateAgentModal from '../components/DeactivateAgentModal'
import RestoreAgentModal from '../components/RestoreAgentModal'
import Pagination from '../components/Pagination'
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
import { useTableSelection } from '../hooks/useTableSelection'
import { useColumnResize } from '../hooks/useColumnResize'
import { Power, PowerOff } from 'lucide-react'
import { BOOKMARKS_KEY } from '../lib/constants'
import { formatDate } from '../lib/date-utils'
import type { Agent } from '../types'

type QuickFilter = 'all' | 'no_t1' | 'bookmarked'

const PAGE_SIZE = 10

const filterPresets: { key: QuickFilter; label: string; emoji: string }[] = [
  { key: 'all', label: 'Tất cả', emoji: '🔍' },
  { key: 'no_t1', label: 'Chưa có T1', emoji: '⚪' },
  { key: 'bookmarked', label: 'Đang theo dõi', emoji: '⭐' },
]

export default function AgentsPage() {
  const { user } = useAuth()
  const { show } = useToast()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all')
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [page, setPage] = useState(1)
  const [showExport, setShowExport] = useState(false)
  const [showCompose, setShowCompose] = useState(false)
  const [composeAgentId, setComposeAgentId] = useState<string | null>(null)
  const [deactivateAgentId, setDeactivateAgentId] = useState<string | null>(null)
  const [restoreAgentId, setRestoreAgentId] = useState<string | null>(null)

  const role = user?.role ?? 'viewer'
  const bookmarks: string[] = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]')

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data, isLoading, isError, error } = useAgentsQuery({
    search: debouncedSearch,
    filter: quickFilter,
    page,
    bookmarks,
  })
  const { data: rankNamesMap = {} } = useRanksMapQuery()
  const { data: divisionMap = {} } = useDivisionsMapQuery()

  const agents = data?.agents ?? []
  const t1Map = data?.t1Map ?? {}
  const totalCount = data?.totalCount ?? 0

  if (isError && error) {
    show('Lỗi tải dữ liệu: ' + (error as Error).message, 'error')
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  const headerRef = useRef<HTMLDivElement | null>(null)
  const { selected, isSelected, toggle, selectAll, allSelected, someSelected, tableRef } =
    useTableSelection({ totalIds: agents.map((a) => a.id), excludeRefs: [headerRef] })

  const openCompose = useCallback((agentId: string) => {
    setComposeAgentId(agentId)
    setShowCompose(true)
  }, [])

  const closeCompose = useCallback(() => {
    setShowCompose(false)
    setComposeAgentId(null)
  }, [])

  const { widths, startResize } = useColumnResize([
    40, 40, 100, 200, 120, 120, 200, 140, 100, 40,
  ])

  const toggleBookmark = (agentId: string) => {
    const next = new Set(bookmarks)
    if (next.has(agentId)) {
      next.delete(agentId)
      show('Đã bỏ theo dõi', 'info')
    } else {
      next.add(agentId)
      show('Đã thêm vào danh sách theo dõi', 'success')
    }
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...next]))
    if (quickFilter === 'bookmarked') {
      queryClient.invalidateQueries({ queryKey: ['agents'] })
    }
  }

  const handleDeactivateClose = () => {
    setDeactivateAgentId(null)
    queryClient.invalidateQueries({ queryKey: ['agents'] })
  }

  const handleRestoreClose = () => {
    setRestoreAgentId(null)
    queryClient.invalidateQueries({ queryKey: ['agents'] })
  }

  async function fetchExportData(): Promise<Record<string, unknown>[]> {
    const all: Agent[] = []
    const batchSize = 1000
    let from = 0

    while (true) {
      let query = supabase.from('agents').select('*').is('deleted_at', null)
      if (quickFilter === 'no_t1') query = query.is('current_t1_id', null)
      if (quickFilter === 'bookmarked') query = query.in('id', bookmarks)
      if (debouncedSearch.trim()) {
        const q = `%${debouncedSearch.trim()}%`
        query = query.or(`full_name.ilike.${q},staff_id.ilike.${q},email.ilike.${q}`)
      }
      const { data } = await query.order('created_at', { ascending: false }).range(from, from + batchSize - 1)
      if (!data || data.length === 0) break
      all.push(...data)
      if (data.length < batchSize) break
      from += batchSize
    }

    const t1Ids = [...new Set(all.map((a) => a.current_t1_id).filter(Boolean))] as string[]
    const t1MapAll: Record<string, { full_name: string; staff_id: string }> = {}
    if (t1Ids.length > 0) {
      const { data: t1Data } = await supabase.from('agents').select('id, full_name, staff_id').in('id', t1Ids)
      t1Data?.forEach((a: Pick<Agent, 'id' | 'full_name' | 'staff_id'>) => { t1MapAll[a.id] = a })
    }

    return all.map((a) => ({
      'Mã NV': a.staff_id,
      'Họ tên': a.full_name,
      'Cấp bậc': a.rank_name ?? (a.rank_id ? rankNamesMap[a.rank_id] : undefined) ?? '—',
      'Ngày ký HĐ': formatDate(a.contract_signing_date),
      'T1 hiện tại': a.current_t1_id
        ? t1MapAll[a.current_t1_id]
          ? `${t1MapAll[a.current_t1_id].full_name} - ${t1MapAll[a.current_t1_id].staff_id}`
          : a.current_t1_id
        : '—',
      'Division': divisionMap[a.division_id ?? ''] ?? '—',
      'Trạng thái': a.status,
    }))
  }

  const activeFilterChips = [
    ...(debouncedSearch ? [{ id: 'search', label: `Tìm: "${debouncedSearch}"` }] : []),
    ...(quickFilter !== 'all' ? [{ id: 'filter', label: filterPresets.find((f) => f.key === quickFilter)?.label ?? '' }] : []),
  ]

  const removeChip = (id: string) => {
    if (id === 'search') setSearch('')
    if (id === 'filter') setQuickFilter('all')
    setPage(1)
  }

  const clearAllFilters = () => {
    setSearch('')
    setQuickFilter('all')
    setPage(1)
  }

  const hasActiveFilters = debouncedSearch || quickFilter !== 'all'

  return (
    <div className="space-y-4">
      <PageHeader title="Agents">
        <div ref={headerRef} className="flex items-center gap-2">
          {role !== 'viewer' && (
            <button
              onClick={() => setShowExport(true)}
              className="flex items-center gap-1.5 px-3 h-9 border border-accent text-accent rounded-sm text-sm hover:bg-accent-subtle transition-colors"
            >
              <Download className="w-4 h-4" /> Export
            </button>
          )}
          {role !== 'viewer' && (
            <button
              onClick={() => selected.length === 1 && openCompose(selected[0])}
              disabled={selected.length !== 1}
              className="flex items-center gap-1.5 px-3 h-9 bg-accent text-white rounded-sm text-sm hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              <Mail className="w-4 h-4" /> Soạn mẫu
            </button>
          )}
        </div>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-3">
        <TextInput
          leftIcon={<Search className="w-4 h-4" />}
          placeholder="Tìm theo mã, tên..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-[280px]"
          size="sm"
        />
        <div className="relative">
          <button
            onClick={() => setShowFilterMenu((v) => !v)}
            className="flex items-center gap-1.5 px-3 h-9 border border-border-light rounded-sm text-sm text-text-secondary hover:bg-bg-secondary transition-colors"
          >
            <Filter className="w-4 h-4" /> {filterPresets.find((f) => f.key === quickFilter)?.label ?? 'Bộ lọc'}
          </button>
          {showFilterMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowFilterMenu(false)} />
              <div className="absolute left-0 mt-2 w-56 bg-bg-primary rounded-sm shadow-dropdown border border-border-light z-20 py-1">
                {filterPresets.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => { setQuickFilter(f.key); setShowFilterMenu(false); setPage(1) }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-bg-secondary transition-colors ${quickFilter === f.key ? 'text-accent font-medium bg-accent-subtle' : 'text-text-secondary'}`}
                  >
                    {f.emoji} {f.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <FilterChips
          chips={activeFilterChips}
          onRemove={removeChip}
          onClearAll={hasActiveFilters ? clearAllFilters : undefined}
        />
      </div>

      <Table>
        <TableHeader>
          <TableHeaderCell width={widths[0]}>
            <input
              type="checkbox"
              className="rounded border-border-light"
              onChange={(e) => selectAll(e.target.checked)}
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = someSelected
              }}
            />
          </TableHeaderCell>
          <TableHeaderCell width={widths[1]} />
          <TableHeaderCell width={widths[2]} resizable onResizeStart={(e) => startResize(2, e)}>Mã NV</TableHeaderCell>
          <TableHeaderCell width={widths[3]} resizable onResizeStart={(e) => startResize(3, e)}>Họ tên</TableHeaderCell>
          <TableHeaderCell width={widths[4]} resizable onResizeStart={(e) => startResize(4, e)}>Cấp bậc</TableHeaderCell>
          <TableHeaderCell width={widths[5]} resizable onResizeStart={(e) => startResize(5, e)}>Ngày ký HĐ</TableHeaderCell>
          <TableHeaderCell width={widths[6]} resizable onResizeStart={(e) => startResize(6, e)}>T1 hiện tại</TableHeaderCell>
          <TableHeaderCell width={widths[7]} resizable onResizeStart={(e) => startResize(7, e)}>Division</TableHeaderCell>
          <TableHeaderCell width={widths[8]} resizable onResizeStart={(e) => startResize(8, e)}>Trạng thái</TableHeaderCell>
          {role === 'admin' && <TableHeaderCell width={widths[9]} />}
        </TableHeader>
        <tbody ref={tableRef as unknown as React.RefObject<HTMLTableSectionElement>}>
          {isLoading ? (
            <SkeletonTable rows={5} cols={role === 'admin' ? 10 : 9} />
          ) : (
            agents.map((agent) => {
              const isBookmarked = bookmarks.includes(agent.id)
              const t1Id = agent.current_t1_id
              return (
                <TableRow key={agent.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      className="rounded border-border-light"
                      checked={isSelected(agent.id)}
                      onChange={() => {}}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggle(agent.id, (e as unknown as MouseEvent).shiftKey)
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleBookmark(agent.id) }}
                      className={isBookmarked ? 'text-warning' : 'text-gray-6 hover:text-warning'}
                    >
                      <Star className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} aria-hidden="true" />
                    </button>
                  </TableCell>
                  <TableCell>
                    <Link to={`/agents/${agent.id}`} className="text-accent hover:underline font-medium">
                      {agent.staff_id}
                    </Link>
                  </TableCell>
                  <TableCell>{agent.full_name}</TableCell>
                  <TableCell className="text-text-secondary">{agent.rank_name ?? rankNamesMap[agent.rank_id ?? ''] ?? '—'}</TableCell>
                  <TableCell className="text-text-secondary">{formatDate(agent.contract_signing_date)}</TableCell>
                  <TableCell className="text-text-secondary">
                    {t1Id
                      ? (t1Map[t1Id]
                        ? `${t1Map[t1Id].full_name} - ${t1Map[t1Id].staff_id}`
                        : t1Id.slice(0, 8))
                      : '—'}
                  </TableCell>
                  <TableCell className="text-text-secondary">{divisionMap[agent.division_id ?? ''] ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={agent.status === 'active' ? 'success' : 'neutral'}>
                      {agent.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  {role === 'admin' && (
                    <TableCell>
                      {agent.status === 'active' ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeactivateAgentId(agent.id) }}
                          className="text-danger hover:text-danger-hover"
                          title="Chấm dứt hoạt động"
                        >
                          <PowerOff className="w-4 h-4" aria-hidden="true" />
                        </button>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); setRestoreAgentId(agent.id) }}
                          className="text-success hover:text-success-hover"
                          title="Kích hoạt lại"
                        >
                          <Power className="w-4 h-4" aria-hidden="true" />
                        </button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              )
            })
          )}
          {!isLoading && agents.length === 0 && (
            <tr>
              <td colSpan={role === 'admin' ? 10 : 9}>
                <EmptyState
                  context={hasActiveFilters ? 'filter_empty' : 'no_data'}
                  action={
                    hasActiveFilters ? (
                      <button
                        onClick={clearAllFilters}
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

      {totalCount > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onChange={setPage}
          pageSize={PAGE_SIZE}
          totalCount={totalCount}
        />
      )}

      {showExport && (
        <ExportModal
          title="Xuất danh sách Agent"
          onClose={() => setShowExport(false)}
          data={agents.map((a) => {
            const t1Id = a.current_t1_id
            return {
              'Mã NV': a.staff_id,
              'Họ tên': a.full_name,
              'Cấp bậc': a.rank_name,
              'Ngày ký HĐ': formatDate(a.contract_signing_date),
              'T1 hiện tại': t1Id
                ? (t1Map[t1Id]
                  ? `${t1Map[t1Id].full_name} - ${t1Map[t1Id].staff_id}`
                  : t1Id)
                : '—',
              'Division': divisionMap[a.division_id ?? ''] ?? '—',
              'Trạng thái': a.status,
            }
          })}
          filename="agents"
          hasFilter={quickFilter !== 'all' || !!debouncedSearch}
          fetchData={fetchExportData}
        />
      )}
      {showCompose && composeAgentId && (
        <ComposeTemplateModal agentId={composeAgentId} onClose={closeCompose} />
      )}
      {deactivateAgentId && (
        <DeactivateAgentModal agentId={deactivateAgentId} onClose={handleDeactivateClose} />
      )}
      {restoreAgentId && (
        <RestoreAgentModal agentId={restoreAgentId} onClose={handleRestoreClose} />
      )}
    </div>
  )
}
