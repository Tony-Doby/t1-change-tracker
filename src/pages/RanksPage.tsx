import { useState } from 'react'
import { useToast } from '../components/Toast'
import { SkeletonTable } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'
import { useRanksListQuery, useSaveRankMutation, useDeleteRankMutation } from '../hooks/queries/useRanks'
import { supabase } from '../lib/supabase'
import { Inbox, Shield } from 'lucide-react'

export default function RanksPage() {
  const { show } = useToast()
  const { data: ranks = [], isLoading } = useRanksListQuery()
  const saveMut = useSaveRankMutation()
  const deleteMut = useDeleteRankMutation()

  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState({ name: '', rank_type: '', sort_order: '' })
  const [showModal, setShowModal] = useState(false)
  const [deleting, setDeleting] = useState<any | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const handleSave = async () => {
    if (!form.name.trim()) {
      show('Vui lòng nhập tên cấp bậc', 'error')
      return
    }
    const payload = {
      name: form.name.trim(),
      rank_type: form.rank_type.trim() || null,
      sort_order: form.sort_order ? parseInt(form.sort_order) : null,
    }
    try {
      await saveMut.mutateAsync({ id: editing?.id, payload })
      show(editing ? 'Đã cập nhật cấp bậc' : 'Đã thêm cấp bậc mới', 'success')
      setEditing(null)
      setForm({ name: '', rank_type: '', sort_order: '' })
      setShowModal(false)
    } catch (e: any) {
      show(editing ? 'Lỗi cập nhật: ' + e.message : 'Lỗi thêm mới: ' + e.message, 'error')
    }
  }

  const startEdit = (rank: any) => {
    setEditing(rank)
    setForm({
      name: rank.name ?? '',
      rank_type: rank.rank_type ?? '',
      sort_order: rank.sort_order?.toString() ?? '',
    })
    setShowModal(true)
  }

  const openAddModal = () => {
    setEditing(null)
    setForm({ name: '', rank_type: '', sort_order: '' })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditing(null)
    setForm({ name: '', rank_type: '', sort_order: '' })
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
      await deleteMut.mutateAsync(deleting.id)
      show('Đã xóa cấp bậc', 'success')
    } catch (e: any) {
      show('Lỗi xóa: ' + e.message, 'error')
    }
    setDeleteBusy(false)
    setDeleting(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Quản lý Cấp bậc</h1>
        <button onClick={openAddModal} className="px-3 h-9 bg-primary text-white rounded-md text-sm hover:bg-primary-hover">+ Thêm mới</button>
      </div>

      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-300">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">Tên</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">Loại</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">Thứ tự</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <SkeletonTable rows={5} cols={4} />
              ) : (
                ranks.map((r) => (
                  <tr key={r.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="px-4 py-3 text-neutral-900 font-medium">{r.name}</td>
                    <td className="px-4 py-3 text-neutral-700">{r.rank_type ?? '—'}</td>
                    <td className="px-4 py-3 text-neutral-700">{r.sort_order ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button onClick={() => startEdit(r)} className="text-primary text-xs hover:underline">Sửa</button>
                        <button onClick={() => setDeleting(r)} className="text-red-600 text-xs hover:underline">Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
              {!isLoading && ranks.length === 0 && (
                <tr><td colSpan={4}><EmptyState icon={<Inbox className="w-12 h-12" />} title="Chưa có cấp bậc nào" /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {deleting && (
        <Modal onClose={() => setDeleting(null)} title="Xác nhận xóa" maxWidth="max-w-sm">
          <div className="space-y-4">
            <p className="text-sm text-neutral-700">Bạn có chắc muốn xóa cấp bậc <strong>{deleting.name}</strong>?</p>
            <p className="text-xs text-neutral-500">Nếu cấp bậc đang được agent sử dụng, hệ thống sẽ từ chối xóa.</p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={() => setDeleting(null)} className="px-4 h-9 border border-neutral-300 rounded-md text-sm text-neutral-700 hover:bg-neutral-50">Hủy</button>
              <button onClick={handleDelete} disabled={deleteBusy} className="px-4 h-9 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 disabled:opacity-60">
                {deleteBusy ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showModal && (
        <Modal onClose={closeModal} title={editing ? 'Sửa cấp bậc' : 'Thêm cấp bậc mới'} maxWidth="max-w-md">
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Tên cấp bậc</label>
              <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="h-9 px-3 border border-neutral-300 rounded-md text-sm focus:outline-none focus:border-primary w-full" />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Loại</label>
              <input type="text" value={form.rank_type} onChange={(e) => setForm((f) => ({ ...f, rank_type: e.target.value }))}
                className="h-9 px-3 border border-neutral-300 rounded-md text-sm focus:outline-none focus:border-primary w-full" />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Thứ tự</label>
              <input type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                className="h-9 px-3 border border-neutral-300 rounded-md text-sm focus:outline-none focus:border-primary w-full" />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button onClick={handleSave} className="px-4 h-9 bg-primary text-white rounded-md text-sm hover:bg-primary-hover">{editing ? 'Cập nhật' : 'Thêm'}</button>
              <button onClick={closeModal} className="px-4 h-9 border border-neutral-300 rounded-md text-sm text-neutral-700 hover:bg-neutral-50">Hủy</button>
            </div>
          </div>
        </Modal>
      )}

      <div className="flex items-center gap-2 text-xs text-neutral-500 bg-neutral-50 rounded-lg p-3">
        <Shield className="w-4 h-4" />
        <span>Chỉ admin có quyền quản lý cấp bậc. Thay đổi sẽ ảnh hưởng đến eligibility check trên toàn hệ thống.</span>
      </div>
    </div>
  )
}
