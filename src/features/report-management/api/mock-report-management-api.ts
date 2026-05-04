import {
  type AggregateResult,
  type AssignmentInput,
  type ReportAction,
  type ReportAssignment,
  type ReportInstance,
  type ReportStatus,
  type ReportSummary,
  type ReportValueRow,
} from './types'
import { AxiosError } from 'axios'
import { apiClient } from '@/lib/api-client'

const NETWORK_DELAY_MS = 220
const NOW_DATE = '2026-04-21'

const forms = [
  { id: 'tpl-01', code: 'KPI-OPER-001', name: 'Biểu mẫu hiệu suất vận hành' },
  { id: 'tpl-02', code: 'KPI-SALE-002', name: 'Biểu mẫu doanh thu bán hàng' },
  { id: 'tpl-03', code: 'KPI-HR-003', name: 'Biểu mẫu nhân sự theo năm' },
]

const periods = [
  { id: 'prd-04-2026', code: 'M-2026-04', name: 'Kỳ tháng 04/2026' },
  { id: 'prd-q2-2026', code: 'Q2-2026', name: 'Kỳ quý II/2026' },
  { id: 'prd-y-2026', code: 'Y-2026', name: 'Kỳ năm 2026' },
]

const units = [
  { id: 'u1', code: 'CQ-001', name: 'UBND Thành phố' },
  { id: 'u2', code: 'PB-010', name: 'Phòng Nội vụ' },
  { id: 'u3', code: 'BP-021', name: 'Bộ phận KPI' },
  { id: 'u4', code: 'NH-001', name: 'Nhóm Tổng hợp' },
]

const baseValues: ReportValueRow[] = [
  {
    id: 'v-1',
    indicatorCode: 'VH001',
    indicatorName: 'Tỷ lệ uptime hạ tầng',
    unit: '%',
    required: true,
    minValue: 0,
    maxValue: 100,
    previousValue: 97.5,
    currentValue: null,
  },
  {
    id: 'v-2',
    indicatorCode: 'VH002',
    indicatorName: 'Số sự cố nghiêm trọng',
    unit: 'Vụ',
    required: true,
    minValue: 0,
    maxValue: 20,
    previousValue: 3,
    currentValue: null,
  },
  {
    id: 'v-3',
    indicatorCode: 'VH003',
    indicatorName: 'Tỷ lệ ticket xử lý đúng hạn',
    unit: '%',
    required: false,
    minValue: 0,
    maxValue: 100,
    previousValue: 88,
    currentValue: null,
  },
]

