import { useMemo } from 'react'
import type { DashboardFieldReportsResponse } from '../api/types'
import {
  buildDashboardCellLookup,
  DASHBOARD_ATTR_CURRENT,
  DASHBOARD_ATTR_PRIOR_YEAR,
  getDashboardCellValue,
} from './dashboard-cell-lookup'
import {
  buildConicGradientFromShares,
  computeDashboardYoYPercent,
  formatDashboardIndicatorDisplay,
  formatDashboardPercent,
  formatDashboardSharePercent,
  formatDashboardYoYPercent,
} from './dashboard-report-values'

/** Card 4 donut + legend — KV III, KV II, KV I, Thuế SP (vivid) */
export const GRDP_STRUCTURE_COLORS = {
  kv3: { fill: '#0EA5E9', text: '#0284C7' },
  kv2: { fill: '#F97316', text: '#EA580C' },
  kv1: { fill: '#22C55E', text: '#16A34A' },
  tax: { fill: '#C026D3', text: '#A21CAF' },
} as const

const CARD4_COLORS = [
  GRDP_STRUCTURE_COLORS.kv3.fill,
  GRDP_STRUCTURE_COLORS.kv2.fill,
  GRDP_STRUCTURE_COLORS.kv1.fill,
  GRDP_STRUCTURE_COLORS.tax.fill,
] as const
const GRDP_KV_LABELS = ['KV III', 'KV II', 'KV I'] as const

export type GrdpChartPoint = {
  label: string
  value: number
  yoyPercent: number
}

const CARD1_CHART_CODES = ['CSTT13', 'CSTT14', 'CSTT17'] as const
const CARD2_CHART_CODES = ['CSTT21', 'CSTT22', 'CSTT25'] as const
const CARD3_CHART_CODES = ['CSTT05', 'CSTT06', 'CSTT09'] as const

function formatMetric(
  lookup: ReturnType<typeof buildDashboardCellLookup>,
  code: string,
  attributeName: string,
  fallback: string
) {
  const value = getDashboardCellValue(lookup, code, attributeName)
  if (value == null) return fallback
  return formatDashboardIndicatorDisplay(value, fallback)
}

function formatYoY(
  lookup: ReturnType<typeof buildDashboardCellLookup>,
  code: string,
  fallback: string
) {
  const current = getDashboardCellValue(
    lookup,
    code,
    DASHBOARD_ATTR_CURRENT
  )
  const prior = getDashboardCellValue(
    lookup,
    code,
    DASHBOARD_ATTR_PRIOR_YEAR
  )
  return formatDashboardYoYPercent(current, prior, fallback)
}

function formatRate(
  lookup: ReturnType<typeof buildDashboardCellLookup>,
  code: string,
  fallback: string
) {
  const value = getDashboardCellValue(lookup, code, DASHBOARD_ATTR_CURRENT)
  return formatDashboardPercent(value, fallback)
}

function buildGrdpChartSeries(
  lookup: ReturnType<typeof buildDashboardCellLookup>,
  codes: readonly string[]
): GrdpChartPoint[] {
  return codes.map((code, index) => {
    const current = getDashboardCellValue(
      lookup,
      code,
      DASHBOARD_ATTR_CURRENT
    )
    const prior = getDashboardCellValue(
      lookup,
      code,
      DASHBOARD_ATTR_PRIOR_YEAR
    )

    return {
      label: GRDP_KV_LABELS[index] ?? code,
      value: current ?? 0,
      yoyPercent: computeDashboardYoYPercent(current, prior) ?? 0,
    }
  })
}

export type GrdpDisplayValues = {
  card1Total: string
  card1YoY: string
  card1ValueAdded: string
  card1ValueAddedYoY: string
  card1TaxNet: string
  card1TaxNetYoY: string
  card1Chart: GrdpChartPoint[]
  card2Total: string
  card2YoY: string
  card2ValueAdded: string
  card2ValueAddedYoY: string
  card2TaxNet: string
  card2TaxNetYoY: string
  card2Chart: GrdpChartPoint[]
  card3ValueAddedRate: string
  card3TaxNetRate: string
  card3Chart: GrdpChartPoint[]
  card4ShareKv3: string
  card4ShareKv2: string
  card4ShareKv1: string
  card4ShareTax: string
  card4DonutGradient: string
}

