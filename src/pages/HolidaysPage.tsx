import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToast } from '../components/Toast'
import { formatDate } from '../lib/date-utils'
import { useHolidaysListQuery, useAddHolidayMutation, useDeleteHolidayMutation } from '../hooks/queries/useHolidays'
import PageHeader from '../ui/layout/PageHeader'
import Table from '../ui/layout/Table'
import TableHeader from '../ui/layout/TableHeader'
import { TableHeaderCell } from '../ui/layout/TableHeader'
import TableRow from '../ui/layout/TableRow'
import TableCell from '../ui/layout/TableCell'
import EmptyState from '../ui/display/EmptyState'
import Modal from '../ui/layout/Modal'
import TextInput from '../ui/input/TextInput'
import { useColumnResize } from '../hooks/useColumnResize'
import { holidaySchema, type HolidayFormData } from '../lib/form-schemas'

export default function HolidaysPage() {
  const { show } = useToast()
  const { data: holidays = [], isLoading } = useHolidaysListQuery()
  const addMut = useAddHolidayMutation()
  const delMut = useDeleteHolidayMutation()

  const [showAdd, setShowAdd] = useState(false)

  const { widths, startResize } = useColumnResize([140, 300, 100, 80])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<HolidayFormData>({
    resolver: zodResolver(holidaySchema),
    defaultValues: { holiday_date: '', name: '', year: new Date().getFullYear() },
  })

  const onSubmit = async (data: HolidayFormData) => {
    try {
      await addMut.mutateAsync({ holiday_date: data.holiday_date, name: data.name.trim() })
      reset()
      setShowAdd(false)
      show('Đã thêm ngày lễ', 'success')
    } catch (e: unknown) {
      show('Lỗi thêm: ' + ((e as Error).message ?? 'Unknown'), 'error')
    }
  }

  const deleteHoliday = async (id: string) => {
    try {
      await delMut.mutateAsync(id)
      show('Đã xóa ngày lễ', 'info')
    } catch (e: unknown) {
      show('Lỗi xóa: ' + ((e as Error).message ?? 'Unknown'), 'error')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <PageHeader title="Quản lý ngày lễ">
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3 h-9 bg-accent text-white rounded-sm text-sm hover:bg-accent-hover transition-colors"
        >
          <Plus className="w-4 h-4" /> Thêm ngày
        </button>
      </PageHeader>

      <Table>
        <TableHeader>
          <TableHeaderCell width={widths[0]} resizable onResizeStart={(e) => startResize(0, e)}>Ngày</TableHeaderCell>
          <TableHeaderCell width={widths[1]} resizable onResizeStart={(e) => startResize(1, e)}>Tên ngày lễ</TableHeaderCell>
          <TableHeaderCell width={widths[2]} resizable onResizeStart={(e) => startResize(2, e)}>Năm</TableHeaderCell>
          <TableHeaderCell width={widths[3]} resizable onResizeStart={(e) => startResize(3, e)}>Hành động</TableHeaderCell>
        </TableHeader>
        <tbody>
          {holidays.map((h) => (
            <TableRow key={h.id}>
              <TableCell className="text-text-secondary">{formatDate(h.holiday_date)}</TableCell>
              <TableCell className="font-medium">{h.name}</TableCell>
              <TableCell className="text-text-secondary">{h.year}</TableCell>
              <TableCell>
                <button
                  onClick={() => deleteHoliday(h.id)}
                  className="text-text-tertiary hover:text-danger transition-colors"
                  aria-label="Xóa ngày lễ"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </TableCell>
            </TableRow>
          ))}
          {holidays.length === 0 && (
            <tr>
              <td colSpan={4}>
                <EmptyState context="no_data" subtitle="Thêm ngày lễ để tính đúng ngày làm việc" />
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      {showAdd && (
        <Modal onClose={() => setShowAdd(false)} title="Thêm ngày lễ" size="sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <TextInput
              label="Ngày"
              type="date"
              error={errors.holiday_date?.message}
              {...register('holiday_date')}
            />
            <TextInput
              label="Tên ngày lễ"
              type="text"
              placeholder="VD: Tết Nguyên Đán"
              error={errors.name?.message}
              {...register('name')}
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="px-4 h-9 border border-border-light rounded-sm text-sm text-text-secondary hover:bg-bg-secondary transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 h-9 bg-accent text-white rounded-sm text-sm hover:bg-accent-hover disabled:opacity-50 transition-colors"
              >
                Thêm
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
