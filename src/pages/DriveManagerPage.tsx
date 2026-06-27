import { useMemo, useState } from 'react'
import { HardDrive } from 'lucide-react'
import PageContainer from '../ui/layout/PageContainer'
import PageHeader from '../ui/layout/PageHeader'
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
import DriveManagerTabs, { type DriveManagerTab } from '../components/drive-manager/DriveManagerTabs'
import TreeListView from '../components/drive-manager/TreeListView'
import TreeDetailView from '../components/drive-manager/TreeDetailView'
import ScanFormView from '../components/drive-manager/ScanFormView'
import ScanResultsView from '../components/drive-manager/ScanResultsView'
import TemplateListView from '../components/drive-manager/TemplateListView'
import TemplateDetailView from '../components/drive-manager/TemplateDetailView'
import TemplateEditorModal from '../components/drive-manager/TemplateEditorModal'
import LogsView from '../components/drive-manager/LogsView'
import CreateTreeDialog from '../components/drive-manager/CreateTreeDialog'
import CreateFromTemplateModal from '../components/drive-manager/CreateFromTemplateModal'
import CopyFolderDialog from '../components/drive-manager/CopyFolderDialog'
import MoveItemDialog from '../components/drive-manager/MoveItemDialog'
import SetPermissionsForm from '../components/apps-script/SetPermissionsForm'
import Modal from '../ui/layout/Modal'
import type {
  AppsScriptAction,
  AppsScriptParams,
  ScanFolderResult,
  ScanFoldersParams,
  SetPermissionsParams,
  DriveTemplateFolder,
} from '../types'
import type { PresetItem } from '../components/apps-script/SetPermissionsForm'
import type { DriveTreeNode } from '../components/drive-manager/drive-tree-utils'
import type { TreeAction } from '../components/drive-manager/DriveTreeTable'
import { DEFAULT_TEMPLATE_ROOT } from '../components/drive-manager/template-editor-utils'

