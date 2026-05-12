export type MyAssignment = {
  assignmentId: string
  deadlineTo: string
  form: { id: string; code: string; name: string }
  period: { type: string; code: string; name: string }
  submission: {
    id: string
    status: SubmissionStatus
    completionPct: number | null
    rejectReason?: string | null
  } | null
}

export type SubmissionStatus =
  | 'NOT_STARTED'
  | 'DRAFTING'
  | 'PENDING_DEPARTMENT'
  | 'DEPARTMENT_APPROVED'
  | 'DISTRICT_APPROVED'
  | 'REJECTED_DEPARTMENT'
  | 'REJECTED_DISTRICT'
  | 'OVERDUE'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DRAFT' // Giữ lại để tương thích ngược nếu cần

export type ApprovalHistoryItem = {
  id: string
  submissionId: string
  approvalLevel: string
  action: string
  userId: string
  createdAt: string
  userName: string
  submissionCode: string
  submissionStatus: SubmissionStatus
  note?: string
}

export type SubmissionDetail = {
  id: string
  code: string
  assignmentId: string
  status: SubmissionStatus
  version: number
  note: string | null
  rejectReason: string | null
  completionPct: number | null
  submittedAt: string | null
  defaultValues: DefaultValueCell[]
  cells: SubmissionCell[]
}

export type DefaultValueCell = {
  indicatorId: string
  attributeId: string
  valueText: string | null
  valueNumber: number | null
}

export type SubmissionCell = {
  indicatorId: string
  attributeId: string
  valueText: string | null
  valueNumeric: number | null
  updatedBy: string | null
  updatedAt: string
}

export type CellChange = {
  indicatorId: string
  attributeId: string
  valueText?: string | null
  valueNumeric?: number | null
}

export type PatchCellsResult = {
  saved: number
  version: number
  validationErrors: {
    indicatorId: string
    attributeId: string
    code: string
    message: string
  }[]
}
