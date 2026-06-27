import { useEffect, useMemo, useState } from 'react'
import { HardDrive, Loader2, Plus, RefreshCw, Trash2, Edit3 } from 'lucide-react'
import PageContainer from '../ui/layout/PageContainer'
import PageHeader from '../ui/layout/PageHeader'
import Card from '../ui/layout/Card'
import EmptyState from '../ui/display/EmptyState'
import Badge from '../ui/display/Badge'
import Modal from '../ui/layout/Modal'
import ConfirmationModal from '../ui/feedback/ConfirmationModal'
import { useToast } from '../components/Toast'
import {
  useAppsScriptMutation,
  useAppsScriptLogsQuery,
} from '../hooks/queries/useAppsScript'
import {
  useDriveTreesQuery,
  useCreateDriveTreeMutation,
  useUpdateDriveTreeMutation,
  useDeleteDriveTreeMutation,
} from '../hooks/queries/useDriveTrees'
import {
  useDriveTemplatesQuery,
  useCreateDriveTemplateMutation,
  useUpdateDriveTemplateMutation,
  useDeleteDriveTemplateMutation,
} from '../hooks/queries/useDriveTemplates'
import ScanFoldersForm from '../components/apps-script/ScanFoldersForm'
import SetPermissionsForm from '../components/apps-script/SetPermissionsForm'
import ScanResultsTable from '../components/apps-script/ScanResultsTable'
import DriveTreeTable, { useDriveTree, type DriveTreeNode, type TreeAction } from '../components/drive-manager/DriveTreeTable'
import CreateTreeDialog from '../components/drive-manager/CreateTreeDialog'
import TemplateManager from '../components/drive-manager/TemplateManager'
import CreateFromTemplateModal from '../components/drive-manager/CreateFromTemplateModal'
import CopyFolderDialog from '../components/drive-manager/CopyFolderDialog'
import MoveItemDialog from '../components/drive-manager/MoveItemDialog'
import type {
  AppsScriptAction,
  AppsScriptLog,
  AppsScriptParams,
  ScanFolderResult,
  ScanFoldersParams,
  SetPermissionsParams,
  DriveTemplateFolder,
} from '../types'
import type { PresetItem } from '../components/apps-script/SetPermissionsForm'

