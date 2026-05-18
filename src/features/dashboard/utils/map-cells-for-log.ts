import type {
  DashboardFieldReportsResponse,
  DashboardReportCell,
  DashboardReportCellLog,
  DashboardSchema,
} from '../api/types'
import { readDashboardCellAttributeName } from './parse-dashboard-cell'

function buildIndicatorCodeMap(schema: DashboardSchema) {
  return new Map(
    schema.indicators.map((indicator) => [indicator.id, indicator.code ?? ''])
  )
}

function buildAttributeNameMap(schema: DashboardSchema) {
  return new Map(
    schema.attributes.map((attribute) => [
      attribute.id,
      attribute.label?.trim() || attribute.key?.trim() || '',
    ])
  )
}

function resolveAttributeName(
  cell: DashboardReportCell,
  attributeNameById: Map<string, string>
): string {
  const fromCell =
    cell.attributeName?.trim() || readDashboardCellAttributeName(cell)?.trim()
  if (fromCell) return fromCell

  const fromSchema = attributeNameById.get(cell.attributeId)?.trim()
  if (fromSchema) return fromSchema

  return ''
}

export function mapCellForLog(
  cell: DashboardReportCell,
  indicatorCodeById: Map<string, string>,
  attributeNameById: Map<string, string>
): DashboardReportCellLog {
  return {
    indicatorId: cell.indicatorId,
    code: cell.code ?? indicatorCodeById.get(cell.indicatorId) ?? '',
    attributeId: cell.attributeId,
    attributeName: resolveAttributeName(cell, attributeNameById),
    valueText: cell.valueText,
    valueNumber: cell.valueNumber,
  }
}

export function buildCellsLogPayload(data: DashboardFieldReportsResponse) {
  const indicatorCodeById = buildIndicatorCodeMap(data.schema)
  const attributeNameById = buildAttributeNameMap(data.schema)
  const cells = data.reports.items.flatMap((report) =>
    report.cells.map((cell) =>
      mapCellForLog(cell, indicatorCodeById, attributeNameById)
    )
  )

  return { cells }
}
