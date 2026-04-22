import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { type TemplateField, type TemplateIndicator } from '@/features/form-management/api/types'

type BuilderStatus = 'idle' | 'saving'

type BuilderState = {
  templateId: string | null
  indicators: TemplateIndicator[]
  attributes: TemplateField[]
  expandedIndicatorIds: string[]
  expandedAttributeIds: string[]
  status: BuilderStatus
  isDirty: boolean
}

type HydratePayload = {
  templateId: string
  indicators: TemplateIndicator[]
  attributes: TemplateField[]
}

const initialState: BuilderState = {
  templateId: null,
  indicators: [],
  attributes: [],
  expandedIndicatorIds: [],
  expandedAttributeIds: [],
  status: 'idle',
  isDirty: false,
}

type TreeItem = {
  id: string
  parentId?: string | null
  order?: number
}

function withOrderDefaults<T extends TreeItem>(items: T[]): T[] {
  return items.map((item, index) => ({
    ...item,
    parentId: item.parentId ?? null,
    order: item.order ?? index + 1,
  }))
}

function isDescendant<T extends TreeItem>(items: T[], rootId: string, targetId: string | null) {
  if (!targetId) return false
  if (targetId === rootId) return true

  let current: string | null = targetId
  while (current) {
    const node = items.find((item) => item.id === current)
    const parentId = node?.parentId ?? null
    if (parentId === rootId) return true
    current = parentId
  }
  return false
}

