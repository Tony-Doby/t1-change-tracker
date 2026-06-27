import { describe, it, expect } from 'vitest'
import type { AppliedPermission, CreatedFolderNode, CreateFolderTreeResult } from '../../types'
import {
  collectPermissionFailures,
  formatPermissionFailures,
} from './create-folder-tree-utils'

// BUG-041: Quyền áp lỗi (vd organizer cho folder con trong Shared Drive) phải nổi lên,
// không được "âm thầm lệch". Trước fix: handleCreateFromTemplate luôn báo thành công.

function ok(name: string, ...perms: AppliedPermission[]): CreatedFolderNode {
  return {
    id: `id-${name}`,
    name,
    depth: 0,
    parentFolderId: 'parent',
    url: `https://drive.google.com/drive/folders/id-${name}`,
    permissionsApplied: perms,
  }
}

describe('collectPermissionFailures', () => {
  it('returns [] for null/undefined/empty result', () => {
    expect(collectPermissionFailures(null)).toEqual([])
    expect(collectPermissionFailures(undefined)).toEqual([])
    expect(collectPermissionFailures({ parentFolderId: 'p', nodes: [] })).toEqual([])
  })

  it('returns [] when every permission applied successfully', () => {
    const result: CreateFolderTreeResult = {
      parentFolderId: 'p',
      nodes: [
        ok('A', { email: 'a@x.com', role: 'reader' }, { email: 'b@x.com', role: 'fileOrganizer' }),
      ],
    }
    expect(collectPermissionFailures(result)).toEqual([])
  })

  it('extracts only errored permissions, tagged with folder name', () => {
    const result: CreateFolderTreeResult = {
      parentFolderId: 'p',
      nodes: [
        ok('Root', { email: 'ok@x.com', role: 'reader' }),
        ok(
          'Marketing',
          { email: 'good@x.com', role: 'writer' },
          { email: 'boss@x.com', role: 'organizer', error: 'Organizer role is only valid for shared drives' }
        ),
      ],
    }
    const failures = collectPermissionFailures(result)
    expect(failures).toHaveLength(1)
    expect(failures[0]).toMatchObject({
      folder: 'Marketing',
      email: 'boss@x.com',
      role: 'organizer',
    })
    expect(failures[0].error).toContain('Organizer role')
  })

  it('tolerates a node with missing permissionsApplied', () => {
    const result = {
      parentFolderId: 'p',
      nodes: [{ id: 'x', name: 'X', depth: 0, parentFolderId: 'p', url: '' }],
    } as unknown as CreateFolderTreeResult
    expect(collectPermissionFailures(result)).toEqual([])
  })
})

describe('formatPermissionFailures', () => {
  it('joins failures and truncates beyond max', () => {
    const failures = [
      { folder: 'A', email: 'a@x.com', role: 'organizer', error: 'e' },
      { folder: 'B', email: 'b@x.com', role: 'organizer', error: 'e' },
      { folder: 'C', email: 'c@x.com', role: 'organizer', error: 'e' },
      { folder: 'D', email: 'd@x.com', role: 'organizer', error: 'e' },
    ]
    const out = formatPermissionFailures(failures, 3)
    expect(out).toContain('A: a@x.com (organizer)')
    expect(out).toContain('…+1')
    expect(out).not.toContain('D: d@x.com')
  })

  it('falls back to scope or dash when email missing', () => {
    expect(
      formatPermissionFailures([{ folder: 'Pub', scope: 'anyone', role: 'reader', error: 'e' }])
    ).toBe('Pub: anyone (reader)')
    expect(
      formatPermissionFailures([{ folder: 'Pub', role: 'reader', error: 'e' }])
    ).toBe('Pub: — (reader)')
  })
})
