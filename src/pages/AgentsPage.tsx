import { useEffect, useState } from 'react'
import { Search, Filter, Download, Mail, Star, ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../components/Toast'
import ExportModal from '../components/ExportModal'
import ComposeTemplateModal from '../components/ComposeTemplateModal'
import { BOOKMARKS_KEY } from '../lib/constants'
import { formatDate } from '../lib/date-utils'

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
  const [agents, setAgents] = useState<any[]>([])
  const [t1Map, setT1Map] = useState<Record<string, { full_name: string; staff_id: string }>>({})
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all')
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showExport, setShowExport] = useState(false)
  const [showCompose, setShowCompose] = useState(false)

  const role = user?.role ?? 'viewer'

  const bookmarks: string[] = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]')

  // Debounce search 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    loadAgents()
  }, [debouncedSearch, page, quickFilter])

  async function loadAgents() {
    setLoading(true)

    // Count query (server-side)
    let countQuery = supabase
      .from('agents')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)

    if (quickFilter === 'no_t1') countQuery = countQuery.is('current_t1_id', null)
    if (quickFilter === 'bookmarked') countQuery = countQuery.in('id', bookmarks)

    if (debouncedSearch.trim()) {
      const q = `%${debouncedSearch.trim()}%`
      countQuery = countQuery.or(`full_name.ilike.${q},staff_id.ilike.${q},email.ilike.${q}`)
    }

    const { count } = await countQuery

    // Data query (server-side pagination + search)
    let query = supabase
      .from('agents')
      .select('*')
      .is('deleted_at', null)

    if (quickFilter === 'no_t1') query = query.is('current_t1_id', null)
    if (quickFilter === 'bookmarked') query = query.in('id', bookmarks)

    if (debouncedSearch.trim()) {
      const q = `%${debouncedSearch.trim()}%`
      query = query.or(`full_name.ilike.${q},staff_id.ilike.${q},email.ilike.${q}`)
    }

    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      show('Lỗi tải dữ liệu: ' + error.message, 'error')
      setAgents([])
      setT1Map({})
    } else {
      const list = data ?? []
      setAgents(list)

      // Load T1 info only for current page agents
      const t1Ids = [...new Set(list.map((a: any) => a.current_t1_id).filter(Boolean))]
      if (t1Ids.length > 0) {
        const { data: t1Data } = await supabase
          .from('agents')
          .select('id, full_name, staff_id')
          .in('id', t1Ids)
        const map: Record<string, { full_name: string; staff_id: string }> = {}
        t1Data?.forEach((a: any) => { map[a.id] = a })
        setT1Map(map)
      } else {
        setT1Map({})
      }
    }

    setTotalCount(count ?? 0)
    setLoading(false)
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

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
    if (quickFilter === 'bookmarked') loadAgents()
  }

  // Fetch all matching data for export (loop through pages to bypass max-rows)
  async function fetchExportData(): Promise<Record<string, unknown>[]> {
    const all: any[] = []
    const batchSize = 1000
    let from = 0

    while (true) {
      let query = supabase
        .from('agents')
        .select('*')
        .is('deleted_at', null)

      if (quickFilter === 'no_t1') query = query.is('current_t1_id', null)
      if (quickFilter === 'bookmarked') query = query.in('id', bookmarks)

      if (debouncedSearch.trim()) {
        const q = `%${debouncedSearch.trim()}%`
        query = query.or(`full_name.ilike.${q},staff_id.ilike.${q},email.ilike.${q}`)
      }

      const { data } = await query
        .order('created_at', { ascending: false })
        .range(from, from + batchSize - 1)

      if (!data || data.length === 0) break
      all.push(...data)
      if (data.length < batchSize) break
      from += batchSize
    }

    // Build T1 map for all exported rows
    const t1Ids = [...new Set(all.map((a: any) => a.current_t1_id).filter(Boolean))]
    const t1MapAll: Record<string, { full_name: string; staff_id: string }> = {}
    if (t1Ids.length > 0) {
      const { data: t1Data } = await supabase
        .from('agents')
        .select('id, full_name, staff_id')
        .in('id', t1Ids)
      t1Data?.forEach((a: any) => { t1MapAll[a.id] = a })
    }

    return all.map((a: any) => ({
      'Mã NV': a.staff_id,
      'Họ tên': a.full_name,
      'Cấp bậc': a.rank_name,
      'Ngày ký HĐ': formatDate(a.contract_signing_date),
      'T1 hiện tại': a.current_t1_id
        ? t1MapAll[a.current_t1_id]
          ? `${t1MapAll[a.current_t1_id].full_name} - ${t1MapAll[a.current_t1_id].staff_id}`
          : a.current_t1_id
        : '—',
      'Trạng thái': a.status,
    }))
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-neutral-900">Agents</h1>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Tìm theo mã, tên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 h-9 w-[280px] border border-neutral-300 rounded-md text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setShowFilterMenu((v) => !v)}
            className="flex items-center gap-1.5 px-3 h-9 border border-neutral-300 rounded-md text-sm text-neutral-700 hover:bg-neutral-50"
          >
            <Filter className="w-4 h-4" /> {filterPresets.find((f) => f.key === quickFilter)?.label ?? 'Bộ lọc'}
          </button>
          {showFilterMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowFilterMenu(false)} />
              <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-dropdown border border-neutral-300 z-20 py-1">
                {filterPresets.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => { setQuickFilter(f.key); setShowFilterMenu(false); setPage(1) }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 ${quickFilter === f.key ? 'text-primary font-medium bg-primary-light/30' : 'text-neutral-700'}`}
                  >
                    {f.emoji} {f.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        {selected.length > 0 && <span className="text-xs text-neutral-500">Đã chọn {selected.length} agent</span>}
        <div className="ml-auto flex items-center gap-2">
          {role !== 'viewer' && (
            <button
              onClick={() => setShowExport(true)}
              className="flex items-center gap-1.5 px-3 h-9 border border-primary text-primary rounded-md text-sm hover:bg-primary-light"
            >
              <Download className="w-4 h-4" /> Export
            </button>
          )}
          {role !== 'viewer' && (
            <button
              onClick={() => selected.length === 1 && setShowCompose(true)}
              disabled={selected.length !== 1}
              className="flex items-center gap-1.5 px-3 h-9 bg-primary text-white rounded-md text-sm disabled:opacity-50"
            >
              <Mail className="w-4 h-4" /> Soạn mẫu
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-300">
              <th className="px-4 py-3 text-left w-10">
                <input
                  type="checkbox"
                  className="rounded border-neutral-300"
                  onChange={(e) => setSelected(e.target.checked ? agents.map((a) => a.id) : [])}
                  checked={agents.length > 0 && agents.every((a) => selected.includes(a.id))}
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 w-10"></th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">Mã NV</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">Họ tên</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">Cấp bậc</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">Ngày ký HĐ</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">T1 hiện tại</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-neutral-500">Đang tải...</td></tr>
            ) : (
              agents.map((agent) => {
                const isBookmarked = bookmarks.includes(agent.id)
                return (
                  <tr key={agent.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        className="rounded border-neutral-300"
                        checked={selected.includes(agent.id)}
                        onChange={() => setSelected((prev) =>
                          prev.includes(agent.id) ? prev.filter((x) => x !== agent.id) : [...prev, agent.id]
                        )}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleBookmark(agent.id) }}
                        className={isBookmarked ? 'text-warning' : 'text-neutral-300 hover:text-warning'}
                      >
                        <Star className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/agents/${agent.id}`} className="text-primary hover:underline font-medium">
                        {agent.staff_id}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-neutral-900">{agent.full_name}</td>
                    <td className="px-4 py-3 text-neutral-700">{agent.rank_name ?? '—'}</td>
                    <td className="px-4 py-3 text-neutral-700">{formatDate(agent.contract_signing_date)}</td>
                    <td className="px-4 py-3 text-neutral-700">
                      {agent.current_t1_id
                        ? (t1Map[agent.current_t1_id]
                          ? `${t1Map[agent.current_t1_id].full_name} - ${t1Map[agent.current_t1_id].staff_id}`
                          : agent.current_t1_id.slice(0, 8))
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${agent.status === 'active' ? 'bg-success-light text-success' : 'bg-neutral-100 text-neutral-500'}`}>
                        {agent.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
            {!loading && agents.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-neutral-500">Không có dữ liệu</td></tr>
            )}
          </tbody>
        </table>
        {totalCount > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-100">
            <span className="text-xs text-neutral-500">
              Hiển thị {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, totalCount)} / {totalCount}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1 rounded-md hover:bg-neutral-100 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-7 h-7 rounded-md text-xs font-medium ${p === page ? 'bg-primary text-white' : 'text-neutral-700 hover:bg-neutral-100'}`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1 rounded-md hover:bg-neutral-100 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {showExport && (
        <ExportModal
          title="Xuất danh sách Agent"
          onClose={() => setShowExport(false)}
          data={agents.map((a) => ({
            'Mã NV': a.staff_id,
            'Họ tên': a.full_name,
            'Cấp bậc': a.rank_name,
            'Ngày ký HĐ': formatDate(a.contract_signing_date),
            'T1 hiện tại': a.current_t1_id
              ? (t1Map[a.current_t1_id]
                ? `${t1Map[a.current_t1_id].full_name} - ${t1Map[a.current_t1_id].staff_id}`
                : a.current_t1_id)
              : '—',
            'Trạng thái': a.status,
          }))}
          filename="agents"
          hasFilter={quickFilter !== 'all' || !!debouncedSearch}
          fetchData={fetchExportData}
        />
      )}
      {showCompose && selected.length === 1 && (
        <ComposeTemplateModal agentId={selected[0]} onClose={() => setShowCompose(false)} />
      )}
    </div>
  )
}
