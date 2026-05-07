import {
  type CreateReportInput,
  type ReportAction,
  type ReportDetail,
  type ReportFilters,
  type ReportHistoryItem,
  type ReportListItem,
  type ReportListResponse,
  type ReportReferences,
  type ReportStatus,
  type ReportSummary,
  type UpdateReportInput,
} from './types'

const NETWORK_DELAY_MS = 220
const NOW_DATE = '2026-05-06'

const references: ReportReferences = {
  templates: [
    { id: 'tpl-ktxh', code: 'KTXH-2026', name: 'Bộ chỉ tiêu kinh tế xã hội' },
    { id: 'tpl-yte', code: 'YTE-2026', name: 'Bộ chỉ tiêu y tế cơ sở' },
    { id: 'tpl-gddt', code: 'GDDT-2026', name: 'Bộ chỉ tiêu giáo dục đào tạo' },
  ],
  units: [
    { id: 'org-vp', code: 'VP-UBND', name: 'Văn phòng UBND' },
    { id: 'org-yte', code: 'PYT', name: 'Phòng Y tế' },
    { id: 'org-gddt', code: 'PGDDT', name: 'Phòng Giáo dục và Đào tạo' },
    { id: 'org-tc', code: 'PTC', name: 'Phòng Tài chính' },
  ],
  periods: [
    { id: '2026-04', code: 'T04-2026', name: 'Tháng 04/2026' },
    { id: '2026-05', code: 'T05-2026', name: 'Tháng 05/2026' },
    { id: '2026-Q2', code: 'Q2-2026', name: 'Quý II/2026' },
  ],
}

const baseCells: ReportDetail['cells'] = [
  {
    id: 'cell-01',
    indicatorCode: 'KTXH.001',
    indicatorName: 'Tổng số hồ sơ tiếp nhận',
    attributeName: 'Số lượng',
    dataType: 'number',
    value: 1280,
    required: true,
    editable: true,
  },
  {
    id: 'cell-02',
    indicatorCode: 'KTXH.002',
    indicatorName: 'Tỷ lệ xử lý đúng hạn',
    attributeName: 'Tỷ lệ',
    dataType: 'number',
    value: 96.4,
    required: true,
    editable: true,
  },
  {
    id: 'cell-03',
    indicatorCode: 'KTXH.003',
    indicatorName: 'Ghi chú phát sinh',
    attributeName: 'Nội dung',
    dataType: 'text',
    value: 'Không có phát sinh bất thường',
    required: false,
    editable: true,
  },
]

