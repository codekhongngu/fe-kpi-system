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
}

export function useAgricultureDisplayValues(
  data: DashboardFieldReportsResponse | undefined
): AgricultureDisplayValues {
  return useMemo(() => {
    if (!data) return EMPTY

    const lookup = buildDashboardCellLookup(data)

    return {
      section1Area: formatMetricPair(lookup, 'CSTT73', '0,0', '0,0'),
      section1Output: formatMetricPair(lookup, 'CSTT75', '0,0', '0,0'),
      section1Yield: formatMetricPair(lookup, 'CSTT76', '0,0', '0,0'),
      dongXuanArea: formatMetricPair(lookup, 'CSTT78', '0,0', '—'),
      dongXuanOutput: formatMetricPair(lookup, 'CSTT80', '0', '—'),
      dongXuanYield: formatMetricPair(lookup, 'CSTT81', '0,0', '—'),
      heThuArea: formatMetricPair(lookup, 'CSTT83', '0,00', '—'),
      heThuOutput: formatMetricPair(lookup, 'CSTT85', '0,00', '—'),
      heThuYield: formatMetricPair(lookup, 'CSTT86', '0,00', '—'),
      muaArea: formatMetricPair(lookup, 'CSTT88', '0,00', '—'),
      muaOutput: formatMetricPair(lookup, 'CSTT90', '0,00', '—'),
      muaYield: formatMetricPair(lookup, 'CSTT91', '0,00', '—'),
    }
  }, [data])
}
