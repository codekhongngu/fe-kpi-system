import type {
  TemplateField,
  TemplateIndicator,
} from '@/features/form-management/api/types'
import type {
  DashboardSchema,
  DashboardSchemaAttribute,
  DashboardSchemaIndicator,
} from '../api/types'

export function mapSchemaIndicators(
  indicators: DashboardSchemaIndicator[]
): TemplateIndicator[] {
  return indicators.map((indicator) => ({
    id: indicator.id,
    code: indicator.code,
    name: indicator.name,
    unit: indicator.unit ?? '',
    dataType: 'text',
    type: indicator.type === 'TITLE' ? 'TITLE' : 'INPUT',
    parentId: indicator.parentId ?? null,
    order: indicator.order,
    level: indicator.level,
    hasReportData: true,
  }))
}

export function mapSchemaAttributes(
  attributes: DashboardSchemaAttribute[]
): TemplateField[] {
  return attributes.map((attribute, index) => ({
    id: attribute.id,
    key: attribute.key ?? attribute.id,
    label: attribute.label,
    order: attribute.order ?? index,
    parentId: attribute.parentId ?? null,
    level: attribute.level,
    isSystemDefault: attribute.isSystemDefault ?? false,
  }))
}

export function mapDashboardSchema(schema: DashboardSchema) {
  return {
    indicators: mapSchemaIndicators(schema.indicators),
    fields: mapSchemaAttributes(schema.attributes),
  }
}