const reportsDb: ReportDetail[] = [
  {
    id: 'rpt-001',
    code: 'BC-2026-001',
    name: 'Báo cáo kinh tế xã hội tháng 04',
    templateId: 'tpl-ktxh',
    templateName: 'Bộ chỉ tiêu kinh tế xã hội',
    unitId: 'org-vp',
    unitName: 'Văn phòng UBND',
    period: 'Tháng 04/2026',
    openDate: '2026-04-25',
    closeDate: '2026-05-05',
    deadline: '2026-05-05',
    status: 'OVERDUE',
    priority: 'high',
    completionPercent: 68,
    ownerName: 'Nguyễn Văn An',
    updatedBy: 'Nguyễn Văn An',
    updatedAt: '2026-05-05T08:30:00.000Z',
    submittedAt: null,
    approvedAt: null,
    rejectionReason: null,
    note: 'Cần bổ sung số liệu từ phòng chuyên môn.',
    description: 'Báo cáo định kỳ từ template đã khóa sau khi tạo report.',
    assignees: ['Nguyễn Văn An', 'Trần Minh Anh'],
    cells: baseCells.map((cell) => ({ ...cell })),
    history: [
      {
        id: 'hst-001',
        actor: 'Admin hệ thống',
        action: 'Giao báo cáo',
        note: 'Giao cho Văn phòng UBND',
        createdAt: '2026-04-25T02:00:00.000Z',
      },
    ],
  },
  {
    id: 'rpt-002',
    code: 'BC-2026-002',
    name: 'Báo cáo y tế cơ sở tháng 05',
    templateId: 'tpl-yte',
    templateName: 'Bộ chỉ tiêu y tế cơ sở',
    unitId: 'org-yte',
    unitName: 'Phòng Y tế',
    period: 'Tháng 05/2026',
    openDate: '2026-05-01',
    closeDate: '2026-05-20',
    deadline: '2026-05-20',
    status: 'UNDER_REVIEW',
    priority: 'normal',
    completionPercent: 100,
    ownerName: 'Lê Thu Hà',
    updatedBy: 'Lê Thu Hà',
    updatedAt: '2026-05-06T03:15:00.000Z',
    submittedAt: '2026-05-06T03:15:00.000Z',
    approvedAt: null,
    rejectionReason: null,
    note: null,
    description: 'Đang chờ admin kiểm tra và phê duyệt.',
    assignees: ['Lê Thu Hà'],
    cells: baseCells.map((cell) => ({ ...cell, id: `yte-${cell.id}` })),
    history: [
      {
        id: 'hst-002',
        actor: 'Lê Thu Hà',
        action: 'Nộp báo cáo',
        note: 'Đã hoàn tất nhập liệu',
        createdAt: '2026-05-06T03:15:00.000Z',
      },
    ],
  },
  {
    id: 'rpt-003',
    code: 'BC-2026-003',
    name: 'Báo cáo giáo dục quý II',
    templateId: 'tpl-gddt',
    templateName: 'Bộ chỉ tiêu giáo dục đào tạo',
    unitId: 'org-gddt',
    unitName: 'Phòng Giáo dục và Đào tạo',
    period: 'Quý II/2026',
    openDate: '2026-05-02',
    closeDate: '2026-06-30',
    deadline: '2026-06-30',
    status: 'ASSIGNED',
    priority: 'normal',
    completionPercent: 0,
    ownerName: 'Phạm Quốc Bảo',
    updatedBy: 'Admin hệ thống',
    updatedAt: '2026-05-02T07:00:00.000Z',
    submittedAt: null,
    approvedAt: null,
    rejectionReason: null,
    note: 'Mới giao, chưa nhập liệu.',
    description: 'Báo cáo theo quý, tổng hợp từ các nhóm chỉ tiêu giáo dục.',
    assignees: ['Phạm Quốc Bảo'],
    cells: baseCells.map((cell) => ({
      ...cell,
      id: `gddt-${cell.id}`,
      value: null,
    })),
    history: [
      {
        id: 'hst-003',
        actor: 'Admin hệ thống',
        action: 'Tạo báo cáo',
        note: 'Tạo từ template Bộ chỉ tiêu giáo dục đào tạo',
        createdAt: '2026-05-02T07:00:00.000Z',
      },
    ],
  },
  {
    id: 'rpt-004',
    code: 'BC-2026-004',
    name: 'Báo cáo tài chính tháng 04',
    templateId: 'tpl-ktxh',
    templateName: 'Bộ chỉ tiêu kinh tế xã hội',
    unitId: 'org-tc',
    unitName: 'Phòng Tài chính',
    period: 'Tháng 04/2026',
    openDate: '2026-04-26',
    closeDate: '2026-05-07',
    deadline: '2026-05-07',
    status: 'APPROVED',
    priority: 'low',
    completionPercent: 100,
    ownerName: 'Đỗ Minh Tuấn',
    updatedBy: 'Admin hệ thống',
    updatedAt: '2026-05-05T10:20:00.000Z',
    submittedAt: '2026-05-05T08:00:00.000Z',
    approvedAt: '2026-05-05T10:20:00.000Z',
    rejectionReason: null,
    note: null,
    description: 'Báo cáo đã được phê duyệt.',
    assignees: ['Đỗ Minh Tuấn'],
    cells: baseCells.map((cell) => ({ ...cell, id: `tc-${cell.id}` })),
    history: [
      {
        id: 'hst-004',
        actor: 'Admin hệ thống',
        action: 'Phê duyệt báo cáo',
        note: 'Số liệu hợp lệ',
        createdAt: '2026-05-05T10:20:00.000Z',
      },
    ],
  },
]

function wait(ms = NETWORK_DELAY_MS) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

async function simulate<T>(factory: () => T): Promise<T> {
  await wait()
  return factory()
}

function normalize(value: string) {
  return value.trim().toLowerCase()
}

