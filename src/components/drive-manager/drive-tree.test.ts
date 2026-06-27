import { describe, it, expect } from 'vitest'
import { buildTree } from './DriveTreeTable'
import type { ScanFolderResult } from '../../types'

function makeResult(overrides: Partial<ScanFolderResult> & { id: string; name: string; path: string }): ScanFolderResult {
  return {
    depth: 0,
    url: `https://drive.google.com/drive/folders/${overrides.id}`,
    driveId: null,
    isSharedDrive: false,
    ...overrides,
  }
}

describe('buildTree', () => {
  it('returns empty array for empty input', () => {
    expect(buildTree([])).toEqual([])
  })

  it('returns single root node', () => {
    const results = [makeResult({ id: 'A', name: 'A', path: 'A', depth: 0 })]
    const tree = buildTree(results)
    expect(tree).toHaveLength(1)
    expect(tree[0].id).toBe('A')
    expect(tree[0].children).toEqual([])
  })

  it('builds nested tree from flat results by path', () => {
    const results = [
      makeResult({ id: 'A', name: 'A', path: 'A', depth: 0 }),
      makeResult({ id: 'B', name: 'B', path: 'A/B', depth: 1 }),
      makeResult({ id: 'C', name: 'C', path: 'A/B/C', depth: 2 }),
    ]
    const tree = buildTree(results)

    expect(tree).toHaveLength(1)
    expect(tree[0].id).toBe('A')
    expect(tree[0].children).toHaveLength(1)
    expect(tree[0].children[0].id).toBe('B')
    expect(tree[0].children[0].children).toHaveLength(1)
    expect(tree[0].children[0].children[0].id).toBe('C')
  })

  it('handles multiple children at same depth', () => {
    const results = [
      makeResult({ id: 'A', name: 'A', path: 'A', depth: 0 }),
      makeResult({ id: 'B1', name: 'B1', path: 'A/B1', depth: 1 }),
      makeResult({ id: 'B2', name: 'B2', path: 'A/B2', depth: 1 }),
    ]
    const tree = buildTree(results)

    expect(tree[0].children).toHaveLength(2)
    expect(tree[0].children.map((c) => c.id).sort()).toEqual(['B1', 'B2'])
  })

  it('falls back to root when parent not found', () => {
    const results = [
      makeResult({ id: 'A', name: 'A', path: 'A', depth: 0 }),
      makeResult({ id: 'Orphan', name: 'Orphan', path: 'X/Orphan', depth: 1 }),
    ]
    const tree = buildTree(results)

    expect(tree).toHaveLength(2)
    expect(tree.some((n) => n.id === 'Orphan')).toBe(true)
  })

  it('preserves all result fields on nodes', () => {
    const results = [
      makeResult({
        id: 'A',
        name: 'A',
        path: 'A',
        depth: 0,
        isSharedDrive: true,
        driveId: 'drive-123',
      }),
    ]
    const tree = buildTree(results)

    expect(tree[0]).toMatchObject({
      id: 'A',
      name: 'A',
      path: 'A',
      depth: 0,
      isSharedDrive: true,
      driveId: 'drive-123',
      children: [],
    })
  })
})
