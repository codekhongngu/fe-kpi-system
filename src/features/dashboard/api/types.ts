import type { PeriodType } from '@/features/form-management/api/types'

export type DashboardReportStatus =
  | 'NOT_STARTED'
  | 'DRAFT'
  | 'PENDING_DEPARTMENT'
  | 'DEPARTMENT_APPROVED'
  | 'DISTRICT_APPROVED'
  | 'REJECTED_DEPARTMENT'
  | 'REJECTED_DISTRICT'
  | 'OVERDUE'
  | string

export type DashboardFieldCategoryRef = {
  id: string
  code: string
  name: string
}

export type DashboardTemplateRef = {
  id: string
  code?: string
  name?: string
}

/** Field category with nested templates from GET /dashboard/field-categories */
export type DashboardFieldCategoryHub = {
  id: string
  code: string
  name: string
  sortOrder?: number
  isActive?: boolean
  templates: DashboardTemplateRef[]
}

export type DashboardSchemaIndicator = {
  id: string
  code: string
  name: string
  unit?: string
  type?: 'INPUT' | 'TITLE' | string
  parentId?: string | null
  order?: number
  level?: number
}

export type DashboardSchemaAttribute = {
  id: string
  key?: string
  label: string
  order?: number
  parentId?: string | null
  level?: number
  isSystemDefault?: boolean
}

export type DashboardSchema = {
  indicators: DashboardSchemaIndicator[]
  attributes: DashboardSchemaAttribute[]
}

export type DashboardReportCell = {
  indicatorId: string
  attributeId: string
  valueText: string | null
  valueNumber: number | string | null
}

export type DashboardReportItem = {
  id: string
  orgId?: string
  orgCode?: string
  orgName?: string
  status?: DashboardReportStatus
  cells: DashboardReportCell[]
}

export type DashboardReportsMeta = {
  page: number
  limit: number
  total: number
}

export type DashboardReportsContext = {
  fieldCategory: DashboardFieldCategoryRef
  template: DashboardTemplateRef
  periodCode: string
  periodType?: PeriodType | string
  periodName?: string
  status?: DashboardReportStatus | string
  orgId?: string | null
}

export type DashboardFieldReportsResponse = {
  context: DashboardReportsContext
  schema: DashboardSchema
  reports: {
    items: DashboardReportItem[]
    meta: DashboardReportsMeta
  }
}

export type DashboardFieldReportsParams = {
  templateId: string
  periodCode: string
  periodType?: PeriodType | string
  status?: string
  orgId?: string
  page?: number
  limit?: number
}

export type FieldDashboardSearch = {
  templateId: string
  periodCode: string
  periodType?: PeriodType
  status?: string
  orgId?: string
  page?: number
  limit?: number
}