const EMPTY_CHART: GrdpChartPoint[] = GRDP_KV_LABELS.map((label) => ({
  label,
  value: 0,
  yoyPercent: 0,
}))

const EMPTY: GrdpDisplayValues = {
  card1Total: '0',
  card1YoY: '—',
  card1ValueAdded: '0',
  card1ValueAddedYoY: '—',
  card1TaxNet: '0',
  card1TaxNetYoY: '—',
  card1Chart: EMPTY_CHART,
  card2Total: '0',
  card2YoY: '—',
  card2ValueAdded: '0',
  card2ValueAddedYoY: '—',
  card2TaxNet: '0',
  card2TaxNetYoY: '—',
  card2Chart: EMPTY_CHART,
  card3ValueAddedRate: '—',
  card3TaxNetRate: '—',
  card3Chart: EMPTY_CHART,
  card4ShareKv3: '—',
  card4ShareKv2: '—',
  card4ShareKv1: '—',
  card4ShareTax: '—',
  card4DonutGradient: 'conic-gradient(#E5E7EB 0% 100%)',
}

export function useGrdpDisplayValues(
  data: DashboardFieldReportsResponse | undefined
): GrdpDisplayValues {
  return useMemo(() => {
    if (!data) return EMPTY

    const lookup = buildDashboardCellLookup(data)

    const shareKv3 = getDashboardCellValue(lookup, 'CSTT33', DASHBOARD_ATTR_CURRENT)
    const shareKv2 = getDashboardCellValue(lookup, 'CSTT30', DASHBOARD_ATTR_CURRENT)
    const shareKv1 = getDashboardCellValue(lookup, 'CSTT29', DASHBOARD_ATTR_CURRENT)
    const shareTax = getDashboardCellValue(lookup, 'CSTT34', DASHBOARD_ATTR_CURRENT)

    return {
      card1Total: formatMetric(lookup, 'CSTT11', DASHBOARD_ATTR_CURRENT, '0'),
      card1YoY: formatYoY(lookup, 'CSTT11', '—'),
      card1ValueAdded: formatMetric(lookup, 'CSTT12', DASHBOARD_ATTR_CURRENT, '0'),
      card1ValueAddedYoY: formatYoY(lookup, 'CSTT12', '—'),
      card1TaxNet: formatMetric(lookup, 'CSTT18', DASHBOARD_ATTR_CURRENT, '0'),
      card1TaxNetYoY: formatYoY(lookup, 'CSTT18', '—'),
      card1Chart: buildGrdpChartSeries(lookup, CARD1_CHART_CODES),

      card2Total: formatMetric(lookup, 'CSTT19', DASHBOARD_ATTR_CURRENT, '0'),
      card2YoY: formatYoY(lookup, 'CSTT19', '—'),
      card2ValueAdded: formatMetric(lookup, 'CSTT20', DASHBOARD_ATTR_CURRENT, '0'),
      card2ValueAddedYoY: formatYoY(lookup, 'CSTT20', '—'),
      card2TaxNet: formatMetric(lookup, 'CSTT26', DASHBOARD_ATTR_CURRENT, '0'),
      card2TaxNetYoY: formatYoY(lookup, 'CSTT26', '—'),
      card2Chart: buildGrdpChartSeries(lookup, CARD2_CHART_CODES),

      card3ValueAddedRate: formatRate(lookup, 'CSTT04', '—'),
      card3TaxNetRate: formatRate(lookup, 'CSTT10', '—'),
      card3Chart: buildGrdpChartSeries(lookup, CARD3_CHART_CODES),

      card4ShareKv3: formatDashboardSharePercent(shareKv3, '—'),
      card4ShareKv2: formatDashboardSharePercent(shareKv2, '—'),
      card4ShareKv1: formatDashboardSharePercent(shareKv1, '—'),
      card4ShareTax: formatDashboardSharePercent(shareTax, '—'),
      card4DonutGradient: buildConicGradientFromShares(
        [shareKv3, shareKv2, shareKv1, shareTax],
        [...CARD4_COLORS]
      ),
    }
  }, [data])
}