// FEAT-034: Drive Manager — replaces AppsScriptAdminPage.
export default function DriveManagerPage() {
  const { show } = useToast()
  const { mutateAsync: runAppsScript, isPending: isAppsScriptPending } = useAppsScriptMutation()
  const { data: logs, isLoading: logsLoading, refetch: refetchLogs } = useAppsScriptLogsQuery()

  const { data: savedTrees, isLoading: treesLoading } = useDriveTreesQuery()
  const createTree = useCreateDriveTreeMutation()
  const updateTree = useUpdateDriveTreeMutation()
  const deleteTree = useDeleteDriveTreeMutation()

  const { data: templates, isLoading: templatesLoading } = useDriveTemplatesQuery()
  const createTemplate = useCreateDriveTemplateMutation()
  const updateTemplate = useUpdateDriveTemplateMutation()
  const deleteTemplate = useDeleteDriveTemplateMutation()

  const [activeTreeId, setActiveTreeId] = useState<string | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [treeToDelete, setTreeToDelete] = useState<string | null>(null)
  const [treeToRename, setTreeToRename] = useState<{ id: string; name: string } | null>(null)

  // Results from a fresh scan (not yet saved).
  const [scanResults, setScanResults] = useState<ScanFolderResult[] | null>(null)
  const [scanParams, setScanParams] = useState<ScanFoldersParams | null>(null)

  // Selection state for tree table.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Modals.
  const [grantNode, setGrantNode] = useState<DriveTreeNode | null>(null)
  const [bulkGrantItems, setBulkGrantItems] = useState<PresetItem[] | null>(null)
  const [createFromTemplateNode, setCreateFromTemplateNode] = useState<DriveTreeNode | null>(null)
  const [copyNode, setCopyNode] = useState<DriveTreeNode | null>(null)
  const [moveNode, setMoveNode] = useState<DriveTreeNode | null>(null)
  const [deleteNode, setDeleteNode] = useState<DriveTreeNode | null>(null)

  const activeTree = useMemo(
    () => savedTrees?.find((t) => t.id === activeTreeId) ?? null,
    [savedTrees, activeTreeId]
  )

  // Auto-select first tree on load.
  useEffect(() => {
    if (!activeTreeId && savedTrees && savedTrees.length > 0) {
      setActiveTreeId(savedTrees[0].id)
    }
  }, [activeTreeId, savedTrees])

  // Reset selection when active tree changes.
  useEffect(() => {
    setSelectedIds(new Set())
    setScanResults(null)
  }, [activeTreeId])

  const currentTreeData = useMemo(() => {
    if (scanResults) return scanResults
    if (activeTree?.tree_data) return activeTree.tree_data as ScanFolderResult[]
    return []
  }, [scanResults, activeTree])

  const { tree, expandedIds, toggleExpand, expandAll, collapseAll } = useDriveTree(currentTreeData)

  const executeAction = async (action: AppsScriptAction, params: AppsScriptParams) => {
    try {
      const res = await runAppsScript({ action, params })
      show('Thao tác thành công', 'success')
      void refetchLogs()
      return res.data
    } catch (err: unknown) {
      show((err as Error).message ?? 'Lỗi không xác định', 'error')
      throw err
    }
  }

  const handleScan = async (params: ScanFoldersParams) => {
    setScanParams(params)
    const data = (await executeAction('scanFolders', params)) as ScanFolderResult[]
    setScanResults(data)
  }

  const handleRefresh = async () => {
    if (!activeTree) return
    const params: ScanFoldersParams = {
      rootFolderId: activeTree.root_folder_id,
      depth: activeTree.depth,
      matchType: 'contains',
      pattern: '',
    }
    const data = (await executeAction('scanFolders', params)) as ScanFolderResult[]
    await updateTree.mutateAsync({
      id: activeTree.id,
      updates: {
        tree_data: data,
        refreshed_at: new Date().toISOString(),
      },
    })
    setScanResults(null)
    show('Đã làm mới cây Drive', 'success')
  }

  const handleCreateTree = async (input: {
    name: string
    rootFolderId: string
    rootUrl: string
    depth: number
  }) => {
    const params: ScanFoldersParams = {
      rootFolderId: input.rootFolderId,
      depth: input.depth,
      matchType: 'contains',
      pattern: '',
    }
    const data = (await executeAction('scanFolders', params)) as ScanFolderResult[]
    const created = await createTree.mutateAsync({
      name: input.name,
      root_url: input.rootUrl,
      root_folder_id: input.rootFolderId,
      depth: input.depth,
      tree_data: data,
      is_shared_drive: data[0]?.isSharedDrive ?? null,
    })
    setActiveTreeId(created.id)
    setScanResults(null)
    setCreateDialogOpen(false)
    show('Đã thêm cây Drive mới', 'success')
  }

  const handleDeleteTree = async () => {
    if (!treeToDelete) return
    await deleteTree.mutateAsync(treeToDelete)
    if (activeTreeId === treeToDelete) {
      setActiveTreeId(null)
      setScanResults(null)
    }
    setTreeToDelete(null)
    show('Đã xóa cây Drive', 'success')
  }

  const handleRenameTree = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!treeToRename) return
    await updateTree.mutateAsync({
      id: treeToRename.id,
      updates: { name: treeToRename.name },
    })
    setTreeToRename(null)
    show('Đã đổi tên cây Drive', 'success')
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = (ids: string[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      const allSelected = ids.every((id) => next.has(id))
      if (allSelected) {
        ids.forEach((id) => next.delete(id))
      } else {
        ids.forEach((id) => next.add(id))
      }
      return next
    })
  }

  const handleCreateTemplate = async (data: { name: string; root: DriveTemplateFolder }) => {
    await createTemplate.mutateAsync({
      name: data.name,
      root: data.root,
      created_by: null,
    })
    show('Đã tạo template', 'success')
  }

  const handleUpdateTemplate = async (id: string, updates: { name?: string; root?: DriveTemplateFolder }) => {
    await updateTemplate.mutateAsync({ id, updates })
    show('Đã cập nhật template', 'success')
  }

  const handleDeleteTemplate = async (id: string) => {
    await deleteTemplate.mutateAsync(id)
    show('Đã xóa template', 'success')
  }

  const handleCreateFromTemplate = async (params: { parentFolderId: string; templateId: string }) => {
    const template = templates?.find((t) => t.id === params.templateId)
    if (!template) {
      show('Không tìm thấy template', 'error')
      return
    }
    await executeAction('createFolderTree', {
      parentFolderId: params.parentFolderId,
      templateId: params.templateId,
      template: template.root,
    })
    setCreateFromTemplateNode(null)
    show('Đã tạo folder từ template', 'success')
  }

  const handleCopyFolder = async (params: { sourceFolderId: string; destFolderId: string; newName: string }) => {
    await executeAction('copyFolder', params)
    setCopyNode(null)
  }

  const handleMoveItem = async (params: { itemId: string; destFolderId: string }) => {
    await executeAction('moveItem', params)
    setMoveNode(null)
  }

  const handleDeleteItem = async () => {
    if (!deleteNode) return
    await executeAction('deleteItem', { itemId: deleteNode.id })
    setDeleteNode(null)
  }

  const handleTreeAction = (action: TreeAction, node: DriveTreeNode) => {
    switch (action) {
      case 'grant':
        setGrantNode(node)
        break
      case 'createFromTemplate':
        setCreateFromTemplateNode(node)
        break
      case 'copy':
        setCopyNode(node)
        break
      case 'move':
        setMoveNode(node)
        break
      case 'delete':
        setDeleteNode(node)
        break
    }
  }

  const handleBulkGrantFromScan = (items: PresetItem[]) => {
    setBulkGrantItems(items)
  }

  const handleGrantSubmit = async (params: SetPermissionsParams) => {
    await executeAction('setPermissions', params)
    setGrantNode(null)
    setBulkGrantItems(null)
  }

  const isLoading =
    isAppsScriptPending ||
    treesLoading ||
    createTree.isPending ||
    updateTree.isPending ||
    deleteTree.isPending ||
    templatesLoading ||
    createTemplate.isPending ||
    updateTemplate.isPending ||
    deleteTemplate.isPending

  return (
    <PageContainer>
      <PageHeader title="Drive Manager" icon={<HardDrive className="w-7 h-7" />} />

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar: saved trees */}
        <Card className="h-fit" padding="sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-text-primary">Cây Drive đã lưu</h3>
            <button
              type="button"
              onClick={() => setCreateDialogOpen(true)}
              className="p-1.5 rounded-sm hover:bg-bg-secondary text-accent"
              aria-label="Thêm cây mới"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {treesLoading ? (
            <div className="flex items-center justify-center py-6 text-text-tertiary">
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Đang tải...
            </div>
          ) : !savedTrees || savedTrees.length === 0 ? (
            <EmptyState
              context="no_data"
              title="Chưa có cây Drive"
              subtitle="Bấm + để thêm cây mới."
            />
          ) : (
            <nav className="space-y-1">
              {savedTrees.map((tree) => (
                <div
                  key={tree.id}
                  className={`group flex items-center gap-2 px-2 py-2 rounded-sm text-sm cursor-pointer ${
                    activeTreeId === tree.id
                      ? 'bg-accent-subtle text-accent font-medium'
                      : 'text-text-secondary hover:bg-bg-secondary'
                  }`}
                  onClick={() => setActiveTreeId(tree.id)}
                >
                  <div className="flex-1 min-w-0">
                    <span className="block truncate">{tree.name || tree.root_folder_id}</span>
                    <span className={`block text-xs truncate ${
                      activeTreeId === tree.id ? 'text-accent/80' : 'text-text-tertiary'
                    }`}>
                      {tree.root_url}
                    </span>
                  </div>
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setTreeToRename({ id: tree.id, name: tree.name || '' })
                      }}
                      className="p-1 rounded-sm hover:bg-bg-tertiary text-text-tertiary"
                      aria-label="Đổi tên"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setTreeToDelete(tree.id)
                      }}
                      className="p-1 rounded-sm hover:bg-bg-tertiary text-danger"
                      aria-label="Xóa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </nav>
          )}
        </Card>

        {/* Main area */}
        <div className="space-y-6">
          <Card>
            <h2 className="text-[1.23rem] font-medium text-text-primary mb-4">
              {scanResults ? 'Kết quả quét mới' : activeTree ? activeTree.name || activeTree.root_folder_id : 'Chọn hoặc thêm cây Drive'}
            </h2>

            {!activeTree && !scanResults ? (
              <EmptyState
                context="no_data"
                title="Chưa chọn cây Drive"
                subtitle="Chọn một cây từ sidebar hoặc thêm cây mới để bắt đầu."
              />
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <button
                    type="button"
                    onClick={expandAll}
                    className="px-3 h-8 text-sm border border-border-hairline rounded-sm hover:bg-bg-secondary transition-colors"
                  >
                    Mở rộng tất cả
                  </button>
                  <button
                    type="button"
                    onClick={collapseAll}
                    className="px-3 h-8 text-sm border border-border-hairline rounded-sm hover:bg-bg-secondary transition-colors"
                  >
                    Thu gọn tất cả
                  </button>
                  {activeTree && !scanResults && (
                    <button
                      type="button"
                      onClick={() => void handleRefresh()}
                      disabled={isLoading}
                      className="inline-flex items-center gap-1.5 px-3 h-8 text-sm border border-border-hairline rounded-sm hover:bg-bg-secondary transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                      Làm mới
                    </button>
                  )}
                  {scanResults && scanParams && (
                    <button
                      type="button"
                      onClick={() => {
                        setScanResults(null)
                        setScanParams(null)
                      }}
                      className="px-3 h-8 text-sm border border-border-hairline rounded-sm hover:bg-bg-secondary transition-colors"
                    >
                      Quay lại cây đã lưu
                    </button>
                  )}
                </div>

                {currentTreeData.length === 0 ? (
                  <EmptyState context="no_data" title="Không có folder" subtitle="Cây này chưa có folder con hoặc quét chưa có kết quả." />
                ) : (
                  <DriveTreeTable
                    nodes={tree}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleSelect}
                    onSelectAll={selectAll}
                    onAction={handleTreeAction}
                    onToggleExpand={toggleExpand}
                    expandedIds={expandedIds}
                  />
                )}

                {selectedIds.size > 0 && (
                  <div className="mt-4 flex items-center gap-3 p-3 rounded-sm bg-accent-subtle border border-accent/20">
                    <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-pill bg-accent text-white text-xs font-medium">
                      {selectedIds.size}
                    </span>
                    <span className="text-sm text-text-secondary">đã chọn</span>
                    <button
                      type="button"
                      onClick={() => {
                        const items = currentTreeData
                          .filter((r) => selectedIds.has(r.id))
                          .map((r) => ({ id: r.id, isSharedDrive: r.isSharedDrive }))
                        setBulkGrantItems(items)
                      }}
                      className="px-3 h-8 bg-accent text-white rounded-sm text-sm hover:bg-accent-hover transition-colors"
                    >
                      Cấp quyền
                    </button>
                  </div>
                )}
              </>
            )}
          </Card>

          {/* Scan form for new tree or re-scan */}
          <Card>
            <h3 className="text-[1.23rem] font-medium text-text-primary mb-4">Quét folder mới</h3>
            <ScanFoldersForm onSubmit={(p) => void handleScan(p)} isLoading={isLoading} />
            {scanResults && (
              <div className="mt-4">
                <ScanResultsTable results={scanResults} onBulkGrant={handleBulkGrantFromScan} />
              </div>
            )}
          </Card>

          {/* Template manager */}
          <TemplateManager
            templates={templates ?? []}
            isLoading={templatesLoading}
            onCreate={handleCreateTemplate}
            onUpdate={handleUpdateTemplate}
            onDelete={handleDeleteTemplate}
            createPending={createTemplate.isPending}
            updatePending={updateTemplate.isPending}
            deletePending={deleteTemplate.isPending}
          />

          {/* Logs */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[1.23rem] font-medium text-text-primary">Lịch sử thao tác</h3>
              <button
                type="button"
                onClick={() => void refetchLogs()}
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

      <CreateTreeDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={(p) => void handleCreateTree(p)}
        isLoading={isLoading}
      />

      <ConfirmationModal
        open={!!treeToDelete}
        onClose={() => setTreeToDelete(null)}
        onConfirm={() => void handleDeleteTree()}
        title="Xác nhận xóa cây Drive"
        description="Bạn có chắc muốn xóa cây Drive này? Dữ liệu Drive thật không bị ảnh hưởng, chỉ xóa bản ghi trong app."
        confirmText="Xóa"
        confirmType="danger"
        loading={deleteTree.isPending}
      />

      {treeToRename && (
        <Modal title="Đổi tên cây Drive" onClose={() => setTreeToRename(null)} size="sm">
          <form onSubmit={handleRenameTree} className="space-y-4">
            <input
              type="text"
              value={treeToRename.name}
              onChange={(e) => setTreeToRename({ ...treeToRename, name: e.target.value })}
              className="w-full px-3 h-10 rounded-sm border border-border-hairline bg-bg-primary text-text-primary focus:outline-none focus:border-accent"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setTreeToRename(null)} className="px-4 h-9 text-sm text-text-secondary">Hủy</button>
              <button
                type="submit"
                disabled={updateTree.isPending}
                className="px-4 h-9 bg-accent text-white rounded-sm text-sm disabled:opacity-50"
              >
                Lưu
              </button>
            </div>
          </form>
        </Modal>
      )}

      {(grantNode || bulkGrantItems) && (
        <Modal
          title={bulkGrantItems ? 'Cấp quyền hàng loạt' : 'Cấp quyền'}
          size="lg"
          onClose={() => {
            setGrantNode(null)
            setBulkGrantItems(null)
          }}
        >
          <SetPermissionsForm
            presetItems={
              bulkGrantItems ||
              (grantNode ? [{ id: grantNode.id, isSharedDrive: grantNode.isSharedDrive }] : undefined)
            }
            isLoading={isAppsScriptPending}
            onSubmit={(p) => void handleGrantSubmit(p)}
          />
        </Modal>
      )}

      {createFromTemplateNode && (
        <CreateFromTemplateModal
          node={{ id: createFromTemplateNode.id, name: createFromTemplateNode.name }}
          templates={templates ?? []}
          isLoading={isAppsScriptPending}
          onClose={() => setCreateFromTemplateNode(null)}
          onSubmit={(p) => void handleCreateFromTemplate(p)}
        />
      )}
      {copyNode && (
        <CopyFolderDialog
          node={{ id: copyNode.id, name: copyNode.name }}
          open
          onClose={() => setCopyNode(null)}
          onSubmit={(p) => void handleCopyFolder(p)}
          isLoading={isAppsScriptPending}
        />
      )}

      {moveNode && (
        <MoveItemDialog
          node={{ id: moveNode.id, name: moveNode.name, isSharedDrive: moveNode.isSharedDrive }}
          open
          onClose={() => setMoveNode(null)}
          onSubmit={(p) => void handleMoveItem(p)}
          isLoading={isAppsScriptPending}
        />
      )}

      <ConfirmationModal
        open={!!deleteNode}
        onClose={() => setDeleteNode(null)}
        onConfirm={() => void handleDeleteItem()}
        title="Xác nhận xóa folder"
        description={
          deleteNode
            ? `Bạn có chắc muốn xóa folder "${deleteNode.name}"? Folder sẽ được chuyển vào thùng rác Google Drive.`
            : ''
        }
        confirmText="Xóa"
        confirmType="danger"
        loading={isAppsScriptPending}
      />
    </PageContainer>
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
    <div className="overflow-auto max-h-64 border border-border-hairline rounded-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-bg-secondary sticky top-0">
          <tr>
            <th className="px-3 py-2 font-medium text-text-tertiary border-b border-border-hairline">Thờii gian</th>
            <th className="px-3 py-2 font-medium text-text-tertiary border-b border-border-hairline">Tác vụ</th>
            <th className="px-3 py-2 font-medium text-text-tertiary border-b border-border-hairline">Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-b border-border-hairline">
              <td className="px-3 py-2 text-text-secondary">
                {log.created_at ? new Date(log.created_at).toLocaleString('vi-VN') : '-'}
              </td>
              <td className="px-3 py-2 text-text-primary">{log.action}</td>
              <td className="px-3 py-2">
                {log.success ? (
                  <Badge variant="success">Thành công</Badge>
                ) : (
                  <Badge variant="danger">Thất bại</Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
