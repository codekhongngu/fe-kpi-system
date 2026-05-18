import type {
  DashboardFieldReportsResponse,
  DashboardReportItem,
  DashboardSchema,
} from '../api/types'

function normalizeCode(code: string) {
  return code.trim().toUpperCase()
}

function resolveCellValue(
  valueText: string | null,
  valueNumber: number | string | null
): string | number | null {
  if (valueText != null && valueText !== '') return valueText
  if (valueNumber == null || valueNumber === '') return null
  return valueNumber
}

/**
 * Lấy giá trị ô báo cáo theo mã chỉ tiêu (schema.indicators[].code).
 * Mặc định dùng báo cáo đầu tiên; ưu tiên cột isSystemDefault nếu có nhiều attribute.
 */
export function getValueByIndicatorCode(
  schema: DashboardSchema,
  reports: DashboardReportItem[],
  indicatorCode: string,
  reportIndex = 0
): string | number | null {
  const indicator = schema.indicators.find(
    (item) => normalizeCode(item.code) === normalizeCode(indicatorCode)
  )
  if (!indicator) return null

  const report = reports[reportIndex]
  if (!report) return null

  const matchingCells = report.cells.filter(
    (cell) => cell.indicatorId === indicator.id
  )
  if (!matchingCells.length) return null

  const defaultAttribute = schema.attributes.find((attr) => attr.isSystemDefault)
  const preferredCell =
    (defaultAttribute
      ? matchingCells.find((cell) => cell.attributeId === defaultAttribute.id)
      : undefined) ?? matchingCells[0]

  return resolveCellValue(
    preferredCell?.valueText ?? null,
    preferredCell?.valueNumber ?? null
  )
}

export function formatDashboardIndicatorDisplay(
  raw: string | number | null | undefined,
  fallback = '0'
): string {
  if (raw == null || raw === '') return fallback

  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (!trimmed) return fallback
    const parsed = Number(trimmed.replace(/\./g, '').replace(',', '.'))
    if (Number.isFinite(parsed)) {
      return parsed.toLocaleString('vi-VN')
    }
    return trimmed
  }

  if (!Number.isFinite(raw)) return fallback
  return raw.toLocaleString('vi-VN')
}

export function getFormattedIndicatorValue(
  data: DashboardFieldReportsResponse | undefined,
  indicatorCode: string,
  fallback = '0'
): string {
  if (!data) return fallback

  const raw = getValueByIndicatorCode(
    data.schema,
    data.reports.items,
    indicatorCode
  )

  if (raw == null) return fallback
  return formatDashboardIndicatorDisplay(raw, fallback)
}

export function formatDashboardPercent(
  value: number | null | undefined,
  fallback = '—'
): string {
  if (value == null || !Number.isFinite(value)) return fallback
  return `${value.toLocaleString('vi-VN', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  })}%`
}

/** (current / prior) * 100 */
export function computeDashboardYoYPercent(
  current: number | null | undefined,
  prior: number | null | undefined
): number | null {
  if (
    current == null ||
    prior == null ||
    !Number.isFinite(current) ||
    !Number.isFinite(prior) ||
    prior === 0
  ) {
    return null
  }

  return (current / prior) * 100
}

/** (current / prior) * 100 — cùng kiểu hiển thị "107,2%" trên dashboard */
export function formatDashboardYoYPercent(
  current: number | null | undefined,
  prior: number | null | undefined,
  fallback = '—'
): string {
  if (
    current == null ||
    prior == null ||
    !Number.isFinite(current) ||
    !Number.isFinite(prior) ||
    prior === 0
  ) {
    return fallback
  }

  return formatDashboardPercent(
    computeDashboardYoYPercent(current, prior),
    fallback
  )
}

export function formatDashboardSharePercent(
  value: number | null | undefined,
  fallback = '—'
): string {
  if (value == null || !Number.isFinite(value)) return fallback
  return `${value.toLocaleString('vi-VN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`
}

export function toRelativeBarHeight(
  value: number | null | undefined,
  max: number,
  minPercent = 8
): string {
  if (value == null || !Number.isFinite(value) || max <= 0) return '0%'
  const percent = Math.max(minPercent, (value / max) * 100)
  return `${percent}%`
}

export function buildConicGradientFromShares(
  shares: Array<number | null | undefined>,
  colors: string[]
): string {
  const values = shares.map((share) =>
    share != null && Number.isFinite(share) && share > 0 ? share : 0
  )
  const total = values.reduce((sum, value) => sum + value, 0)
  if (total <= 0) {
    return 'conic-gradient(#E5E7EB 0% 100%)'
  }

  let cumulative = 0
  const stops = values.map((value, index) => {
    const start = cumulative
    cumulative += (value / total) * 100
    return `${colors[index]} ${start}% ${cumulative}%`
  })

  return `conic-gradient(${stops.join(', ')})`
}
