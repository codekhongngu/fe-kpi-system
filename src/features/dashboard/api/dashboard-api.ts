import { apiClient } from '@/lib/api-client'
import type {
  DashboardFieldCategoryHub,
  DashboardFieldReportsParams,
  DashboardFieldReportsResponse,
  DashboardReportCell,
  DashboardReportItem,
  DashboardReportsContext,
  DashboardReportsMeta,
  DashboardSchema,
  DashboardSchemaAttribute,
  DashboardSchemaIndicator,
  DashboardTemplateRef,
} from './types'

type BeTemplate = {
  id: string
  code?: string
  name?: string
}

type BeFieldCategoryHub = {
  id: string
  code?: string
  name?: string
  sortOrder?: number
  sort_order?: number
  isActive?: boolean
  is_active?: boolean
  templates?: BeTemplate[]
}

type BeCell = {
  indicatorId: string
  attributeId: string
  valueText?: string | null
  valueNumber?: number | string | null
}

type BeReportItem = {
  id: string
  orgId?: string
  orgCode?: string
  orgName?: string
  status?: string
  cells?: BeCell[]
}

type BeSchemaIndicator = {
  id: string
  code?: string
  name?: string
  unit?: string
  type?: string
  parentId?: string | null
  order?: number
  level?: number
}

type BeSchemaAttribute = {
  id: string
  key?: string
  label?: string
  order?: number
  parentId?: string | null
  level?: number
  isSystemDefault?: boolean
  is_system_default?: boolean
}

type BeSchema = {
  indicators?: BeSchemaIndicator[]
  attributes?: BeSchemaAttribute[]
}

type BeReportsResponse = {
  context?: Record<string, unknown>
  schema?: BeSchema
  reports?: {
    items?: BeReportItem[]
    meta?: Partial<DashboardReportsMeta>
  }
}

function unwrapList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[]
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    if (Array.isArray(record.items)) return record.items as T[]
    if (Array.isArray(record.data)) return record.data as T[]
  }
  return []
}

const mapTemplate = (item: BeTemplate): DashboardTemplateRef => ({
  id: item.id,
  code: item.code,
  name: item.name,
})

const mapFieldCategoryHub = (item: BeFieldCategoryHub): DashboardFieldCategoryHub => ({
  id: item.id,
  code: item.code ?? '',
  name: item.name ?? '',
  sortOrder:
    typeof item.sortOrder === 'number'
      ? item.sortOrder
      : typeof item.sort_order === 'number'
        ? item.sort_order
        : 0,
  isActive:
    typeof item.isActive === 'boolean'
      ? item.isActive
      : typeof item.is_active === 'boolean'
        ? item.is_active
        : true,
  templates: (item.templates ?? []).map(mapTemplate),
})

const mapCell = (cell: BeCell): DashboardReportCell => ({
  indicatorId: cell.indicatorId,
  attributeId: cell.attributeId,
  valueText: cell.valueText ?? null,
  valueNumber: cell.valueNumber ?? null,
})

const mapReportItem = (item: BeReportItem): DashboardReportItem => ({
  id: item.id,
  orgId: item.orgId,
  orgCode: item.orgCode,
  orgName: item.orgName,
  status: item.status,
  cells: (item.cells ?? []).map(mapCell),
})

const mapIndicator = (item: BeSchemaIndicator): DashboardSchemaIndicator => ({
  id: item.id,
  code: item.code ?? '',
  name: item.name ?? '',
  unit: item.unit ?? '',
  type: item.type,
  parentId: item.parentId ?? null,
  order: item.order,
  level: item.level,
})

const mapAttribute = (item: BeSchemaAttribute): DashboardSchemaAttribute => ({
  id: item.id,
  key: item.key,
  label: item.label ?? '',
  order: item.order,
  parentId: item.parentId ?? null,
  level: item.level,
  isSystemDefault: item.isSystemDefault ?? item.is_system_default ?? false,
})

const mapSchema = (schema?: BeSchema): DashboardSchema => ({
  indicators: (schema?.indicators ?? []).map(mapIndicator),
  attributes: (schema?.attributes ?? []).map(mapAttribute),
})

const mapTemplateRef = (raw: Record<string, unknown>): DashboardTemplateRef => ({
  id: String(raw.id ?? ''),
  code: typeof raw.code === 'string' ? raw.code : undefined,
  name: typeof raw.name === 'string' ? raw.name : undefined,
})

const mapContext = (raw: Record<string, unknown>): DashboardReportsContext => {
  const fieldCategory = raw.fieldCategory as Record<string, unknown> | undefined
  const template = raw.template as Record<string, unknown> | undefined

  return {
    fieldCategory: {
      id: String(fieldCategory?.id ?? ''),
      code: String(fieldCategory?.code ?? ''),
      name: String(fieldCategory?.name ?? ''),
    },
    template: mapTemplateRef(template ?? {}),
    periodCode: String(raw.periodCode ?? ''),
    periodType: raw.periodType as DashboardReportsContext['periodType'],
    periodName: typeof raw.periodName === 'string' ? raw.periodName : undefined,
    status: typeof raw.status === 'string' ? raw.status : undefined,
    orgId:
      typeof raw.orgId === 'string'
        ? raw.orgId
        : raw.orgId === null
          ? null
          : undefined,
  }
}

const mapReportsResponse = (payload: BeReportsResponse): DashboardFieldReportsResponse => {
  const items = payload.reports?.items ?? []
  const meta = payload.reports?.meta ?? {}

  return {
    context: mapContext((payload.context ?? {}) as Record<string, unknown>),
    schema: mapSchema(payload.schema),
    reports: {
      items: items.map(mapReportItem),
      meta: {
        page: meta.page ?? 1,
        limit: meta.limit ?? items.length,
        total: meta.total ?? items.length,
      },
    },
  }
}

export const dashboardApi = {
  listDashboardFieldCategories: async (
    isGetAll = true
  ): Promise<DashboardFieldCategoryHub[]> => {
    const response = await apiClient.get<unknown>('/dashboard/field-categories', {
      params: { isGetAll },
    })
    return unwrapList<BeFieldCategoryHub>(response.data)
      .map(mapFieldCategoryHub)
      .filter((item) => item.isActive !== false && item.code.trim())
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  },

  getFieldCategoryReports: async (
    fieldCategoryId: string,
    params: DashboardFieldReportsParams
  ): Promise<DashboardFieldReportsResponse> => {
    const response = await apiClient.get<BeReportsResponse>(
      `/dashboard/field-categories/${fieldCategoryId}/reports`,
      { params }
    )
    return mapReportsResponse(response.data)
  },
}
