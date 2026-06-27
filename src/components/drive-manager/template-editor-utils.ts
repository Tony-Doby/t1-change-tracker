import type { DriveTemplateFolder, DriveRole } from '../../types'

export const DRIVE_ROLES: DriveRole[] = [
  'reader',
  'commenter',
  'writer',
  'fileOrganizer',
  'organizer',
]

export const DEFAULT_TEMPLATE_ROOT: DriveTemplateFolder = {
  name: 'A0 - Báo cáo',
  permissions: [
    { email: 'hos@era.com.vn', role: 'reader' },
    { email: 'huu.tran@era.com.vn', role: 'organizer' },
  ],
  children: [
    {
      name: 'B1 - Public',
      permissions: [{ scope: 'anyone', role: 'reader' }],
      children: [],
    },
    {
      name: 'C1 - Marketing',
      permissions: [
        { email: 'ps@era.com.vn', role: 'fileOrganizer' },
        { email: 'mkt@era.com.vn', role: 'reader' },
      ],
      children: [
        {
          name: 'D2 - Campaign',
          permissions: [
            { email: 'mkt@era.com.vn', role: 'fileOrganizer' },
            { email: 'agent@era.com.vn', role: 'reader' },
          ],
          children: [],
        },
      ],
    },
  ],
}

export function roleLabel(role: DriveRole): string {
  switch (role) {
    case 'reader':
      return 'Người xem'
    case 'commenter':
      return 'Người nhận xét'
    case 'writer':
      return 'Người chỉnh sửa'
    case 'fileOrganizer':
      return 'Người quản lý nội dung'
    case 'organizer':
      return 'Người quản lý'
    default:
      return role
  }
}

export function createEmptyFolder(name = 'Folder mới'): DriveTemplateFolder {
  return {
    name,
    permissions: [],
    children: [],
  }
}

export function findNode(root: DriveTemplateFolder, path: number[]): DriveTemplateFolder | null {
  let current: DriveTemplateFolder = root
  for (const index of path) {
    if (!current.children || index < 0 || index >= current.children.length) {
      return null
    }
    current = current.children[index]
  }
  return current
}

export function updateNode(
  root: DriveTemplateFolder,
  path: number[],
  updater: (node: DriveTemplateFolder) => DriveTemplateFolder
): DriveTemplateFolder {
  if (path.length === 0) {
    return updater(root)
  }
  const [index, ...rest] = path
  const children = [...(root.children || [])]
  if (index < 0 || index >= children.length) return root
  children[index] = updateNode(children[index], rest, updater)
  return { ...root, children }
}

export function addChild(
  root: DriveTemplateFolder,
  parentPath: number[],
  child: DriveTemplateFolder = createEmptyFolder()
): DriveTemplateFolder {
  if (parentPath.length === 0) {
    return { ...root, children: [...(root.children || []), child] }
  }
  const [index, ...rest] = parentPath
  const children = [...(root.children || [])]
  if (index < 0 || index >= children.length) return root
  children[index] = addChild(children[index], rest, child)
  return { ...root, children }
}

export function removeNode(root: DriveTemplateFolder, path: number[]): DriveTemplateFolder {
  if (path.length === 0) return root
  if (path.length === 1) {
    const [index] = path
    const children = (root.children || []).filter((_, i) => i !== index)
    return { ...root, children }
  }
  const [index, ...rest] = path
  const children = [...(root.children || [])]
  if (index < 0 || index >= children.length) return root
  children[index] = removeNode(children[index], rest)
  return { ...root, children }
}

export interface ValidationError {
  path: number[]
  message: string
}

export function validateTemplate(root: DriveTemplateFolder): ValidationError[] {
  const errors: ValidationError[] = []
  validateNode(root, [], errors)
  return errors
}

function validateNode(
  node: DriveTemplateFolder,
  path: number[],
  errors: ValidationError[],
  siblingNames: string[] = []
) {
  if (!node.name || node.name.trim() === '') {
    errors.push({ path, message: 'Tên folder không được để trống' })
  }
  if (node.name && siblingNames.includes(node.name.trim())) {
    errors.push({ path, message: 'Tên folder bị trùng trong cùng một cấp' })
  }

  node.permissions?.forEach((perm, idx) => {
    if (perm.scope === 'anyone') return
    if (!perm.email || perm.email.trim() === '') {
      errors.push({ path: [...path, idx], message: 'Email không được để trống' })
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(perm.email.trim())) {
      errors.push({ path: [...path, idx], message: 'Email không hợp lệ' })
    }
  })

  const names = node.children?.map((c) => c.name.trim()) || []
  node.children?.forEach((child, idx) => {
    validateNode(child, [...path, idx], errors, names.filter((_, i) => i !== idx))
  })
}

export function countFolders(node: DriveTemplateFolder): number {
  return 1 + (node.children || []).reduce((sum, child) => sum + countFolders(child), 0)
}

export function countPermissions(node: DriveTemplateFolder): number {
  return (
    (node.permissions?.length || 0) +
    (node.children || []).reduce((sum, child) => sum + countPermissions(child), 0)
  )
}
