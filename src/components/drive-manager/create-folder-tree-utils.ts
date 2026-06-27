import type { CreateFolderTreeResult } from '../../types'

// BUG-041: 1 quyền áp không thành công khi tạo cây folder từ template, kèm tên folder.
export interface PermissionFailure {
  folder: string
  email?: string
  scope?: string
  role: string
  error: string
}

// BUG-041 (pure): Gom mọi quyền áp lỗi từ kết quả createFolderTree.
// Apps Script tạo folder xong vẫn báo success, nhưng từng quyền có thể lỗi (ghi vào
// permissionsApplied[].error). Hàm này rút các lỗi đó để hiển thị cho người dùng,
// tránh tình trạng "âm thầm lệch" giữa template và quyền thật trên Drive.
export function collectPermissionFailures(
  result: CreateFolderTreeResult | null | undefined
): PermissionFailure[] {
  if (!result || !Array.isArray(result.nodes)) return []
  const failures: PermissionFailure[] = []
  for (const node of result.nodes) {
    for (const perm of node.permissionsApplied ?? []) {
      if (perm.error) {
        failures.push({
          folder: node.name,
          email: perm.email,
          scope: perm.scope,
          role: perm.role,
          error: perm.error,
        })
      }
    }
  }
  return failures
}

// BUG-041 (pure): Tóm tắt ngắn gọn các lỗi quyền để bỏ vào toast.
export function formatPermissionFailures(failures: PermissionFailure[], max = 3): string {
  const head = failures
    .slice(0, max)
    .map((f) => `${f.folder}: ${f.email ?? f.scope ?? '—'} (${f.role})`)
    .join('; ')
  return failures.length > max ? `${head}; …+${failures.length - max}` : head
}
