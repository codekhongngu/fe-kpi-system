import { apiClient } from '@/lib/api-client'
import type { SubmissionFlowLog } from '../components/submission-timeline'

export const approvalApi = {
  // POST /api/v1/approvals/:id/approve-department
  approveDepartment: (submissionId: string) =>
    apiClient
      .post(`/approvals/${submissionId}/approve-department`)
      .then((r) => r.data),

  // POST /api/v1/approvals/:id/reject-department
  rejectDepartment: (submissionId: string, reason: string) =>
    apiClient
      .post(`/approvals/${submissionId}/reject-department`, { reason })
      .then((r) => r.data),

  // POST /api/v1/approvals/:id/approve-district
  approveDistrict: (submissionId: string) =>
    apiClient
      .post(`/approvals/${submissionId}/approve-district`)
      .then((r) => r.data),

  // POST /api/v1/approvals/:id/reject-district
  rejectDistrict: (submissionId: string, reason: string) =>
    apiClient
      .post(`/approvals/${submissionId}/reject-district`, { reason })
      .then((r) => r.data),

  // GET /api/v1/approvals/history/:submissionId
  getHistory: (submissionId: string) =>
    apiClient
      .get<SubmissionFlowLog[]>(`/approvals/history/${submissionId}`)
      .then((r) => r.data),
}
