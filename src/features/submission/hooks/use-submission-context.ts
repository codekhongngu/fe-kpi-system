import { useQuery } from '@tanstack/react-query'
import { submissionApi } from '../api/submission-api'
import type { SubmissionContext } from '../api/types'
import type { FormTemplate, TemplateField, TemplateIndicator, TemplateCellConfig } from '@/features/form-management/api/types'

function mapAttribute(item: SubmissionContext['template']['attributes'][number]): TemplateField {
  return {
    id: item.id,
    key: item.name ?? '',
    label: item.name ?? '',
    order: item.sortOrder ?? 0,
    parentId: item.parentId ?? null,
    level: 0,
    isSystemDefault: Boolean(item.isSystem),
  }
}

function mapIndicator(item: SubmissionContext['template']['indicators'][number]): TemplateIndicator {
  return {
    id: item.id,
    code: item.code ?? item.displayIndex ?? '',
    name: item.name ?? '',
    unit: item.unit ?? '',
    dataType: item.dataType ?? 'number',
    type: item.type === 'TITLE' ? 'TITLE' : 'INPUT',
    parentId: item.parentId ?? null,
    order: item.sortOrder ?? 0,
    level: 0,
    hasReportData: false,
  }
}

function mapCellConfig(item: SubmissionContext['template']['cellConfigs'][number]): TemplateCellConfig {
  return {
    id: item.id,
    indicatorId: item.indicatorId,
    attributeId: item.attributeId,
    dataType: item.dataType === 'number' ? 'number' : 'text',
    required: item.required,
    readOnly: item.readOnly,
    formula: item.formula,
  }
}

export function useSubmissionContext(assignmentId: string) {
  const query = useQuery({
    queryKey: ['submission-context', assignmentId],
    queryFn: () => submissionApi.getSubmissionContext(assignmentId),
    enabled: !!assignmentId,
    staleTime: 30_000,
  })

  const context = query.data
  const template: FormTemplate | null = context
    ? {
        id: context.template.id,
        code: context.template.code,
        name: context.template.name,
        description: context.template.description ?? '',
        fieldCategoryId: '',
        periodType: context.template.periodType as FormTemplate['periodType'],
        templateType: (context.template.templateType ?? 'AGGREGATE') as FormTemplate['templateType'],
        isActive: true,
        fields: context.template.attributes.map(mapAttribute),
        indicators: context.template.indicators.map(mapIndicator),
        cellConfigs: context.template.cellConfigs.map(mapCellConfig),
      }
    : null

  return {
    ...query,
    context,
    assignment: context?.assignment ?? null,
    submission: context?.submission ?? null,
    template,
    allowedIndicatorIds: context?.allowedIndicatorIds ?? [],
  }
}
