import { apiClient } from '@/lib/api-client'
import type { OrgTreeItem } from '@/features/form-management/api/template-management-api'
import type { SubmissionDetail } from '@/features/submission/api/types'
import { normalizeSubmissionStatus } from '@/features/submission/utils/submission-status-rules'
import type {
  CampaignDefaultValue,
  CampaignSummaryReadiness,
  CampaignScope,
  CreateReportInput,
  ReportDetail,
  ReportListItem,
  ReportAssignment,
} from './types'

// ── Raw BE shapes ──────────────────────────────────────────────────────────────

type BeCampaign = {
  id: string
  formId?: string
  periodType?: string
  periodCode?: string
  periodName?: string
  deadlineFrom?: string
  deadlineTo?: string
  createdBy?: string
  status?: string
  dispatchedAt?: string | null
  dispatchedBy?: string | null
  createdAt?: string
  form?: {
    id?: string
    code?: string
    name?: string
    templateType?: string
  }
  templateCode?: string
  templateName?: string
  assignments?: BeCampaignAssignment[]
}

type BeCampaignAssignment = {
  id: string
  orgId: string
  orgName?: string
  submissionId?: string | null
  status?: string
  completionPct?: number | string | null
  submittedAt?: string | null
  approvedAt?: string | null
  departmentApprovedAt?: string | null
  districtApprovedAt?: string | null
  updatedAt?: string | null
  assigneeName?: string
  batchId?: string
  formId?: string
  periodType?: string
  periodCode?: string
  periodName?: string | null
  deadlineFrom?: string
  deadlineTo?: string
  assignedAt?: string | null
  assignedBy?: string | null
}

type BeCampaignScope = {
  id?: string
  orgId: string
  orgCode?: string
  orgName?: string
  indicatorId: string
  indicatorCode?: string
  indicatorName?: string
}

type BeCampaignDefaultValue = {
  id?: string
  campaignId?: string
  indicatorId: string
  attributeId: string
  valueText?: string | null
  valueNumber?: number | null
}

type BeAssignmentAdminView = {
  id: string
  code: string
  assignmentId: string
  status: string
  version: number
  note: string | null
  rejectReason: string | null
  completionPct: number | string | null
  submittedAt: string | null
  defaultValues: Array<{
    indicatorId: string
    attributeId: string
    valueText: string | null
    valueNumber: number | null
  }>
  cells: Array<{
    indicatorId: string
    attributeId: string
    valueText: string | null
    valueNumeric: number | string | null
    updatedBy: string | null
    updatedAt: string
  }>
}

// ── Mapper helpers ─────────────────────────────────────────────────────────────

const mapCampaign = (item: BeCampaign): ReportListItem => ({
  id: item.id,
  formId: item.formId ?? item.form?.id ?? '',
  periodType: item.periodType ?? '',
  periodCode: item.periodCode ?? '',
  periodName: item.periodName ?? '',
  deadlineFrom: item.deadlineFrom ?? '',
  deadlineTo: item.deadlineTo ?? '',
  createdBy: item.createdBy ?? '',
  status: (item.status as ReportListItem['status']) ?? 'DRAFT',
  dispatchedAt: item.dispatchedAt ?? null,
  dispatchedBy: item.dispatchedBy ?? null,
  createdAt: item.createdAt ?? '',
  templateCode: item.templateCode ?? item.form?.code,
  templateName: item.templateName ?? item.form?.name,
  // Compatibility
  code: item.periodCode,
  name: item.periodName,
  openDate: item.deadlineFrom,
  closeDate: item.deadlineTo,
})

const mapCampaignDetail = (item: BeCampaign): ReportDetail => ({
  ...mapCampaign(item),
  templateId: item.formId ?? item.form?.id,
  assignments: (item.assignments ?? []).map((a) => ({
    id: a.id,
    orgId: a.orgId,
    orgName: a.orgName ?? '',
    submissionId: a.submissionId ?? null,
    status:
      (normalizeSubmissionStatus(a.status) as ReportAssignment['status']) ??
      'NOT_STARTED',
    completionPercent:
      a.completionPct === null || a.completionPct === undefined
        ? null
        : Number(a.completionPct),
    submittedAt: a.submittedAt ?? null,
    approvedAt: a.approvedAt ?? a.districtApprovedAt ?? a.departmentApprovedAt ?? null,
    departmentApprovedAt: a.departmentApprovedAt ?? null,
    districtApprovedAt: a.districtApprovedAt ?? null,
    updatedAt: a.updatedAt ?? null,
    assigneeName: a.assigneeName,
  })),
})

