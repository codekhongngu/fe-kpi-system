import * as XLSX from 'xlsx-js-style'
import type { FormTemplate, TemplateCellConfig } from '@/features/form-management/api/types'
import type { CellChange, SubmissionCell, SubmissionDetail } from '../api/types'
import {
  buildDefaultValuesMap,
  buildEffectiveCellConfigMap,
  buildSubmissionExcelHeaderLayout,
  formatExcelIndicatorName,
  getSubmissionAttributeHeaderRowCount,
  getSubmissionDataLeafFields,
  getSubmissionExcelIndicatorRows,
  isSubmissionCellEditable,
  normalizeExcelHeaderLabel,
  SUBMISSION_EXCEL_STICKY_COLUMN_COUNT,
  validateSubmissionExcelStructure,
} from './submission-excel-editable'

const COL_CODE = 'Mã chỉ tiêu'
const COL_NAME = 'Tên chỉ tiêu'
const COL_UNIT = 'ĐVT'

const STICKY_COLUMN_COUNT = SUBMISSION_EXCEL_STICKY_COLUMN_COUNT

const EXCEL_ATTRIBUTE_CELL_STYLE = {
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
} as const

function applyCenterAlignToAttributeColumns(
  sheet: XLSX.WorkSheet,
  rowCount: number,
  colCount: number
) {
  for (let row = 0; row < rowCount; row += 1) {
    for (let col = STICKY_COLUMN_COUNT; col < colCount; col += 1) {
      const address = XLSX.utils.encode_cell({ r: row, c: col })
      if (!sheet[address]) {
        sheet[address] = { t: 's', v: '' }
      }
      sheet[address].s = EXCEL_ATTRIBUTE_CELL_STYLE
    }
  }
}

export type SubmissionExcelInvalidCell = {
  indicatorId: string
  attributeId: string
  rawDisplay: string
}

export type SubmissionExcelParseResult = {
  changes: CellChange[]
  invalidCells: SubmissionExcelInvalidCell[]
  /** Invalid cell values (partial apply may still be allowed) */
  errors: string[]
  /** Missing rows/columns vs template — blocks apply */
  structureErrors: string[]
  warnings: string[]
  matchedCells: number
  skippedCells: number
}

const emptyParseResult = (): SubmissionExcelParseResult => ({
  changes: [],
  invalidCells: [],
  errors: [],
  structureErrors: [],
  warnings: [],
  matchedCells: 0,
  skippedCells: 0,
})

function parseCellValue(
  raw: unknown,
  dataType: 'number' | 'text'
): { valueText: string | null; valueNumber: number | null } | null {
  if (raw === null || raw === undefined || raw === '') {
    return { valueText: null, valueNumber: null }
  }

  if (dataType === 'number') {
    const num =
      typeof raw === 'number' ? raw : Number(String(raw).replace(/,/g, '').trim())
    if (Number.isNaN(num)) return null
    return { valueText: null, valueNumber: num }
  }

  return { valueText: String(raw).trim() || null, valueNumber: null }
}

export function buildSubmissionExcelRows(
  template: FormTemplate,
  detail?: SubmissionDetail
) {
  const { headerRows, merges, leafFields } = buildSubmissionExcelHeaderLayout(
    template.fields,
    [COL_CODE, COL_NAME, COL_UNIT]
  )
  const excelIndicators = getSubmissionExcelIndicatorRows(template.indicators)

  const cellValuesMap = new Map<string, SubmissionCell>()
  for (const cell of detail?.cells ?? []) {
    cellValuesMap.set(`${cell.indicatorId}__${cell.attributeId}`, cell)
  }

  const dataRows = excelIndicators.map((indicator) => {
    const isTitle = indicator.type === 'TITLE'
    const row: (string | number)[] = [
      indicator.code,
      formatExcelIndicatorName(indicator),
      isTitle ? '' : indicator.unit || '',
    ]

    for (const field of leafFields) {
      if (isTitle) {
        row.push('')
        continue
      }
      const cell = cellValuesMap.get(`${indicator.id}__${field.id}`)
      if (!cell) {
        row.push('')
        continue
      }
      if (cell.valueNumber !== null && cell.valueNumber !== undefined) {
        row.push(Number(cell.valueNumber))
      } else {
        row.push(cell.valueText ?? '')
      }
    }

    return row
  })

  return { headerRows, merges, dataRows, leafFields, inputIndicators: excelIndicators }
}

