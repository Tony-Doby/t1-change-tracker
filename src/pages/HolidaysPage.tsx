import { useState, useEffect } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'

interface Holiday {
  id: string
  holiday_date: string
  name: string
  year: number
}

export default function HolidaysPage() {
  const { show } = useToast()
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newDate, setNewDate] = useState('')
  const [newName, setNewName] = useState('')

  useEffect(() => {
    loadHolidays()
  }, [])

  async function loadHolidays() {
    setLoading(true)
    const { data, error } = await supabase.from('holidays').select('*').order('holiday_date', { ascending: true })
    if (error) { show('Lỗi tải dữ liệu: ' + error.message, 'error'); setLoading(false); return }
    setHolidays(data ?? [])
    setLoading(false)
  }

  const addHoliday = async () => {
    if (!newDate || !newName.trim()) return
    const d = new Date(newDate)
    const { data, error } = await supabase.from('holidays').insert({
      holiday_date: newDate,
      name: newName.trim(),
      year: d.getFullYear(),
    }).select()
    if (error) { show('Lỗi thêm: ' + error.message, 'error'); return }
    setHolidays((prev) => [...prev, ...(data ?? [])].sort((a, b) => a.holiday_date.localeCompare(b.holiday_date)))
    setNewDate('')
    setNewName('')
    setShowAdd(false)
    show('Đã thêm ngày lễ', 'success')
  }

  const deleteHoliday = async (id: string) => {
    const { error } = await supabase.from('holidays').delete().eq('id', id)
    if (error) { show('Lỗi xóa: ' + error.message, 'error'); return }
    setHolidays((prev) => prev.filter((h) => h.id !== id))
    show('Đã xóa ngày lễ', 'info')
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Quản lý ngày lễ</h1>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-3 h-9 bg-primary text-white rounded-md text-sm hover:bg-primary-hover">
          <Plus className="w-4 h-4" /> Thêm ngày
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-300">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">Ngày</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">Tên ngày lễ</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">Năm</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {holidays.map((h) => (
              <tr key={h.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                <td className="px-4 py-3 text-neutral-700">{new Date(h.holiday_date).toLocaleDateString('vi-VN')}</td>
                <td className="px-4 py-3 text-neutral-900 font-medium">{h.name}</td>
                <td className="px-4 py-3 text-neutral-500">{h.year}</td>
                <td className="px-4 py-3">
                  <button onClick={() => deleteHoliday(h.id)} className="text-neutral-400 hover:text-danger transition-colors"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
            {holidays.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-12 text-center text-neutral-500">Chưa có ngày lễ nào</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-modal w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-neutral-900">Thêm ngày lễ</h3>
              <button onClick={() => setShowAdd(false)} className="text-neutral-500 hover:text-neutral-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-neutral-500 mb-1">Ngày</label>
                <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)}
                  className="w-full h-10 px-3 border border-neutral-300 rounded-md text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light" />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-neutral-500 mb-1">Tên ngày lễ</label>
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="VD: Tết Nguyên Đán"
                  className="w-full h-10 px-3 border border-neutral-300 rounded-md text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light" />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowAdd(false)} className="px-4 h-9 border border-neutral-300 rounded-md text-sm text-neutral-700 hover:bg-neutral-50">Hủy</button>
              <button onClick={addHoliday} disabled={!newDate || !newName.trim()}
                className="px-4 h-9 bg-primary text-white rounded-md text-sm hover:bg-primary-hover disabled:opacity-50">Thêm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
