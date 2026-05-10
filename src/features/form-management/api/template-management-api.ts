import {
  type CatalogOption,
  type CatalogStatusFilter,
  type CreateFieldInput,
  type CreateFieldCategoryInput,
  type CreateIndicatorInput,
  type CreateTemplateInput,
  type FieldCategory,
  type FormTemplate,
  type FormTemplateListResult,
  type FormTemplateListParams,
  type PeriodType,
  type TemplateLifecycleStatus,
  type TemplateField,
  type TemplateCellConfig,
  type EffectiveTemplateCellConfig,
  type TemplateIndicator,
  type TemplateScope,
  type TemplateScopeInput,
  type TemplateType,
  type UpdateFieldInput,
  type UpdateFieldCategoryInput,
  type UpdateIndicatorInput,
  type UpdateTemplateInput,
} from './types'
import { apiClient } from '@/lib/api-client'

function shouldFallbackToUnderscorePath(error: unknown) {
  const status = (error as { response?: { status?: number } })?.response?.status
  return status === 404 || status === 405
}

type BeCatalogItem = { id: string; code?: string; name?: string }
type BeForm = {
  id: string
  code: string
  name: string
  description?: string
  fieldCategoryId?: string
  fieldCategory?: { id: string; name?: string } | string
  fieldCategoryName?: string
  periodType?: PeriodType
  templateType?: TemplateType
  templateStatus?: TemplateLifecycleStatus
  isActive?: boolean
  updatedAt?: string
  attributes?: BeAttribute[]
  indicators?: BeIndicator[]
  cellConfigs?: BeCellConfig[]
  templateScopes?: BeScope[]
}
type BeAttribute = {
  id: string
  parentId?: string | null
  name?: string
  key?: string
  sortOrder?: number
  order?: number
  level?: number
  isSystem?: boolean
}
type BeIndicator = {
  id: string
  parentId?: string | null
  displayIndex?: string
  code?: string
  name?: string
  unit?: string
  dataType?: string
  type?: 'INPUT' | 'TITLE'
  sortOrder?: number
  order?: number
  level?: number
}

type BeScope = {
  id?: string
  orgId: string
  orgCode?: string
  orgName?: string
  indicatorId: string
  indicatorCode?: string
  indicatorName?: string
}

export type OrgTreeItem = {
  id: string
  code: string
  name: string
  level: number
  parentId: string | null
  canAssignReports: boolean
  children: OrgTreeItem[]
}

type BeOrgTreeItem = {
  id: string
  code?: string
  name?: string
  level?: number
  parentId?: string | null
  canAssignReports?: boolean
  can_assign_reports?: boolean
  children?: BeOrgTreeItem[]
}

type BeEffectiveCellConfig = EffectiveTemplateCellConfig
type BeCellConfig = {
  id?: string
  indicatorId: string
  attributeId: string
  dataType?: string | null
  required?: boolean | null
  readOnly?: boolean | null
  formula?: string | null
  isEditable?: boolean
  isRequired?: boolean | null
}

const mapCellConfig = (item: BeCellConfig): TemplateCellConfig => {
  const formula = item.formula?.trim() ? item.formula.trim() : null
  const readOnlyRaw =
    typeof item.readOnly === 'boolean'
      ? item.readOnly
      : typeof item.isEditable === 'boolean'
        ? !item.isEditable
        : false
  return {
    id: item.id,
    indicatorId: item.indicatorId,
    attributeId: item.attributeId,
    dataType: item.dataType === 'number' ? 'number' : 'text',
    required: typeof item.required === 'boolean' ? item.required : Boolean(item.isRequired),
    readOnly: formula ? true : readOnlyRaw,
    formula,
  }
}

const mapAttribute = (item: BeAttribute): TemplateField => ({
  id: item.id,
  key: item.key ?? item.name ?? '',
  label: item.name ?? item.key ?? '',
  order: item.sortOrder ?? item.order ?? 0,
  parentId: item.parentId ?? null,
  level: item.level ?? 0,
  isSystemDefault: Boolean(item.isSystem),
})

