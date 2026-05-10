export type MyAssignment = {
  assignmentId: string
  deadlineTo: string
  form: { id: string; code: string; name: string }
  period: { type: string; code: string; name: string }
  submission: {
    id: string
    status: SubmissionStatus
    completionPct: number | null
  } | null
}

export type SubmissionStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'NOT_STARTED'

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
