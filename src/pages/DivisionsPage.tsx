import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'
import { useAuth } from '../hooks/useAuth'
import { SkeletonTable } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'
import CountdownConfirmModal from '../components/CountdownConfirmModal'
import { Inbox, Shield, Search, X, RefreshCw } from 'lucide-react'

export default function DivisionsPage() {
  const { show } = useToast()
  const { user } = useAuth()
  const [divisions, setDivisions] = useState<any[]>([])
  const [agents, setAgents] = useState<Record<string, { full_name: string; staff_id: string }>>({})
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState({ name: '', head_agent_id: '', is_official: false })
  const [showRecomputeConfirm, setShowRecomputeConfirm] = useState(false)

  const role = user?.role ?? 'viewer'

  // Searchable dropdown state
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadDivisions()
  }, [])

  // Debounced search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }
    // Don't search if searchTerm is already a selected label (contains "(")
    if (form.head_agent_id && searchTerm.includes('(') && !searchTerm.endsWith(' ')) {
      // User is typing after a selected label — treat as new search
    }
    const timer = setTimeout(() => doSearch(searchTerm), 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm])

  // Click outside to close dropdown
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Load selected head agent label when editing
  useEffect(() => {
    if (editing?.head_agent_id) {
      const cached = agents[editing.head_agent_id]
      if (cached) {
        setSearchTerm(`${cached.full_name} (${cached.staff_id})`)
      } else {
        supabase
          .from('agents')
          .select('full_name, staff_id')
          .eq('id', editing.head_agent_id)
          .single()
          .then(({ data }) => {
            if (data) setSearchTerm(`${data.full_name} (${data.staff_id})`)
          })
      }
    } else {
      setSearchTerm('')
    }
  }, [editing, agents])

  async function loadDivisions() {
    setLoading(true)
    const { data, error } = await supabase.from('divisions').select('*').order('name', { ascending: true })
    if (error) {
      show('Lỗi tải dữ liệu: ' + error.message, 'error')
      setLoading(false)
      return
    }
    setDivisions(data ?? [])

    // Load head agents
    const headIds = [...new Set((data ?? []).map((d) => d.head_agent_id).filter(Boolean))]
    if (headIds.length > 0) {
      const { data: agentData } = await supabase.from('agents').select('id, full_name, staff_id').in('id', headIds)
      const map: Record<string, { full_name: string; staff_id: string }> = {}
      agentData?.forEach((a: any) => { map[a.id] = a })
      setAgents(map)
    }

    setLoading(false)
  }

  async function doSearch(term: string) {
    setSearchLoading(true)
    const { data, error } = await supabase
      .from('agents')
      .select('id, full_name, staff_id')
      .or(`full_name.ilike.%${term}%,staff_id.ilike.%${term}%`)
      .eq('status', 'active')
      .is('deleted_at', null)
      .limit(10)
    if (error) {
      setSearchLoading(false)
      return
    }
    setSearchResults(data ?? [])
    setShowDropdown(true)
    setSearchLoading(false)
  }

  function selectAgent(agent: any) {
    setForm((f) => ({ ...f, head_agent_id: agent.id }))
    setSearchTerm(`${agent.full_name} (${agent.staff_id})`)
    setShowDropdown(false)
  }

  function clearAgent() {
    setForm((f) => ({ ...f, head_agent_id: '' }))
    setSearchTerm('')
    setSearchResults([])
    setShowDropdown(false)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      show('Vui lòng nhập tên division', 'error')
      return
    }
    const payload: any = {
      name: form.name.trim(),
      head_agent_id: form.head_agent_id || null,
      is_official: form.is_official,
    }
    if (editing) {
      const { error } = await supabase.from('divisions').update(payload).eq('id', editing.id)
      if (error) { show('Lỗi cập nhật: ' + error.message, 'error'); return }
      show('Đã cập nhật division', 'success')
    } else {
      const { error } = await supabase.from('divisions').insert(payload)
      if (error) { show('Lỗi thêm mới: ' + error.message, 'error'); return }
      show('Đã thêm division mới', 'success')
    }
    setEditing(null)
    setForm({ name: '', head_agent_id: '', is_official: false })
    setSearchTerm('')
    setShowDropdown(false)
    loadDivisions()
  }

  const startEdit = (div: any) => {
    setEditing(div)
    setForm({
      name: div.name ?? '',
      head_agent_id: div.head_agent_id ?? '',
      is_official: div.is_official ?? false,
    })
    setSearchTerm('')
    setShowDropdown(false)
  }

  const resetForm = () => {
    setEditing(null)
    setForm({ name: '', head_agent_id: '', is_official: false })
    setSearchTerm('')
    setSearchResults([])
    setShowDropdown(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Quản lý Divisions</h1>
        <div className="flex items-center gap-2">
          {role === 'admin' && (
            <button
              onClick={() => setShowRecomputeConfirm(true)}
              className="flex items-center gap-1.5 px-3 h-9 border border-neutral-300 text-neutral-700 rounded-md text-sm hover:bg-neutral-50"
              title="Tính lại division cho toàn bộ agents"
            >
              <RefreshCw className="w-4 h-4" /> Tính lại Division
            </button>
          )}
          <button
            onClick={resetForm}
            className="px-3 h-9 bg-primary text-white rounded-md text-sm hover:bg-primary-hover"
          >
            + Thêm mới
          </button>
        </div>
      </div>

      {/* Table with scroll */}
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <div className="max-h-[400px] overflow-y-auto overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-neutral-50 border-b border-neutral-300">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">Tên</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">Trưởng nhóm</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">Chính thức</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">Mặc định</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonTable rows={5} cols={5} />
              ) : (
                divisions.map((d) => (
                  <tr key={d.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="px-4 py-3 text-neutral-900 font-medium">{d.name}</td>
                    <td className="px-4 py-3 text-neutral-700">
                      {d.head_agent_id && agents[d.head_agent_id]
                        ? `${agents[d.head_agent_id].full_name} - ${agents[d.head_agent_id].staff_id}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-neutral-700">{d.is_official ? '✅' : '—'}</td>
                    <td className="px-4 py-3 text-neutral-700">{d.is_default ? '✅' : '—'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => startEdit(d)} className="text-primary text-xs hover:underline">Sửa</button>
                    </td>
                  </tr>
                ))
              )}
              {!loading && divisions.length === 0 && (
                <tr><td colSpan={5}><EmptyState icon={<Inbox className="w-12 h-12" />} title="Chưa có division nào" /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-card p-5">
        <h3 className="text-sm font-semibold text-neutral-900 mb-3">{editing ? 'Sửa division' : 'Thêm division mới'}</h3>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Tên division</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="h-9 px-3 border border-neutral-300 rounded-md text-sm focus:outline-none focus:border-primary w-48"
            />
          </div>

          {/* Searchable Head Agent Dropdown */}
          <div className="relative" ref={searchRef}>
            <label className="block text-xs text-neutral-500 mb-1">Trưởng nhóm</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  if (form.head_agent_id) {
                    // User started typing again → clear previous selection
                    setForm((f) => ({ ...f, head_agent_id: '' }))
                  }
                }}
                onFocus={() => {
                  if (searchTerm.trim() && searchResults.length > 0) setShowDropdown(true)
                }}
                placeholder="Tìm theo tên hoặc mã NV..."
                className="h-9 pl-9 pr-8 border border-neutral-300 rounded-md text-sm focus:outline-none focus:border-primary w-64"
              />
              {searchTerm && (
                <button
                  onClick={clearAgent}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Dropdown results */}
            {showDropdown && (
              <div className="absolute z-20 mt-1 w-64 bg-white border border-neutral-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {searchLoading ? (
                  <div className="px-3 py-2 text-sm text-neutral-500">Đang tìm...</div>
                ) : searchResults.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-neutral-500">Không tìm thấy</div>
                ) : (
                  searchResults.map((agent) => (
                    <button
                      key={agent.id}
                      onClick={() => selectAgent(agent)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 flex items-center justify-between"
                    >
                      <span className="text-neutral-900 truncate">{agent.full_name}</span>
                      <span className="text-neutral-500 text-xs ml-2 shrink-0">{agent.staff_id}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_official}
              onChange={(e) => setForm((f) => ({ ...f, is_official: e.target.checked }))}
              className="rounded border-neutral-300"
            />
            <span className="text-sm text-neutral-700">Chính thức</span>
          </label>
          <button onClick={handleSave} className="px-4 h-9 bg-primary text-white rounded-md text-sm hover:bg-primary-hover">
            {editing ? 'Cập nhật' : 'Thêm'}
          </button>
          {editing && (
            <button onClick={resetForm} className="px-4 h-9 border border-neutral-300 rounded-md text-sm text-neutral-700 hover:bg-neutral-50">
              Hủy
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-neutral-500 bg-neutral-50 rounded-lg p-3">
        <Shield className="w-4 h-4" />
        <span>Chỉ admin có quyền quản lý divisions. Division "Khác" (is_default) là fallback cho agent không thuộc division nào.</span>
      </div>

      {showRecomputeConfirm && (
        <CountdownConfirmModal
          open={showRecomputeConfirm}
          title="Tính lại Division cho toàn bộ Agents"
          countdownSeconds={10}
          confirmText="Xác nhận tính lại"
          confirmVariant="primary"
          onCancel={() => setShowRecomputeConfirm(false)}
          onConfirm={async () => {
            setShowRecomputeConfirm(false)
            setLoading(true)
            const { data, error } = await supabase.rpc('recompute_all_divisions', {})
            setLoading(false)
            if (error) {
              show('Lỗi: ' + error.message, 'error')
            } else {
              const count = data ?? 0
              if (count > 0) {
                show(`Đã cập nhật division cho ${count} agents`, 'success')
              } else {
                show('Tất cả division đã đồng bộ, không có thay đổi', 'info')
              }
              loadDivisions()
            }
          }}
        >
          <p className="text-sm text-neutral-700">
            Thao tác này sẽ tính lại <strong>division</strong> cho <strong>toàn bộ agents</strong> theo business rule (T1 tree → head → division).
          </p>
          <p className="text-sm text-neutral-500 mt-2">
            Thường dùng sau khi import data, đổi head division, hoặc khi nghi ngờ data không đồng bộ.
          </p>
        </CountdownConfirmModal>
      )}
    </div>
  )
}