export function downloadSubmissionExcelTemplate(
  template: FormTemplate,
  detail: SubmissionDetail | undefined,
  fileName: string
) {
  const { headerRows, merges, dataRows } = buildSubmissionExcelRows(template, detail)
  const allRows = [...headerRows, ...dataRows]
  const sheet = XLSX.utils.aoa_to_sheet(allRows)
  if (merges.length > 0) {
    sheet['!merges'] = merges
  }
  const colCount = headerRows[0]?.length ?? 0
  const rowCount = allRows.length
  applyCenterAlignToAttributeColumns(sheet, rowCount, colCount)
  sheet['!cols'] = Array.from({ length: colCount }, (_col, index) => ({
    wch: index === 1 ? 40 : index < STICKY_COLUMN_COUNT ? 14 : 18,
  }))

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Bao cao')
  XLSX.writeFile(workbook, fileName)
}

export async function parseSubmissionExcelFile(
  file: File,
  template: FormTemplate,
  effectiveCellConfigs: TemplateCellConfig[] | undefined,
  detail: SubmissionDetail
): Promise<SubmissionExcelParseResult> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    return {
      ...emptyParseResult(),
      errors: ['Tệp Excel không có sheet dữ liệu.'],
    }
  }

  const sheet = workbook.Sheets[sheetName]!
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    raw: true,
  }) as unknown[][]

  const headerRowCount = getSubmissionAttributeHeaderRowCount(template.fields)
  const minRows = headerRowCount + 1

  if (rows.length < minRows) {
    return {
      ...emptyParseResult(),
      errors: [
        `Tệp Excel cần có ${headerRowCount} dòng tiêu đề thuộc tính và ít nhất một dòng dữ liệu.`,
      ],
    }
  }

  const stickyHeaderRow = rows[0] ?? []
  const stickyHeaderIndex = new Map<string, number>()
  stickyHeaderRow.forEach((cell, index) => {
    stickyHeaderIndex.set(normalizeExcelHeaderLabel(cell), index)
  })

  const codeCol = stickyHeaderIndex.get(normalizeExcelHeaderLabel(COL_CODE))
  if (codeCol === undefined) {
    return {
      ...emptyParseResult(),
      errors: [`Thiếu cột bắt buộc "${COL_CODE}" trên dòng tiêu đề.`],
    }
  }

  const leafFields = getSubmissionDataLeafFields(template.fields)

  const { structureErrors, leafFieldColumnIndex } =
    validateSubmissionExcelStructure(rows, template, codeCol)

  if (structureErrors.length > 0) {
    return {
      ...emptyParseResult(),
      structureErrors,
    }
  }

  if (leafFields.length > 0 && leafFieldColumnIndex.size === 0) {
    const msg = 'Không khớp cột thuộc tính nào với biểu mẫu hiện tại.'
    return {
      ...emptyParseResult(),
      structureErrors: [msg],
    }
  }

  const indicatorByCode = new Map(
    template.indicators
      .filter((i) => i.type !== 'TITLE')
      .map((i) => [i.code.trim().toLowerCase(), i])
  )

  const titleCodes = new Set(
    template.indicators
      .filter((i) => i.type === 'TITLE')
      .map((i) => i.code.trim().toLowerCase())
  )

  const effectiveMap = buildEffectiveCellConfigMap(template, effectiveCellConfigs)
  const defaultValuesMap = buildDefaultValuesMap(detail.defaultValues)

  const changes: CellChange[] = []
  const invalidCells: SubmissionExcelInvalidCell[] = []
  const errors: string[] = []
  const warnings: string[] = []
  let matchedCells = 0
  let skippedCells = 0

  for (let rowIndex = headerRowCount; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex] ?? []
    const codeRaw = row[codeCol]
    const code = String(codeRaw ?? '').trim()
    if (!code) continue

    const codeKey = code.toLowerCase()
    if (titleCodes.has(codeKey)) {
      continue
    }

    const indicator = indicatorByCode.get(codeKey)
    if (!indicator) {
      warnings.push(`Dòng ${rowIndex + 1}: không tìm thấy chỉ tiêu mã "${code}".`)
      continue
    }

    for (const field of leafFields) {
      const colIndex = leafFieldColumnIndex.get(field.id)
      if (colIndex === undefined) {
        skippedCells += 1
        continue
      }

      const cellConfig = effectiveMap.get(`${indicator.id}__${field.id}`)
      const editable = isSubmissionCellEditable({
        indicator,
        field,
        cellConfig,
        defaultValuesMap,
      })

      if (!editable) {
        skippedCells += 1
        continue
      }

      const raw = row[colIndex]
      if (raw === '' || raw === null || raw === undefined) {
        skippedCells += 1
        continue
      }

      const resolvedDataType = (cellConfig?.dataType ||
        indicator.dataType ||
        'text') as 'number' | 'text'

      const parsed = parseCellValue(raw, resolvedDataType)
      if (!parsed) {
        const rawDisplay = String(raw).trim()
        errors.push(
          `Dòng ${rowIndex + 1}, cột "${field.label}": giá trị không hợp lệ (${rawDisplay}).`
        )
        invalidCells.push({
          indicatorId: indicator.id,
          attributeId: field.id,
          rawDisplay,
        })
        continue
      }

      changes.push({
        indicatorId: indicator.id,
        attributeId: field.id,
        valueText: parsed.valueText,
        valueNumber: parsed.valueNumber,
      })
      matchedCells += 1
    }
  }

  if (changes.length === 0 && errors.length === 0) {
    warnings.push('Không có ô dữ liệu nào được nhập từ tệp.')
  }

  return {
    changes,
    invalidCells,
    errors,
    structureErrors: [],
    warnings,
    matchedCells,
    skippedCells,
  }
}

