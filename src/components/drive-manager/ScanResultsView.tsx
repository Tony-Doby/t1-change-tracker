import { useState } from 'react'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../ui/layout/Card'
import BreadcrumbNav from './BreadcrumbNav'
import ScanResultsTable from '../apps-script/ScanResultsTable'
import type { ScanFolderResult, ScanFoldersParams } from '../../types'
import type { PresetItem } from '../apps-script/SetPermissionsForm'

interface ScanResultsViewProps {
  results: ScanFolderResult[]
  params: ScanFoldersParams
  onBack: () => void
  onSaveAsTree: (name: string, params: ScanFoldersParams, results: ScanFolderResult[]) => void
  onBulkGrant: (items: PresetItem[]) => void
  isSaving: boolean
}

export default function ScanResultsView({
  results,
  params,
  onBack,
  onSaveAsTree,
  onBulkGrant,
  isSaving,
}: ScanResultsViewProps) {
  const [treeName, setTreeName] = useState('')

  const handleSave = () => {
    const name = treeName.trim() || 'Cây Drive quét'
    onSaveAsTree(name, params, results)
  }

  return (
    <div className="space-y-4">
      <BreadcrumbNav
        items={[
          { label: 'Drive Manager' },
          { label: 'Quét folder', onClick: onBack },
          { label: 'Kết quả' },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 h-8 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quét folder khác
        </button>
      </div>

      <ScanResultsTable results={results} onBulkGrant={onBulkGrant} />

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-text-secondary mb-1">Lưu kết quả thành cây Drive</label>
            <input
              type="text"
              value={treeName}
              onChange={(e) => setTreeName(e.target.value)}
              placeholder="Tên cây Drive mới"
              className="w-full px-3 h-10 rounded-sm border border-border-hairline bg-bg-primary text-text-primary focus:outline-none focus:border-accent"
            />
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || results.length === 0}
            className="inline-flex items-center gap-1.5 px-4 h-10 bg-accent text-white rounded-sm text-sm hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Đang lưu...' : 'Lưu thành cây Drive'}
          </button>
        </div>
      </Card>
    </div>
  )
}
