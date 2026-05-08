export type TreeNode<T> = T & {
  children: Array<TreeNode<T>>
}

type TreeItem = {
  id: string
  parentId?: string | null
  order?: number
}

export function buildTree<T extends TreeItem>(items: T[]): Array<TreeNode<T>> {
  const map = new Map(
    items.map((item) => [
      item.id,
      {
        ...item,
        children: [] as Array<TreeNode<T>>,
      },
    ])
  )
  const roots: Array<TreeNode<T>> = []

  for (const node of map.values()) {
    const parentId = node.parentId ?? null
    if (parentId && map.has(parentId)) {
      map.get(parentId)?.children.push(node)
    } else {
      roots.push(node)
    }
  }

  const sortRecursive = (nodes: Array<TreeNode<T>>) => {
    nodes.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    nodes.forEach((node) => sortRecursive(node.children))
  }

  sortRecursive(roots)
  return roots
}

export function flattenTree<T extends TreeItem>(
  nodes: Array<TreeNode<T>>,
  depth = 0
): Array<T & { depth: number }> {
  const rows: Array<T & { depth: number }> = []
  for (const node of nodes) {
    rows.push({ ...(node as T), depth })
    rows.push(...flattenTree(node.children, depth + 1))
  }
  return rows
}

export function getSiblingIds<T extends TreeItem>(items: T[], item: T) {
  const parentId = item.parentId ?? null
  return items
    .filter((entry) => (entry.parentId ?? null) === parentId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((entry) => entry.id)
}

