import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'
import { useAuth } from '../hooks/useAuth'
import { SkeletonTable } from '../components/Skeleton'
import EmptyState from '../ui/display/EmptyState'
import CountdownConfirmModal from '../components/CountdownConfirmModal'
import { useDivisionsListQuery, useSaveDivisionMutation, useDeleteDivisionMutation, useRecomputeDivisionsMutation } from '../hooks/queries/useDivisions'
import { Shield, Search, X, RefreshCw } from 'lucide-react'
import PageHeader from '../ui/layout/PageHeader'
import Table from '../ui/layout/Table'
import TableHeader from '../ui/layout/TableHeader'
import { TableHeaderCell } from '../ui/layout/TableHeader'
import TableRow from '../ui/layout/TableRow'
import TableCell from '../ui/layout/TableCell'
import Modal from '../ui/layout/Modal'
import TextInput from '../ui/input/TextInput'
import Badge from '../ui/display/Badge'
import { useColumnResize } from '../hooks/useColumnResize'
import { divisionSchema, type DivisionFormData } from '../lib/form-schemas'

export default function DivisionsPage() {
  const { show } = useToast()
  const { user } = useAuth()
  const { data: divisions = [], isLoading } = useDivisionsListQuery()
  const saveMut = useSaveDivisionMutation()
  const deleteMut = useDeleteDivisionMutation()
  const recomputeMut = useRecomputeDivisionsMutation()

  const [agents, setAgents] = useState<Record<string, { full_name: string; staff_id: string }>>({})
  const [editing, setEditing] = useState<any | null>(null)
  const [showRecomputeConfirm, setShowRecomputeConfirm] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [deleting, setDeleting] = useState<any | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const role = user?.role ?? 'viewer'

  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const { widths, startResize } = useColumnResize([200, 220, 100, 100, 100])

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DivisionFormData>({
    resolver: zodResolver(divisionSchema),
    defaultValues: { name: '', head_agent_id: '', is_official: false },
  })

  const headAgentId = watch('head_agent_id')

  useEffect(() => {
    const headIds = [...new Set(divisions.map((d) => d.head_agent_id).filter(Boolean))]
    if (headIds.length === 0) { setAgents({}); return }
    supabase.from('agents').select('id, full_name, staff_id').in('id', headIds).then(({ data }) => {
      const map: Record<string, { full_name: string; staff_id: string }> = {}
      data?.forEach((a: any) => { map[a.id] = a })
      setAgents(map)
    })
  }, [divisions])

  useEffect(() => {
    if (!searchTerm.trim()) { setSearchResults([]); setShowDropdown(false); return }
    const timer = setTimeout(() => doSearch(searchTerm), 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowDropdown(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (showModal) {
      if (editing) {
        reset({
          name: editing.name ?? '',
          head_agent_id: editing.head_agent_id ?? '',
          is_official: editing.is_official ?? false,
        })
        const cached = agents[editing.head_agent_id]
        if (cached) {
          setSearchTerm(`${cached.full_name} (${cached.staff_id})`)
        } else if (editing.head_agent_id) {
          supabase.from('agents').select('full_name, staff_id').eq('id', editing.head_agent_id).single().then(({ data }) => {
            if (data) setSearchTerm(`${data.full_name} (${data.staff_id})`)
          })
        } else {
          setSearchTerm('')
        }
      } else {
        reset({ name: '', head_agent_id: '', is_official: false })
        setSearchTerm('')
      }
      setSearchResults([])
      setShowDropdown(false)
    }
  }, [showModal, editing, reset, agents])

  async function doSearch(term: string) {
    setSearchLoading(true)
    const { data, error } = await supabase
      .from('agents')
      .select('id, full_name, staff_id')
      .or(`full_name.ilike.%${term}%,staff_id.ilike.%${term}%`)
      .eq('status', 'active')
      .is('deleted_at', null)
      .limit(10)
    if (error) { setSearchLoading(false); return }
    setSearchResults(data ?? [])
    setShowDropdown(true)
    setSearchLoading(false)
  }

  function selectAgent(agent: any) {
    setValue('head_agent_id', agent.id, { shouldValidate: true })
    setSearchTerm(`${agent.full_name} (${agent.staff_id})`)
    setShowDropdown(false)
  }

  function clearAgent() {
    setValue('head_agent_id', '', { shouldValidate: true })
    setSearchTerm('')
    setSearchResults([])
    setShowDropdown(false)
  }

  const onSubmit = async (data: DivisionFormData) => {
    const payload = {
      name: data.name.trim(),
      head_agent_id: data.head_agent_id || null,
      is_official: !!data.is_official,
    }
    try {
      await saveMut.mutateAsync({ id: editing?.id, payload })
      show(editing ? 'Đã cập nhật division' : 'Đã thêm division mới', 'success')
      closeModal()
    } catch (e: any) {
      show(editing ? 'Lỗi cập nhật: ' + e.message : 'Lỗi thêm mới: ' + e.message, 'error')
    }
  }

  const startEdit = (div: any) => {
    setEditing(div)
    setShowModal(true)
  }

  const openAddModal = () => {
    setEditing(null)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditing(null)
    reset()
    setSearchTerm('')
    setSearchResults([])
    setShowDropdown(false)
  }

  const handleDelete = async () => {
    if (!deleting) return
    setDeleteBusy(true)
    const { count, error: countError } = await supabase
      .from('agents')
      .select('*', { count: 'exact', head: true })
      .eq('division_id', deleting.id)
      .is('deleted_at', null)
    if (countError) {
      show('Lỗi kiểm tra: ' + countError.message, 'error')
      setDeleteBusy(false)
      return
    }
    if ((count ?? 0) > 0) {
      show(`Không thể xóa: ${count} agent đang thuộc division này`, 'error')
      setDeleteBusy(false)
      setDeleting(null)
      return
    }
    try {
      await deleteMut.mutateAsync(deleting.id)
      show('Đã xóa division', 'success')
    } catch (e: any) {
      show('Lỗi xóa: ' + e.message, 'error')
    }
    setDeleteBusy(false)
    setDeleting(null)
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Quản lý Divisions">
        <div className="flex items-center gap-2">
          {role === 'admin' && (
            <button
              onClick={() => setShowRecomputeConfirm(true)}
              className="flex items-center gap-1.5 px-3 h-9 border border-border-light text-text-secondary rounded-sm text-sm hover:bg-bg-secondary transition-colors"
              title="Tính lại division cho toàn bộ agents"
            >
              <RefreshCw className="w-4 h-4" /> Tính lại Division
            </button>
          )}
          <button
            onClick={openAddModal}
            className="px-3 h-9 bg-accent text-white rounded-sm text-sm hover:bg-accent-hover transition-colors"
          >
            + Thêm mới
          </button>
        </div>
      </PageHeader>

      <Table>
        <TableHeader>
          <TableHeaderCell width={widths[0]} resizable onResizeStart={(e) => startResize(0, e)}>Tên</TableHeaderCell>
          <TableHeaderCell width={widths[1]} resizable onResizeStart={(e) => startResize(1, e)}>Trưởng nhóm</TableHeaderCell>
          <TableHeaderCell width={widths[2]} resizable onResizeStart={(e) => startResize(2, e)}>Chính thức</TableHeaderCell>
          <TableHeaderCell width={widths[3]} resizable onResizeStart={(e) => startResize(3, e)}>Mặc định</TableHeaderCell>
          <TableHeaderCell width={widths[4]} resizable onResizeStart={(e) => startResize(4, e)} />
        </TableHeader>
        <tbody>
          {isLoading ? (
            <SkeletonTable rows={5} cols={5} />
          ) : (
            divisions.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.name}</TableCell>
                <TableCell className="text-text-secondary">
                  {d.head_agent_id && agents[d.head_agent_id]
                    ? `${agents[d.head_agent_id].full_name} - ${agents[d.head_agent_id].staff_id}`
                    : '—'}
                </TableCell>
                <TableCell>{d.is_official ? <Badge variant="success">✓</Badge> : '—'}</TableCell>
                <TableCell>{d.is_default ? <Badge variant="primary">✓</Badge> : '—'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <button onClick={() => startEdit(d)} className="text-accent text-xs hover:underline">Sửa</button>
                    {!d.is_default && (
                      <button onClick={() => setDeleting(d)} className="text-danger text-xs hover:underline">Xóa</button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
          {!isLoading && divisions.length === 0 && (
            <tr>
              <td colSpan={5}>
                <EmptyState context="no_data" />
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      {deleting && (
        <Modal onClose={() => setDeleting(null)} title="Xác nhận xóa" size="sm">
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">Bạn có chắc muốn xóa division <strong className="text-text-primary">{deleting.name}</strong>?</p>
            <p className="text-xs text-danger">Nếu division đang có agent, hệ thống sẽ từ chối xóa để tránh mất dữ liệu.</p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={() => setDeleting(null)} className="px-4 h-9 border border-border-light rounded-sm text-sm text-text-secondary hover:bg-bg-secondary transition-colors">Hủy</button>
              <button onClick={handleDelete} disabled={deleteBusy} className="px-4 h-9 bg-danger text-white rounded-sm text-sm hover:bg-danger-hover disabled:opacity-60 transition-colors">
                {deleteBusy ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showModal && (
        <Modal onClose={closeModal} title={editing ? 'Sửa division' : 'Thêm division mới'} size="sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <TextInput
              label="Tên division"
              error={errors.name?.message}
              {...register('name')}
            />
            <div className="relative" ref={searchRef}>
              <label className="block text-sm font-medium text-text-secondary mb-1">Trưởng nhóm</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); if (headAgentId) setValue('head_agent_id', '', { shouldValidate: true }) }}
                  onFocus={() => { if (searchTerm.trim() && searchResults.length > 0) setShowDropdown(true) }}
                  placeholder="Tìm theo tên hoặc mã NV..."
                  className="w-full h-10 pl-9 pr-8 border border-border-light rounded-sm text-sm bg-bg-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
                {searchTerm && (
                  <button type="button" onClick={clearAgent} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary" aria-label="Xóa trưởng nhóm đã chọn">
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
              </div>
              {showDropdown && (
                <div className="absolute z-20 mt-1 w-full bg-bg-primary border border-border-light rounded-sm shadow-dropdown max-h-60 overflow-y-auto">
                  {searchLoading ? (
                    <div className="px-3 py-2 text-sm text-text-tertiary">Đang tìm...</div>
                  ) : searchResults.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-text-tertiary">Không tìm thấy</div>
                  ) : (
                    searchResults.map((agent) => (
                      <button type="button" key={agent.id} onClick={() => selectAgent(agent)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-bg-secondary flex items-center justify-between transition-colors">
                        <span className="text-text-primary truncate">{agent.full_name}</span>
                        <span className="text-text-tertiary text-xs ml-2 shrink-0">{agent.staff_id}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('is_official')}
                className="rounded border-border-light"
              />
              <span className="text-sm text-text-secondary">Chính thức</span>
            </label>
            <div className="flex items-center gap-2 pt-2">
              <button type="submit" disabled={isSubmitting} className="px-4 h-9 bg-accent text-white rounded-sm text-sm hover:bg-accent-hover transition-colors disabled:opacity-60">
                {isSubmitting ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Thêm'}
              </button>
              <button type="button" onClick={closeModal} className="px-4 h-9 border border-border-light rounded-sm text-sm text-text-secondary hover:bg-bg-secondary transition-colors">Hủy</button>
            </div>
          </form>
        </Modal>
      )}

      <div className="flex items-center gap-2 text-xs text-text-tertiary bg-bg-secondary rounded-sm p-3">
        <Shield className="w-4 h-4" aria-hidden="true" />
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
            try {
              const count = await recomputeMut.mutateAsync()
              if (count > 0) {
                show(`Đã cập nhật division cho ${count} agents`, 'success')
              } else {
                show('Tất cả division đã đồng bộ, không có thay đổi', 'info')
              }
            } catch (e: any) {
              show('Lỗi: ' + e.message, 'error')
            }
          }}
        >
          <p className="text-sm text-text-secondary">Thao tác này sẽ tính lại <strong>division</strong> cho <strong>toàn bộ agents</strong> theo business rule (T1 tree → head → division).</p>
          <p className="text-sm text-text-tertiary mt-2">Thường dùng sau khi import data, đổi head division, hoặc khi nghi ngờ data không đồng bộ.</p>
        </CountdownConfirmModal>
      )}
    </div>
  )
}
