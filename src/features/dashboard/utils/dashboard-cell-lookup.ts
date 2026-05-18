import type {
  DashboardFieldReportsResponse,
  DashboardReportCell,
  DashboardSchema,
} from '../api/types'

export const DASHBOARD_ATTR_CURRENT = 'Thực hiên'
export const DASHBOARD_ATTR_PRIOR_YEAR = 'Cùng kỳ năm trước'

function normalizeCode(code: string) {
  return code.trim().toUpperCase()
}

function normalizeAttributeName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFC')
    .replace(/\s+/g, ' ')
}

export function dashboardAttributesMatch(
  actual: string,
  expected: string
): boolean {
  const left = normalizeAttributeName(actual)
  const right = normalizeAttributeName(expected)
  if (left === right) return true

  const fixTypo = (value: string) =>
    value.replace('thực hiên', 'thực hiện')

  return fixTypo(left) === fixTypo(right)
}

function cellLookupKey(code: string, attributeName: string) {
  return `${normalizeCode(code)}::${normalizeAttributeName(attributeName)}`
}

function resolveCellCode(
  cell: DashboardReportCell,
  schema: DashboardSchema
): string {
  if (cell.code?.trim()) return normalizeCode(cell.code)

  const indicator = schema.indicators.find(
    (item) => item.id === cell.indicatorId
  )
  return indicator?.code ? normalizeCode(indicator.code) : ''
}

function resolveCellAttributeName(
  cell: DashboardReportCell,
  schema: DashboardSchema
): string {
  if (cell.attributeName?.trim()) return cell.attributeName.trim()

  const attribute = schema.attributes.find(
    (item) => item.id === cell.attributeId
  )
  return attribute?.label?.trim() || attribute?.key?.trim() || ''
}

export function buildDashboardCellLookup(
  data: DashboardFieldReportsResponse | undefined,
  reportIndex = 0
): Map<string, DashboardReportCell> {
  const map = new Map<string, DashboardReportCell>()
  if (!data) return map

  const report = data.reports.items[reportIndex]
  if (!report) return map

  for (const cell of report.cells) {
    const code = resolveCellCode(cell, data.schema)
    const attributeName = resolveCellAttributeName(cell, data.schema)
    if (!code || !attributeName) continue

    map.set(cellLookupKey(code, attributeName), cell)
  }

  return map
}

export function findDashboardCell(
  lookup: Map<string, DashboardReportCell>,
  indicatorCode: string,
  attributeName: string
): DashboardReportCell | undefined {
  const normalizedCode = normalizeCode(indicatorCode)
  const targetKey = cellLookupKey(normalizedCode, attributeName)

  const direct = lookup.get(targetKey)
  if (direct) return direct

  for (const [key, cell] of lookup) {
    const separator = key.indexOf('::')
    if (separator === -1) continue
    const code = key.slice(0, separator)
    const attr = key.slice(separator + 2)
    if (code !== normalizedCode) continue
    if (dashboardAttributesMatch(attr, attributeName)) {
      return cell
    }
  }

  return undefined
}

export function getDashboardCellNumericValue(
  cell: DashboardReportCell | undefined
): number | null {
  if (!cell) return null

  if (cell.valueText != null && cell.valueText !== '') {
    const parsed = Number(
      cell.valueText.trim().replace(/\./g, '').replace(',', '.')
    )
    if (Number.isFinite(parsed)) return parsed
  }

  if (cell.valueNumber == null || cell.valueNumber === '') return null

  const numeric = Number(cell.valueNumber)
  return Number.isFinite(numeric) ? numeric : null
}

export function getDashboardCellValue(
  lookup: Map<string, DashboardReportCell>,
  indicatorCode: string,
  attributeName: string
): number | null {
  return getDashboardCellNumericValue(
    findDashboardCell(lookup, indicatorCode, attributeName)
  )
}