// FEAT-037: Drive Manager with full-page tabs, drill-down views, and breadcrumb navigation.
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

  // Tab state.
  const [activeTab, setActiveTab] = useState<DriveManagerTab>('trees')

  // Drill-down states.
  const [selectedTreeId, setSelectedTreeId] = useState<string | null>(null)
  const [scanResults, setScanResults] = useState<ScanFolderResult[] | null>(null)
  const [scanParams, setScanParams] = useState<ScanFoldersParams | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)

  // Modals.
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [treeToDelete, setTreeToDelete] = useState<string | null>(null)
  const [treeToRename, setTreeToRename] = useState<{ id: string; name: string } | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<{ id: string; name: string; root: DriveTemplateFolder } | null>(null)
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null)

  // Context action modals.
  const [grantNode, setGrantNode] = useState<DriveTreeNode | null>(null)
  const [bulkGrantItems, setBulkGrantItems] = useState<PresetItem[] | null>(null)
  const [createFromTemplateNode, setCreateFromTemplateNode] = useState<{ id: string; name: string } | null>(null)
  const [copyNode, setCopyNode] = useState<DriveTreeNode | null>(null)
  const [moveNode, setMoveNode] = useState<DriveTreeNode | null>(null)
  const [deleteNode, setDeleteNode] = useState<DriveTreeNode | null>(null)

  const activeTree = useMemo(
    () => savedTrees?.find((t) => t.id === selectedTreeId) ?? null,
    [savedTrees, selectedTreeId]
  )

  const activeTemplate = useMemo(
    () => templates?.find((t) => t.id === selectedTemplateId) ?? null,
    [templates, selectedTemplateId]
  )

  // Reset drill-down when tab changes.
  const handleTabChange = (tab: DriveManagerTab) => {
    setActiveTab(tab)
  }

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

  // Tree operations.
  const handleRefreshTreeById = async (treeId: string) => {
    const tree = savedTrees?.find((t) => t.id === treeId)
    if (!tree) return
    const params: ScanFoldersParams = {
      rootFolderId: tree.root_folder_id,
      depth: tree.depth,
      matchType: 'contains',
      pattern: '',
    }
    const data = (await executeAction('scanFolders', params)) as ScanFolderResult[]
    await updateTree.mutateAsync({
      id: tree.id,
      updates: {
        tree_data: data,
        refreshed_at: new Date().toISOString(),
      },
    })
    show('Đã làm mới cây Drive', 'success')
  }

  const handleQuickScan = async (tree: { id: string; root_folder_id: string; depth: number }) => {
    const params: ScanFoldersParams = {
      rootFolderId: tree.root_folder_id,
      depth: tree.depth,
      matchType: 'contains',
      pattern: '',
    }
    const data = (await executeAction('scanFolders', params)) as ScanFolderResult[]
    setScanParams(params)
    setScanResults(data)
    setActiveTab('scan')
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
    setActiveTab('trees')
    setSelectedTreeId(created.id)
    setCreateDialogOpen(false)
    show('Đã thêm cây Drive mới', 'success')
  }

  const handleDeleteTree = async () => {
    if (!treeToDelete) return
    await deleteTree.mutateAsync(treeToDelete)
    if (selectedTreeId === treeToDelete) {
      setSelectedTreeId(null)
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

  // Scan operations.
  const handleScan = async (params: ScanFoldersParams) => {
    setScanParams(params)
    const data = (await executeAction('scanFolders', params)) as ScanFolderResult[]
    setScanResults(data)
  }

  const handleSaveScanAsTree = async (name: string, params: ScanFoldersParams, results: ScanFolderResult[]) => {
    const created = await createTree.mutateAsync({
      name,
      root_url: `https://drive.google.com/drive/folders/${params.rootFolderId}`,
      root_folder_id: params.rootFolderId,
      depth: params.depth,
      tree_data: results,
      is_shared_drive: results[0]?.isSharedDrive ?? null,
    })
    setActiveTab('trees')
    setSelectedTreeId(created.id)
    setScanResults(null)
    setScanParams(null)
    show('Đã lưu cây Drive mới', 'success')
  }

  // Template operations.
  const handleCreateTemplate = async (data: { name: string; root: DriveTemplateFolder }) => {
    try {
      await createTemplate.mutateAsync({
        name: data.name,
        root: data.root,
        created_by: null,
      })
      setEditingTemplate(null)
      show('Đã tạo template', 'success')
    } catch (err: unknown) {
      show((err as Error).message ?? 'Lỗi khi lưu template', 'error')
    }
  }

  const handleUpdateTemplate = async (data: { name: string; root: DriveTemplateFolder }) => {
    if (!editingTemplate) return
    try {
      await updateTemplate.mutateAsync({ id: editingTemplate.id, updates: data })
      setEditingTemplate(null)
      show('Đã cập nhật template', 'success')
    } catch (err: unknown) {
      show((err as Error).message ?? 'Lỗi khi cập nhật template', 'error')
    }
  }

  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return
    await deleteTemplate.mutateAsync(templateToDelete)
    if (selectedTemplateId === templateToDelete) {
      setSelectedTemplateId(null)
    }
    setTemplateToDelete(null)
    show('Đã xóa template', 'success')
  }

  // Context actions.
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

  // Render tabs.
  const renderTreesTab = () => {
    if (selectedTreeId && activeTree) {
      return (
        <TreeDetailView
          tree={activeTree}
          onBack={() => setSelectedTreeId(null)}
          onRefresh={() => void handleRefreshTreeById(activeTree.id)}
          onAction={handleTreeAction}
          onBulkGrant={setBulkGrantItems}
          onCreateFromTemplate={setCreateFromTemplateNode}
          isLoading={isLoading}
        />
      )
    }

    return (
      <TreeListView
        trees={savedTrees ?? []}
        isLoading={treesLoading}
        onSelect={setSelectedTreeId}
        onRefresh={(tree) => void handleRefreshTreeById(tree.id)}
        onQuickScan={(tree) => void handleQuickScan(tree)}
        onRename={(tree) => setTreeToRename({ id: tree.id, name: tree.name || '' })}
        onDelete={setTreeToDelete}
        onCreate={() => setCreateDialogOpen(true)}
      />
    )
  }

  const renderScanTab = () => {
    if (scanResults && scanParams) {
      return (
        <ScanResultsView
          results={scanResults}
          params={scanParams}
          onBack={() => {
            setScanResults(null)
            setScanParams(null)
          }}
          onSaveAsTree={(name, params, results) => void handleSaveScanAsTree(name, params, results)}
          onBulkGrant={setBulkGrantItems}
          isSaving={createTree.isPending}
        />
      )
    }

    return <ScanFormView onSubmit={(p) => void handleScan(p)} isLoading={isAppsScriptPending} />
  }

  const renderTemplatesTab = () => {
    if (selectedTemplateId && activeTemplate) {
      return (
        <TemplateDetailView
          template={activeTemplate}
          onBack={() => setSelectedTemplateId(null)}
          onEdit={() => setEditingTemplate({ id: activeTemplate.id, name: activeTemplate.name, root: activeTemplate.root })}
          onDelete={() => setTemplateToDelete(activeTemplate.id)}
        />
      )
    }

    return (
      <TemplateListView
        templates={templates ?? []}
        isLoading={templatesLoading}
        onSelect={setSelectedTemplateId}
        onCreate={() => setEditingTemplate({ id: '', name: '', root: DEFAULT_TEMPLATE_ROOT })}
        onDelete={setTemplateToDelete}
      />
    )
  }

  const renderLogsTab = () => {
    return <LogsView logs={logs} isLoading={logsLoading} onRefresh={() => void refetchLogs()} />
  }

  return (
    <PageContainer>
      <PageHeader title="Drive Manager" icon={<HardDrive className="w-7 h-7" />} />

      <DriveManagerTabs activeTab={activeTab} onChange={handleTabChange} />

      <div className="min-h-[24rem]">
        {activeTab === 'trees' && renderTreesTab()}
        {activeTab === 'scan' && renderScanTab()}
        {activeTab === 'templates' && renderTemplatesTab()}
        {activeTab === 'logs' && renderLogsTab()}
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

      <ConfirmationModal
        open={!!templateToDelete}
        onClose={() => setTemplateToDelete(null)}
        onConfirm={() => void handleDeleteTemplate()}
        title="Xác nhận xóa template"
        description="Bạn có chắc muốn xóa template này?"
        confirmText="Xóa"
        confirmType="danger"
        loading={deleteTemplate.isPending}
      />

      {editingTemplate && (
        <TemplateEditorModal
          template={editingTemplate.id ? { id: editingTemplate.id, name: editingTemplate.name, root: editingTemplate.root, created_by: null, created_at: '', updated_at: '' } : null}
          onClose={() => setEditingTemplate(null)}
          onSave={(data) => {
            if (editingTemplate.id) {
              void handleUpdateTemplate(data)
            } else {
              void handleCreateTemplate(data)
            }
          }}
          isPending={createTemplate.isPending || updateTemplate.isPending}
        />
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
