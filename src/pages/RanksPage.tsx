import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'
import { SkeletonTable } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'
import { Inbox, Shield } from 'lucide-react'

export default function RanksPage() {
  const { show } = useToast()
  const [ranks, setRanks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState({ name: '', rank_type: '', sort_order: '' })

  useEffect(() => {
    loadRanks()
  }, [])

  async function loadRanks() {
    setLoading(true)
    const { data, error } = await supabase.from('ranks').select('*').order('sort_order', { ascending: true })
    if (error) {
      show('Lỗi tải dữ liệu: ' + error.message, 'error')
    } else {
      setRanks(data ?? [])
    }
    setLoading(false)
  }

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
    if (editing) {
      const { error } = await supabase.from('ranks').update(payload).eq('id', editing.id)
      if (error) { show('Lỗi cập nhật: ' + error.message, 'error'); return }
      show('Đã cập nhật cấp bậc', 'success')
    } else {
      const { error } = await supabase.from('ranks').insert(payload)
      if (error) { show('Lỗi thêm mới: ' + error.message, 'error'); return }
      show('Đã thêm cấp bậc mới', 'success')
    }
    setEditing(null)
    setForm({ name: '', rank_type: '', sort_order: '' })
    loadRanks()
  }

  const startEdit = (rank: any) => {
    setEditing(rank)
    setForm({
      name: rank.name ?? '',
      rank_type: rank.rank_type ?? '',
      sort_order: rank.sort_order?.toString() ?? '',
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Quản lý Cấp bậc</h1>
        <button
          onClick={() => { setEditing(null); setForm({ name: '', rank_type: '', sort_order: '' }) }}
          className="px-3 h-9 bg-primary text-white rounded-md text-sm hover:bg-primary-hover"
        >
          + Thêm mới
        </button>
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
              {loading ? (
                <SkeletonTable rows={5} cols={4} />
              ) : (
                ranks.map((r) => (
                  <tr key={r.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="px-4 py-3 text-neutral-900 font-medium">{r.name}</td>
                    <td className="px-4 py-3 text-neutral-700">{r.rank_type ?? '—'}</td>
                    <td className="px-4 py-3 text-neutral-700">{r.sort_order ?? '—'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => startEdit(r)} className="text-primary text-xs hover:underline">Sửa</button>
                    </td>
                  </tr>
                ))
              )}
              {!loading && ranks.length === 0 && (
                <tr><td colSpan={4}><EmptyState icon={<Inbox className="w-12 h-12" />} title="Chưa có cấp bậc nào" /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-card p-5">
        <h3 className="text-sm font-semibold text-neutral-900 mb-3">{editing ? 'Sửa cấp bậc' : 'Thêm cấp bậc mới'}</h3>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Tên cấp bậc</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="h-9 px-3 border border-neutral-300 rounded-md text-sm focus:outline-none focus:border-primary w-48"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Loại</label>
            <input
              type="text"
              value={form.rank_type}
              onChange={(e) => setForm((f) => ({ ...f, rank_type: e.target.value }))}
              className="h-9 px-3 border border-neutral-300 rounded-md text-sm focus:outline-none focus:border-primary w-32"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Thứ tự</label>
            <input
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
              className="h-9 px-3 border border-neutral-300 rounded-md text-sm focus:outline-none focus:border-primary w-24"
            />
          </div>
          <button onClick={handleSave} className="px-4 h-9 bg-primary text-white rounded-md text-sm hover:bg-primary-hover">
            {editing ? 'Cập nhật' : 'Thêm'}
          </button>
          {editing && (
            <button onClick={() => { setEditing(null); setForm({ name: '', rank_type: '', sort_order: '' }) }} className="px-4 h-9 border border-neutral-300 rounded-md text-sm text-neutral-700 hover:bg-neutral-50">
              Hủy
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-neutral-500 bg-neutral-50 rounded-lg p-3">
        <Shield className="w-4 h-4" />
        <span>Chỉ admin có quyền quản lý cấp bậc. Thay đổi sẽ ảnh hưởng đến eligibility check trên toàn hệ thống.</span>
      </div>
    </div>
  )
}