function cloneDetail(report: ReportDetail): ReportDetail {
  return {
    ...report,
    assignees: [...report.assignees],
    cells: report.cells.map((cell) => ({ ...cell })),
    history: report.history.map((item) => ({ ...item })),
  }
}

function toListItem(report: ReportDetail): ReportListItem {
  const { description: _description, assignees: _assignees, cells: _cells, history: _history, ...item } =
    report
  return { ...item }
}

function nextCode() {
  return `BC-2026-${String(reportsDb.length + 1).padStart(3, '0')}`
}

function nextId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function appendHistory(report: ReportDetail, action: string, note: string) {
  const item: ReportHistoryItem = {
    id: nextId('hst'),
    actor: 'Admin hệ thống',
    action,
    note,
    createdAt: new Date().toISOString(),
  }
  report.history.unshift(item)
}

function ensureReport(id: string) {
  const report = reportsDb.find((item) => item.id === id)
  if (!report) {
    throw new Error('Không tìm thấy báo cáo.')
  }
  return report
}

function matchesTab(report: ReportListItem, tab: ReportFilters['tab']) {
  if (tab === 'all') return true
  if (tab === 'unsubmitted') {
    return ['ASSIGNED', 'NOT_STARTED', 'DRAFT', 'DRAFTING', 'OVERDUE'].includes(report.status)
  }
  if (tab === 'pending_approval') {
    return ['SUBMITTED', 'UNDER_REVIEW'].includes(report.status)
  }
  if (tab === 'approved') {
    return ['APPROVED', 'COMPLETED'].includes(report.status)
  }
  if (tab === 'rejected') {
    return report.status === 'REJECTED'
  }
  return report.status === 'OVERDUE'
}

function computeSummary(items: ReportListItem[]): ReportSummary {
  return {
    total: items.length,
    unsubmitted: items.filter((item) => matchesTab(item, 'unsubmitted')).length,
    pendingApproval: items.filter((item) => matchesTab(item, 'pending_approval')).length,
    approved: items.filter((item) => matchesTab(item, 'approved')).length,
    rejected: items.filter((item) => matchesTab(item, 'rejected')).length,
    overdue: items.filter((item) => item.status === 'OVERDUE' || item.deadline < NOW_DATE).length,
  }
}

function updateReportStatus(report: ReportDetail, status: ReportStatus) {
  report.status = status
  report.updatedBy = 'Admin hệ thống'
  report.updatedAt = new Date().toISOString()
}

