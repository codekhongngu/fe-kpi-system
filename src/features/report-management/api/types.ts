import type { PeriodType } from '@/features/form-management/api/types'

export type ReportRole = 'admin' | 'manager' | 'staff'

export type ReportTab =
  | 'all'
  | 'unsubmitted'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'overdue'

export type CampaignStatus = 'DRAFT' | 'DISPATCHED' | 'CLOSED' | 'CANCELLED'

export type SubmissionStatus =
  | 'NOT_STARTED'
  | 'DRAFT'
  | 'PENDING_DEPARTMENT'
  | 'DEPARTMENT_APPROVED'
  | 'DISTRICT_APPROVED'
  | 'REJECTED_DEPARTMENT'
  | 'REJECTED_DISTRICT'
  | 'OVERDUE'

export type ReportStatus = CampaignStatus | SubmissionStatus

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
  formId: string
  periodType: string
  periodCode: string
  periodName: string
  deadlineFrom: string
  deadlineTo: string
  createdBy: string
  status: CampaignStatus
  dispatchedAt: string | null
  dispatchedBy: string | null
  createdAt: string
  templateCode?: string
  templateName?: string
  // Additional fields for compatibility
  code?: string
  name?: string
  openDate?: string
  closeDate?: string
  deadline?: string
}

export type ReportAssignment = {
  id: string
  orgId: string
  orgName: string
  submissionId?: string | null
  status: SubmissionStatus
  completionPercent: number | null
  submittedAt: string | null
  approvedAt: string | null
  departmentApprovedAt?: string | null
  districtApprovedAt?: string | null
  updatedAt: string | null
  assigneeName?: string
}

export type ReportDetail = {
  id: string
  formId: string
  periodType: string
  periodCode: string
  periodName: string
  deadlineFrom: string
  deadlineTo: string
  createdBy: string
  status: CampaignStatus
  dispatchedAt: string | null
  dispatchedBy: string | null
  createdAt: string
  templateCode?: string
  templateName?: string
  /** templateId = formId alias — dùng cho các tab con cần gọi lại API template */
  templateId?: string
  description?: string
  cells?: ReportCell[]
  history?: ReportHistoryItem[]
  assignees?: string[]
  assignments?: ReportAssignment[]
  // Additional fields for compatibility
  code?: string
  name?: string
  openDate?: string
  closeDate?: string
  deadline?: string
  updatedAt?: string
  unitId?: string
  unitName?: string
  period?: string
  completionPercent?: number
  ownerName?: string
  updatedBy?: string
  submittedAt?: string | null
  approvedAt?: string | null
  rejectionReason?: string | null
  note?: string | null
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
  periodType: PeriodType
  periodCode: string
  periodName: string
  openDate: string
  closeDate: string
  deadline: string
  autoAssignNextPeriod?: boolean
  priority: ReportPriority
  note?: string | null
}

export type UpdateReportInput = {
  name?: string
  periodName?: string
  deadlineFrom?: string
  deadlineTo?: string
  deadline?: string
  priority?: ReportPriority
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

export const campaignStatusOptions: Array<{
  value: CampaignStatus
  label: string
}> = [
  { value: 'DRAFT', label: 'Nháp' },
  { value: 'DISPATCHED', label: 'Đã phát hành' },
  { value: 'CLOSED', label: 'Đã đóng' },
  { value: 'CANCELLED', label: 'Đã hủy' },
]

export const submissionStatusOptions: Array<{
  value: SubmissionStatus
  label: string
}> = [
  { value: 'NOT_STARTED', label: 'Chưa nhập' },
  { value: 'DRAFT', label: 'Đang nhập' },
  { value: 'PENDING_DEPARTMENT', label: 'Chờ phòng duyệt' },
  { value: 'DEPARTMENT_APPROVED', label: 'Chờ xã chốt' },
  { value: 'DISTRICT_APPROVED', label: 'Đã chốt (Xã)' },
  { value: 'REJECTED_DEPARTMENT', label: 'Phòng trả lại' },
  { value: 'REJECTED_DISTRICT', label: 'Xã trả lại' },
  { value: 'OVERDUE', label: 'Quá hạn' },
]

export const reportStatusOptions = [
  ...campaignStatusOptions,
  ...submissionStatusOptions,
]

export const reportPriorityOptions: Array<{
  value: ReportPriority
  label: string
}> = [
  { value: 'low', label: 'Thấp' },
  { value: 'normal', label: 'Bình thường' },
  { value: 'high', label: 'Cao' },
]

// ── Campaign Scope & Default Value types ──────────────────────────────────────

export type CampaignScope = {
  id?: string
  orgId: string
  orgCode?: string
  orgName?: string
  indicatorId: string
  indicatorCode?: string
  indicatorName?: string
}

export type CampaignScopeInput = {
  orgId: string
  indicatorId: string
}

export type CampaignDefaultValue = {
  id?: string
  campaignId?: string
  indicatorId: string
  attributeId: string
  valueText: string | null
  valueNumber: number | null
}