const mapIndicator = (item: BeIndicator): TemplateIndicator => ({
  id: item.id,
  code: item.code ?? item.displayIndex ?? '',
  name: item.name ?? '',
  unit: item.unit ?? '',
  dataType: item.dataType ?? 'number',
  type: item.type === 'TITLE' ? 'TITLE' : 'INPUT',
  parentId: item.parentId ?? null,
  order: item.sortOrder ?? item.order ?? 0,
  level: item.level ?? 0,
  hasReportData: false,
})

const mapScope = (item: BeScope): TemplateScope => ({
  id: item.id,
  orgId: item.orgId,
  orgCode: item.orgCode,
  orgName: item.orgName,
  indicatorId: item.indicatorId,
  indicatorCode: item.indicatorCode,
  indicatorName: item.indicatorName,
})

export const formManagementApi = {
  getOrgTree: async (): Promise<OrgTreeItem[]> => {
    const response = await apiClient.get<{ items?: BeOrgTreeItem[] } | BeOrgTreeItem[]>('/orgs', { params: { tree: true } })
    const payload = response.data
    const items = Array.isArray(payload) ? payload : (payload.items ?? [])
    
    const mapTree = (nodes: BeOrgTreeItem[]): OrgTreeItem[] => {
      return nodes.map((node) => ({
        id: node.id,
        code: node.code ?? '',
        name: node.name ?? '',
        level: node.level ?? 1,
        parentId: node.parentId ?? null,
        canAssignReports: Boolean(node.canAssignReports ?? node.can_assign_reports ?? true),
        children: mapTree(node.children ?? []),
      }))
    }
    
    return mapTree(items)
  },

  listFieldCategories: async () => {
    type BeFieldCategory = {
      id: string
      code?: string
      name?: string
      description?: string | null
      sortOrder?: number
      sort_order?: number
      isActive?: boolean
      is_active?: boolean
    }

    const fetch = async (path: string) => {
      const response = await apiClient.get<
        | { items?: BeFieldCategory[] }
        | { data?: BeFieldCategory[] }
        | { data: BeFieldCategory[]; meta?: unknown }
        | BeFieldCategory[]
      >(path, { params: { page: 1, limit: 200 } })

      const payload = response.data
      const items = Array.isArray(payload)
        ? payload
        : Array.isArray((payload as { data?: unknown }).data)
          ? ((payload as { data: BeFieldCategory[] }).data ?? [])
          : (payload as { items?: BeFieldCategory[] }).items ?? []

      return items.map<FieldCategory>((item) => ({
        id: item.id,
        code: item.code ?? '',
        name: item.name ?? '',
        description: typeof item.description === 'string' ? item.description : null,
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
      }))
    }

    try {
      return await fetch('/field-categories')
    } catch (error) {
      if (!shouldFallbackToUnderscorePath(error)) {
        throw error
      }
      return await fetch('/field_categories')
    }
  },

  createFieldCategory: async (input: CreateFieldCategoryInput) => {
    const payload = {
      code: input.code,
      name: input.name,
      description: input.description,
      sortOrder: input.sortOrder,
      isActive: input.isActive,
    }

    try {
      const response = await apiClient.post<FieldCategory>('/field-categories', payload)
      return response.data
    } catch (error) {
      if (!shouldFallbackToUnderscorePath(error)) {
        throw error
      }
      const response = await apiClient.post<FieldCategory>('/field_categories', payload)
      return response.data
    }
  },

  updateFieldCategory: async (id: string, input: UpdateFieldCategoryInput) => {
    const payload = {
      code: input.code,
      name: input.name,
      description: input.description,
      sortOrder: input.sortOrder,
      isActive: input.isActive,
    }

    try {
      const response = await apiClient.patch<FieldCategory>(`/field-categories/${id}`, payload)
      return response.data
    } catch (error) {
      if (!shouldFallbackToUnderscorePath(error)) {
        throw error
      }
      const response = await apiClient.patch<FieldCategory>(`/field_categories/${id}`, payload)
      return response.data
    }
  },

  deleteFieldCategory: async (id: string) => {
    const attempts: Array<() => Promise<void>> = [
      () => apiClient.delete(`/field-categories/${id}`),
      () => apiClient.delete(`/field_categories/${id}`),
      () => apiClient.delete('/field-categories', { data: { id } }),
      () => apiClient.delete('/field_categories', { data: { id } }),
      () => apiClient.delete('/field-categories', { params: { id } }),
      () => apiClient.delete('/field_categories', { params: { id } }),
    ]

    const errors: unknown[] = []

    for (const attempt of attempts) {
      try {
        await attempt()
        return true
      } catch (error) {
        errors.push(error)
        if (!shouldFallbackToUnderscorePath(error)) {
          throw error
        }
      }
    }

    const message =
      errors.length > 0
        ? 'Backend chưa hỗ trợ API xóa lĩnh vực biểu mẫu. Vui lòng kiểm tra lại endpoint xóa.'
        : 'Không thể xóa lĩnh vực biểu mẫu.'
    throw new Error(message)
  },

  listTemplates: async (params?: FormTemplateListParams): Promise<FormTemplateListResult> => {
    const rawParams = (params ?? {}) as Record<string, unknown>
    const readString = (...values: unknown[]) =>
      values.find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim() ?? ''
    const search = readString(rawParams.q, rawParams.search)
    const category = readString(rawParams.fieldCategoryId, rawParams.category, rawParams.fieldCategory)
    const periodType = readString(rawParams.periodType, rawParams.period)
    const statusRaw = rawParams.status
    const statusValue =
      statusRaw === 'true'
        ? 'active'
        : statusRaw === 'false'
          ? 'inactive'
          : statusRaw === 'active' || statusRaw === 'inactive'
            ? statusRaw
            : ''
    const isActive =
      typeof rawParams.isActive === 'boolean'
        ? rawParams.isActive
        : statusValue === 'active'
          ? true
          : statusValue === 'inactive'
            ? false
            : undefined

    const requestParams: Record<string, string | number | boolean> = {
      page: typeof rawParams.page === 'number' ? rawParams.page : 1,
      limit: typeof rawParams.limit === 'number' ? rawParams.limit : 20,
    }

    if (search) {
      requestParams.q = search
      requestParams.search = search
    }

    if (category) {
      requestParams.fieldCategoryId = category
    }

    if (periodType) {
      requestParams.periodType = periodType
    }

    if (statusValue) {
      requestParams.status = statusValue
    }

    if (typeof isActive === 'boolean') {
      requestParams.isActive = isActive
    }

    const response = await apiClient.get<
      BeForm[] | { items?: BeForm[]; meta?: { page?: number; limit?: number; total?: number } }
    >('/forms', {
      params: requestParams,
    })
    const payload = response.data
    const list = Array.isArray(payload) ? payload : (payload.items ?? [])
    const items = list.map<FormTemplate>((item) => ({
      id: item.id,
      code: item.code,
      name: item.name,
      description: item.description ?? '',
      fieldCategoryId:
        item.fieldCategoryId ??
        (typeof item.fieldCategory === 'string' ? '' : item.fieldCategory?.id) ??
        '',
      fieldCategoryName:
        item.fieldCategoryName ??
        (typeof item.fieldCategory === 'string' ? item.fieldCategory : item.fieldCategory?.name),
      periodType: item.periodType,
      templateType: item.templateType ?? 'AGGREGATE',
      templateStatus: item.templateStatus ?? 'DRAFT',
      isActive: item.isActive ?? true,
      updatedAt: item.updatedAt,
      fields: [],
      indicators: [],
      templateScopes: [],
    }))

    return {
      items,
      meta: {
        page: Array.isArray(payload) ? params?.page ?? 1 : payload.meta?.page ?? (params?.page ?? 1),
        limit: Array.isArray(payload) ? params?.limit ?? 20 : payload.meta?.limit ?? (params?.limit ?? 20),
        total: Array.isArray(payload) ? items.length : payload.meta?.total ?? items.length,
      },
    }
  },

  listFieldCategoriesCatalog: async (status: CatalogStatusFilter = 'all', isGetAll = true) => {
    const params = status === 'all' ? { isGetAll } : { status, isGetAll }
    const response = await apiClient.get<{ items?: BeCatalogItem[] } | BeCatalogItem[]>(
      '/field-categories',
      { params },
    )
    const items = Array.isArray(response.data) ? response.data : (response.data.items ?? [])
    return items.map<CatalogOption>((item) => ({
      id: item.id,
      code: item.code ?? '',
      name: item.name ?? '',
    }))
  },

  getTemplate: async (templateId: string) => {
    const formResponse = await apiClient.get<BeForm>(`/forms/${templateId}`)
    const form = formResponse.data
    const fields = (form.attributes ?? []).map(mapAttribute)
    const indicators = (form.indicators ?? []).map(mapIndicator)
    return {
      id: form.id,
      code: form.code,
      name: form.name,
      description: form.description ?? '',
      fieldCategoryId: form.fieldCategoryId ?? (typeof form.fieldCategory === 'string' ? '' : form.fieldCategory?.id) ?? '',
      fieldCategoryName:
        form.fieldCategoryName ??
        (typeof form.fieldCategory === 'string' ? form.fieldCategory : form.fieldCategory?.name),
      periodType: form.periodType,
      templateType: form.templateType ?? 'AGGREGATE',
      templateStatus: form.templateStatus ?? 'DRAFT',
      isActive: form.isActive ?? true,
      updatedAt: form.updatedAt,
      fields,
      indicators,
      cellConfigs: (form.cellConfigs ?? []).map(mapCellConfig),
      templateScopes: (form.templateScopes ?? []).map(mapScope),
    } satisfies FormTemplate
  },

  createTemplate: async (input: CreateTemplateInput) => {
    const response = await apiClient.post<BeForm | { id: string }>('/forms', input)
    const formId = (response.data as { id?: string }).id
    if (formId) {
      return await formManagementApi.getTemplate(formId)
    }
    const form = response.data as BeForm
    return {
      id: form.id,
      code: form.code,
      name: form.name,
      description: form.description ?? '',
      fieldCategoryId: form.fieldCategoryId ?? input.fieldCategoryId,
      periodType: form.periodType ?? input.periodType,
      templateType: form.templateType ?? input.templateType,
      isActive: form.isActive ?? input.isActive,
      fields: [],
      indicators: [],
      templateScopes: [],
    } satisfies FormTemplate
  },

  updateTemplate: async (templateId: string, input: UpdateTemplateInput) => {
    await apiClient.patch<BeForm | { ok: boolean }>(`/forms/${templateId}`, input)
    return await formManagementApi.getTemplate(templateId)
  },

  deleteTemplate: async (templateId: string) => {
    await apiClient.delete(`/forms/${templateId}`)
    return true
  },

  markReadyTemplate: async (templateId: string) => {
    await apiClient.post(`/forms/${templateId}/mark-ready`)
    return true
  },

  archiveTemplate: async (templateId: string) => {
    await apiClient.post(`/forms/${templateId}/archive`)
    return true
  },

  activateTemplate: async (templateId: string) => {
    await apiClient.post(`/forms/${templateId}/activate`)
    return true
  },

  deactivateTemplate: async (templateId: string) => {
    await apiClient.post(`/forms/${templateId}/deactivate`)
    return true
  },

  copyTemplate: async (templateId: string, payload?: { name?: string }) => {
    const response = await apiClient.post<BeForm | { id: string }>(`/forms/${templateId}/copy`, payload ?? {})
    const formId = (response.data as { id?: string }).id
    if (formId) {
      return await formManagementApi.getTemplate(formId)
    }
    return response.data as BeForm
  },

  createField: async (templateId: string, input: CreateFieldInput) => {
    const payload = {
      parentId: input.parentId ?? null,
      name: input.label,
    }
    const response = await apiClient.post<BeAttribute>(`/forms/${templateId}/attributes`, payload)
    return mapAttribute(response.data)
  },

  updateField: async (templateId: string, fieldId: string, input: UpdateFieldInput) => {
    const payload = {
      parentId: input.parentId ?? null,
      name: input.label,
    }
    const response = await apiClient.patch<BeAttribute>(`/forms/${templateId}/attributes/${fieldId}`, payload)
    return mapAttribute(response.data)
  },

  deleteField: async (templateId: string, fieldId: string) => {
    await apiClient.delete(`/forms/${templateId}/attributes/${fieldId}`)
    return true
  },

  importFieldsFromExcel: async (templateId: string) => {
    await apiClient.post(`/forms/${templateId}/attributes/import`)
    return true
  },

  createIndicator: async (templateId: string, input: CreateIndicatorInput) => {
    const payload = {
      parentId: input.parentId ?? null,
      displayIndex: input.code,
      code: input.code,
      name: input.name,
      unit: input.unit,
      dataType: input.dataType ?? 'number',
      type: input.type ?? 'INPUT',
    }
    const response = await apiClient.post<BeIndicator>(`/forms/${templateId}/indicators`, payload)
    return mapIndicator(response.data)
  },

  updateIndicator: async (templateId: string, indicatorId: string, input: UpdateIndicatorInput) => {
    const payload = {
      parentId: input.parentId ?? null,
      displayIndex: input.code,
      code: input.code,
      name: input.name,
      unit: input.unit,
      dataType: input.dataType ?? 'number',
      type: input.type ?? 'INPUT',
    }
    const response = await apiClient.patch<BeIndicator>(`/forms/${templateId}/indicators/${indicatorId}`, payload)
    return mapIndicator(response.data)
  },

  deleteIndicator: async (templateId: string, indicatorId: string) => {
    await apiClient.delete(`/forms/${templateId}/indicators/${indicatorId}`)
    return true
  },

  importIndicatorsFromExcel: async (templateId: string) => {
    await apiClient.post(`/forms/${templateId}/indicators/import`)
    return true
  },

  reorderFields: async (templateId: string, items: Array<{ id: string; parentId?: string | null }>) => {
    await apiClient.post(`/forms/${templateId}/attributes/reorder`, { items })
    return true
  },

  reorderIndicators: async (templateId: string, items: Array<{ id: string; parentId?: string | null }>) => {
    await apiClient.post(`/forms/${templateId}/indicators/reorder`, { items })
    return true
  },



  listTemplateScopes: async (templateId: string) => {
    const response = await apiClient.get<{ items?: BeScope[] }>(`/forms/${templateId}/template-scopes`)
    return (response.data.items ?? []).map(mapScope)
  },

  upsertTemplateScopes: async (templateId: string, items: TemplateScopeInput[]) => {
    await apiClient.post(`/forms/${templateId}/template-scopes`, { items })
    return true
  },

  deleteTemplateScopes: async (templateId: string, items: TemplateScopeInput[]) => {
    await apiClient.delete(`/forms/${templateId}/template-scopes`, { data: { items } })
    return true
  },

  listCellConfigs: async (templateId: string) => {
    const response = await apiClient.get<{ items?: BeCellConfig[] }>(
      `/forms/${templateId}/cell-configs`
    )
    return (response.data.items ?? []).map(mapCellConfig)
  },

  listEffectiveCellConfigs: async (templateId: string) => {
    const response = await apiClient.get<{ items?: BeEffectiveCellConfig[] }>(
      `/forms/${templateId}/cell-configs/effective`
    )
    return (response.data.items ?? []).map((item) => mapCellConfig(item))
  },

  upsertCellConfigs: async (templateId: string, items: TemplateCellConfig[]) => {
    await apiClient.post(`/forms/${templateId}/cell-configs`, { items })
    return true
  },

  deleteCellConfigs: async (
    templateId: string,
    items: Array<{ indicatorId: string; attributeId: string }>
  ) => {
    await apiClient.delete(`/forms/${templateId}/cell-configs`, { data: { items } })
    return true
  },
}
