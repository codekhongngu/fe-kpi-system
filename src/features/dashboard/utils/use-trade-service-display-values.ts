import { useMemo } from 'react'
import type { DashboardFieldReportsResponse } from '../api/types'
import {
  buildDashboardCellLookup,
  DASHBOARD_ATTR_CURRENT,
  DASHBOARD_ATTR_PRIOR_YEAR,
  getDashboardCellValue,
} from './dashboard-cell-lookup'
import {
  formatDashboardIndicatorDisplay,
  formatDashboardYoYPercent,
} from './dashboard-report-values'

type Lookup = ReturnType<typeof buildDashboardCellLookup>

export type TradeServiceMetricPair = {
  value: string
  yoy: string
}

function formatMetric(lookup: Lookup, code: string, fallback: string): string {
  const value = getDashboardCellValue(lookup, code, DASHBOARD_ATTR_CURRENT)
  if (value == null) return fallback
  return formatDashboardIndicatorDisplay(value, fallback)
}

function formatYoY(lookup: Lookup, code: string, fallback: string): string {
  const current = getDashboardCellValue(lookup, code, DASHBOARD_ATTR_CURRENT)
  const prior = getDashboardCellValue(lookup, code, DASHBOARD_ATTR_PRIOR_YEAR)
  return formatDashboardYoYPercent(current, prior, fallback)
}

function formatMetricPair(
  lookup: Lookup,
  code: string,
  valueFallback: string,
  yoyFallback: string
): TradeServiceMetricPair {
  return {
    value: formatMetric(lookup, code, valueFallback),
    yoy: formatYoY(lookup, code, yoyFallback),
  }
}

export function parseTradeMetricNumber(value: string): number {
  return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0
}

function formatSharePercent(share: number): string {
  return `${share.toFixed(1).replace('.', ',')}%`
}

