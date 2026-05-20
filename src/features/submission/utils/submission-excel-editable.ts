import type {
  FormTemplate,
  TemplateCellConfig,
  TemplateField,
  TemplateIndicator,
} from '@/features/form-management/api/types'
import {
  buildHeaderMatrix,
  buildTree,
  collectLeafFieldsInOrder,
  flattenIndicatorTree,
  type TreeNode,
} from '@/features/form-management/utils/tree-utils'
import type { DefaultValueCell } from '../api/types'

export function cellKey(indicatorId: string, attributeId: string) {
  return `${indicatorId}__${attributeId}`
}

export type ExcelMergeRange = {
  s: { r: number; c: number }
  e: { r: number; c: number }
}

export type SubmissionExcelHeaderLayout = {
  headerRows: string[][]
  merges: ExcelMergeRange[]
  leafFields: TemplateField[]
  headerRowCount: number
  /** Leaf attribute field id -> sheet column index */
  leafFieldColumnIndex: Map<string, number>
}

export const SUBMISSION_EXCEL_STICKY_COLUMN_COUNT = 3

/** Attribute columns only (excludes sticky Tên chỉ tiêu / ĐVT on grid) */
export function getSubmissionExtraFields(fields: TemplateField[]): TemplateField[] {
  const systemFields = fields.filter((f) => f.isSystemDefault)
  const nameField =
    systemFields.find((f) => f.label === 'Tên chỉ tiêu') ?? systemFields[0]
  const unitField = systemFields.find(
    (f) => f.label === 'Đơn vị tính' && f.id !== nameField?.id
  )
  const stickyIds = new Set(
    [nameField, unitField].filter(Boolean).map((f) => f!.id)
  )

  return fields.filter((f) => !f.isSystemDefault || !stickyIds.has(f.id))
}

export function getSubmissionDataLeafFields(fields: TemplateField[]): TemplateField[] {
  return collectLeafFieldsInOrder(getSubmissionExtraFields(fields))
}

function countAttributeLeafColumns(node: TreeNode<TemplateField>): number {
  if (!node.children?.length) return 1
  return node.children.reduce(
    (sum, child) => sum + countAttributeLeafColumns(child),
    0
  )
}

/**
 * Multi-row attribute headers (parent groups + leaf labels), aligned with TemplateMatrixGrid.
 */
export function buildSubmissionExcelHeaderLayout(
  fields: TemplateField[],
  stickyLabels: [string, string, string]
): SubmissionExcelHeaderLayout {
  const extraFields = getSubmissionExtraFields(fields)
  const leafFields = collectLeafFieldsInOrder(extraFields)
  const maxDepth =
    extraFields.length > 0 ? Math.max(1, buildHeaderMatrix(extraFields).length) : 1
  const totalCols = 3 + leafFields.length

  const headerRows: string[][] = Array.from({ length: maxDepth }, () =>
    Array.from({ length: totalCols }, () => '')
  )
  const merges: ExcelMergeRange[] = []

  for (let col = 0; col < 3; col += 1) {
    headerRows[0][col] = stickyLabels[col] ?? ''
    if (maxDepth > 1) {
      merges.push({ s: { r: 0, c: col }, e: { r: maxDepth - 1, c: col } })
    }
  }

  const tree = buildTree(extraFields)

  function walk(nodes: TreeNode<TemplateField>[], depth: number, startCol: number): number {
    let col = startCol
    for (const node of nodes) {
      const isLeaf = !node.children?.length
      if (isLeaf) {
        const rowIndex = depth - 1
        headerRows[rowIndex][col] = node.label
        const rowSpan = maxDepth - depth + 1
        if (rowSpan > 1) {
          merges.push({
            s: { r: rowIndex, c: col },
            e: { r: rowIndex + rowSpan - 1, c: col },
          })
        }
        col += 1
      } else {
        const leafCount = countAttributeLeafColumns(node)
        headerRows[depth - 1][col] = node.label
        if (leafCount > 1) {
          merges.push({
            s: { r: depth - 1, c: col },
            e: { r: depth - 1, c: col + leafCount - 1 },
          })
        }
        col = walk(node.children!, depth + 1, col)
      }
    }
    return col
  }

  walk(tree, 1, SUBMISSION_EXCEL_STICKY_COLUMN_COUNT)

  const leafFieldColumnIndex = buildSubmissionExcelLeafColumnMap(extraFields)

  return {
    headerRows,
    merges,
    leafFields,
    headerRowCount: maxDepth,
    leafFieldColumnIndex,
  }
}

/** Column index per leaf field — same order/positions as export layout */
export function buildSubmissionExcelLeafColumnMap(
  extraFields: TemplateField[]
): Map<string, number> {
  const map = new Map<string, number>()
  const tree = buildTree(extraFields)

  function walk(nodes: TreeNode<TemplateField>[], startCol: number): number {
    let col = startCol
    for (const node of nodes) {
      if (!node.children?.length) {
        map.set(node.id, col)
        col += 1
      } else {
        col = walk(node.children!, col)
      }
    }
    return col
  }

  walk(tree, SUBMISSION_EXCEL_STICKY_COLUMN_COUNT)
  return map
}

