import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Lock, Calculator, AlertCircle, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
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
  /** Excel import preview: expand all rows, compact layout */
  previewMode?: boolean
  effectiveCellConfigs?: TemplateCellConfig[]
  /** Cells with invalid Excel values (shown in red in preview) */
  importInvalidCellKeys?: Set<string>
  allowedIndicatorIds?: string[]
}

function cellKey(indicatorId: string, attributeId: string) {
  return `${indicatorId}__${attributeId}`
}

function formatCellInputValue(
  value: string | number | null | undefined
): string {
  if (value === null || value === undefined) return ''
  return String(value)
}
/**
 * Collects all ancestor indicator IDs for a given set of indicator IDs.
 * This ensures parent TITLE rows remain visible when filtering by allowed indicators.
 */
function collectAncestorIds(
  indicators: TemplateIndicator[],
  allowedIds: Set<string>
): Set<string> {
  const idMap = new Map<string, TemplateIndicator>()
  for (const ind of indicators) {
    idMap.set(ind.id, ind)
  }

  const result = new Set<string>(allowedIds)
  for (const id of allowedIds) {
    let current = idMap.get(id)
    while (current?.parentId) {
      result.add(current.parentId)
      current = idMap.get(current.parentId)
    }
  }
  return result
}

export function SubmissionGrid({
  template,
  detail,
  isReadOnly,
  onCellChange,
  previewMode = false,
  effectiveCellConfigs,
  importInvalidCellKeys,
  allowedIndicatorIds,
}: SubmissionGridProps) {
  const { indicators, fields } = template
  const [showAllIndicators, setShowAllIndicators] = useState(false)

  // Compute the allowed set and whether scope filtering is active
  const allowedSet = useMemo(() => {
    if (!allowedIndicatorIds || allowedIndicatorIds.length === 0) return null
    // If all INPUT indicators are allowed, no filtering needed
    const inputIds = indicators.filter((i) => i.type === 'INPUT').map((i) => i.id)
    const allAllowed = inputIds.every((id) => allowedIndicatorIds.includes(id))
    if (allAllowed) return null
    return new Set(allowedIndicatorIds)
  }, [allowedIndicatorIds, indicators])

  const hasScopeFiltering = allowedSet !== null

  // Filter indicators when not showing all
  const visibleIndicators = useMemo(() => {
    if (!hasScopeFiltering || showAllIndicators) return indicators
    // Keep allowed indicators + their ancestors (TITLE parents)
    const visibleIds = collectAncestorIds(indicators, allowedSet!)
    return indicators.filter((ind) => visibleIds.has(ind.id))
  }, [indicators, hasScopeFiltering, showAllIndicators, allowedSet])

  const effectiveCellConfigsQuery = useQuery({
    queryKey: [
      'form-management',
      'template',
      template.id,
      'cell-configs',
      'effective',
    ],
    queryFn: () => formManagementApi.listEffectiveCellConfigs(template.id),
    enabled: Boolean(template.id) && effectiveCellConfigs === undefined,
  })

  const effectiveMap = useMemo(() => {
    const map = new Map<string, TemplateCellConfig>()
    const configs =
      effectiveCellConfigs ??
      effectiveCellConfigsQuery.data ??
      template.cellConfigs ??
      []
    for (const cell of configs) {
      map.set(cellKey(cell.indicatorId, cell.attributeId), cell)
    }
    return map
  }, [effectiveCellConfigs, effectiveCellConfigsQuery.data, template.cellConfigs])

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
    const map = new Map<string, { valueText: string | null; valueNumber: number | null }>()
    for (const item of detail.cells ?? []) {
      map.set(cellKey(item.indicatorId, item.attributeId), {
        valueText: item.valueText,
        valueNumber:
          item.valueNumber != null ? Number(item.valueNumber) : null,
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
      valueNumber:
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

    // Check if this indicator is outside the allowed scope
    const isOutOfScope = hasScopeFiltering && allowedSet && !allowedSet.has(indicator.id)

    // 2. Out-of-scope cells — disabled with visual distinction
    if (isOutOfScope) {
      const currentVal = cellValuesMap.get(key)
      const displayValue = isNumber
        ? (currentVal?.valueNumber ?? '')
        : (currentVal?.valueText ?? '')
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className='relative w-full min-w-[120px]'>
                <Input
                  value={displayValue}
                  readOnly
                  disabled
                  className='h-8 border-dashed border-slate-300 bg-slate-100 pr-8 text-xs text-slate-400'
                />
                <EyeOff className='absolute top-1/2 right-2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400' />
              </div>
            </TooltipTrigger>
            <TooltipContent side='top' className='max-w-[200px] text-xs'>
              Chỉ tiêu này không thuộc phạm vi giao cho đơn vị bạn
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    // 3. Formula cells — locked, blue tint
    if (cellConfig?.formula) {
      const currentVal = cellValuesMap.get(key)
      const displayValue = formatCellInputValue(
        currentVal?.valueNumber ?? currentVal?.valueText ?? ''
      )
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

    // 4. Default value cells — locked, yellow tint
    const defaultVal = defaultValuesMap.get(key)
    if (
      defaultVal &&
      (defaultVal.valueText || defaultVal.valueNumber !== null)
    ) {
      const displayValue = formatCellInputValue(
        defaultVal.valueNumber !== null
          ? defaultVal.valueNumber
          : (defaultVal.valueText ?? '')
      )
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

    // 5. Read-only config cells
    if (cellConfig?.readOnly) {
      const currentVal = cellValuesMap.get(key)
      const displayValue = formatCellInputValue(
        isNumber
          ? (currentVal?.valueNumber ?? '')
          : (currentVal?.valueText ?? '')
      )
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

    // 5. Excel import preview — invalid cell (show raw Excel text, not old value)
    if (previewMode && importInvalidCellKeys?.has(key)) {
      const currentVal = cellValuesMap.get(key)
      const displayValue = formatCellInputValue(
        currentVal?.valueText ?? currentVal?.valueNumber ?? ''
      )
      return (
        <div className='relative w-full min-w-[120px] rounded-md ring-2 ring-red-500 ring-offset-1'>
          <Input
            value={displayValue}
            readOnly
            disabled
            className='h-8 border-2 border-red-600 bg-red-200 pr-8 text-xs font-semibold text-red-950 shadow-sm disabled:cursor-not-allowed disabled:opacity-100'
            title='Giá trị không hợp lệ trong file Excel — sẽ không được áp dụng'
          />
          <AlertCircle
            className='pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-red-700'
            aria-hidden
          />
        </div>
      )
    }

    // 6. Normal editable input (allow if it's an INPUT indicator even if no cellConfig exists)
    const currentVal = cellValuesMap.get(key)
    const displayVal = formatCellInputValue(
      isNumber
        ? (currentVal?.valueNumber ?? '')
        : (currentVal?.valueText ?? '')
    )

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
    <div className='space-y-0'>
      {/* Scope filter toggle — only shown when scope filtering is active */}
      {hasScopeFiltering && (
        <div className='flex items-center justify-end gap-2 px-2 pb-2'>
          <Switch
            id='show-all-indicators'
            checked={showAllIndicators}
            onCheckedChange={setShowAllIndicators}
          />
          <Label
            htmlFor='show-all-indicators'
            className='cursor-pointer text-xs font-medium text-muted-foreground'
          >
            Hiển thị toàn bộ chỉ tiêu
          </Label>
        </div>
      )}

      <TemplateMatrixGrid
        indicators={visibleIndicators}
        fields={fields}
        renderCell={renderCell}
        emptyMessage='Chưa có chỉ tiêu nào để nhập liệu.'
      />
    </div>
  )
}
