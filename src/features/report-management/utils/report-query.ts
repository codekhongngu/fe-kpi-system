import type { ReportFilters } from '../api/types'
import { AxiosError } from 'axios'

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
  if (error instanceof AxiosError) {
    const raw = error.message || 'Thao tác thất bại.'
    const code = raw.split(/\s|\(/)[0]?.trim()

    if (code === 'ASSIGNMENT_BATCH_DUPLICATE') {
      const requestIdMatch = raw.match(/\(requestId:\s*([^)]+)\)/)
      const requestId = requestIdMatch?.[1]?.trim()
      const suffix = requestId ? ` (requestId: ${requestId})` : ''
      return `Đợt giao báo cáo đã tồn tại (trùng biểu mẫu/kỳ/thời hạn). Vui lòng chọn kỳ hoặc thời hạn khác.${suffix}`
    }

    return raw
  }

  return error instanceof Error ? error.message : 'Thao tác thất bại.'
}
