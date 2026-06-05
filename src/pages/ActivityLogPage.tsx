import { useState, useMemo } from 'react'
import { Filter, Search, Inbox } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatDate, formatTime } from '../lib/date-utils'
import { useDebounce } from '../hooks/useDebounce'
import { useActivityLogsQuery } from '../hooks/queries/useActivityLogs'
import PageHeader from '../ui/layout/PageHeader'
import Card from '../ui/layout/Card'
import TextInput from '../ui/input/TextInput'
import Badge from '../ui/display/Badge'
import EmptyState from '../ui/display/EmptyState'

const actionTypeLabels: Record<string, { label: string; variant: 'primary' | 'success' | 'warning' | 'danger' | 'neutral'; dot: string }> = {
  t1_changed: { label: 'Đổi T1', variant: 'primary', dot: 'bg-accent' },
  template_generated: { label: 'Soạn mẫu', variant: 'warning', dot: 'bg-warning' },
  m1_chose_new_t1: { label: 'M1 chọn T1 mới', variant: 'success', dot: 'bg-success' },
  m1_stayed_with_t2: { label: 'M1 ở lại T2', variant: 'neutral', dot: 'bg-text-tertiary' },
  request_created: { label: 'Tạo đề xuất', variant: 'primary', dot: 'bg-accent-subtle' },
  request_completed: { label: 'Hoàn tất', variant: 'success', dot: 'bg-success' },
  request_step_changed: { label: 'Chuyển bước', variant: 'neutral', dot: 'bg-text-secondary' },
}

export default function ActivityLogPage() {
  const { data: logs = [], isLoading } = useActivityLogsQuery()
  const [filterType, setFilterType] = useState('all')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [showFilter, setShowFilter] = useState(false)

  const allTypes = useMemo(() => {
    const types = new Set(logs.map((l) => l.action_type))
    return ['all', ...Array.from(types)]
  }, [logs])

  const filtered = useMemo(() => {
    let list = [...logs]
    if (filterType !== 'all') {
      list = list.filter((l) => l.action_type === filterType)
    }
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase()
      list = list.filter((l) =>
        (l.description?.toLowerCase() ?? '').includes(q) ||
        (l.agent_name?.toLowerCase() ?? '').includes(q)
      )
    }
    return list
  }, [filterType, debouncedSearch, logs])

  const grouped = useMemo(() => {
    const g: Record<string, typeof filtered> = {}
    filtered.forEach((item) => {
      const date = formatDate(item.created_at)
      if (!g[date]) g[date] = []
      g[date].push(item)
    })
    return g
  }, [filtered])

  const hasFilter = filterType !== 'all' || debouncedSearch.trim().length > 0

  if (isLoading) {
    return (
      <div className="max-w-5xl space-y-6">
        <PageHeader title="Lịch sử hoạt động" />
        <Card className="h-64 animate-pulse"><div /></Card>
      </div>
    )
  }

  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader title="Lịch sử hoạt động" />

      <div className="flex flex-wrap items-center gap-3">
        <TextInput
          type="text"
          placeholder="Tìm agent..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
          className="w-[240px]"
        />
        <div className="relative">
          <button
            onClick={() => setShowFilter((v) => !v)}
            className="flex items-center gap-1.5 px-3 h-10 border border-border-light rounded-sm text-sm text-text-secondary hover:bg-bg-secondary transition-colors"
          >
            <Filter className="w-4 h-4" aria-hidden="true" /> Loại hành động
          </button>
          {showFilter && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowFilter(false)} />
              <div className="absolute left-0 mt-2 w-48 bg-bg-primary rounded-sm shadow-dropdown border border-border-light z-20 py-1">
                {allTypes.map((t) => (
                  <button
                    key={t}
                    onClick={() => { setFilterType(t); setShowFilter(false) }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-bg-secondary transition-colors ${
                      filterType === t ? 'text-accent font-medium bg-accent-subtle' : 'text-text-secondary'
                    }`}
                  >
                    {actionTypeLabels[t]?.label ?? t}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <Card padding="none">
        <div className="divide-y divide-border-hairline">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date} className="p-4">
              <h2 className="text-xs font-medium uppercase tracking-wider text-text-tertiary mb-3">{date}</h2>
              <div className="space-y-3">
                {items.map((item) => {
                  const meta = actionTypeLabels[item.action_type] ?? { label: item.action_type, variant: 'neutral' as const, dot: 'bg-text-tertiary' }
                  const time = formatTime(item.created_at)
                  return (
                    <div key={item.id} className="flex items-start gap-3">
                      <div className="w-16 text-xs text-text-tertiary shrink-0 pt-1">{time}</div>
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${meta.dot}`} aria-hidden="true" />
                      <div className="flex-1 min-w-0">
                        <Badge variant={meta.variant} className="mr-2">{meta.label}</Badge>
                        <span className="text-sm text-text-primary">{item.description}</span>
                        {(item.old_t1 || item.new_t1) && (
                          <p className="text-xs text-text-tertiary mt-1">
                            {item.old_t1 && `T1 cũ: ${item.old_t1.full_name} - ${item.old_t1.staff_id}`}
                            {item.old_t1 && item.new_t1 && ' → '}
                            {item.new_t1 && `T1 mới: ${item.new_t1.full_name} - ${item.new_t1.staff_id}`}
                          </p>
                        )}
                        {item.request_id && (
                          <Link to={`/requests/${item.request_id}`} className="text-xs text-accent hover:underline mt-0.5 inline-block">
                            #{item.request_id.slice(0, 8)}
                          </Link>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
          {Object.keys(grouped).length === 0 && (
            <EmptyState
              context={hasFilter ? 'filter_empty' : 'no_data'}
              icon={<Inbox className="w-12 h-12" />}
              title={hasFilter ? 'Không tìm thấy kết quả' : 'Không có hoạt động nào'}
              subtitle={hasFilter ? 'Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm.' : 'Dữ liệu sẽ xuất hiện khi có hoạt động.'}
            />
          )}
        </div>
      </Card>
    </div>
  )
}
