import { useState } from 'react'
import { HardDrive, Loader2 } from 'lucide-react'
import PageContainer from '../ui/layout/PageContainer'
import PageHeader from '../ui/layout/PageHeader'
import Card from '../ui/layout/Card'
import Table from '../ui/layout/Table'
import TableHeader from '../ui/layout/TableHeader'
import { TableHeaderCell } from '../ui/layout/TableHeader'
import TableRow from '../ui/layout/TableRow'
import TableCell from '../ui/layout/TableCell'
import Badge from '../ui/display/Badge'
import EmptyState from '../ui/display/EmptyState'
import ConfirmationModal from '../ui/feedback/ConfirmationModal'
import { useToast } from '../components/Toast'
import {
  useAppsScriptLogsQuery,
  useAppsScriptMutation,
} from '../hooks/queries/useAppsScript'
import {
  ScanFoldersForm,
  SetPermissionsForm,
  CreateFolderForm,
  CopyFolderForm,
  ListItemsForm,
  MoveItemForm,
  RemovePermissionForm,
  DeleteItemForm,
} from '../components/apps-script'
import type { AppsScriptAction, AppsScriptParams, AppsScriptLog } from '../types'

const ACTION_OPTIONS: { value: AppsScriptAction; label: string; description: string }[] = [
  { value: 'scanFolders', label: 'Quét folder', description: 'Tìm các folder con theo tên trong phạm vi độ sâu.' },
  { value: 'setPermissions', label: 'Cấp quyền', description: 'Gán quyền reader/writer/commenter cho nhiều item và email.' },
  { value: 'createFolder', label: 'Tạo folder', description: 'Tạo folder mới bên trong folder cha.' },
  { value: 'copyFolder', label: 'Sao chép folder', description: 'Sao chép toàn bộ folder sang folder đích với tên mới.' },
  { value: 'listItems', label: 'Liệt kê items', description: 'Xem danh sách file và folder bên trong một folder.' },
  { value: 'moveItem', label: 'Di chuyển item', description: 'Chuyển một file/folder sang folder đích.' },
  { value: 'removePermission', label: 'Xóa quyền', description: 'Thu hồi quyền của một email trên item.' },
  { value: 'deleteItem', label: 'Xóa item', description: 'Xóa vĩnh viễn file hoặc folder.' },
]

const DESTRUCTIVE_ACTIONS: AppsScriptAction[] = [
  'setPermissions',
  'copyFolder',
  'moveItem',
  'removePermission',
  'deleteItem',
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('vi-VN')
}

function isArrayResult(data: unknown): data is Array<Record<string, unknown>> {
  return Array.isArray(data)
}