const mapCampaignAssignment = (item: BeCampaignAssignment) => ({
  id: item.id,
  orgId: item.orgId,
  orgName: item.orgName ?? '',
  submissionId: item.submissionId ?? null,
  status:
    (normalizeSubmissionStatus(item.status) as ReportAssignment['status']) ??
    'NOT_STARTED',
  completionPercent:
    item.completionPct === null || item.completionPct === undefined
      ? null
      : Number(item.completionPct),
  submittedAt: item.submittedAt ?? null,
  approvedAt: item.approvedAt ?? item.districtApprovedAt ?? item.departmentApprovedAt ?? null,
  departmentApprovedAt: item.departmentApprovedAt ?? null,
  districtApprovedAt: item.districtApprovedAt ?? null,
  updatedAt: item.updatedAt ?? item.assignedAt ?? null,
  assigneeName: item.assigneeName,
})

const mapScope = (item: BeCampaignScope): CampaignScope => ({
  id: item.id,
  orgId: item.orgId,
  orgCode: item.orgCode,
  orgName: item.orgName,
  indicatorId: item.indicatorId,
  indicatorCode: item.indicatorCode,
  indicatorName: item.indicatorName,
})

const mapDefaultValue = (
  item: BeCampaignDefaultValue
): CampaignDefaultValue => ({
  id: item.id,
  campaignId: item.campaignId,
  indicatorId: item.indicatorId,
  attributeId: item.attributeId,
  valueText: item.valueText ?? null,
  valueNumber:
    item.valueNumber === null || item.valueNumber === undefined
      ? null
      : Number(item.valueNumber),
})

const mapAssignmentAdminView = (item: BeAssignmentAdminView): SubmissionDetail => ({
  id: item.id,
  code: item.code,
  assignmentId: item.assignmentId,
  status: normalizeSubmissionStatus(item.status) as SubmissionDetail['status'],
  version: item.version,
  note: item.note,
  rejectReason: item.rejectReason,
  completionPct:
    item.completionPct === null || item.completionPct === undefined
      ? null
      : Number(item.completionPct),
  submittedAt: item.submittedAt,
  defaultValues: item.defaultValues.map((row) => ({
    indicatorId: row.indicatorId,
    attributeId: row.attributeId,
    valueText: row.valueText,
    valueNumber: row.valueNumber,
  })),
  cells: item.cells.map((row) => ({
    indicatorId: row.indicatorId,
    attributeId: row.attributeId,
    valueText: row.valueText,
    valueNumeric:
      row.valueNumeric === null || row.valueNumeric === undefined
        ? null
        : Number(row.valueNumeric),
    updatedBy: row.updatedBy,
    updatedAt: row.updatedAt,
  })),
})

// ── API client ─────────────────────────────────────────────────────────────────

