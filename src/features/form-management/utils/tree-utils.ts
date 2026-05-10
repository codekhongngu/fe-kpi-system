import { type TemplateField, type TemplateIndicator } from '../api/types'

export type TreeNode<T> = T & {
  children?: TreeNode<T>[]
}

export type FieldHeaderNode = TreeNode<TemplateField> & {
  colSpan: number
  rowSpan: number
  depth: number // 1-based index from root
}

export type IndicatorRowNode = TemplateIndicator & {
  isExpanded?: boolean
  hasChildren: boolean
}

/**
 * Builds a tree structure from a flat array of items with parentId.
 */
export function buildTree<T extends { id: string; parentId?: string | null }>(
  items: T[],
  parentId: string | null = null,
): TreeNode<T>[] {
  return items
    .filter((item) => (item.parentId || null) === parentId)
    .map((item) => ({
      ...item,
      children: buildTree(items, item.id),
    }))
}

/**
 * Calculates the maximum depth of a tree.
 */
function getTreeMaxDepth<T>(nodes: TreeNode<T>[]): number {
  if (!nodes || nodes.length === 0) return 0
  let max = 0
  for (const node of nodes) {
    const childDepth = getTreeMaxDepth(node.children ?? [])
    if (childDepth > max) max = childDepth
  }
  return max + 1
}

/**
 * Traverses the field tree to calculate colSpan, rowSpan, and depth.
 * Returns a 2D array representing rows of header cells.
 */
export function buildHeaderMatrix(
  fields: TemplateField[],
): FieldHeaderNode[][] {
  const tree = buildTree(fields)
  const maxDepth = getTreeMaxDepth(tree)
  const matrix: FieldHeaderNode[][] = Array.from({ length: maxDepth }, () => [])

  function traverse(
    node: TreeNode<TemplateField>,
    depth: number,
  ): FieldHeaderNode {
    const isLeaf = !node.children || node.children.length === 0
    let colSpan = 1
    const rowSpan = isLeaf ? maxDepth - depth + 1 : 1

    if (!isLeaf) {
      colSpan = 0
      for (const child of node.children!) {
        const childNode = traverse(child, depth + 1)
        colSpan += childNode.colSpan
      }
    }

    const headerNode: FieldHeaderNode = {
      ...node,
      colSpan,
      rowSpan,
      depth,
    }

    matrix[depth - 1].push(headerNode)
    return headerNode
  }

  for (const rootNode of tree) {
    traverse(rootNode, 1)
  }

  return matrix
}

/**
 * Flattens an indicator tree into a list of rows, handling expanded/collapsed state.
 */
export function flattenIndicatorTree(
  tree: TreeNode<TemplateIndicator>[],
  expandedIds: Set<string>,
): IndicatorRowNode[] {
  const result: IndicatorRowNode[] = []

  function traverse(nodes: TreeNode<TemplateIndicator>[]) {
    for (const node of nodes) {
      const hasChildren = Boolean(node.children && node.children.length > 0)
      const isExpanded = expandedIds.has(node.id)

      result.push({
        ...node,
        hasChildren,
        isExpanded,
      })

      if (hasChildren && isExpanded) {
        traverse(node.children!)
      }
    }
  }

  traverse(tree)
  return result
}
