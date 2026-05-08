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

export function buildSameLevelReorderPayload<T extends TreeItem>(items: T[], activeId: string, overId: string) {
  const active = items.find((item) => item.id === activeId)
  const over = items.find((item) => item.id === overId)
  if (!active || !over) return items.map((item) => ({ id: item.id, parentId: item.parentId ?? null }))

  const parentId = active.parentId ?? null
  if ((over.parentId ?? null) !== parentId) {
    return items.map((item) => ({ id: item.id, parentId: item.parentId ?? null }))
  }

  const siblings = items
    .filter((item) => (item.parentId ?? null) === parentId)
    .sort((a, b) => {
      if ((a.order ?? 0) !== (b.order ?? 0)) return (a.order ?? 0) - (b.order ?? 0)
      return a.id.localeCompare(b.id)
    })

  const fromIndex = siblings.findIndex((item) => item.id === activeId)
  const toIndex = siblings.findIndex((item) => item.id === overId)
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
    return siblings.map((item) => ({ id: item.id, parentId: item.parentId ?? null }))
  }

  const next = [...siblings]
  const [moved] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, moved)
  return next.map((item) => ({ id: item.id, parentId: item.parentId ?? null }))
}

export function reorderSameLevelItems<T extends TreeItem>(items: T[], activeId: string, overId: string) {
  const active = items.find((item) => item.id === activeId)
  const over = items.find((item) => item.id === overId)
  if (!active || !over) return items

  const parentId = active.parentId ?? null
  if ((over.parentId ?? null) !== parentId) return items

  const siblings = items
    .filter((item) => (item.parentId ?? null) === parentId)
    .sort((a, b) => {
      if ((a.order ?? 0) !== (b.order ?? 0)) return (a.order ?? 0) - (b.order ?? 0)
      return a.id.localeCompare(b.id)
    })

  const fromIndex = siblings.findIndex((item) => item.id === activeId)
  const toIndex = siblings.findIndex((item) => item.id === overId)
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return items

  const nextSiblings = [...siblings]
  const [moved] = nextSiblings.splice(fromIndex, 1)
  nextSiblings.splice(toIndex, 0, moved)

  const nextOrder = new Map(nextSiblings.map((item, index) => [item.id, index]))
  return items.map((item) =>
    (item.parentId ?? null) === parentId
      ? {
          ...item,
          order: nextOrder.get(item.id) ?? (item.order ?? 0),
        }
      : item,
  )
}
