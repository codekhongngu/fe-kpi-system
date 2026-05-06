import type { ReportFilters } from '../api/types'

export const reportQueryKeys = {
  references: ['report-management', 'references'] as const,
  summary: ['report-management', 'summary'] as const,
  list: (filters: ReportFilters) => ['report-management', 'list', filters] as const,
  detail: (id: string | null) => ['report-management', 'detail', id] as const,
}

export const defaultReportFilters: ReportFilters = {
  tab: 'all',
  keyword: '',
  templateId: '',
  unitId: '',
  status: 'all',
  period: '',
  page: 1,
  pageSize: 10,
}

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Thao tác thất bại.'
}
