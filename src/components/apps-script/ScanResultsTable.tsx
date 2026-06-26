import { useMemo, useState } from 'react'
import { Search, ExternalLink } from 'lucide-react'
import TextInput from '../../ui/input/TextInput'
import Badge from '../../ui/display/Badge'
import BulkActionsBar from '../../ui/feedback/BulkActionsBar'
import EmptyState from '../../ui/display/EmptyState'
import type { ScanFolderResult } from '../../types'
import type { PresetItem } from './SetPermissionsForm'

interface Props {
  results: ScanFolderResult[]
  onBulkGrant: (items: PresetItem[]) => void
}

type DriveFilter = 'all' | 'my' | 'shared'

// FEAT-032: Bảng kết quả quét tương tác — tìm kiếm, lọc theo cấp & loại Drive, chọn nhiều, cấp quyền hàng loạt.
export default function ScanResultsTable({ results, onBulkGrant }: Props) {
  const [query, setQuery] = useState('')
  const [depthFilter, setDepthFilter] = useState<Set<number>>(new Set())
  const [driveFilter, setDriveFilter] = useState<DriveFilter>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const depths = useMemo(
    () => Array.from(new Set(results.map((r) => r.depth))).sort((a, b) => a - b),
    [results]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return results.filter((r) => {
      if (q && !`${r.name} ${r.path}`.toLowerCase().includes(q)) return false
      if (depthFilter.size > 0 && !depthFilter.has(r.depth)) return false
      if (driveFilter === 'my' && r.isSharedDrive) return false
      if (driveFilter === 'shared' && !r.isSharedDrive) return false
      return true
    })
  }, [results, query, depthFilter, driveFilter])

  const allFilteredSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id))

  const toggleDepth = (d: number) => {
    setDepthFilter((prev) => {
      const next = new Set(prev)
      if (next.has(d)) next.delete(d)
      else next.add(d)
      return next
    })
  }

  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allFilteredSelected) filtered.forEach((r) => next.delete(r.id))
      else filtered.forEach((r) => next.add(r.id))
      return next
    })
  }

  const handleBulkGrant = () => {
    const items: PresetItem[] = results
      .filter((r) => selected.has(r.id))
      .map((r) => ({ id: r.id, isSharedDrive: r.isSharedDrive }))
    if (items.length > 0) onBulkGrant(items)
  }

  const chipBase =
    'inline-flex items-center h-7 px-3 rounded-pill text-xs font-medium border transition-colors'
  const chipOn = 'bg-accent-subtle text-accent border-accent/20'
  const chipOff = 'bg-bg-secondary text-text-secondary border-border-light hover:bg-bg-tertiary'

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-text-secondary">
            Kết quả quét ({filtered.length}/{results.length} folder)
          </p>
        </div>

        <TextInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm theo tên hoặc đường dẫn..."
          leftIcon={<Search className="w-4 h-4" />}
          size="sm"
        />

        <div className="flex flex-wrap items-center gap-4">
          {/* Lọc theo loại Drive */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-text-tertiary mr-1">Loại Drive:</span>
            {(['all', 'my', 'shared'] as DriveFilter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setDriveFilter(f)}
                className={`${chipBase} ${driveFilter === f ? chipOn : chipOff}`}
              >
                {f === 'all' ? 'Tất cả' : f === 'my' ? 'My Drive' : 'Shared Drive'}
              </button>
            ))}
          </div>

          {/* Lọc theo cấp độ sâu */}
          {depths.length > 1 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-text-tertiary mr-1">Cấp:</span>
              {depths.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDepth(d)}
                  className={`${chipBase} ${depthFilter.has(d) ? chipOn : chipOff}`}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState context="filter_empty" title="Không có folder khớp" subtitle="Thử đổi từ khóa hoặc bộ lọc." />
      ) : (
        <div className="overflow-auto max-h-[28rem] border border-border-hairline rounded-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-bg-secondary sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2 w-10 border-b border-border-hairline">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleSelectAll}
                    aria-label="Chọn tất cả"
                    className="accent-accent w-4 h-4 align-middle"
                  />
                </th>
                <th className="px-3 py-2 font-medium text-text-tertiary border-b border-border-hairline">Tên</th>
                <th className="px-3 py-2 font-medium text-text-tertiary border-b border-border-hairline">Đường dẫn</th>
                <th className="px-3 py-2 font-medium text-text-tertiary border-b border-border-hairline">Cấp</th>
                <th className="px-3 py-2 font-medium text-text-tertiary border-b border-border-hairline">Loại Drive</th>
                <th className="px-3 py-2 font-medium text-text-tertiary border-b border-border-hairline">Link</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-border-hairline hover:bg-bg-secondary/50">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selected.has(r.id)}
                      onChange={() => toggleRow(r.id)}
                      aria-label={`Chọn ${r.name}`}
                      className="accent-accent w-4 h-4 align-middle"
                    />
                  </td>
                  <td className="px-3 py-2 text-text-primary">{r.name}</td>
                  <td className="px-3 py-2 text-text-tertiary max-w-xs truncate" title={r.path}>{r.path}</td>
                  <td className="px-3 py-2 text-text-secondary">{r.depth}</td>
                  <td className="px-3 py-2">
                    {r.isSharedDrive ? (
                      <Badge variant="primary">Shared Drive</Badge>
                    ) : (
                      <Badge variant="neutral">My Drive</Badge>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-accent hover:text-accent-hover"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Mở
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected.size > 0 && (
        <BulkActionsBar
          count={selected.size}
          onClear={() => setSelected(new Set())}
          actions={
            <button
              type="button"
              onClick={handleBulkGrant}
              className="px-3 h-8 bg-accent text-white rounded-sm text-sm hover:bg-accent-hover transition-colors"
            >
              Cấp quyền
            </button>
          }
        />
      )}
    </div>
  )
}
