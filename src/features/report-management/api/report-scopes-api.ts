import { apiClient } from '@/lib/api-client'

export type ReportScope = {
  id: string
  orgId: string
  orgName: string
  orgCode: string
  indicatorId: string
  indicatorCode: string
  indicatorName: string
  parent_id: string | null
  sort_order: number
  source: string
}

export const reportScopesApi = {
  getReportScopes: async (campaignId: string): Promise<ReportScope[]> => {
    const response = await apiClient.get<{
      data: {
        items: ReportScope[]
      }
      error: any
    }>(
      `/report-campaigns/${campaignId}/scopes`
    )
    console.log('API response:', response)
    return response.data.items ?? []
  }
}
