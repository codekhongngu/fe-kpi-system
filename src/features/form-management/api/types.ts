export type CatalogStatusFilter = 'all' | 'true' | 'false'

export type TemplateCycle = 'week' | 'month' | 'quarter' | 'year'
export type TemplateStatus = 'active' | 'inactive'
export type FieldDataType = 'text' | 'number'
export type IndicatorType = 'input' | 'calculated'
export type PeriodType = 'TUAN' | 'THANG' | 'QUY' | 'NAM'

export type CatalogOption = {
  id: string
  code: string
  name: string
}

export type FormTemplateListParams = {
  search?: string
  page?: number
  limit?: number
  status?: CatalogStatusFilter
  period?: string
  category?: string
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
  dataType: FieldDataType | string
  required: boolean
  readonly?: boolean
  visible: boolean
  order: number
  parentId?: string | null
  level?: number
  validationRule?: Record<string, unknown> | null
  isSystemDefault: boolean
}

export type TemplateIndicator = {
  id: string
  code: string
  name: string
  unit: string
  type: IndicatorType
  group: string
  formula: string | null
  dataType?: FieldDataType | string
  required?: boolean
  readonly?: boolean
  validationRule?: Record<string, unknown> | null
  parentId?: string | null
  order?: number
  level?: number
  hasReportData: boolean
}

export type TemplateCellConfig = {
  id?: string
  indicatorId: string
  attributeId: string
  isEditable: boolean
  validationRule?: Record<string, unknown> | null
  defaultValue?: string | null
  dataType?: FieldDataType | string | null
  isRequired?: boolean | null
  formula?: string | null
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
  isActive: boolean
  updatedAt?: string
  fields: TemplateField[]
  indicators: TemplateIndicator[]
  cellConfigs?: TemplateCellConfig[]
  domain?: string
  cycle?: TemplateCycle
  status?: TemplateStatus
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
  description: string
  isActive: boolean
}

export type UpdateTemplateInput = {
  name: string
  fieldCategoryId: string
  periodType: PeriodType
  description: string
  isActive: boolean
}

export type CreateFieldInput = {
  key: string
  label: string
  dataType: FieldDataType | string
  required: boolean
  readonly?: boolean
  visible: boolean
  parentId?: string | null
  validationRule?: Record<string, unknown> | null
}

export type UpdateFieldInput = CreateFieldInput

export type CreateIndicatorInput = {
  code: string
  name: string
  unit: string
  type: IndicatorType
  group: string
  formula: string | null
  dataType?: FieldDataType | string
  required?: boolean
  readonly?: boolean
  validationRule?: Record<string, unknown> | null
  parentId?: string | null
}

export type UpdateIndicatorInput = CreateIndicatorInput

export type CreateFieldCategoryInput = Omit<FieldCategory, 'id'>
export type UpdateFieldCategoryInput = Omit<FieldCategory, 'id'>

export const templateCycleOptions: Array<{ value: TemplateCycle; label: string }> = [
  { value: 'week', label: 'Tuần' },
  { value: 'month', label: 'Tháng' },
  { value: 'quarter', label: 'Quý' },
  { value: 'year', label: 'Năm' },
]

export const templateStatusOptions: Array<{ value: TemplateStatus; label: string }> = [
  { value: 'active', label: 'Hoạt động' },
  { value: 'inactive', label: 'Ngừng sử dụng' },
]

export const fieldDataTypeOptions: Array<{ value: FieldDataType; label: string }> = [
  { value: 'text', label: 'Văn bản' },
  { value: 'number', label: 'Số' },
]

export const indicatorTypeOptions: Array<{ value: IndicatorType; label: string }> = [
  { value: 'input', label: 'Nhập tay' },
  { value: 'calculated', label: 'Tự động tính' },
]