export function buildSubmissionExcelLeafColumnMapFromTemplate(
  fields: TemplateField[]
): Map<string, number> {
  return buildSubmissionExcelLeafColumnMap(getSubmissionExtraFields(fields))
}

export function normalizeExcelHeaderLabel(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
}

export type SubmissionExcelDuplicateAttributeColumn = {
  displayLabel: string
  cols: number[]
}

function collectAttributeColumnLabelsFromFile(
  rows: unknown[][],
  headerRowCount: number
): Map<string, SubmissionExcelDuplicateAttributeColumn> {
  let maxCol = SUBMISSION_EXCEL_STICKY_COLUMN_COUNT - 1
  for (let r = 0; r < Math.min(headerRowCount, rows.length); r += 1) {
    maxCol = Math.max(maxCol, (rows[r]?.length ?? 0) - 1)
  }

  const labelColMap = new Map<string, SubmissionExcelDuplicateAttributeColumn>()
  for (
    let col = SUBMISSION_EXCEL_STICKY_COLUMN_COUNT;
    col <= maxCol;
    col += 1
  ) {
    let label = ''
    for (let r = headerRowCount - 1; r >= 0; r -= 1) {
      const cell = rows[r]?.[col]
      const text = String(cell ?? '').trim()
      if (text) {
        label = text
        break
      }
    }
    if (!label) continue
    const key = normalizeExcelHeaderLabel(label)
    const colNumber = col + 1
    const existing = labelColMap.get(key)
    if (existing) {
      existing.cols.push(colNumber)
    } else {
      labelColMap.set(key, { displayLabel: label, cols: [colNumber] })
    }
  }

  return labelColMap
}

/** Map leaf columns from actual file header rows (by attribute label). */
export function buildSubmissionExcelLeafColumnMapFromFile(
  rows: unknown[][],
  fields: TemplateField[]
): {
  leafFieldColumnIndex: Map<string, number>
  missingLeafFields: TemplateField[]
  duplicateAttributeColumns: SubmissionExcelDuplicateAttributeColumn[]
} {
  const leafFields = getSubmissionDataLeafFields(fields)
  const headerRowCount = getSubmissionAttributeHeaderRowCount(fields)
  const leafFieldColumnIndex = new Map<string, number>()
  const missingLeafFields: TemplateField[] = []

  if (leafFields.length === 0) {
    return {
      leafFieldColumnIndex,
      missingLeafFields,
      duplicateAttributeColumns: [],
    }
  }

  const labelColMap = collectAttributeColumnLabelsFromFile(rows, headerRowCount)
  const duplicateAttributeColumns = [...labelColMap.values()].filter(
    (entry) => entry.cols.length > 1
  )

  for (const field of leafFields) {
    const entry = labelColMap.get(normalizeExcelHeaderLabel(field.label))
    if (!entry) {
      missingLeafFields.push(field)
    } else {
      leafFieldColumnIndex.set(field.id, entry.cols[0] - 1)
    }
  }

  return {
    leafFieldColumnIndex,
    missingLeafFields,
    duplicateAttributeColumns,
  }
}

const STRUCTURE_LIST_LIMIT = 12

function formatMissingList(items: string[], limit = STRUCTURE_LIST_LIMIT): string {
  if (items.length <= limit) return items.join(', ')
  const rest = items.length - limit
  return `${items.slice(0, limit).join(', ')} (và ${rest} mục khác)`
}

export type SubmissionExcelStructureValidation = {
  structureErrors: string[]
  leafFieldColumnIndex: Map<string, number>
}

