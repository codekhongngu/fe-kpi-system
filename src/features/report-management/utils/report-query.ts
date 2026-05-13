import { AxiosError } from 'axios'
import type { ReportFilters } from '../api/types'

export const reportQueryKeys = {
  references: ['report-management', 'references'] as const,
  summary: ['report-management', 'summary'] as const,
  list: (filters: ReportFilters) =>
    ['report-management', 'list', filters] as const,
  detail: (id: string | null) => ['report-management', 'detail', id] as const,
  assignments: (id: string | null) =>
    ['report-management', 'assignments', id] as const,
  scopes: (id: string | null) => ['report-management', 'scopes', id] as const,
  defaultValues: (id: string | null) =>
    ['report-management', 'default-values', id] as const,
  summaryReadiness: (id: string | null) =>
    ['report-management', 'summary-readiness', id] as const,
  campaignSummary: (id: string | null) =>
    ['report-management', 'campaign-summary', id] as const,
  approvalHistory: (submissionId: string | null) =>
    ['report-management', 'approval-history', submissionId] as const,
  adminAssignmentView: (campaignId: string | null, assignmentId: string | null) =>
    ['report-management', 'admin-assignment-view', campaignId, assignmentId] as const,
  template: (templateId: string | null) =>
    ['report-management', 'template', templateId] as const,
  orgTree: ['report-management', 'org-tree'] as const,
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
