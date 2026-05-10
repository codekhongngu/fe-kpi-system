import { apiClient } from '@/lib/api-client'
import type { OrgTreeItem } from '@/features/form-management/api/template-management-api'
import type {
  CampaignDefaultValue,
  CampaignScope,
  CreateReportInput,
  ReportDetail,
  ReportListItem,
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
  status?: string
  submittedAt?: string | null
  updatedAt?: string | null
  assigneeName?: string
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
    status: (a.status as ReportDetail['status']) ?? 'DRAFT',
    completionPercent: 0,
    submittedAt: a.submittedAt ?? null,
    approvedAt: null,
    updatedAt: a.updatedAt ?? null,
    assigneeName: a.assigneeName,
  })),
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

const mapDefaultValue = (item: BeCampaignDefaultValue): CampaignDefaultValue => ({
  id: item.id,
  campaignId: item.campaignId,
  indicatorId: item.indicatorId,
  attributeId: item.attributeId,
  valueText: item.valueText ?? null,
  valueNumber: (item.valueNumber === null || item.valueNumber === undefined) ? null : Number(item.valueNumber),
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
      BeCampaign[] | { items?: BeCampaign[]; total?: number; meta?: { total?: number } }
    >('/report-campaigns', { params })
    const payload = response.data
    const list = Array.isArray(payload) ? payload : (payload.items ?? [])
    const total = Array.isArray(payload)
      ? list.length
      : ((payload as { total?: number }).total ?? (payload as { meta?: { total?: number } }).meta?.total ?? list.length)
    return { items: list.map(mapCampaign), total }
  },

  getCampaign: async (campaignId: string): Promise<ReportDetail> => {
    const response = await apiClient.get<BeCampaign>(`/report-campaigns/${campaignId}`)
    return mapCampaignDetail(response.data)
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
    items: Array<{ orgId: string; indicatorId: string }>,
  ): Promise<void> => {
    await apiClient.post(`/report-campaigns/${campaignId}/scopes`, { items })
  },

  deleteScopes: async (
    campaignId: string,
    items: Array<{ orgId: string; indicatorId: string }>,
  ): Promise<void> => {
    await apiClient.delete(`/report-campaigns/${campaignId}/scopes`, { data: { items } })
  },

  // ── Campaign Default Values ──────────────────────────────────────────────

  listDefaultValues: async (campaignId: string): Promise<CampaignDefaultValue[]> => {
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
    }>,
  ): Promise<void> => {
    await apiClient.post(`/report-campaigns/${campaignId}/default-values`, { items })
  },

  deleteDefaultValues: async (
    campaignId: string,
    items: Array<{ indicatorId: string; attributeId: string }>,
  ): Promise<void> => {
    await apiClient.delete(`/report-campaigns/${campaignId}/default-values`, { data: { items } })
  },
}

// Re-export getOrgTree from form-management api for convenience
export type { OrgTreeItem }

// ── Utility ────────────────────────────────────────────────────────────────────

export function canRunReportAction(report: ReportListItem, action: string) {
  if (action === 'report:update') {
    return !['APPROVED', 'COMPLETED', 'CANCELLED'].includes(report.status)
  }
  if (action === 'report:delete') {
    return !['APPROVED', 'COMPLETED'].includes(report.status)
  }
  if (action === 'report:assign') {
    return ['DRAFT', 'NOT_STARTED'].includes(report.status)
  }
  if (action === 'report:approve' || action === 'report:reject') {
    return ['SUBMITTED', 'UNDER_REVIEW'].includes(report.status)
  }
  return true
}