export const reportCampaignApi = {
  // ── Campaigns ─────────────────────────────────────────────────────────────

  listCampaigns: async (params?: {
    page?: number
    limit?: number
    status?: string
    formId?: string
  }): Promise<{ items: ReportListItem[]; total: number }> => {
    const response = await apiClient.get<
      | BeCampaign[]
      | { items?: BeCampaign[]; total?: number; meta?: { total?: number } }
    >('/report-campaigns', { params })
    const payload = response.data
    const list = Array.isArray(payload) ? payload : (payload.items ?? [])
    const total = Array.isArray(payload)
      ? list.length
      : ((payload as { total?: number }).total ??
        (payload as { meta?: { total?: number } }).meta?.total ??
        list.length)
    return { items: list.map(mapCampaign), total }
  },

  getCampaign: async (campaignId: string): Promise<ReportDetail> => {
    const response = await apiClient.get<BeCampaign>(
      `/report-campaigns/${campaignId}`
    )
    return mapCampaignDetail(response.data)
  },

  listCampaignAssignments: async (
    campaignId: string
  ): Promise<ReportDetail['assignments']> => {
    const response = await apiClient.get<
      BeCampaignAssignment[] | { items?: BeCampaignAssignment[] }
    >(`/report-campaigns/${campaignId}/assignments`)
    const payload = response.data
    const items = Array.isArray(payload) ? payload : (payload.items ?? [])
    return items.map(mapCampaignAssignment)
  },

  getAssignmentAdminView: async (
    campaignId: string,
    assignmentId: string
  ): Promise<SubmissionDetail> => {
    const response = await apiClient.get<BeAssignmentAdminView>(
      `/report-campaigns/${campaignId}/assignments/${assignmentId}/admin-view`
    )
    return mapAssignmentAdminView(response.data)
  },

  createCampaign: async (input: CreateReportInput): Promise<ReportDetail> => {
    const response = await apiClient.post<BeCampaign>('/report-campaigns', {
      formId: input.templateId,
      periodType: input.periodType,
      periodCode: input.periodCode,
      periodName: input.periodName,
      deadlineFrom: input.openDate,
      deadlineTo: input.closeDate,
    })
    const id = (response.data as { id?: string }).id ?? response.data?.id
    if (id) return reportCampaignApi.getCampaign(id)
    return mapCampaignDetail(response.data)
  },

  confirmDispatch: async (campaignId: string): Promise<void> => {
    await apiClient.post(`/report-campaigns/${campaignId}/confirm-dispatch`)
  },

  cancelCampaign: async (campaignId: string): Promise<void> => {
    await apiClient.post(`/report-campaigns/${campaignId}/cancel`)
  },

  // ── Campaign Scopes ──────────────────────────────────────────────────────

  listScopes: async (campaignId: string): Promise<CampaignScope[]> => {
    const response = await apiClient.get<
      BeCampaignScope[] | { items?: BeCampaignScope[] }
    >(`/report-campaigns/${campaignId}/scopes`)
    const payload = response.data
    const items = Array.isArray(payload) ? payload : (payload.items ?? [])
    return items.map(mapScope)
  },

  upsertScopes: async (
    campaignId: string,
    items: Array<{ orgId: string; indicatorId: string }>
  ): Promise<void> => {
    await apiClient.post(`/report-campaigns/${campaignId}/scopes`, { items })
  },

  deleteScopes: async (
    campaignId: string,
    items: Array<{ orgId: string; indicatorId: string }>
  ): Promise<void> => {
    await apiClient.delete(`/report-campaigns/${campaignId}/scopes`, {
      data: { items },
    })
  },

  // ── Campaign Default Values ──────────────────────────────────────────────

  listDefaultValues: async (
    campaignId: string
  ): Promise<CampaignDefaultValue[]> => {
    const response = await apiClient.get<
      BeCampaignDefaultValue[] | { items?: BeCampaignDefaultValue[] }
    >(`/report-campaigns/${campaignId}/default-values`)
    const payload = response.data
    const items = Array.isArray(payload) ? payload : (payload.items ?? [])
    return items.map(mapDefaultValue)
  },

  upsertDefaultValues: async (
    campaignId: string,
    items: Array<{
      indicatorId: string
      attributeId: string
      valueText?: string | null
      valueNumber?: number | null
    }>
  ): Promise<void> => {
    await apiClient.post(`/report-campaigns/${campaignId}/default-values`, {
      items,
    })
  },

  deleteDefaultValues: async (
    campaignId: string,
    items: Array<{ indicatorId: string; attributeId: string }>
  ): Promise<void> => {
    await apiClient.delete(`/report-campaigns/${campaignId}/default-values`, {
      data: { items },
    })
  },

  getSummaryReadiness: async (
    campaignId: string
  ): Promise<CampaignSummaryReadiness> => {
    const response = await apiClient.get<CampaignSummaryReadiness>(
      `/report-campaigns/${campaignId}/summary-readiness`
    )
    return response.data
  },
}

// Re-export getOrgTree from form-management api for convenience
export type { OrgTreeItem }

// ── Utility ────────────────────────────────────────────────────────────────────

export function canRunReportAction(report: ReportListItem, action: string) {
  if (action === 'report:update') {
    return !['CLOSED', 'CANCELLED'].includes(report.status)
  }
  if (action === 'report:delete') {
    return !['CLOSED'].includes(report.status)
  }
  if (action === 'report:assign') {
    return ['DRAFT', 'NOT_STARTED'].includes(report.status)
  }
  if (action === 'report:approve' || action === 'report:reject') {
    return ['PENDING_DEPARTMENT', 'DEPARTMENT_APPROVED'].includes(report.status)
  }
  return true
}
