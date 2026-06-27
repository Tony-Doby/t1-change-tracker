import { describe, it, expect } from 'vitest'
import {
  buildTree,
  pruneTree,
  collectMatchedParentIds,
  collectIds,
} from './drive-tree-utils'
import type { ScanFolderResult } from '../../types'

function makeResult(
  overrides: Partial<ScanFolderResult> & { id: string; name: string; path: string }
): ScanFolderResult {
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

describe('pruneTree', () => {
  it('returns full tree when all nodes match', () => {
    const results = [
      makeResult({ id: 'A', name: 'A', path: 'A', depth: 0 }),
      makeResult({ id: 'B', name: 'B', path: 'A/B', depth: 1 }),
    ]
    const tree = buildTree(results)
    const pruned = pruneTree(tree, new Set(['A', 'B']))
    expect(collectIds(pruned).sort()).toEqual(['A', 'B'])
  })

  it('keeps matched node and removes unmatched siblings', () => {
    const results = [
      makeResult({ id: 'A', name: 'A', path: 'A', depth: 0 }),
      makeResult({ id: 'B1', name: 'B1', path: 'A/B1', depth: 1 }),
      makeResult({ id: 'B2', name: 'B2', path: 'A/B2', depth: 1 }),
    ]
    const tree = buildTree(results)
    const pruned = pruneTree(tree, new Set(['B1']))

    expect(pruned).toHaveLength(1)
    expect(pruned[0].id).toBe('A')
    expect(pruned[0].children).toHaveLength(1)
    expect(pruned[0].children[0].id).toBe('B1')
  })

  it('keeps ancestor of matched deep node even if ancestor does not match', () => {
    const results = [
      makeResult({ id: 'A', name: 'A', path: 'A', depth: 0 }),
      makeResult({ id: 'B', name: 'B', path: 'A/B', depth: 1 }),
      makeResult({ id: 'C', name: 'C', path: 'A/B/C', depth: 2 }),
    ]
    const tree = buildTree(results)
    const pruned = pruneTree(tree, new Set(['C']))

    expect(collectIds(pruned).sort()).toEqual(['A', 'B', 'C'])
  })

  it('returns empty array when no nodes match', () => {
    const results = [
      makeResult({ id: 'A', name: 'A', path: 'A', depth: 0 }),
      makeResult({ id: 'B', name: 'B', path: 'A/B', depth: 1 }),
    ]
    const tree = buildTree(results)
    const pruned = pruneTree(tree, new Set(['X']))
    expect(pruned).toEqual([])
  })
})

describe('collectMatchedParentIds', () => {
  it('returns empty set when no matched nodes', () => {
    const results = [
      makeResult({ id: 'A', name: 'A', path: 'A', depth: 0 }),
      makeResult({ id: 'B', name: 'B', path: 'A/B', depth: 1 }),
    ]
    const tree = buildTree(results)
    expect(collectMatchedParentIds(tree, new Set())).toEqual(new Set())
  })

  it('collects ancestor ids of matched deep node', () => {
    const results = [
      makeResult({ id: 'A', name: 'A', path: 'A', depth: 0 }),
      makeResult({ id: 'B', name: 'B', path: 'A/B', depth: 1 }),
      makeResult({ id: 'C', name: 'C', path: 'A/B/C', depth: 2 }),
    ]
    const tree = buildTree(results)
    const parentIds = collectMatchedParentIds(tree, new Set(['C']))
    expect(parentIds).toEqual(new Set(['A', 'B']))
  })

  it('collects ancestors for multiple matched nodes in different branches', () => {
    const results = [
      makeResult({ id: 'A', name: 'A', path: 'A', depth: 0 }),
      makeResult({ id: 'B1', name: 'B1', path: 'A/B1', depth: 1 }),
      makeResult({ id: 'C1', name: 'C1', path: 'A/B1/C1', depth: 2 }),
      makeResult({ id: 'B2', name: 'B2', path: 'A/B2', depth: 1 }),
      makeResult({ id: 'C2', name: 'C2', path: 'A/B2/C2', depth: 2 }),
    ]
    const tree = buildTree(results)
    const parentIds = collectMatchedParentIds(tree, new Set(['C1', 'C2']))
    expect(parentIds).toEqual(new Set(['A', 'B1', 'B2']))
  })
})
