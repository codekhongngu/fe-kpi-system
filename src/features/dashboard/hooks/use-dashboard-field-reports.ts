import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { PeriodType } from '@/features/form-management/api/types'
import { dashboardApi } from '../api/dashboard-api'
import type { FieldDashboardSearch } from '../api/types'
import {
  DEFAULT_FIELD_DASHBOARD_SEARCH,
  DEFAULT_PERIOD_CODE,
  dashboardQueryKeys,
} from '../utils/dashboard-query'

export type DashboardFieldReportsParams = {
  fieldCategoryId?: string
  templateId?: string
  periodCode?: string
  periodType?: PeriodType | string
}

export function toFieldDashboardSearch(
  params: DashboardFieldReportsParams
): FieldDashboardSearch | null {
  if (!params.fieldCategoryId || !params.templateId) return null

  return {
    templateId: params.templateId,
    periodCode: params.periodCode || DEFAULT_PERIOD_CODE,
    periodType: (params.periodType ||
      DEFAULT_FIELD_DASHBOARD_SEARCH.periodType) as PeriodType,
    page: DEFAULT_FIELD_DASHBOARD_SEARCH.page,
    limit: DEFAULT_FIELD_DASHBOARD_SEARCH.limit,
  }
}

export function useDashboardFieldReports(params: DashboardFieldReportsParams) {
  const search = useMemo(
    () => toFieldDashboardSearch(params),
    [
      params.fieldCategoryId,
      params.templateId,
      params.periodCode,
      params.periodType,
    ]
  )

  return useQuery({
    queryKey: dashboardQueryKeys.fieldReports(
      params.fieldCategoryId ?? '',
      search ?? {
        templateId: '',
        periodCode: DEFAULT_PERIOD_CODE,
        periodType: 'THANG',
      }
    ),
    queryFn: () =>
      dashboardApi.getFieldCategoryReports(
        params.fieldCategoryId as string,
        search!
      ),
    enabled: Boolean(search?.templateId && search?.periodCode),
    staleTime: 2 * 60 * 1000,
  })
}

export async function fetchDashboardFieldReports(
  fieldCategoryId: string,
  templateId: string,
  overrides?: Partial<Omit<FieldDashboardSearch, 'templateId'>>
) {
  const search = toFieldDashboardSearch({
    fieldCategoryId,
    templateId,
    periodCode: overrides?.periodCode,
    periodType: overrides?.periodType,
  })

  if (!search) {
    throw new Error('Thiếu fieldCategoryId hoặc templateId.')
  }

  const definedOverrides = overrides
    ? Object.fromEntries(
        Object.entries(overrides).filter(([, v]) => v !== undefined)
      )
    : {}
  return dashboardApi.getFieldCategoryReports(fieldCategoryId, {
    ...search,
    ...definedOverrides,
  })
}
