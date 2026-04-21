export type ReportStatus =
  | 'NOT_STARTED'
  | 'DRAFT'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'OVERDUE'

export type ReportAction = 'submit' | 'approve' | 'reject' | 'cancel-assignment' | 'soft-delete'

export type ReportValueRow = {
  id: string
  indicatorCode: string
  indicatorName: string
  unit: string
  required: boolean
  minValue: number | null
  maxValue: number | null
  previousValue: number | null
  currentValue: number | null
}

export type ReportAuditEntry = {
  id: string
  action: ReportAction
  actor: string
  note: string
  createdAt: string
}

export type ReportInstance = {
  id: string
  assignmentId: string
  formTemplateId: string
  formTemplateName: string
  reportPeriodId: string
  reportPeriodName: string
  unitId: string
  unitName: string
  dueDate: string
  status: ReportStatus
  completionPercent: number
  isDeleted: boolean
  isAggregated: boolean
  lastSavedAt: string | null
  submittedAt: string | null
  approvedAt: string | null
  values: ReportValueRow[]
  audits: ReportAuditEntry[]
}

export type ReportAssignment = {
  id: string
  formTemplateId: string
  formTemplateName: string
  reportPeriodId: string
  reportPeriodName: string
  unitId: string
  unitName: string
  dueDate: string
  autoAssignNextPeriod: boolean
  isCancelled: boolean
  cancelReason: string | null
  createdAt: string
}

export type AssignmentInput = {
  formTemplateId: string
  reportPeriodId: string
  unitIds: string[]
  dueDate: string
  autoAssignNextPeriod: boolean
}

export type ReportReferenceItem = {
  id: string
  code: string
  name: string
}

export type ReportSummary = {
  total: number
  byStatus: Record<ReportStatus, number>
  nearDueCount: number
  overdueCount: number
}

export type AggregateResult = {
  formTemplateName: string
  reportPeriodName: string
  collectedUnits: number
  approvedUnits: number
  pendingUnits: number
  rejectedUnits: number
  averageCompletion: number
}

export const reportStatusOptions: Array<{ value: ReportStatus; label: string }> = [
  { value: 'NOT_STARTED', label: 'Chưa nhập' },
  { value: 'DRAFT', label: 'Lưu nháp' },
  { value: 'PENDING', label: 'Chờ duyệt' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'REJECTED', label: 'Từ chối' },
  { value: 'OVERDUE', label: 'Quá hạn' },
]
