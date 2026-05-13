import { apiClient } from '@/lib/api-client'
import { normalizeSubmissionStatus } from '@/features/submission/utils/submission-status-rules'
import type {
  CampaignSummaryDetail,
  CampaignSummaryReadiness,
  CreateSummaryInput,
  SubmissionStatus,
} from './types'

type BeSummaryListItem = {
  id: string
  formId: string
  periodType: string
  periodCode: string | null
  periodName: string | null
  periodFrom: string
  periodTo: string
  orgId: string
  status: string
  totalUnits: number | null
  submittedUnits: number | null
  approvedUnits: number | null
  summarizedAt: string | null
  createdAt: string
}

type BeSummaryDetail = BeSummaryListItem & {
  summaryData: Record<string, unknown> | null
  approvedAt: string | null
  approvedBy: string | null
}

type BeSummaryListResponse =
  | BeSummaryListItem[]
  | {
      items?: BeSummaryListItem[]
      total?: number
      meta?: { total?: number }
    }

type BeSummaryReadiness = {
  campaignId: string
  totalAssignments: number
  readyAssignments: number
  blockedAssignments: Array<{
    assignmentId: string
    orgId: string
    orgName: string
    submissionId: string | null
    status: string
    updatedAt: string | null
  }>
  canAggregate: boolean
  campaignStatus: string
}

function mapSummary(item: BeSummaryDetail): CampaignSummaryDetail {
  return {
    id: item.id,
    formId: item.formId,
    periodType: item.periodType,
    period: {
      type: item.periodType,
      code: item.periodCode,
      name: item.periodName,
      dateFrom: item.periodFrom,
      dateTo: item.periodTo,
    },
    orgId: item.orgId,
    status: item.status,
    totalUnits: item.totalUnits,
    submittedUnits: item.submittedUnits,
    approvedUnits: item.approvedUnits,
    summaryData: item.summaryData,
    summarizedAt: item.summarizedAt,
    createdAt: item.createdAt,
  }
}

function normalizeListResponse(payload: BeSummaryListResponse) {
  const list = Array.isArray(payload) ? payload : payload.items ?? []
  const total = Array.isArray(payload)
    ? list.length
    : (payload.total ?? payload.meta?.total ?? list.length)
  return { list, total }
}

export const reportSummaryApi = {
  listCampaignSummaries: async (params: CreateSummaryInput) => {
    const response = await apiClient.get<BeSummaryListResponse>('/summaries', {
      params: {
        formId: params.formId,
        periodType: params.periodType,
        from: params.periodFrom,
        to: params.periodTo,
        orgId: params.orgId,
      },
    })
    const { list, total } = normalizeListResponse(response.data)
    return {
      items: list.map((item) => mapSummary({ ...item, summaryData: null, approvedAt: null, approvedBy: null })),
      total,
    }
  },

  getCampaignSummary: async (
    params: CreateSummaryInput
  ): Promise<CampaignSummaryDetail | null> => {
    const response = await apiClient.get<BeSummaryListResponse>('/summaries', {
      params: {
        formId: params.formId,
        periodType: params.periodType,
        from: params.periodFrom,
        to: params.periodTo,
        orgId: params.orgId,
      },
    })
    const { list } = normalizeListResponse(response.data)
    const first = list[0]
    if (!first) return null
    const detail = await apiClient.get<BeSummaryDetail>(`/summaries/${first.id}`)
    return mapSummary(detail.data)
  },

  createSummary: async (input: CreateSummaryInput) => {
    const response = await apiClient.post<BeSummaryDetail>('/summaries', input)
    return mapSummary(response.data)
  },

  recomputeSummary: async (summaryId: string): Promise<void> => {
    await apiClient.post(`/summaries/${summaryId}/recompute`)
  },

  aggregateCampaignSummary: async (
    input: CreateSummaryInput
  ): Promise<CampaignSummaryDetail> => {
    const response = await apiClient.get<BeSummaryListResponse>('/summaries', {
      params: {
        formId: input.formId,
        periodType: input.periodType,
        from: input.periodFrom,
        to: input.periodTo,
        orgId: input.orgId,
      },
    })
    const { list } = normalizeListResponse(response.data)
    const existing = list[0]

    if (existing) {
      await reportSummaryApi.recomputeSummary(existing.id)
      const refreshed = await apiClient.get<BeSummaryDetail>(
        `/summaries/${existing.id}`
      )
      return mapSummary(refreshed.data)
    }

    const created = await reportSummaryApi.createSummary(input)
    await reportSummaryApi.recomputeSummary(created.id)
    const refreshed = await apiClient.get<BeSummaryDetail>(
      `/summaries/${created.id}`
    )
    return mapSummary(refreshed.data)
  },

  getCampaignReadiness: async (
    campaignId: string
  ): Promise<CampaignSummaryReadiness> => {
    const response = await apiClient.get<BeSummaryReadiness>(
      `/report-campaigns/${campaignId}/summary-readiness`
    )
    return {
      ...response.data,
      blockedAssignments: response.data.blockedAssignments.map((item) => ({
        ...item,
        status: normalizeSubmissionStatus(item.status) as SubmissionStatus,
      })),
    }
  },
}
