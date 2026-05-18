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

export type TreePlantingMetricPair = {
  value: string
  yoy: string
}

const CROP_CHART_LABELS = [
  'Ngô',
  'Lạc',
  'Khoai lang',
  'Sắn',
  'Mía',
  'Cây vừng (Mè)',
  'Rau các loại',
  'Đậu các loại',
] as const

const AREA_CHART_CODES = [
  'CSTT94',
  'CSTT95',
  'CSTT96',
  'CSTT97',
  'CSTT98',
  'CSTT99',
  'CSTT100',
  'CSTT101',
] as const

const OUTPUT_CHART_CODES = [
  'CSTT103',
  'CSTT104',
  'CSTT105',
  'CSTT106',
  'CSTT107',
  'CSTT108',
  'CSTT109',
  'CSTT110',
] as const

const YIELD_CHART_CODES = [
  'CSTT112',
  'CSTT113',
  'CSTT114',
  'CSTT115',
  'CSTT116',
  'CSTT117',
  'CSTT118',
  'CSTT119',
] as const

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
): TreePlantingMetricPair {
  return {
    value: formatMetric(lookup, code, valueFallback),
    yoy: formatYoY(lookup, code, yoyFallback),
  }
}

const EMPTY_PAIR: TreePlantingMetricPair = { value: '0,0', yoy: '0,0' }

export type TreePlantingDisplayValues = {
  areaChart: GrdpChartPoint[]
  outputChart: GrdpChartPoint[]
  yieldChart: GrdpChartPoint[]
  landRice: TreePlantingMetricPair
  landSugarcane: TreePlantingMetricPair
  landCassava: TreePlantingMetricPair
}

const EMPTY_CHART: GrdpChartPoint[] = CROP_CHART_LABELS.map((label) => ({
  label,
  value: 0,
  yoyPercent: 0,
}))

const EMPTY: TreePlantingDisplayValues = {
  areaChart: EMPTY_CHART,
  outputChart: EMPTY_CHART,
  yieldChart: EMPTY_CHART,
  landRice: EMPTY_PAIR,
  landSugarcane: EMPTY_PAIR,
  landCassava: EMPTY_PAIR,
}

export function useTreePlantingDisplayValues(
  data: DashboardFieldReportsResponse | undefined
): TreePlantingDisplayValues {
  return useMemo(() => {
    if (!data) return EMPTY

    const lookup = buildDashboardCellLookup(data)

    return {
      areaChart: buildCropChartSeries(lookup, AREA_CHART_CODES),
      outputChart: buildCropChartSeries(lookup, OUTPUT_CHART_CODES),
      yieldChart: buildCropChartSeries(lookup, YIELD_CHART_CODES),
      landRice: formatMetricPair(lookup, 'CSTT121', '0,0', '0,0'),
      landSugarcane: formatMetricPair(lookup, 'CSTT122', '0,0', '0,0'),
      landCassava: formatMetricPair(lookup, 'CSTT123', '0,0', '0,0'),
    }
  }, [data])
}
