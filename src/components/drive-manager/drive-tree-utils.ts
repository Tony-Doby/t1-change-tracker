import { useMemo, useState } from 'react'
import type { ScanFolderResult } from '../../types'

export interface DriveTreeNode extends ScanFolderResult {
  children: DriveTreeNode[]
}

export function buildTree(results: ScanFolderResult[]): DriveTreeNode[] {
  const rootNodes: DriveTreeNode[] = []
  const nodeMap = new Map<string, DriveTreeNode>()

  // Create nodes.
  results.forEach((r) => {
    nodeMap.set(r.id, { ...r, children: [] })
  })

  // Build parent-child relationships based on path.
  results.forEach((r) => {
    const node = nodeMap.get(r.id)
    if (!node) return

    if (r.depth === 0) {
      rootNodes.push(node)
      return
    }

    // Find parent: the folder whose path is the immediate parent of this node's path.
    const parentPath = r.path.split('/').slice(0, -1).join('/')
    const parent = results.find(
      (candidate) =>
        candidate.depth === r.depth - 1 &&
        (candidate.path === parentPath || (parentPath === '' && candidate.depth === 0))
    )

    if (parent) {
      const parentNode = nodeMap.get(parent.id)
      if (parentNode) parentNode.children.push(node)
    } else {
      // Fallback: attach to root if parent not found.
      rootNodes.push(node)
    }
  })

  return rootNodes
}

export function useDriveTree(results: ScanFolderResult[]) {
  const tree = useMemo(() => buildTree(results), [results])
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const allIds = new Set<string>()
    results.forEach((r) => allIds.add(r.id))
    return allIds
  })

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const expandAll = () => {
    const allIds = new Set<string>()
    results.forEach((r) => allIds.add(r.id))
    setExpandedIds(allIds)
  }

  const collapseAll = () => setExpandedIds(new Set())

  return { tree, expandedIds, setExpandedIds, toggleExpand, expandAll, collapseAll }
}

export function collectIds(nodes: DriveTreeNode[]): string[] {
  const ids: string[] = []
  nodes.forEach((n) => {
    ids.push(n.id)
    ids.push(...collectIds(n.children))
  })
  return ids
}

// Keep nodes that match the filter, plus all ancestors needed to display them.
export function pruneTree(nodes: DriveTreeNode[], matchedIds: Set<string>): DriveTreeNode[] {
  return nodes
    .map((node) => {
      const prunedChildren = pruneTree(node.children, matchedIds)
      const keep = matchedIds.has(node.id) || prunedChildren.length > 0
      if (!keep) return null
      return { ...node, children: prunedChildren }
    })
    .filter(Boolean) as DriveTreeNode[]
}

// Collect ids of all ancestor nodes that have at least one matched descendant.
export function collectMatchedParentIds(
  nodes: DriveTreeNode[],
  matchedIds: Set<string>,
  parentIds: string[] = []
): Set<string> {
  const result = new Set<string>()
  nodes.forEach((node) => {
    const isMatched = matchedIds.has(node.id)
    const childParentIds = [...parentIds, node.id]
    const childResults = collectMatchedParentIds(node.children, matchedIds, childParentIds)
    childResults.forEach((id) => result.add(id))
    if (isMatched) {
      parentIds.forEach((id) => result.add(id))
    }
  })
  return result
}
