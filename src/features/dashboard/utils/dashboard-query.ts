import type { FieldDashboardSearch } from '../api/types'

export const dashboardQueryKeys = {
  fieldCategories: ['dashboard', 'field-categories-hub'] as const,
  fieldReports: (fieldCategoryId: string, filters: FieldDashboardSearch) =>
    ['dashboard', 'field-reports', fieldCategoryId, filters] as const,
}

export const DEFAULT_PERIOD_CODE = 'KBCT06'

export const DEFAULT_FIELD_DASHBOARD_SEARCH = {
  periodCode: DEFAULT_PERIOD_CODE,
  periodType: 'THANG' as const,
  page: 1,
  limit: 50,
}

export function buildFieldDashboardSearch(
  templateId: string,
  overrides?: Partial<Omit<FieldDashboardSearch, 'templateId'>>
): FieldDashboardSearch {
  const defined = overrides
    ? Object.fromEntries(
        Object.entries(overrides).filter(([, v]) => v !== undefined)
      )
    : {}
  return {
    templateId,
    periodCode: DEFAULT_FIELD_DASHBOARD_SEARCH.periodCode,
    periodType: DEFAULT_FIELD_DASHBOARD_SEARCH.periodType,
    page: DEFAULT_FIELD_DASHBOARD_SEARCH.page,
    limit: DEFAULT_FIELD_DASHBOARD_SEARCH.limit,
    ...defined,
  }
}

export type KtXhDashboardRouteSearch = FieldDashboardSearch & {
  fieldCategoryId: string
}

export function buildKtXhDashboardRouteSearch(
  fieldCategoryId: string,
  templateId: string,
  overrides?: Partial<Omit<FieldDashboardSearch, 'templateId'>>
): KtXhDashboardRouteSearch {
  return {
    fieldCategoryId,
    ...buildFieldDashboardSearch(templateId, overrides),
  }
}

/** Build periodCode for monthly dashboard filter (matches report assignment convention). */
export function buildMonthlyPeriodCode(month: string, _year: string) {
  const mm = month.padStart(2, '0')
  return `KBCT${mm}`
}

export function parseMonthlyPeriodCode(periodCode: string): {
  month: string
  year: string
} {
  const match = /^KBCT(\d{1,2})$/i.exec(periodCode.trim())
  if (match?.[1]) {
    return {
      month: match[1].padStart(2, '0'),
      year: String(new Date().getFullYear()),
    }
  }
  return { month: '06', year: String(new Date().getFullYear()) }
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }
  return 'Không thể tải dữ liệu dashboard.'
}