/** Preview: valid Excel values + raw text for invalid cells (not old server data). */
export function mergeSubmissionDetailForExcelPreview(
  detail: SubmissionDetail,
  changes: CellChange[],
  invalidCells: SubmissionExcelInvalidCell[]
): SubmissionDetail {
  let merged = mergeSubmissionDetailWithChanges(detail, changes)

  if (invalidCells.length === 0) return merged

  const cells = [...merged.cells]
  for (const invalid of invalidCells) {
    const idx = cells.findIndex(
      (c) =>
        c.indicatorId === invalid.indicatorId &&
        c.attributeId === invalid.attributeId
    )
    const overlay = {
      indicatorId: invalid.indicatorId,
      attributeId: invalid.attributeId,
      valueText: invalid.rawDisplay,
      valueNumber: null,
      updatedAt: new Date().toISOString(),
      updatedBy: 'import-preview-invalid',
    }
    if (idx >= 0) {
      cells[idx] = { ...cells[idx], ...overlay }
    } else {
      cells.push(overlay)
    }
  }

  merged = { ...merged, cells }
  return merged
}

export function buildExcelImportInvalidCellKeys(
  invalidCells: SubmissionExcelInvalidCell[]
): Set<string> {
  return new Set(
    invalidCells.map((c) => `${c.indicatorId}__${c.attributeId}`)
  )
}

export function mergeSubmissionDetailWithChanges(
  detail: SubmissionDetail,
  changes: CellChange[]
): SubmissionDetail {
  const mergedCells = [...detail.cells]
  for (const change of changes) {
    const idx = mergedCells.findIndex(
      (c) =>
        c.indicatorId === change.indicatorId &&
        c.attributeId === change.attributeId
    )
    const updatedCell = {
      indicatorId: change.indicatorId,
      attributeId: change.attributeId,
      valueText: change.valueText ?? null,
      valueNumber: change.valueNumber ?? null,
      updatedAt: new Date().toISOString(),
      updatedBy: 'import',
    }
    if (idx >= 0) {
      mergedCells[idx] = { ...mergedCells[idx], ...updatedCell }
    } else {
      mergedCells.push(updatedCell)
    }
  }
  return { ...detail, cells: mergedCells }
}