const db: {
  assignments: ReportAssignment[]
  reports: ReportInstance[]
} = {
  assignments: [
    {
      id: 'asgn-01',
      formTemplateId: 'tpl-01',
      formTemplateName: 'Biểu mẫu hiệu suất vận hành',
      reportPeriodId: 'prd-04-2026',
      reportPeriodName: 'Kỳ tháng 04/2026',
      unitId: 'u2',
      unitName: 'Phòng Nội vụ',
      dueDate: '2026-04-26',
      autoAssignNextPeriod: true,
      isCancelled: false,
      cancelReason: null,
      createdAt: '2026-04-01T02:00:00.000Z',
    },
    {
      id: 'asgn-02',
      formTemplateId: 'tpl-01',
      formTemplateName: 'Biểu mẫu hiệu suất vận hành',
      reportPeriodId: 'prd-04-2026',
      reportPeriodName: 'Kỳ tháng 04/2026',
      unitId: 'u3',
      unitName: 'Bộ phận KPI',
      dueDate: '2026-04-20',
      autoAssignNextPeriod: false,
      isCancelled: false,
      cancelReason: null,
      createdAt: '2026-04-01T02:00:00.000Z',
    },
    {
      id: 'asgn-03',
      formTemplateId: 'tpl-02',
      formTemplateName: 'Biểu mẫu doanh thu bán hàng',
      reportPeriodId: 'prd-q2-2026',
      reportPeriodName: 'Kỳ quý II/2026',
      unitId: 'u4',
      unitName: 'Nhóm Tổng hợp',
      dueDate: '2026-05-10',
      autoAssignNextPeriod: false,
      isCancelled: false,
      cancelReason: null,
      createdAt: '2026-04-05T04:20:00.000Z',
    },
  ],
  reports: [
    {
      id: 'rpt-01',
      assignmentId: 'asgn-01',
      formTemplateId: 'tpl-01',
      formTemplateName: 'Biểu mẫu hiệu suất vận hành',
      reportPeriodId: 'prd-04-2026',
      reportPeriodName: 'Kỳ tháng 04/2026',
      unitId: 'u2',
      unitName: 'Phòng Nội vụ',
      dueDate: '2026-04-26',
      status: 'DRAFT',
      completionPercent: 66,
      isDeleted: false,
      isAggregated: false,
      lastSavedAt: '2026-04-20T09:12:00.000Z',
      submittedAt: null,
      approvedAt: null,
      values: [
        { ...baseValues[0], currentValue: 98.1 },
        { ...baseValues[1], currentValue: 2 },
        { ...baseValues[2], currentValue: null },
      ],
      audits: [],
    },
    {
      id: 'rpt-02',
      assignmentId: 'asgn-02',
      formTemplateId: 'tpl-01',
      formTemplateName: 'Biểu mẫu hiệu suất vận hành',
      reportPeriodId: 'prd-04-2026',
      reportPeriodName: 'Kỳ tháng 04/2026',
      unitId: 'u3',
      unitName: 'Bộ phận KPI',
      dueDate: '2026-04-20',
      status: 'PENDING',
      completionPercent: 100,
      isDeleted: false,
      isAggregated: false,
      lastSavedAt: '2026-04-20T02:40:00.000Z',
      submittedAt: '2026-04-20T03:00:00.000Z',
      approvedAt: null,
      values: [
        { ...baseValues[0], currentValue: 96.8 },
        { ...baseValues[1], currentValue: 4 },
        { ...baseValues[2], currentValue: 90.2 },
      ],
      audits: [
        {
          id: 'audit-01',
          action: 'submit',
          actor: 'entry.kpi',
          note: 'Đã gửi duyệt lần 1',
          createdAt: '2026-04-20T03:00:00.000Z',
        },
      ],
    },
    {
      id: 'rpt-03',
      assignmentId: 'asgn-03',
      formTemplateId: 'tpl-02',
      formTemplateName: 'Biểu mẫu doanh thu bán hàng',
      reportPeriodId: 'prd-q2-2026',
      reportPeriodName: 'Kỳ quý II/2026',
      unitId: 'u4',
      unitName: 'Nhóm Tổng hợp',
      dueDate: '2026-05-10',
      status: 'NOT_STARTED',
      completionPercent: 0,
      isDeleted: false,
      isAggregated: false,
      lastSavedAt: null,
      submittedAt: null,
      approvedAt: null,
      values: baseValues.map((value) => ({ ...value })),
      audits: [],
    },
  ],
}

const wait = (ms = NETWORK_DELAY_MS) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms))

async function simulate<T>(action: () => T): Promise<T> {
  await wait()
  return action()
}

function normalize(value: string) {
  return value.trim().toLowerCase()
}

function nextId(prefix: string, items: Array<{ id: string }>) {
  return `${prefix}-${items.length + 1}-${Date.now()}`
}

function cloneReport(report: ReportInstance): ReportInstance {
  return {
    ...report,
    values: report.values.map((value) => ({ ...value })),
    audits: report.audits.map((audit) => ({ ...audit })),
  }
}

function effectiveStatus(report: ReportInstance): ReportStatus {
  if (
    report.status !== 'APPROVED' &&
    report.status !== 'PENDING' &&
    report.status !== 'REJECTED' &&
    report.dueDate < NOW_DATE
  ) {
    return 'OVERDUE'
  }
  return report.status
}

function ensureReport(reportId: string) {
  const report = db.reports.find((item) => item.id === reportId && !item.isDeleted)
  if (!report) {
    throw new Error('Không tìm thấy báo cáo.')
  }
  return report
}

function ensureAssignment(assignmentId: string) {
  const assignment = db.assignments.find((item) => item.id === assignmentId)
  if (!assignment) {
    throw new Error('Không tìm thấy giao báo cáo.')
  }
  return assignment
}

function recalculateCompletion(report: ReportInstance) {
  const requiredRows = report.values.filter((item) => item.required)
  if (requiredRows.length === 0) {
    report.completionPercent = 100
    return
  }
  const filled = requiredRows.filter((item) => item.currentValue !== null).length
  report.completionPercent = Math.round((filled / requiredRows.length) * 100)
}

