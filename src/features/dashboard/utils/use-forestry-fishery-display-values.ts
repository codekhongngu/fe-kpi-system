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

export type ForestryFisheryMetricPair = {
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
): ForestryFisheryMetricPair {
  return {
    value: formatMetric(lookup, code, valueFallback),
    yoy: formatYoY(lookup, code, yoyFallback),
  }
}

const EMPTY_PAIR: ForestryFisheryMetricPair = { value: '0', yoy: '0' }

export type ForestryFisheryDisplayValues = {
  forestArea: ForestryFisheryMetricPair
  timberOutput: ForestryFisheryMetricPair
  aquacultureOutput: ForestryFisheryMetricPair
  fisheryCatch: ForestryFisheryMetricPair
}

const EMPTY: ForestryFisheryDisplayValues = {
  forestArea: EMPTY_PAIR,
  timberOutput: EMPTY_PAIR,
  aquacultureOutput: EMPTY_PAIR,
  fisheryCatch: EMPTY_PAIR,
}

export function useForestryFisheryDisplayValues(
  data: DashboardFieldReportsResponse | undefined
): ForestryFisheryDisplayValues {
  return useMemo(() => {
    if (!data) return EMPTY

    const lookup = buildDashboardCellLookup(data)

    return {
      forestArea: formatMetricPair(lookup, 'CSTT130', '0', '0'),
      timberOutput: formatMetricPair(lookup, 'CSTT131', '0', '0'),
      aquacultureOutput: formatMetricPair(lookup, 'CSTT133', '0', '0'),
      fisheryCatch: formatMetricPair(lookup, 'CSTT134', '0', '0'),
    }
  }, [data])
}
