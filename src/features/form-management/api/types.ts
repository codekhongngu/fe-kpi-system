export type CatalogStatusFilter = 'all' | 'true' | 'false'

export type TemplateCycle = 'week' | 'month' | 'quarter' | 'year'
export type TemplateType = 'AGGREGATE' | 'UNIQUE'
export type TemplateLifecycleStatus = 'DRAFT' | 'READY' | 'IN_USE' | 'ARCHIVED'
export type TemplateActivationStatus = 'active' | 'inactive'
export type FieldDataType = 'text' | 'number'

export type PeriodType = 'TUAN' | 'THANG' | 'QUY' | 'NAM'

export type CatalogOption = {
  id: string
  code: string
  name: string
}

export type FormTemplateListParams = {
  q?: string
  search?: string
  fieldCategory?: string
  category?: string
  fieldCategoryId?: string
  period?: string
  periodType?: PeriodType
  template_status?: string
  page?: number
  limit?: number
}

export type FormTemplateListMeta = {
  page: number
  limit: number
  total: number
}

export type FormTemplateListResult = {
  items: FormTemplate[]
  meta: FormTemplateListMeta
}

export type FieldCategory = {
  id: string
  code: string
  name: string
  description: string | null
  sortOrder: number
  isActive: boolean
}

export type TemplateField = {
  id: string
  key: string
  label: string
  order: number
  parentId?: string | null
  level?: number
  isSystemDefault: boolean
}

export type TemplateIndicator = {
  id: string
  code: string
  name: string
  unit: string
  dataType?: FieldDataType | string
  type: 'INPUT' | 'TITLE'
  parentId?: string | null
  order?: number
  level?: number
  hasReportData: boolean
}

export type TemplateScope = {
  id?: string
  orgId: string
  orgCode?: string
  orgName?: string
  indicatorId: string
  indicatorCode?: string
  indicatorName?: string
}

export type TemplateCellConfig = {
  id?: string
  indicatorId: string
  attributeId: string
  dataType: FieldDataType
  required: boolean
  readOnly: boolean
  formula: string | null
}

export type EffectiveTemplateCellConfig = Omit<TemplateCellConfig, 'id'> & {
  hasOverride: boolean
}

export type FormTemplate = {
  id: string
  code: string
  name: string
  description: string
  fieldCategoryId: string
  fieldCategoryName?: string
  periodType?: PeriodType
  templateType?: TemplateType
  templateStatus?: TemplateLifecycleStatus
  isActive: boolean
  updatedAt?: string
  fields: TemplateField[]
  indicators: TemplateIndicator[]
  cellConfigs?: TemplateCellConfig[]
  templateScopes?: TemplateScope[]
  assignedUnits?: number
  completionRate?: number
  hasReportData?: boolean
  referenceFiles?: string[]
}

export type CreateTemplateInput = {
  code: string
  name: string
  fieldCategoryId: string
  periodType: PeriodType
  templateType: TemplateType
  description: string
  isActive?: boolean
}

export type UpdateTemplateInput = {
  name: string
  fieldCategoryId: string
  periodType: PeriodType
  templateType: TemplateType
  description: string
}

export type CreateFieldInput = {
  key: string
  label: string
  parentId?: string | null
}

export type UpdateFieldInput = CreateFieldInput

export type CreateIndicatorInput = {
  code: string
  name: string
  unit: string
  dataType?: FieldDataType | string
  type?: 'INPUT' | 'TITLE'
  parentId?: string | null
}

export type UpdateIndicatorInput = CreateIndicatorInput

export type CreateFieldCategoryInput = Omit<FieldCategory, 'id'>
export type UpdateFieldCategoryInput = Omit<FieldCategory, 'id'>

export type TemplateScopeInput = {
  orgId: string
  indicatorId: string
}

export const templateCycleOptions: Array<{
  value: TemplateCycle
  label: string
}> = [
  { value: 'week', label: 'Tuần' },
  { value: 'month', label: 'Tháng' },
  { value: 'quarter', label: 'Quý' },
  { value: 'year', label: 'Năm' },
]

export const templateTypeOptions: Array<{
  value: TemplateType
  label: string
}> = [
  { value: 'AGGREGATE', label: 'Tổng hợp' },
  { value: 'UNIQUE', label: 'Đơn nhất' },
]

export const templateLifecycleStatusOptions: Array<{
  value: TemplateLifecycleStatus
  label: string
}> = [
  { value: 'DRAFT', label: 'Nháp' },
  { value: 'READY', label: 'Sẵn sàng' },
  { value: 'IN_USE', label: 'Đang sử dụng' },
  { value: 'ARCHIVED', label: 'Đã lưu trữ' },
]

export const templateActivationStatusOptions: Array<{
  value: TemplateActivationStatus
  label: string
}> = [
  { value: 'active', label: 'Hoạt động' },
  { value: 'inactive', label: 'Ngừng hoạt động' },
]

export const fieldDataTypeOptions: Array<{
  value: FieldDataType
  label: string
}> = [
  { value: 'text', label: 'Văn bản' },
  { value: 'number', label: 'Số' },
]

export const indicatorTypeOptions: Array<{
  value: 'INPUT' | 'TITLE'
  label: string
}> = [
  { value: 'INPUT', label: 'Nhập liệu' },
  { value: 'TITLE', label: 'Chỉ hiển thị (Tiêu đề)' },
]
