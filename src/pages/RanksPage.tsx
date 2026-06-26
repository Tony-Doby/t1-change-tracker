import { useState, useEffect } from 'react'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToast } from '../components/Toast'
import { SkeletonTable } from '../components/Skeleton'
import EmptyState from '../ui/display/EmptyState'
import { useRanksListQuery, useSaveRankMutation, useDeleteRankMutation, type Rank as ApiRank } from '../hooks/queries/useRanks'
import { supabase } from '../lib/supabase'
import { Shield } from 'lucide-react'
import PageHeader from '../ui/layout/PageHeader'
import Table from '../ui/layout/Table'
import TableHeader from '../ui/layout/TableHeader'
import { TableHeaderCell } from '../ui/layout/TableHeader'
import TableRow from '../ui/layout/TableRow'
import TableCell from '../ui/layout/TableCell'
import Modal from '../ui/layout/Modal'
import TextInput from '../ui/input/TextInput'
import { useColumnResize } from '../hooks/useColumnResize'
import { rankSchema, type RankFormData } from '../lib/form-schemas'

export default function RanksPage() {
  const { show } = useToast()
  const { data: ranks = [], isLoading } = useRanksListQuery()
  const saveMut = useSaveRankMutation()
  const deleteMut = useDeleteRankMutation()

  const [editing, setEditing] = useState<Partial<ApiRank> | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [deleting, setDeleting] = useState<Partial<ApiRank> | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const { widths, startResize } = useColumnResize([240, 160, 120, 100])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RankFormData>({
    resolver: zodResolver(rankSchema),
    defaultValues: { name: '', rank_type: '', sort_order: '' },
  })

  useEffect(() => {
    if (showModal) {
      if (editing) {
        reset({
          name: editing.name ?? '',
          rank_type: editing.rank_type ?? '',
          sort_order: editing.sort_order?.toString() ?? '',
        })
      } else {
        reset({ name: '', rank_type: '', sort_order: '' })
      }
    }
  }, [showModal, editing, reset])

  const onSubmit = async (data: RankFormData) => {
    const payload = {
      name: data.name.trim(),
      rank_type: data.rank_type?.trim() || null,
      sort_order: data.sort_order ? parseInt(data.sort_order, 10) : null,
    }
    try {
      await saveMut.mutateAsync({ id: editing?.id, payload })
      show(editing ? 'Đã cập nhật cấp bậc' : 'Đã thêm cấp bậc mới', 'success')
      closeModal()
    } catch (e: unknown) {
      show(editing ? 'Lỗi cập nhật: ' + ((e as Error).message ?? 'Unknown') : 'Lỗi thêm mới: ' + ((e as Error).message ?? 'Unknown'), 'error')
    }
  }

  const startEdit = (rank: ApiRank) => {
    setEditing(rank)
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
  }

  const handleDelete = async () => {
    if (!deleting) return
    setDeleteBusy(true)
    const { count, error: countError } = await supabase
      .from('agents')
      .select('*', { count: 'exact', head: true })
      .eq('rank_id', deleting.id)
      .is('deleted_at', null)
    if (countError) {
      show('Lỗi kiểm tra: ' + countError.message, 'error')
      setDeleteBusy(false)
      return
    }
    if ((count ?? 0) > 0) {
      show(`Không thể xóa: ${count} agent đang dùng cấp bậc này`, 'error')
      setDeleteBusy(false)
      setDeleting(null)
      return
    }
    try {
      await deleteMut.mutateAsync(deleting.id as string)
      show('Đã xóa cấp bậc', 'success')
    } catch (e: unknown) {
      show('Lỗi xóa: ' + ((e as Error).message ?? 'Unknown'), 'error')
    }
    setDeleteBusy(false)
    setDeleting(null)
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Quản lý Cấp bậc">
        <button
          onClick={openAddModal}
          className="px-3 h-9 bg-accent text-white rounded-sm text-sm hover:bg-accent-hover transition-colors"
        >
          + Thêm mới
        </button>
      </PageHeader>

      <Table>
        <TableHeader>
          <TableHeaderCell width={widths[0]} resizable onResizeStart={(e) => startResize(0, e)}>Tên</TableHeaderCell>
          <TableHeaderCell width={widths[1]} resizable onResizeStart={(e) => startResize(1, e)}>Loại</TableHeaderCell>
          <TableHeaderCell width={widths[2]} resizable onResizeStart={(e) => startResize(2, e)}>Thứ tự</TableHeaderCell>
          <TableHeaderCell width={widths[3]} resizable onResizeStart={(e) => startResize(3, e)} />
        </TableHeader>
        <tbody>
          {isLoading ? (
            <SkeletonTable rows={5} cols={4} />
          ) : (
            ranks.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="text-text-secondary">{r.rank_type ?? '—'}</TableCell>
                <TableCell className="text-text-secondary">{r.sort_order ?? '—'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <button onClick={() => startEdit(r)} className="text-accent text-xs hover:underline">Sửa</button>
                    <button onClick={() => setDeleting(r)} className="text-danger text-xs hover:underline">Xóa</button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
          {!isLoading && ranks.length === 0 && (
            <tr>
              <td colSpan={4}>
                <EmptyState context="no_data" />
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      {deleting && (
        <Modal onClose={() => setDeleting(null)} title="Xác nhận xóa" size="sm">
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">Bạn có chắc muốn xóa cấp bậc <strong className="text-text-primary">{deleting.name}</strong>?</p>
            <p className="text-xs text-text-tertiary">Nếu cấp bậc đang được agent sử dụng, hệ thống sẽ từ chối xóa.</p>
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
        <Modal onClose={closeModal} title={editing ? 'Sửa cấp bậc' : 'Thêm cấp bậc mới'} size="sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <TextInput
              label="Tên cấp bậc"
              error={errors.name?.message}
              {...register('name')}
            />
            <TextInput
              label="Loại"
              error={errors.rank_type?.message}
              {...register('rank_type')}
            />
            <TextInput
              label="Thứ tự"
              type="number"
              error={errors.sort_order?.message}
              {...register('sort_order')}
            />
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
        <span>Chỉ admin có quyền quản lý cấp bậc. Thay đổi sẽ ảnh hưởng đến eligibility check trên toàn hệ thống.</span>
      </div>
    </div>
  )
}