function appendAudit(
  report: ReportInstance,
  action: ReportAction,
  note: string,
  actor: string
) {
  report.audits.unshift({
    id: nextId('audit', report.audits),
    action,
    actor,
    note,
    createdAt: new Date().toISOString(),
  })
}

export const reportManagementMockApi = {
  listReferenceData: () =>
    simulate(() => ({
      forms: forms.map((item) => ({ ...item })),
      periods: periods.map((item) => ({ ...item })),
      units: units.map((item) => ({ ...item })),
    })),

  listAssignments: () => simulate(() => db.assignments.map((item) => ({ ...item }))),

  listReports: (filters?: {
    status?: ReportStatus | 'all'
    keyword?: string
    formTemplateId?: string | 'all'
    reportPeriodId?: string | 'all'
    unitId?: string | 'all'
  }) =>
    simulate(() => {
      const status = filters?.status ?? 'all'
      const keyword = normalize(filters?.keyword ?? '')
      const formTemplateId = filters?.formTemplateId ?? 'all'
      const reportPeriodId = filters?.reportPeriodId ?? 'all'
      const unitId = filters?.unitId ?? 'all'

      return db.reports
        .filter((item) => !item.isDeleted)
        .map((item) => ({ ...cloneReport(item), status: effectiveStatus(item) }))
        .filter((item) => {
          const matchesKeyword =
            !keyword ||
            [item.formTemplateName, item.unitName, item.reportPeriodName].some((value) =>
              normalize(value).includes(keyword)
            )
          const matchesStatus = status === 'all' || item.status === status
          const matchesForm = formTemplateId === 'all' || item.formTemplateId === formTemplateId
          const matchesPeriod =
            reportPeriodId === 'all' || item.reportPeriodId === reportPeriodId
          const matchesUnit = unitId === 'all' || item.unitId === unitId
          return (
            matchesKeyword && matchesStatus && matchesForm && matchesPeriod && matchesUnit
          )
        })
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    }),

  createAssignments: (input: AssignmentInput) =>
    simulate(() => {
      if (!input.formTemplateId || !input.reportPeriodId || input.unitIds.length === 0) {
        throw new Error('Thiếu thông tin giao báo cáo.')
      }
      if (!input.dueDate) {
        throw new Error('Hạn nhập liệu là bắt buộc.')
      }
      const form = forms.find((item) => item.id === input.formTemplateId)
      const period = periods.find((item) => item.id === input.reportPeriodId)
      if (!form || !period) {
        throw new Error('Biểu mẫu hoặc kỳ báo cáo không tồn tại.')
      }

      const created: ReportAssignment[] = []
      input.unitIds.forEach((unitId) => {
        const unit = units.find((item) => item.id === unitId)
        if (!unit) {
          return
        }
        const duplicated = db.assignments.some(
          (assignment) =>
            !assignment.isCancelled &&
            assignment.formTemplateId === form.id &&
            assignment.reportPeriodId === period.id &&
            assignment.unitId === unit.id
        )
        if (duplicated) {
          throw new Error(
            `Đã tồn tại giao báo cáo cho ${unit.name} với bộ form + kỳ + đơn vị này.`
          )
        }
        const assignment: ReportAssignment = {
          id: nextId('asgn', db.assignments),
          formTemplateId: form.id,
          formTemplateName: form.name,
          reportPeriodId: period.id,
          reportPeriodName: period.name,
          unitId: unit.id,
          unitName: unit.name,
          dueDate: input.dueDate,
          autoAssignNextPeriod: input.autoAssignNextPeriod,
          isCancelled: false,
          cancelReason: null,
          createdAt: new Date().toISOString(),
        }
        db.assignments.unshift(assignment)
        const report: ReportInstance = {
          id: nextId('rpt', db.reports),
          assignmentId: assignment.id,
          formTemplateId: form.id,
          formTemplateName: form.name,
          reportPeriodId: period.id,
          reportPeriodName: period.name,
          unitId: unit.id,
          unitName: unit.name,
          dueDate: input.dueDate,
          status: 'NOT_STARTED',
          completionPercent: 0,
          isDeleted: false,
          isAggregated: false,
          lastSavedAt: null,
          submittedAt: null,
          approvedAt: null,
          values: baseValues.map((value) => ({ ...value })),
          audits: [],
        }
        db.reports.unshift(report)
        created.push({ ...assignment })
      })
      return created
    }),

  cancelAssignment: (assignmentId: string, reason: string) =>
    simulate(() => {
      const assignment = ensureAssignment(assignmentId)
      if (!reason.trim()) {
        throw new Error('Hủy giao báo cáo bắt buộc nhập lý do.')
      }
      const report = db.reports.find(
        (item) => item.assignmentId === assignmentId && !item.isDeleted
      )
      if (!report) {
        throw new Error('Không tìm thấy báo cáo của giao này.')
      }
      if (effectiveStatus(report) !== 'NOT_STARTED') {
        throw new Error('Chỉ hủy giao khi đơn vị chưa bắt đầu nhập liệu.')
      }
      assignment.isCancelled = true
      assignment.cancelReason = reason.trim()
      report.isDeleted = true
      appendAudit(report, 'cancel-assignment', reason.trim(), 'data.manager')
      return true
    }),

  updateReportValue: (reportId: string, rowId: string, value: number | null) =>
    simulate(() => {
      const report = ensureReport(reportId)
      if (report.status === 'APPROVED') {
        throw new Error('Báo cáo đã duyệt, không thể chỉnh sửa.')
      }
      const row = report.values.find((item) => item.id === rowId)
      if (!row) {
        throw new Error('Không tìm thấy chỉ tiêu cần cập nhật.')
      }
      if (value !== null) {
        if (row.minValue !== null && value < row.minValue) {
          throw new Error(`Giá trị nhỏ hơn min (${row.minValue}).`)
        }
        if (row.maxValue !== null && value > row.maxValue) {
          throw new Error(`Giá trị lớn hơn max (${row.maxValue}).`)
        }
      }
      row.currentValue = value
      if (report.status === 'NOT_STARTED' || report.status === 'REJECTED') {
        report.status = 'DRAFT'
      }
      report.lastSavedAt = new Date().toISOString()
      recalculateCompletion(report)
      return cloneReport(report)
    }),

  autosaveReport: (reportId: string) =>
    simulate(() => {
      const report = ensureReport(reportId)
      report.lastSavedAt = new Date().toISOString()
      return cloneReport(report)
    }),

  importExcelData: (reportId: string) =>
    simulate(() => {
      const report = ensureReport(reportId)
      report.values = report.values.map((row, index) => ({
        ...row,
        currentValue: row.required ? (row.previousValue ?? 50) + index : row.previousValue,
      }))
      report.status = report.status === 'NOT_STARTED' ? 'DRAFT' : report.status
      report.lastSavedAt = new Date().toISOString()
      recalculateCompletion(report)
      return cloneReport(report)
    }),

  copyPreviousPeriod: (reportId: string) =>
    simulate(() => {
      const report = ensureReport(reportId)
      report.values = report.values.map((row) => ({
        ...row,
        currentValue: row.previousValue,
      }))
      report.status = report.status === 'NOT_STARTED' ? 'DRAFT' : report.status
      report.lastSavedAt = new Date().toISOString()
      recalculateCompletion(report)
      return cloneReport(report)
    }),

  submitReport: (reportId: string, note: string) =>
    simulate(() => {
      const report = ensureReport(reportId)
      const missingRequired = report.values.some(
        (row) => row.required && row.currentValue === null
      )
      if (missingRequired) {
        throw new Error('Chỉ được gửi duyệt khi đủ các ô bắt buộc.')
      }
      report.status = 'PENDING'
      report.submittedAt = new Date().toISOString()
      appendAudit(report, 'submit', note.trim() || 'Gửi duyệt báo cáo', 'data.entry')
      return cloneReport(report)
    }),

  approveReport: (reportId: string, note: string) =>
    simulate(() => {
      const report = ensureReport(reportId)
      if (report.status !== 'PENDING') {
        throw new Error('Chỉ có thể duyệt báo cáo ở trạng thái chờ duyệt.')
      }
      report.status = 'APPROVED'
      report.approvedAt = new Date().toISOString()
      appendAudit(report, 'approve', note.trim() || 'Phê duyệt báo cáo', 'approver')
      return cloneReport(report)
    }),

  rejectReport: (reportId: string, note: string) =>
    simulate(() => {
      const report = ensureReport(reportId)
      if (report.status !== 'PENDING') {
        throw new Error('Chỉ có thể từ chối báo cáo ở trạng thái chờ duyệt.')
      }
      if (!note.trim()) {
        throw new Error('Nội dung từ chối là bắt buộc.')
      }
      report.status = 'REJECTED'
      appendAudit(report, 'reject', note.trim(), 'approver')
      return cloneReport(report)
    }),

  softDeleteReport: (reportId: string, reason: string) =>
    simulate(() => {
      const report = ensureReport(reportId)
      if (!reason.trim()) {
        throw new Error('Soft delete báo cáo bắt buộc nhập lý do.')
      }
      if (report.status === 'APPROVED') {
        throw new Error('Không thể xóa cứng/soft delete báo cáo đã phê duyệt.')
      }
      report.isDeleted = true
      appendAudit(report, 'soft-delete', reason.trim(), 'system.admin')
      return true
    }),

  getSummary: () =>
    simulate(() => {
      const activeReports = db.reports.filter((item) => !item.isDeleted)
      const byStatus: ReportSummary['byStatus'] = {
        NOT_STARTED: 0,
        DRAFT: 0,
        PENDING: 0,
        APPROVED: 0,
        REJECTED: 0,
        OVERDUE: 0,
      }
      let nearDueCount = 0
      let overdueCount = 0

      activeReports.forEach((report) => {
        const status = effectiveStatus(report)
        byStatus[status] += 1
        if (status === 'OVERDUE') {
          overdueCount += 1
          return
        }
        if (status === 'NOT_STARTED' || status === 'DRAFT') {
          const diff = new Date(report.dueDate).getTime() - new Date(NOW_DATE).getTime()
          if (diff <= 3 * 24 * 60 * 60 * 1000) {
            nearDueCount += 1
          }
        }
      })

      return {
        total: activeReports.length,
        byStatus,
        nearDueCount,
        overdueCount,
      } satisfies ReportSummary
    }),

  aggregateReports: (formTemplateId: string, reportPeriodId: string) =>
    simulate(() => {
      const reports = db.reports.filter(
        (item) =>
          !item.isDeleted &&
          item.formTemplateId === formTemplateId &&
          item.reportPeriodId === reportPeriodId
      )
      const form = forms.find((item) => item.id === formTemplateId)
      const period = periods.find((item) => item.id === reportPeriodId)
      if (!form || !period) {
        throw new Error('Biểu mẫu hoặc kỳ báo cáo không hợp lệ.')
      }
      if (reports.length === 0) {
        throw new Error('Không có dữ liệu báo cáo để tổng hợp.')
      }

      reports.forEach((report) => {
        report.isAggregated = true
      })

      const approvedUnits = reports.filter((item) => effectiveStatus(item) === 'APPROVED').length
      const pendingUnits = reports.filter((item) => effectiveStatus(item) === 'PENDING').length
      const rejectedUnits = reports.filter((item) => effectiveStatus(item) === 'REJECTED').length
      const totalCompletion = reports.reduce(
        (sum, report) => sum + report.completionPercent,
        0
      )

      return {
        formTemplateName: form.name,
        reportPeriodName: period.name,
        collectedUnits: reports.length,
        approvedUnits,
        pendingUnits,
        rejectedUnits,
        averageCompletion: Math.round(totalCompletion / reports.length),
      } satisfies AggregateResult
    }),

  listPendingApprovals: () =>
    simulate(() =>
      db.reports
        .filter((item) => !item.isDeleted && effectiveStatus(item) === 'PENDING')
        .map((item) => ({ ...cloneReport(item), status: effectiveStatus(item) }))
    ),

  exportReports: (format: 'excel' | 'pdf') =>
    simulate(() => {
      const stamp = new Date().toISOString().slice(0, 10)
      return {
        fileName: `bao-cao-tong-hop-${stamp}.${format === 'excel' ? 'xlsx' : 'pdf'}`,
        format,
      }
    }),
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function flattenOrgTree(nodes: unknown): Array<{ id: string; code: string; name: string }> {
  if (!Array.isArray(nodes)) {
    return []
  }

  const result: Array<{ id: string; code: string; name: string }> = []

  const visit = (node: unknown) => {
    if (!isRecord(node)) {
      return
    }
    const id = typeof node.id === 'string' ? node.id : ''
    const code = typeof node.code === 'string' ? node.code : ''
    const name = typeof node.name === 'string' ? node.name : ''
    if (id) {
      result.push({ id, code, name })
    }
    const children = node.children
    if (Array.isArray(children)) {
      children.forEach(visit)
    }
  }

  nodes.forEach(visit)
  return result
}

function toReportStatus(value: unknown): ReportStatus {
  if (value === 'NOT_STARTED') return 'NOT_STARTED'
  if (value === 'DRAFT') return 'DRAFT'
  if (value === 'PENDING') return 'PENDING'
  if (value === 'APPROVED') return 'APPROVED'
  if (value === 'REJECTED') return 'REJECTED'
  if (value === 'OVERDUE') return 'OVERDUE'
  return 'NOT_STARTED'
}

export const reportManagementApi = {
  listReferenceData: async () => {
    type FormItem = { id: string; code?: string; name?: string }
    type PeriodItem = { id: string; code?: string; name?: string }

    const [formsRes, periodsRes, orgsRes] = await Promise.all([
      apiClient.get<{ items: FormItem[] } | FormItem[]>('/forms', {
        params: { page: 1, limit: 200 },
      }),
      apiClient.get<{ items: PeriodItem[] } | PeriodItem[]>('/report-periods', {
        params: { page: 1, limit: 200 },
      }),
      apiClient.get('/orgs', { params: { tree: true } }),
    ])

    const formsPayload = formsRes.data
    const periodsPayload = periodsRes.data
    const orgsPayload = orgsRes.data

    const formsItems = Array.isArray(formsPayload) ? formsPayload : formsPayload.items ?? []
    const periodsItems = Array.isArray(periodsPayload)
      ? periodsPayload
      : periodsPayload.items ?? []
    const units = flattenOrgTree(orgsPayload)

    return {
      forms: formsItems.map((item) => ({
        id: item.id,
        code: item.code ?? '',
        name: item.name ?? '',
      })),
      periods: periodsItems.map((item) => ({
        id: item.id,
        code: item.code ?? '',
        name: item.name ?? '',
      })),
      units,
    }
  },

  listAssignments: async () => {
    type BeAssignment = {
      id: string
      formId?: string
      periodId?: string
      orgId?: string
      deadlineTo?: string
      createdAt?: string
      cancelReason?: string | null
      isCancelled?: boolean
      autoAssignNextPeriod?: boolean
      form?: { id: string; name?: string }
      period?: { id: string; name?: string }
      org?: { id: string; name?: string }
      formName?: string
      periodName?: string
      orgName?: string
    }

    const response = await apiClient.get<{ items: BeAssignment[] } | BeAssignment[]>(
      '/assignments',
      { params: { page: 1, limit: 200 } },
    )
    const payload = response.data
    const items = Array.isArray(payload) ? payload : payload.items ?? []

    return items.map<ReportAssignment>((item) => ({
      id: item.id,
      formTemplateId: item.formId ?? item.form?.id ?? '',
      formTemplateName: item.formName ?? item.form?.name ?? '',
      reportPeriodId: item.periodId ?? item.period?.id ?? '',
      reportPeriodName: item.periodName ?? item.period?.name ?? '',
      unitId: item.orgId ?? item.org?.id ?? '',
      unitName: item.orgName ?? item.org?.name ?? '',
      dueDate: item.deadlineTo ?? '',
      autoAssignNextPeriod: Boolean(item.autoAssignNextPeriod),
      isCancelled: Boolean(item.isCancelled),
      cancelReason: item.cancelReason ?? null,
      createdAt: item.createdAt ?? '',
    }))
  },

  createAssignments: async (input: AssignmentInput) => {
    await apiClient.post('/assignments', {
      formId: input.formTemplateId,
      periodId: input.reportPeriodId,
      orgIds: input.unitIds,
      deadlineFrom: input.dueDate,
      deadlineTo: input.dueDate,
    })

    const assignments = await reportManagementApi.listAssignments()
    return assignments.filter(
      (item) =>
        item.formTemplateId === input.formTemplateId &&
        item.reportPeriodId === input.reportPeriodId &&
        input.unitIds.includes(item.unitId),
    )
  },

  cancelAssignment: async (assignmentId: string, reason: string) => {
    try {
      await apiClient.post(`/assignments/${assignmentId}/cancel`, { reason })
      return true
    } catch (error: unknown) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        throw new Error('Backend chưa hỗ trợ hủy giao báo cáo.')
      }
      throw error
    }
  },

  listReports: async (filters?: {
    status?: ReportStatus | 'all'
    keyword?: string
    formTemplateId?: string | 'all'
    reportPeriodId?: string | 'all'
    unitId?: string | 'all'
  }) => {
    type BeReportListItem = {
      id: string
      assignmentId?: string
      formId?: string
      formName?: string
      periodId?: string
      periodName?: string
      orgId?: string
      orgName?: string
      dueDate?: string
      deadlineTo?: string
      status?: string
      completionPercent?: number
      lastSavedAt?: string | null
      submittedAt?: string | null
      approvedAt?: string | null
    }

    const params: Record<string, unknown> = { page: 1, limit: 200 }
    if (filters?.keyword) {
      params.q = filters.keyword
    }
    if (filters?.status && filters.status !== 'all') {
      params.status = filters.status
    }
    if (filters?.formTemplateId && filters.formTemplateId !== 'all') {
      params.formId = filters.formTemplateId
    }
    if (filters?.reportPeriodId && filters.reportPeriodId !== 'all') {
      params.periodId = filters.reportPeriodId
    }
    if (filters?.unitId && filters.unitId !== 'all') {
      params.orgId = filters.unitId
    }

    const response = await apiClient.get<{ items: BeReportListItem[] } | BeReportListItem[]>(
      '/query/reports',
      { params },
    )
    const payload = response.data
    const items = Array.isArray(payload) ? payload : payload.items ?? []

    return items.map<ReportInstance>((item) => ({
      id: item.id,
      assignmentId: item.assignmentId ?? '',
      formTemplateId: item.formId ?? '',
      formTemplateName: item.formName ?? '',
      reportPeriodId: item.periodId ?? '',
      reportPeriodName: item.periodName ?? '',
      unitId: item.orgId ?? '',
      unitName: item.orgName ?? '',
      dueDate: item.dueDate ?? item.deadlineTo ?? '',
      status: toReportStatus(item.status),
      completionPercent: item.completionPercent ?? 0,
      isDeleted: false,
      isAggregated: false,
      lastSavedAt: item.lastSavedAt ?? null,
      submittedAt: item.submittedAt ?? null,
      approvedAt: item.approvedAt ?? null,
      values: [],
      audits: [],
    }))
  },

  getSummary: async (): Promise<ReportSummary> => {
    const reports = await reportManagementApi.listReports()
    const byStatus: ReportSummary['byStatus'] = {
      NOT_STARTED: 0,
      DRAFT: 0,
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
      OVERDUE: 0,
    }

    const today = new Date()
    const nearDueThreshold = 3 * 24 * 60 * 60 * 1000
    let nearDueCount = 0
    let overdueCount = 0

    reports.forEach((report) => {
      let status = report.status
      if (
        status !== 'APPROVED' &&
        status !== 'PENDING' &&
        status !== 'REJECTED' &&
        report.dueDate
      ) {
        const due = new Date(report.dueDate)
        if (!Number.isNaN(due.getTime()) && due.getTime() < today.getTime()) {
          status = 'OVERDUE'
        }
      }

      byStatus[status] += 1

      if (status === 'OVERDUE') {
        overdueCount += 1
        return
      }

      if ((status === 'NOT_STARTED' || status === 'DRAFT') && report.dueDate) {
        const due = new Date(report.dueDate)
        const diff = due.getTime() - today.getTime()
        if (!Number.isNaN(diff) && diff <= nearDueThreshold) {
          nearDueCount += 1
        }
      }
    })

    return { total: reports.length, byStatus, nearDueCount, overdueCount }
  },

  listPendingApprovals: async () => {
    type BePendingItem = {
      id: string
      formId?: string
      formName?: string
      periodId?: string
      periodName?: string
      orgId?: string
      orgName?: string
      deadlineTo?: string
      completionPercent?: number
    }

    const response = await apiClient.get<{ items: BePendingItem[] } | BePendingItem[]>(
      '/approvals/pending',
      { params: { page: 1, limit: 200 } },
    )
    const payload = response.data
    const items = Array.isArray(payload) ? payload : payload.items ?? []

    return items.map<ReportInstance>((item) => ({
      id: item.id,
      assignmentId: '',
      formTemplateId: item.formId ?? '',
      formTemplateName: item.formName ?? '',
      reportPeriodId: item.periodId ?? '',
      reportPeriodName: item.periodName ?? '',
      unitId: item.orgId ?? '',
      unitName: item.orgName ?? '',
      dueDate: item.deadlineTo ?? '',
      status: 'PENDING',
      completionPercent: item.completionPercent ?? 0,
      isDeleted: false,
      isAggregated: false,
      lastSavedAt: null,
      submittedAt: null,
      approvedAt: null,
      values: [],
      audits: [],
    }))
  },

  aggregateReports: async (formTemplateId: string, reportPeriodId: string) => {
    const response = await apiClient.post<unknown>('/analytics/pivot', {
      formId: formTemplateId,
      periodIds: [reportPeriodId],
      orgIds: [],
    })

    const payload = response.data
    if (isRecord(payload)) {
      const formTemplateName =
        typeof payload.formTemplateName === 'string' ? payload.formTemplateName : ''
      const reportPeriodName =
        typeof payload.reportPeriodName === 'string' ? payload.reportPeriodName : ''
      const collectedUnits =
        typeof payload.collectedUnits === 'number' ? payload.collectedUnits : 0
      const approvedUnits = typeof payload.approvedUnits === 'number' ? payload.approvedUnits : 0
      const pendingUnits = typeof payload.pendingUnits === 'number' ? payload.pendingUnits : 0
      const rejectedUnits = typeof payload.rejectedUnits === 'number' ? payload.rejectedUnits : 0
      const averageCompletion =
        typeof payload.averageCompletion === 'number' ? payload.averageCompletion : 0

      if (
        formTemplateName ||
        reportPeriodName ||
        collectedUnits ||
        approvedUnits ||
        pendingUnits ||
        rejectedUnits ||
        averageCompletion
      ) {
        return {
          formTemplateName,
          reportPeriodName,
          collectedUnits,
          approvedUnits,
          pendingUnits,
          rejectedUnits,
          averageCompletion,
        } satisfies AggregateResult
      }
    }

    const refs = await reportManagementApi.listReferenceData()
    const formName = refs.forms.find((item) => item.id === formTemplateId)?.name ?? ''
    const periodName = refs.periods.find((item) => item.id === reportPeriodId)?.name ?? ''

    return {
      formTemplateName: formName,
      reportPeriodName: periodName,
      collectedUnits: 0,
      approvedUnits: 0,
      pendingUnits: 0,
      rejectedUnits: 0,
      averageCompletion: 0,
    } satisfies AggregateResult
  },

  updateReportValue: async (reportId: string, rowId: string, value: number | null) => {
    await apiClient.patch(`/submissions/${reportId}/cells`, {
      changes: [{ indicatorId: rowId, valueNumeric: value }],
    })
    return true
  },

  autosaveReport: async (reportId: string) => {
    await apiClient.patch(`/submissions/${reportId}/save`)
    return true
  },

  importExcelData: async (reportId: string) => {
    await apiClient.post(`/submissions/${reportId}/import`)
    return true
  },

  copyPreviousPeriod: async (reportId: string) => {
    await apiClient.post(`/submissions/${reportId}/copy-previous`)
    return true
  },

  submitReport: async (reportId: string, note: string) => {
    await apiClient.post(`/submissions/${reportId}/submit`, { note })
    return true
  },

  approveReport: async (reportId: string, note: string) => {
    await apiClient.post(`/approvals/${reportId}/approve`, { note })
    return true
  },

  rejectReport: async (reportId: string, note: string) => {
    await apiClient.post(`/approvals/${reportId}/reject`, { note })
    return true
  },

  softDeleteReport: async (reportId: string, reason: string) => {
    await apiClient.post(`/submissions/${reportId}/soft-delete`, { reason })
    return true
  },

  exportReports: async (format: 'excel' | 'pdf') => {
    await apiClient.get('/analytics/export', { params: { format } })
    const stamp = new Date().toISOString().slice(0, 10)
    return {
      fileName: `analytics-export-${stamp}.${format === 'excel' ? 'xlsx' : 'pdf'}`,
      format,
    }
  },
}