export const reportManagementApi = {
  listReferences: () => simulate(() => ({ ...references })),

  listReports: (filters: ReportFilters): Promise<ReportListResponse> =>
    simulate(() => {
      const keyword = normalize(filters.keyword)
      const filtered = reportsDb
        .map(toListItem)
        .filter((item) => matchesTab(item, filters.tab))
        .filter((item) => filters.status === 'all' || item.status === filters.status)
        .filter((item) => !filters.templateId || item.templateId === filters.templateId)
        .filter((item) => !filters.unitId || item.unitId === filters.unitId)
        .filter((item) => !filters.period || item.period === filters.period)
        .filter((item) => {
          if (!keyword) return true
          return [
            item.code,
            item.name,
            item.templateName,
            item.unitName,
            item.period,
            item.ownerName,
          ].some((value) => normalize(value).includes(keyword))
        })
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

      const start = (filters.page - 1) * filters.pageSize
      return {
        items: filtered.slice(start, start + filters.pageSize),
        total: filtered.length,
      }
    }),

  getSummary: () => simulate(() => computeSummary(reportsDb.map(toListItem))),

  getReport: (id: string) => simulate(() => cloneDetail(ensureReport(id))),

  createReport: (input: CreateReportInput) =>
    simulate(() => {
      const template = references.templates.find((item) => item.id === input.templateId)
      if (!template) {
        throw new Error('Thông tin tạo báo cáo chưa hợp lệ.')
      }

      const unit = references.units[0]
      if (!unit) {
        throw new Error('Đơn vị được chọn không hợp lệ.')
      }

      const report: ReportDetail = {
        id: nextId('rpt'),
        code: nextCode(),
        name: input.name,
        templateId: template.id,
        templateName: template.name,
        unitId: unit.id,
        unitName: unit.name,
        period: input.periodName,
        openDate: input.openDate,
        closeDate: input.closeDate,
        deadline: input.closeDate,
        status: 'DRAFT',
        priority: input.priority,
        completionPercent: 0,
        ownerName: unit.name,
        updatedBy: 'Admin hệ thống',
        updatedAt: new Date().toISOString(),
        submittedAt: null,
        approvedAt: null,
        rejectionReason: null,
        note: input.note ?? null,
        description: 'Báo cáo được tạo từ template đang hiệu lực.',
        assignees: [unit.name],
        cells: baseCells.map((cell) => ({
          ...cell,
          id: `${unit.id}-${cell.id}`,
          value: null,
        })),
        history: [],
      }
      appendHistory(report, 'Tạo báo cáo', `Tạo từ template ${template.name}`)
      reportsDb.unshift(report)

      return cloneDetail(report)
    }),

  updateReport: (id: string, input: UpdateReportInput) =>
    simulate(() => {
      const report = ensureReport(id)
      if (['APPROVED', 'COMPLETED', 'CANCELLED'].includes(report.status)) {
        throw new Error('Không thể chỉnh sửa báo cáo đã chốt.')
      }
      report.name = input.name
      report.deadline = input.deadline
      report.priority = input.priority
      report.note = input.note ?? null
      report.updatedBy = 'Admin hệ thống'
      report.updatedAt = new Date().toISOString()
      appendHistory(report, 'Cập nhật báo cáo', 'Cập nhật thông tin chung')
      return cloneDetail(report)
    }),

  deleteReport: (id: string) =>
    simulate(() => {
      const index = reportsDb.findIndex((item) => item.id === id)
      if (index < 0) {
        throw new Error('Không tìm thấy báo cáo.')
      }
      if (['APPROVED', 'COMPLETED'].includes(reportsDb[index].status)) {
        throw new Error('Không thể xóa báo cáo đã duyệt.')
      }
      reportsDb.splice(index, 1)
      return true
    }),

  assignReport: (id: string) =>
    simulate(() => {
      const report = ensureReport(id)
      updateReportStatus(report, 'ASSIGNED')
      appendHistory(report, 'Giao báo cáo', 'Giao cho đơn vị nhập liệu')
      return cloneDetail(report)
    }),

  approveReport: (id: string, note: string) =>
    simulate(() => {
      const report = ensureReport(id)
      if (!['SUBMITTED', 'UNDER_REVIEW'].includes(report.status)) {
        throw new Error('Chỉ phê duyệt báo cáo đang chờ duyệt.')
      }
      updateReportStatus(report, 'APPROVED')
      report.approvedAt = new Date().toISOString()
      appendHistory(report, 'Phê duyệt báo cáo', note.trim() || 'Số liệu hợp lệ')
      return cloneDetail(report)
    }),

  rejectReport: (id: string, reason: string) =>
    simulate(() => {
      if (!reason.trim()) {
        throw new Error('Lý do trả lại là bắt buộc.')
      }
      const report = ensureReport(id)
      if (!['SUBMITTED', 'UNDER_REVIEW'].includes(report.status)) {
        throw new Error('Chỉ trả lại báo cáo đang chờ duyệt.')
      }
      updateReportStatus(report, 'REJECTED')
      report.rejectionReason = reason.trim()
      appendHistory(report, 'Trả lại báo cáo', reason.trim())
      return cloneDetail(report)
    }),

  exportReports: (format: 'excel' | 'pdf') =>
    simulate(() => {
      const stamp = new Date().toISOString().slice(0, 10)
      return {
        fileName: `quan-ly-bao-cao-${stamp}.${format === 'excel' ? 'xlsx' : 'pdf'}`,
        format,
      }
    }),
}

export function canRunReportAction(report: ReportListItem, action: ReportAction) {
  if (action === 'report:update') {
    return !['APPROVED', 'COMPLETED', 'CANCELLED'].includes(report.status)
  }
  if (action === 'report:delete') {
    return !['APPROVED', 'COMPLETED'].includes(report.status)
  }
  if (action === 'report:assign') {
    return ['DRAFT', 'NOT_STARTED'].includes(report.status)
  }
  if (action === 'report:approve' || action === 'report:reject') {
    return ['SUBMITTED', 'UNDER_REVIEW'].includes(report.status)
  }
  return true
}