function normalizeSiblingOrders<T extends TreeItem>(items: T[], parentId: string | null) {
  const siblings = items
    .filter((item) => (item.parentId ?? null) === parentId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  siblings.forEach((item, index) => {
    item.order = index + 1
  })
}

function moveItemWithParentChange<T extends TreeItem>(
  items: T[],
  activeId: string,
  newParentId: string | null,
  overId?: string
) {
  const active = items.find((item) => item.id === activeId)
  if (!active) return
  if (isDescendant(items, activeId, newParentId)) return

  const previousParentId = active.parentId ?? null
  active.parentId = newParentId

  const newSiblings = items
    .filter((item) => (item.parentId ?? null) === newParentId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  const activeIndex = newSiblings.findIndex((item) => item.id === activeId)
  const targetIndex =
    overId != null ? newSiblings.findIndex((item) => item.id === overId) : newSiblings.length - 1

  if (activeIndex !== -1 && targetIndex !== -1 && activeIndex !== targetIndex) {
    const [moved] = newSiblings.splice(activeIndex, 1)
    newSiblings.splice(targetIndex, 0, moved)
  }

  newSiblings.forEach((item, index) => {
    item.order = index + 1
  })

  normalizeSiblingOrders(items, previousParentId)
  normalizeSiblingOrders(items, newParentId)
}

function reorderWithinSameParent<T extends TreeItem>(items: T[], activeId: string, overId: string) {
  const active = items.find((item) => item.id === activeId)
  const over = items.find((item) => item.id === overId)
  if (!active || !over) return

  const parentId = active.parentId ?? null
  if ((over.parentId ?? null) !== parentId) return

  const siblings = items
    .filter((item) => (item.parentId ?? null) === parentId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const fromIndex = siblings.findIndex((item) => item.id === activeId)
  const toIndex = siblings.findIndex((item) => item.id === overId)
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return

  const [moved] = siblings.splice(fromIndex, 1)
  siblings.splice(toIndex, 0, moved)
  siblings.forEach((item, index) => {
    item.order = index + 1
  })
}

const formBuilderSlice = createSlice({
  name: 'formBuilder',
  initialState,
  reducers: {
    hydrateFromTemplate: (state, action: PayloadAction<HydratePayload>) => {
      state.templateId = action.payload.templateId
      state.indicators = withOrderDefaults(action.payload.indicators)
      state.attributes = withOrderDefaults(action.payload.attributes)
      state.expandedIndicatorIds = []
      state.expandedAttributeIds = []
      state.status = 'idle'
      state.isDirty = false
    },
    clearBuilderState: () => initialState,
    setBuilderStatus: (state, action: PayloadAction<BuilderStatus>) => {
      state.status = action.payload
    },
    markBuilderClean: (state) => {
      state.isDirty = false
    },
    toggleIndicatorExpanded: (state, action: PayloadAction<string>) => {
      const id = action.payload
      if (state.expandedIndicatorIds.includes(id)) {
        state.expandedIndicatorIds = state.expandedIndicatorIds.filter((item) => item !== id)
        return
      }
      state.expandedIndicatorIds.push(id)
    },
    toggleAttributeExpanded: (state, action: PayloadAction<string>) => {
      const id = action.payload
      if (state.expandedAttributeIds.includes(id)) {
        state.expandedAttributeIds = state.expandedAttributeIds.filter((item) => item !== id)
        return
      }
      state.expandedAttributeIds.push(id)
    },
    indicatorReorder: (
      state,
      action: PayloadAction<{ activeId: string; overId: string }>
    ) => {
      reorderWithinSameParent(state.indicators, action.payload.activeId, action.payload.overId)
      state.isDirty = true
    },
    indicatorReparent: (
      state,
      action: PayloadAction<{ activeId: string; newParentId: string | null; overId?: string }>
    ) => {
      moveItemWithParentChange(
        state.indicators,
        action.payload.activeId,
        action.payload.newParentId,
        action.payload.overId
      )
      state.isDirty = true
    },
    attributeReorder: (
      state,
      action: PayloadAction<{ activeId: string; overId: string }>
    ) => {
      reorderWithinSameParent(state.attributes, action.payload.activeId, action.payload.overId)
      state.isDirty = true
    },
    attributeReparent: (
      state,
      action: PayloadAction<{ activeId: string; newParentId: string | null; overId?: string }>
    ) => {
      moveItemWithParentChange(
        state.attributes,
        action.payload.activeId,
        action.payload.newParentId,
        action.payload.overId
      )
      state.isDirty = true
    },
  },
})

export const {
  hydrateFromTemplate,
  clearBuilderState,
  setBuilderStatus,
  markBuilderClean,
  toggleIndicatorExpanded,
  toggleAttributeExpanded,
  indicatorReorder,
  indicatorReparent,
  attributeReorder,
  attributeReparent,
} = formBuilderSlice.actions

export const formBuilderReducer = formBuilderSlice.reducer

export type FormBuilderTreeNode<T extends TreeItem> = T & {
  children: Array<FormBuilderTreeNode<T>>
}

function buildTree<T extends TreeItem>(items: T[]): Array<FormBuilderTreeNode<T>> {
  const map = new Map(
    items.map((item) => [
      item.id,
      {
        ...item,
        children: [] as Array<FormBuilderTreeNode<T>>,
      },
    ])
  )
  const roots: Array<FormBuilderTreeNode<T>> = []

  for (const node of map.values()) {
    const parentId = node.parentId ?? null
    if (parentId && map.has(parentId)) {
      map.get(parentId)?.children.push(node)
    } else {
      roots.push(node)
    }
  }

  const sortRecursive = (nodes: Array<FormBuilderTreeNode<T>>) => {
    nodes.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    nodes.forEach((node) => sortRecursive(node.children))
  }
  sortRecursive(roots)

  return roots
}

function flattenTree<T extends TreeItem>(
  nodes: Array<FormBuilderTreeNode<T>>,
  depth = 0
): Array<T & { depth: number }> {
  const rows: Array<T & { depth: number }> = []
  for (const node of nodes) {
    rows.push({ ...(node as T), depth })
    rows.push(...flattenTree(node.children, depth + 1))
  }
  return rows
}

export const selectFormBuilderState = (state: { formBuilder: BuilderState }) => state.formBuilder
export const selectBuilderStatus = (state: { formBuilder: BuilderState }) => state.formBuilder.status
export const selectBuilderDirty = (state: { formBuilder: BuilderState }) => state.formBuilder.isDirty
export const selectIndicators = (state: { formBuilder: BuilderState }) => state.formBuilder.indicators
export const selectAttributes = (state: { formBuilder: BuilderState }) => state.formBuilder.attributes
export const selectExpandedIndicatorIds = (state: { formBuilder: BuilderState }) =>
  state.formBuilder.expandedIndicatorIds
export const selectExpandedAttributeIds = (state: { formBuilder: BuilderState }) =>
  state.formBuilder.expandedAttributeIds

export const selectIndicatorTree = createSelector([selectIndicators], (items) => buildTree(items))
export const selectAttributeTree = createSelector([selectAttributes], (items) => buildTree(items))
export const selectIndicatorRows = createSelector([selectIndicatorTree], (tree) => flattenTree(tree))
export const selectAttributeRows = createSelector([selectAttributeTree], (tree) => flattenTree(tree))
