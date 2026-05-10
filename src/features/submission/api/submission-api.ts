import { apiClient } from '@/lib/api-client'
import type {
  MyAssignment,
  SubmissionDetail,
  CellChange,
  PatchCellsResult,
} from './types'

export const submissionApi = {
  // GET /api/v1/my/assignments
  myAssignments: (params?: { status?: string; overdue?: boolean }) =>
    apiClient
      .get<{ items: MyAssignment[] }>('/my/assignments', { params })
      .then((r) => r.data.items),

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

  // PATCH /api/v1/submissions/:id/cells
  patchCells: (
    submissionId: string,
    clientVersion: number,
    changes: CellChange[]
  ) =>
    apiClient
      .patch<PatchCellsResult>(`/submissions/${submissionId}/cells`, {
        clientVersion,
        changes,
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
}
