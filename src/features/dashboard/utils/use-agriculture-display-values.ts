import { useMemo } from 'react'
import type { DashboardFieldReportsResponse } from '../api/types'
import {
  buildDashboardCellLookup,
  DASHBOARD_ATTR_CURRENT,
  DASHBOARD_ATTR_PRIOR_YEAR,
  getDashboardCellValue,
} from './dashboard-cell-lookup'
import {
  computeDashboardYoYPercent,
  formatDashboardIndicatorDisplay,
  formatDashboardYoYPercent,
} from './dashboard-report-values'
import type { GrdpChartPoint } from './use-grdp-display-values'

type Lookup = ReturnType<typeof buildDashboardCellLookup>

export type AgricultureMetricPair = {
  value: string
  yoy: string
}

function formatMetric(
  lookup: Lookup,
  code: string,
  fallback: string
): string {
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
): AgricultureMetricPair {
  return {
    value: formatMetric(lookup, code, valueFallback),
    yoy: formatYoY(lookup, code, yoyFallback),
  }
}

const EMPTY_PAIR: AgricultureMetricPair = { value: '0,0', yoy: '0,0' }

const CROP_CHART_LABELS = [
  'Ngô',
  'Lạc',
  'Rau các loại',
  'Đậu các loại',
] as const

const AREA_CHART_CODES = ['CSTT95', 'CSTT105', 'CSTT110', 'CSTT100'] as const
const OUTPUT_CHART_CODES = ['CSTT98', 'CSTT108', 'CSTT113', 'CSTT103'] as const
const YIELD_CHART_CODES = ['CSTT97', 'CSTT107', 'CSTT112', 'CSTT102'] as const

function buildCropChartSeries(
  lookup: Lookup,
  codes: readonly string[]
): GrdpChartPoint[] {
  return codes.map((code, index) => {
    const current = getDashboardCellValue(lookup, code, DASHBOARD_ATTR_CURRENT)
    const prior = getDashboardCellValue(lookup, code, DASHBOARD_ATTR_PRIOR_YEAR)

    return {
      label: CROP_CHART_LABELS[index] ?? code,
      value: current ?? 0,
      yoyPercent: computeDashboardYoYPercent(current, prior) ?? 0,
    }
  })
}

const EMPTY_CHART: GrdpChartPoint[] = CROP_CHART_LABELS.map((label) => ({
  label,
  value: 0,
  yoyPercent: 0,
}))

export type AgricultureDisplayValues = {
  section1Area: AgricultureMetricPair
  section1Output: AgricultureMetricPair
  section1Yield: AgricultureMetricPair
  dongXuanArea: AgricultureMetricPair
  dongXuanOutput: AgricultureMetricPair
  dongXuanYield: AgricultureMetricPair
  heThuArea: AgricultureMetricPair
  heThuOutput: AgricultureMetricPair
  heThuYield: AgricultureMetricPair
  muaArea: AgricultureMetricPair
  muaOutput: AgricultureMetricPair
  muaYield: AgricultureMetricPair
  areaChart: GrdpChartPoint[]
  outputChart: GrdpChartPoint[]
  yieldChart: GrdpChartPoint[]
}

const EMPTY: AgricultureDisplayValues = {
  section1Area: EMPTY_PAIR,
  section1Output: EMPTY_PAIR,
  section1Yield: EMPTY_PAIR,
  dongXuanArea: { value: '0,0', yoy: '—' },
  dongXuanOutput: { value: '0', yoy: '—' },
  dongXuanYield: { value: '0,0', yoy: '—' },
  heThuArea: { value: '0,00', yoy: '—' },
  heThuOutput: { value: '0,00', yoy: '—' },
  heThuYield: { value: '0,00', yoy: '—' },
  muaArea: { value: '0,00', yoy: '—' },
  muaOutput: { value: '0,00', yoy: '—' },
  muaYield: { value: '0,00', yoy: '—' },
  areaChart: EMPTY_CHART,
  outputChart: EMPTY_CHART,
  yieldChart: EMPTY_CHART,
}

export function useAgricultureDisplayValues(
  data: DashboardFieldReportsResponse | undefined
): AgricultureDisplayValues {
  return useMemo(() => {
    if (!data) return EMPTY

    const lookup = buildDashboardCellLookup(data)

    return {
      section1Area: formatMetricPair(lookup, 'CSTT74', '0,0', '0,0'),
      section1Output: formatMetricPair(lookup, 'CSTT77', '0,0', '0,0'),
      section1Yield: formatMetricPair(lookup, 'CSTT76', '0,0', '0,0'),
      dongXuanArea: formatMetricPair(lookup, 'CSTT79', '0,0', '—'),
      dongXuanOutput: formatMetricPair(lookup, 'CSTT82', '0', '—'),
      dongXuanYield: formatMetricPair(lookup, 'CSTT81', '0,0', '—'),
      heThuArea: formatMetricPair(lookup, 'CSTT84', '0,00', '—'),
      heThuOutput: formatMetricPair(lookup, 'CSTT87', '0,00', '—'),
      heThuYield: formatMetricPair(lookup, 'CSTT86', '0,00', '—'),
      muaArea: formatMetricPair(lookup, 'CSTT89', '0,00', '—'),
      muaOutput: formatMetricPair(lookup, 'CSTT91', '0,00', '—'),
      muaYield: formatMetricPair(lookup, 'CSTT91', '0,00', '—'),
      areaChart: buildCropChartSeries(lookup, AREA_CHART_CODES),
      outputChart: buildCropChartSeries(lookup, OUTPUT_CHART_CODES),
      yieldChart: buildCropChartSeries(lookup, YIELD_CHART_CODES),
    }
  }, [data])
}