function formatAverage(value: number): string {
  return value.toLocaleString('vi-VN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export type ServiceSectorItem = {
  index: string
  label: string
  code: string
  metric: TradeServiceMetricPair
}

export type TradeServiceSectorDetail = ServiceSectorItem & {
  sharePercent: string
  rank: number
}

export type TradeServiceStats = {
  highest: { label: string; value: string }
  lowest: { label: string; value: string }
  average: string
  sectorCount: number
}

export type TradeServiceDisplayValues = {
  exportRevenue: TradeServiceMetricPair
  retailRevenue: TradeServiceMetricPair
  totalValue: TradeServiceMetricPair
  sectors: ServiceSectorItem[]
  sectorDetails: TradeServiceSectorDetail[]
  stats: TradeServiceStats
  topSectorName: string
}

/** Mã CSTT theo `kt-xh-page-data-bindings.md` — `/trade-service` */
const CSTT_EXPORT_REVENUE = 'CSTT36'
const CSTT_TOTAL_TRADE_SERVICE = 'CSTT37'
const CSTT_RETAIL_REVENUE = 'CSTT42'

const SECTOR_DEFINITIONS = [
  {
    index: '2.1',
    label: 'Bán buôn và bán lẻ; sửa chữa ô tô, mô tô, xe máy',
    code: 'CSTT38',
  },
  { index: '2.2', label: 'Vận tải kho bãi', code: 'CSTT39' },
  { index: '2.3', label: 'Dịch vụ lưu trú và ăn uống', code: 'CSTT40' },
  { index: '2.4', label: 'Dịch vụ khác', code: 'CSTT41' },
]

/** Sample So CK when API has no prior-year data (dev / fallback). */
export const MOCK_YOY_BY_CODE: Record<string, string> = {
  [CSTT_EXPORT_REVENUE]: '+12,5%',
  [CSTT_RETAIL_REVENUE]: '+8,2%',
  [CSTT_TOTAL_TRADE_SERVICE]: '+5,8%',
  CSTT38: '+15,3%',
  CSTT39: '+6,8%',
  CSTT40: '-2,1%',
  CSTT41: '+4,2%',
}

const MOCK_SECTORS: ServiceSectorItem[] = SECTOR_DEFINITIONS.map((def) => ({
  index: def.index,
  label: def.label,
  code: def.code,
  metric: {
    value:
      def.code === 'CSTT38'
        ? '62.450,00'
        : def.code === 'CSTT39'
          ? '95.120,50'
          : def.code === 'CSTT40'
            ? '35.280,40'
            : '22.628,00',
    yoy: MOCK_YOY_BY_CODE[def.code],
  },
}))

const MOCK_DATA: TradeServiceDisplayValues = buildDisplayFromSectors(
  { value: '1.250.000', yoy: MOCK_YOY_BY_CODE[CSTT_EXPORT_REVENUE] },
  { value: '5.420', yoy: MOCK_YOY_BY_CODE[CSTT_RETAIL_REVENUE] },
  { value: '215.478,90', yoy: MOCK_YOY_BY_CODE[CSTT_TOTAL_TRADE_SERVICE] },
  MOCK_SECTORS
)

function buildDisplayFromSectors(
  exportRevenue: TradeServiceMetricPair,
  retailRevenue: TradeServiceMetricPair,
  totalValue: TradeServiceMetricPair,
  sectors: ServiceSectorItem[]
): TradeServiceDisplayValues {
  const numericValues = sectors.map((s) => ({
    sector: s,
    numeric: parseTradeMetricNumber(s.metric.value),
  }))
  const totalNumeric = numericValues.reduce((sum, item) => sum + item.numeric, 0)
  const divisor = totalNumeric > 0 ? totalNumeric : 1

  const ranked = [...numericValues].sort((a, b) => b.numeric - a.numeric)
  const rankByCode = new Map(
    ranked.map((item, index) => [item.sector.code, index + 1])
  )

  const sectorDetails: TradeServiceSectorDetail[] = sectors.map((sector) => {
    const numeric = parseTradeMetricNumber(sector.metric.value)
    return {
      ...sector,
      sharePercent: formatSharePercent((numeric / divisor) * 100),
      rank: rankByCode.get(sector.code) ?? sectors.length,
    }
  })

  const highest = ranked[0]
  const lowest = ranked[ranked.length - 1]
  const average =
    sectors.length > 0 ? totalNumeric / sectors.length : 0

  return {
    exportRevenue,
    retailRevenue,
    totalValue,
    sectors,
    sectorDetails,
    topSectorName: highest?.sector.label ?? '—',
    stats: {
      highest: {
        label: highest?.sector.label ?? '—',
        value: highest?.sector.metric.value ?? '0',
      },
      lowest: {
        label: lowest?.sector.label ?? '—',
        value: lowest?.sector.metric.value ?? '0',
      },
      average: formatAverage(average),
      sectorCount: sectors.length,
    },
  }
}

export function useTradeServiceDisplayValues(
  data: DashboardFieldReportsResponse | undefined
): TradeServiceDisplayValues {
  return useMemo(() => {
    if (!data) return MOCK_DATA

    const lookup = buildDashboardCellLookup(data)

    const exportRevenue = formatMetricPair(
      lookup,
      CSTT_EXPORT_REVENUE,
      '0',
      '—'
    )
    const retailRevenue = formatMetricPair(
      lookup,
      CSTT_RETAIL_REVENUE,
      '0',
      '—'
    )

    const sectors: ServiceSectorItem[] = SECTOR_DEFINITIONS.map((def) => ({
      index: def.index,
      label: def.label,
      code: def.code,
      metric: formatMetricPair(lookup, def.code, '0', '—'),
    }))

    const hasRealData =
      exportRevenue.value !== '0' ||
      retailRevenue.value !== '0' ||
      sectors.some((s) => s.metric.value !== '0')

    if (!hasRealData) return MOCK_DATA

    const totalNumeric = sectors.reduce(
      (sum, s) => sum + parseTradeMetricNumber(s.metric.value),
      0
    )
    const totalValue = {
      value: formatAverage(totalNumeric),
      yoy: formatYoY(lookup, CSTT_TOTAL_TRADE_SERVICE, '—'),
    }

    return buildDisplayFromSectors(
      exportRevenue,
      retailRevenue,
      totalValue,
      sectors
    )
  }, [data])
}
