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

export type LivestockMetricPair = {
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
): LivestockMetricPair {
  return {
    value: formatMetric(lookup, code, valueFallback),
    yoy: formatYoY(lookup, code, yoyFallback),
  }
}

const EMPTY_PAIR: LivestockMetricPair = { value: '0', yoy: '0' }

export type LivestockDisplayValues = {
  herdCattle: LivestockMetricPair
  herdPig: LivestockMetricPair
  herdPoultry: LivestockMetricPair
  beefMeat: LivestockMetricPair
  porkMeat: LivestockMetricPair
  poultryMeat: LivestockMetricPair
  pigFarm: LivestockMetricPair
  cattleFarm: LivestockMetricPair
  poultryFarm: LivestockMetricPair
}

const EMPTY: LivestockDisplayValues = {
  herdCattle: EMPTY_PAIR,
  herdPig: EMPTY_PAIR,
  herdPoultry: { value: '0,0', yoy: '0' },
  beefMeat: EMPTY_PAIR,
  porkMeat: EMPTY_PAIR,
  poultryMeat: EMPTY_PAIR,
  pigFarm: EMPTY_PAIR,
  cattleFarm: EMPTY_PAIR,
  poultryFarm: EMPTY_PAIR,
}

export function useLivestockDisplayValues(
  data: DashboardFieldReportsResponse | undefined
): LivestockDisplayValues {
  return useMemo(() => {
    if (!data) return EMPTY

    const lookup = buildDashboardCellLookup(data)

    return {
      herdCattle: formatMetricPair(lookup, 'CSTT127', '0', '0'),
      herdPig: formatMetricPair(lookup, 'CSTT126', '0', '0'),
      herdPoultry: formatMetricPair(lookup, 'CSTT128', '0,0', '0'),
      beefMeat: formatMetricPair(lookup, 'CSTT131', '0', '0,00'),
      porkMeat: formatMetricPair(lookup, 'CSTT130', '0', '0,00'),
      poultryMeat: formatMetricPair(lookup, 'CSTT132', '0', '0,00'),
      pigFarm: formatMetricPair(lookup, 'CSTT134', '0', '0,00'),
      cattleFarm: formatMetricPair(lookup, 'CSTT135', '0', '0,00'),
      poultryFarm: formatMetricPair(lookup, 'CSTT136', '0', '0,00'),
    }
  }, [data])
}