function ResultPanel({ data }: { data: unknown }) {
  if (data === null || data === undefined) return null

  if (isArrayResult(data) && data.length > 0) {
    const columns = Object.keys(data[0])
    return (
      <div className="space-y-3">
        <p className="text-sm text-text-secondary">Kết quả ({data.length} bản ghi)</p>
        <div className="overflow-auto max-h-96 border border-border-hairline rounded-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-bg-secondary sticky top-0">
              <tr>
                {columns.map((col) => (
                  <th key={col} className="px-3 py-2 font-medium text-text-tertiary border-b border-border-hairline">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx} className="border-b border-border-hairline">
                  {columns.map((col) => (
                    <td key={col} className="px-3 py-2 text-text-primary">
                      {typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-text-secondary">Kết quả:</p>
      <pre className="text-xs bg-bg-secondary p-3 rounded-sm overflow-auto max-h-96 text-text-primary">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}

function LogsTable({ logs, isLoading }: { logs?: AppsScriptLog[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-text-tertiary">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Đang tải lịch sử...
      </div>
    )
  }

  if (!logs || logs.length === 0) {
    return <EmptyState context="no_data" title="Chưa có lịch sử" subtitle="Các thao tác sẽ được ghi lại ở đây." />
  }

  return (
    <Table>
      <TableHeader>
        <TableHeaderCell>Thờii gian</TableHeaderCell>
        <TableHeaderCell>Tác vụ</TableHeaderCell>
        <TableHeaderCell>Trạng thái</TableHeaderCell>
        <TableHeaderCell>Lỗi</TableHeaderCell>
      </TableHeader>
      <tbody>
        {logs.map((log) => (
          <TableRow key={log.id}>
            <TableCell>{formatDate(log.created_at)}</TableCell>
            <TableCell>
              {ACTION_OPTIONS.find((a) => a.value === log.action)?.label ?? log.action}
            </TableCell>
            <TableCell>
              {log.success ? (
                <Badge variant="success">Thành công</Badge>
              ) : (
                <Badge variant="danger">Thất bại</Badge>
              )}
            </TableCell>
            <TableCell className="max-w-xs truncate">
              <span title={log.error_message ?? undefined}>{log.error_message ?? '-'}</span>
            </TableCell>
          </TableRow>
        ))}
      </tbody>
    </Table>
  )
}

export default function AppsScriptAdminPage() {
  const [selectedAction, setSelectedAction] = useState<AppsScriptAction>('scanFolders')
  const [result, setResult] = useState<unknown>(null)
  const [pendingAction, setPendingAction] = useState<{ action: AppsScriptAction; params: AppsScriptParams } | null>(null)

  const { show } = useToast()
  const { mutateAsync, isPending } = useAppsScriptMutation()
  const { data: logs, isLoading: logsLoading, refetch } = useAppsScriptLogsQuery()

  const executeAction = async (action: AppsScriptAction, params: AppsScriptParams) => {
    try {
      const res = await mutateAsync({ action, params })
      setResult(res.data ?? null)
      show('Thao tác thành công', 'success')
      void refetch()
    } catch (err: unknown) {
      show((err as Error).message ?? 'Lỗi không xác định', 'error')
      setResult(null)
    } finally {
      setPendingAction(null)
    }
  }

  const handleAction = (action: AppsScriptAction, params: AppsScriptParams) => {
    if (DESTRUCTIVE_ACTIONS.includes(action)) {
      setPendingAction({ action, params })
      return
    }
    void executeAction(action, params)
  }

  const selectedLabel = ACTION_OPTIONS.find((a) => a.value === selectedAction)?.label ?? selectedAction

  return (
    <PageContainer>
      <PageHeader title="Google Drive Admin" icon={<HardDrive className="w-7 h-7" />} />

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <Card className="h-fit" padding="sm">
          <nav className="space-y-1" aria-label="Drive operations">
            {ACTION_OPTIONS.map((opt) => {
              const active = opt.value === selectedAction
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setSelectedAction(opt.value)
                    setResult(null)
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-sm text-sm transition-colors ${
                    active
                      ? 'bg-accent-subtle text-accent font-medium'
                      : 'text-text-secondary hover:bg-bg-secondary'
                  }`}
                >
                  <span className="block">{opt.label}</span>
                  <span className={`block text-xs mt-0.5 ${active ? 'text-accent/80' : 'text-text-tertiary'}`}>
                    {opt.description}
                  </span>
                </button>
              )
            })}
          </nav>
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="text-[1.23rem] font-medium text-text-primary mb-4">{selectedLabel}</h2>
            {selectedAction === 'scanFolders' && (
              <ScanFoldersForm onSubmit={(p) => handleAction('scanFolders', p)} isLoading={isPending} />
            )}
            {selectedAction === 'setPermissions' && (
              <SetPermissionsForm onSubmit={(p) => handleAction('setPermissions', p)} isLoading={isPending} />
            )}
            {selectedAction === 'createFolder' && (
              <CreateFolderForm onSubmit={(p) => handleAction('createFolder', p)} isLoading={isPending} />
            )}
            {selectedAction === 'copyFolder' && (
              <CopyFolderForm onSubmit={(p) => handleAction('copyFolder', p)} isLoading={isPending} />
            )}
            {selectedAction === 'listItems' && (
              <ListItemsForm onSubmit={(p) => handleAction('listItems', p)} isLoading={isPending} />
            )}
            {selectedAction === 'moveItem' && (
              <MoveItemForm onSubmit={(p) => handleAction('moveItem', p)} isLoading={isPending} />
            )}
            {selectedAction === 'removePermission' && (
              <RemovePermissionForm onSubmit={(p) => handleAction('removePermission', p)} isLoading={isPending} />
            )}
            {selectedAction === 'deleteItem' && (
              <DeleteItemForm onSubmit={(p) => handleAction('deleteItem', p)} isLoading={isPending} />
            )}
          </Card>

          {result !== null && (
            <Card>
              <ResultPanel data={result} />
            </Card>
          )}

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[1.23rem] font-medium text-text-primary">Lịch sử thao tác</h3>
              <button
                type="button"
                onClick={() => void refetch()}
                disabled={logsLoading}
                className="text-sm text-accent hover:text-accent-hover disabled:opacity-50"
              >
                Làm mới
              </button>
            </div>
            <LogsTable logs={logs} isLoading={logsLoading} />
          </Card>
        </div>
      </div>

      <ConfirmationModal
        open={!!pendingAction}
        onClose={() => setPendingAction(null)}
        onConfirm={async () => {
          if (pendingAction) {
            await executeAction(pendingAction.action, pendingAction.params)
          }
        }}
        title="Xác nhận thao tác"
        description={`Bạn có chắc muốn thực hiện "${selectedLabel}"? Thao tác này có thể thay đổi dữ liệu Google Drive.`}
        confirmText="Xác nhận"
        confirmType={pendingAction?.action === 'deleteItem' ? 'danger' : 'primary'}
        loading={isPending}
      />
    </PageContainer>
  )
}