export function validateSubmissionExcelStructure(
  rows: unknown[][],
  template: FormTemplate,
  codeCol: number
): SubmissionExcelStructureValidation {
  const structureErrors: string[] = []
  const headerRowCount = getSubmissionAttributeHeaderRowCount(template.fields)
  const leafFields = getSubmissionDataLeafFields(template.fields)
  const requiredIndicators = getSubmissionExcelIndicatorRows(template.indicators)
  const expectedDataRowCount = requiredIndicators.length
  const expectedColCount = SUBMISSION_EXCEL_STICKY_COLUMN_COUNT + leafFields.length

  if (rows.length < headerRowCount + expectedDataRowCount) {
    const dataRowCount = Math.max(0, rows.length - headerRowCount)
    structureErrors.push(
      `File thiếu dòng chỉ tiêu: cần ${expectedDataRowCount} dòng dữ liệu sau tiêu đề, file có ${dataRowCount} dòng.`
    )
  }

  let maxCol = 0
  for (const row of rows) {
    maxCol = Math.max(maxCol, (row?.length ?? 0) - 1)
  }
  const actualColCount = maxCol + 1
  if (actualColCount < expectedColCount) {
    structureErrors.push(
      `File thiếu cột thuộc tính: cần ${expectedColCount} cột (${leafFields.length} thuộc tính + 3 cột cố định), file có ${actualColCount} cột.`
    )
  }

  const { leafFieldColumnIndex, missingLeafFields, duplicateAttributeColumns } =
    buildSubmissionExcelLeafColumnMapFromFile(rows, template.fields)

  if (duplicateAttributeColumns.length > 0) {
    structureErrors.push(
      `Trùng cột thuộc tính (${duplicateAttributeColumns.length} nhãn): ${formatMissingList(
        duplicateAttributeColumns.map(
          (entry) => `"${entry.displayLabel}" tại cột ${entry.cols.join(', ')}`
        )
      )}.`
    )
  }

  if (missingLeafFields.length > 0) {
    structureErrors.push(
      `Thiếu ${missingLeafFields.length} cột thuộc tính: ${formatMissingList(
        missingLeafFields.map((f) => f.label)
      )}.`
    )
  }

  const codeRowMap = new Map<string, { displayCode: string; rows: number[] }>()
  for (let rowIndex = headerRowCount; rowIndex < rows.length; rowIndex += 1) {
    const code = String(rows[rowIndex]?.[codeCol] ?? '').trim()
    if (!code) continue
    const key = code.toLowerCase()
    const line = rowIndex + 1
    const existing = codeRowMap.get(key)
    if (existing) {
      existing.rows.push(line)
    } else {
      codeRowMap.set(key, { displayCode: code, rows: [line] })
    }
  }

  const duplicateCodes = [...codeRowMap.values()].filter(
    (entry) => entry.rows.length > 1
  )
  if (duplicateCodes.length > 0) {
    structureErrors.push(
      `Trùng mã chỉ tiêu (${duplicateCodes.length} mã): ${formatMissingList(
        duplicateCodes.map(
          (entry) => `"${entry.displayCode}" tại dòng ${entry.rows.join(', ')}`
        )
      )}.`
    )
  }

  const codesInFile = new Set(codeRowMap.keys())
  const missingIndicators = requiredIndicators.filter(
    (indicator) => !codesInFile.has(indicator.code.trim().toLowerCase())
  )

  if (missingIndicators.length > 0) {
    structureErrors.push(
      `Thiếu ${missingIndicators.length} dòng chỉ tiêu (mã): ${formatMissingList(
        missingIndicators.map((i) => i.code)
      )}.`
    )
  }

  return { structureErrors, leafFieldColumnIndex }
}

export function getSubmissionAttributeHeaderRowCount(fields: TemplateField[]): number {
  const extraFields = getSubmissionExtraFields(fields)
  if (extraFields.length === 0) return 1
  return Math.max(1, buildHeaderMatrix(extraFields).length)
}

/** INPUT rows only — used when importing cell values */
export function getSubmissionInputIndicators(
  indicators: TemplateIndicator[]
): TemplateIndicator[] {
  return getSubmissionExcelIndicatorRows(indicators).filter(
    (row) => row.type !== 'TITLE'
  )
}

/** All rows (TITLE + INPUT), expanded — matches grid row list for Excel export */
export function getSubmissionExcelIndicatorRows(
  indicators: TemplateIndicator[]
): TemplateIndicator[] {
  const expandedIds = new Set(indicators.map((i) => i.id))
  const tree = buildTree(indicators)
  return flattenIndicatorTree(tree, expandedIds) as TemplateIndicator[]
}

export function formatExcelIndicatorName(
  indicator: TemplateIndicator & { level?: number }
): string {
  const depth = Math.max(0, (indicator.level ?? 1) - 1)
  const indent = depth > 0 ? `${'  '.repeat(depth)}` : ''
  return `${indent}${indicator.name}`
}

type EditableCellContext = {
  indicator: TemplateIndicator
  field: TemplateField
  cellConfig?: TemplateCellConfig
  defaultValuesMap: Map<string, DefaultValueCell>
}

export function isSubmissionCellEditable({
  indicator,
  field,
  cellConfig,
  defaultValuesMap,
}: EditableCellContext): boolean {
  if (indicator.type === 'TITLE') return false
  if (cellConfig?.formula) return false

  const key = cellKey(indicator.id, field.id)
  const defaultVal = defaultValuesMap.get(key)
  if (
    defaultVal &&
    (defaultVal.valueText || defaultVal.valueNumber !== null)
  ) {
    return false
  }

  if (cellConfig?.readOnly) return false
  return true
}

export function buildEffectiveCellConfigMap(
  template: FormTemplate,
  effectiveConfigs: TemplateCellConfig[] | undefined
): Map<string, TemplateCellConfig> {
  const map = new Map<string, TemplateCellConfig>()
  const configs = effectiveConfigs ?? template.cellConfigs ?? []
  for (const cell of configs) {
    map.set(cellKey(cell.indicatorId, cell.attributeId), cell)
  }
  return map
}

export function buildDefaultValuesMap(
  defaultValues: DefaultValueCell[] | undefined
): Map<string, DefaultValueCell> {
  const map = new Map<string, DefaultValueCell>()
  for (const item of defaultValues ?? []) {
    map.set(cellKey(item.indicatorId, item.attributeId), item)
  }
  return map
}
