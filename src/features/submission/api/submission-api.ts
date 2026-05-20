import { apiClient } from '@/lib/api-client'
import type {
  MyAssignment,
  SubmissionDetail,
  CellChange,
  PatchCellsResult,
  SubmissionContext,
} from './types'

export type MyAssignmentsQuery = {
  status?: string
  overdue?: boolean
  q?: string
  periodType?: string
  page?: number
  limit?: number
}

export type PaginatedResponse<T> = {
  items: T[]
  total: number
  page: number
  limit: number
}

export const submissionApi = {
  // GET /api/v1/my/assignments
  myAssignments: (params?: MyAssignmentsQuery) =>
    apiClient
      .get<PaginatedResponse<MyAssignment>>('/my/assignments', { params })
      .then((r) => r.data),

  // POST /api/v1/submissions  { assignmentId }
  create: (assignmentId: string) =>
    apiClient
      .post<{ id: string; status: string }>('/submissions', { assignmentId })
      .then((r) => r.data),

  // GET /api/v1/submissions/:id
  getOne: (submissionId: string) =>
    apiClient
      .get<SubmissionDetail>(`/submissions/${submissionId}`)
      .then((r) => r.data),

  // GET /api/v1/submissions/by-assignment/:id
  getByAssignment: (assignmentId: string) =>
    apiClient
      .get<SubmissionDetail>(`/submissions/by-assignment/${assignmentId}`)
      .then((r) => r.data),

  // PATCH /api/v1/submissions/:id/cells
  patchCells: (
    submissionId: string,
    clientVersion: number,
    changes: CellChange[]
  ) =>
    apiClient
      .patch<PatchCellsResult>(`/submissions/${submissionId}/cells`, {
        clientVersion,
        changes: changes.map((c) => ({
          indicatorId: c.indicatorId,
          attributeId: c.attributeId,
          valueText: c.valueText ?? null,
          valueNumber: c.valueNumber ?? null,
        })),
      })
      .then((r) => r.data),

  // POST /api/v1/submissions/:id/submit
  submit: (submissionId: string, note?: string) =>
    apiClient
      .post<{
        status: string
        submittedAt: string
      }>(`/submissions/${submissionId}/submit`, { note })
      .then((r) => r.data),

  // POST /api/v1/submissions/:id/cancel-submit
  cancelSubmit: (submissionId: string) =>
    apiClient
      .post<{ status: string }>(`/submissions/${submissionId}/cancel-submit`)
      .then((r) => r.data),

  // GET /api/v1/my/assignments/:assignmentId/submission-context
  getSubmissionContext: (assignmentId: string) =>
    apiClient
      .get<SubmissionContext>(`/my/assignments/${assignmentId}/submission-context`)
      .then((r) => r.data),

  // GET /api/v1/submissions/history/:assignmentId
  getHistory: (assignmentId: string) =>
    apiClient
      .get<any[]>(`/submissions/history/${assignmentId}`)
      .then((r) => r.data),

  // GET /api/v1/submissions/flow-logs/:id
  getFlowLogDetails: (logId: string) =>
    apiClient
      .get<any>(`/submissions/flow-logs/${logId}`)
      .then((r) => r.data),
}
