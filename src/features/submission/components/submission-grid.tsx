import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Lock, Calculator } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { formManagementApi } from '@/features/form-management/api/template-management-api'
import type {
  FormTemplate,
  TemplateField,
  TemplateIndicator,
  TemplateCellConfig,
} from '@/features/form-management/api/types'
import { TemplateMatrixGrid } from '@/features/form-management/components/shared/template-matrix-grid'
import type { SubmissionDetail, CellChange } from '../api/types'

type SubmissionGridProps = {
  template: FormTemplate
  detail: SubmissionDetail
  isReadOnly: boolean
  onCellChange: (change: CellChange) => void
}

function cellKey(indicatorId: string, attributeId: string) {
  return `${indicatorId}__${attributeId}`
}

export function SubmissionGrid({
  template,
  detail,
  isReadOnly,
  onCellChange,
}: SubmissionGridProps) {
  const { indicators, fields } = template

  // Fetch effective cell configs for accurate dataType resolution and readOnly status
  const effectiveCellConfigsQuery = useQuery({
    queryKey: [
      'form-management',
      'template',
      template.id,
      'cell-configs',
      'effective',
    ],
    queryFn: () => formManagementApi.listEffectiveCellConfigs(template.id),
    enabled: Boolean(template.id),
  })

  // Build lookup maps for fast access
  const effectiveMap = useMemo(() => {
    const map = new Map<string, TemplateCellConfig>()
    const configs = effectiveCellConfigsQuery.data ?? template.cellConfigs ?? []
    for (const cell of configs) {
      map.set(cellKey(cell.indicatorId, cell.attributeId), cell)
    }
    return map
  }, [effectiveCellConfigsQuery.data, template.cellConfigs])

  const defaultValuesMap = useMemo(() => {
    const map = new Map<string, { valueText: string | null; valueNumber: number | null }>()
    for (const item of detail.defaultValues ?? []) {
      map.set(cellKey(item.indicatorId, item.attributeId), {
        valueText: item.valueText,
        valueNumber: item.valueNumber,
      })
    }
    return map
  }, [detail.defaultValues])

  const cellValuesMap = useMemo(() => {
    const map = new Map<string, { valueText: string | null; valueNumeric: number | null }>()
    for (const item of detail.cells ?? []) {
      map.set(cellKey(item.indicatorId, item.attributeId), {
        valueText: item.valueText,
        valueNumeric:
          item.valueNumeric != null ? Number(item.valueNumeric) : null,
      })
    }
    return map
  }, [detail.cells])

  function handleValueChange(
    indicatorId: string,
    attributeId: string,
    value: string,
    dataType: 'number' | 'text'
  ) {
    onCellChange({
      indicatorId,
      attributeId,
      valueText: dataType === 'text' ? value || null : null,
      valueNumeric:
        dataType === 'number'
          ? value === ''
            ? null
            : Number(value)
          : null,
    })
  }

  function renderCell(indicator: TemplateIndicator, field: TemplateField) {
    // 1. TITLE rows — not applicable
    if (indicator.type === 'TITLE') {
      return (
        <div className='flex w-full min-w-[120px] items-center justify-center rounded-md border border-dashed border-transparent bg-muted/5 px-2 py-1 opacity-50'>
          <span className='text-[10px] text-muted-foreground uppercase'>
            Không áp dụng
          </span>
        </div>
      )
    }

    const key = cellKey(indicator.id, field.id)
    const cellConfig = effectiveMap.get(key)

    // Sync dataType: cellConfig override > indicator default > 'text'
    const resolvedDataType = (cellConfig?.dataType ||
      indicator.dataType ||
      'text') as 'number' | 'text'
    const isNumber = resolvedDataType === 'number'

    // 2. Formula cells — locked, blue tint
    if (cellConfig?.formula) {
      const currentVal = cellValuesMap.get(key)
      const displayValue =
        currentVal?.valueNumeric ?? currentVal?.valueText ?? ''
      return (
        <div className='relative w-full min-w-[120px]'>
          <Input
            value={displayValue}
            readOnly
            disabled
            className='h-8 border-blue-200 bg-blue-50 pr-8 text-xs text-blue-900'
            title={`Công thức: ${cellConfig.formula}`}
          />
          <Calculator className='absolute top-1/2 right-2 h-3.5 w-3.5 -translate-y-1/2 text-blue-500' />
        </div>
      )
    }

    // 3. Default value cells — locked, yellow tint
    const defaultVal = defaultValuesMap.get(key)
    if (
      defaultVal &&
      (defaultVal.valueText || defaultVal.valueNumber !== null)
    ) {
      const displayValue =
        defaultVal.valueNumber !== null
          ? defaultVal.valueNumber
          : (defaultVal.valueText ?? '')
      return (
        <div className='relative w-full min-w-[120px]'>
          <Input
            value={displayValue}
            readOnly
            disabled
            className='h-8 border-yellow-200 bg-yellow-50 pr-8 text-xs text-yellow-900'
          />
          <Lock className='absolute top-1/2 right-2 h-3.5 w-3.5 -translate-y-1/2 text-yellow-500' />
        </div>
      )
    }

    // 4. Read-only config cells
    if (cellConfig?.readOnly) {
      const currentVal = cellValuesMap.get(key)
      const displayValue = isNumber
        ? (currentVal?.valueNumeric ?? '')
        : (currentVal?.valueText ?? '')
      return (
        <div className='relative w-full min-w-[120px]'>
          <Input
            value={displayValue}
            readOnly
            disabled
            className='h-8 border-dashed bg-muted/10 text-xs'
          />
          <Lock className='absolute top-1/2 right-2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground' />
        </div>
      )
    }

    // 5. Normal editable input (allow if it's an INPUT indicator even if no cellConfig exists)
    const currentVal = cellValuesMap.get(key)
    const displayVal = isNumber
      ? (currentVal?.valueNumeric ?? '')
      : (currentVal?.valueText ?? '')

    return (
      <div className='w-full min-w-[120px]'>
        <Input
          type={isNumber ? 'number' : 'text'}
          placeholder='Nhập giá trị...'
          className='h-8 text-xs'
          disabled={isReadOnly}
          value={displayVal}
          onChange={(e) =>
            handleValueChange(
              indicator.id,
              field.id,
              e.target.value,
              resolvedDataType
            )
          }
        />
      </div>
    )
  }

  return (
    <TemplateMatrixGrid
      indicators={indicators}
      fields={fields}
      renderCell={renderCell}
      emptyMessage='Chưa có chỉ tiêu nào để nhập liệu.'
    />
  )
}
