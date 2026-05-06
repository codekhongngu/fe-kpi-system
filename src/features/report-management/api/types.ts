export type ReportRole = 'admin' | 'manager' | 'staff'

export type ReportTab =
  | 'all'
  | 'unsubmitted'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'overdue'

export type ReportStatus =
  | 'DRAFT'
  | 'ASSIGNED'
  | 'NOT_STARTED'
  | 'DRAFTING'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'OVERDUE'
  | 'COMPLETED'
  | 'CANCELLED'

export type ReportPriority = 'low' | 'normal' | 'high'

export type ReportAction =
  | 'report:create'
  | 'report:update'
  | 'report:delete'
  | 'report:assign'
  | 'report:input'
  | 'report:submit'
  | 'report:approve'
  | 'report:reject'
  | 'report:view'
  | 'report:history'
  | 'report:role-variants'

export type ReportListItem = {
  id: string
  code: string
  name: string
  templateId: string
  templateName: string
  unitId: string
  unitName: string
  period: string
  deadline: string
  status: ReportStatus
  priority: ReportPriority
  completionPercent: number
  ownerName: string
  updatedBy: string
  updatedAt: string
  submittedAt: string | null
  approvedAt: string | null
  rejectionReason: string | null
  note: string | null
}

export type ReportDetail = ReportListItem & {
  description: string
  cells: ReportCell[]
  history: ReportHistoryItem[]
  assignees: string[]
}

export type ReportCell = {
  id: string
  indicatorCode: string
  indicatorName: string
  attributeName: string
  dataType: 'number' | 'text'
  value: string | number | null
  required: boolean
  editable: boolean
}

export type ReportHistoryItem = {
  id: string
  actor: string
  action: string
  note: string
  createdAt: string
}

export type ReportReferenceItem = {
  id: string
  code: string
  name: string
}

export type ReportFilters = {
  tab: ReportTab
  keyword: string
  templateId: string
  unitId: string
  status: ReportStatus | 'all'
  period: string
  page: number
  pageSize: number
}

export type ReportListResponse = {
  items: ReportListItem[]
  total: number
}

export type ReportSummary = {
  total: number
  unsubmitted: number
  pendingApproval: number
  approved: number
  rejected: number
  overdue: number
}

export type ReportReferences = {
  templates: ReportReferenceItem[]
  units: ReportReferenceItem[]
  periods: ReportReferenceItem[]
}

export type CreateReportInput = {
  name: string
  templateId: string
  unitIds: string[]
  period: string
  deadline: string
  priority: ReportPriority
  note?: string | null
}

export type UpdateReportInput = {
  name: string
  deadline: string
  priority: ReportPriority
  note?: string | null
}

export type RoleVariant = {
  role: ReportRole
  label: string
  defaultTab: ReportTab
  visibleTabs: ReportTab[]
  actions: Array<{ action: ReportAction; label: string; condition: string }>
}

export const reportTabs: Array<{ value: ReportTab; label: string }> = [
  { value: 'all', label: 'Tất cả' },
  { value: 'unsubmitted', label: 'Chưa nộp' },
  { value: 'pending_approval', label: 'Chờ duyệt' },
  { value: 'approved', label: 'Đã duyệt' },
  { value: 'rejected', label: 'Bị trả lại' },
  { value: 'overdue', label: 'Quá hạn' },
]

export const reportStatusOptions: Array<{ value: ReportStatus; label: string }> = [
  { value: 'DRAFT', label: 'Nháp' },
  { value: 'ASSIGNED', label: 'Đã giao' },
  { value: 'NOT_STARTED', label: 'Chưa nhập' },
  { value: 'DRAFTING', label: 'Đang nhập' },
  { value: 'SUBMITTED', label: 'Đã nộp' },
  { value: 'UNDER_REVIEW', label: 'Chờ duyệt' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'REJECTED', label: 'Bị trả lại' },
  { value: 'OVERDUE', label: 'Quá hạn' },
  { value: 'COMPLETED', label: 'Đã chốt' },
  { value: 'CANCELLED', label: 'Đã hủy' },
]

export const reportPriorityOptions: Array<{ value: ReportPriority; label: string }> = [
  { value: 'low', label: 'Thấp' },
  { value: 'normal', label: 'Bình thường' },
  { value: 'high', label: 'Cao' },
]

