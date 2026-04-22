export type TemplateCycle = 'week' | 'month' | 'quarter' | 'year'
export type TemplateStatus = 'active' | 'inactive'
export type FieldDataType = 'text' | 'number' | 'percentage' | 'currency' | 'boolean' | 'date'
export type IndicatorType = 'input' | 'calculated'

export type TemplateField = {
  id: string
  key: string
  label: string
  dataType: FieldDataType
  required: boolean
  visible: boolean
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
  type: IndicatorType
  group: string
  formula: string | null
  parentId?: string | null
  order?: number
  level?: number
  hasReportData: boolean
}

export type FormTemplate = {
  id: string
  code: string
  name: string
  description: string
  domain: string
  cycle: TemplateCycle
  status: TemplateStatus
  assignedUnits: number
  completionRate: number
  hasReportData: boolean
  referenceFiles: string[]
  updatedAt: string
  fields: TemplateField[]
  indicators: TemplateIndicator[]
}

export type CreateTemplateInput = {
  code: string
  name: string
  description: string
  domain: string
  cycle: TemplateCycle
  status: TemplateStatus
  cloneFromTemplateId?: string
  referenceFiles?: string[]
}

export type UpdateTemplateInput = Omit<CreateTemplateInput, 'code' | 'cloneFromTemplateId'>

export type CreateFieldInput = Omit<TemplateField, 'id' | 'isSystemDefault'>
export type UpdateFieldInput = Omit<TemplateField, 'id' | 'isSystemDefault'>

export type CreateIndicatorInput = Omit<TemplateIndicator, 'id' | 'hasReportData'>
export type UpdateIndicatorInput = Omit<TemplateIndicator, 'id' | 'hasReportData'>

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
  { value: 'percentage', label: 'Phần trăm' },
  { value: 'currency', label: 'Tiền tệ' },
  { value: 'boolean', label: 'Đúng/Sai' },
  { value: 'date', label: 'Ngày' },
]

export const indicatorTypeOptions: Array<{ value: IndicatorType; label: string }> = [
  { value: 'input', label: 'Nhập tay' },
  { value: 'calculated', label: 'Tự động tính' },
]
