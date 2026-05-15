import { Lock, Calculator } from 'lucide-react'
import { Input } from '@/components/ui/input'
import type {
  TemplateIndicator,
  TemplateField,
  TemplateCellConfig,
} from '@/features/form-management/api/types'
import type { DefaultValueCell, SubmissionCell, CellChange } from '../api/types'

type SubmissionCellComponentProps = {
  indicator: TemplateIndicator
  field: TemplateField
  config?: TemplateCellConfig
  defaultValue?: DefaultValueCell
  currentValue?: SubmissionCell
  isReadOnlyMode: boolean
  onChange: (change: CellChange) => void
}

export function SubmissionCellComponent({
  indicator,
  field,
  config,
  defaultValue,
  currentValue,
  isReadOnlyMode,
  onChange,
}: SubmissionCellComponentProps) {
  // 1. Dòng Title
  if (indicator.type === 'TITLE') {
    return null // Title được xử lý ở css hoặc không render input
  }

  // 2. Ô không nằm trong scope (không có config)
  if (!config) {
    return <div className='h-full min-h-[36px] w-full rounded bg-muted/30' />
  }

  // 3. Có default value (admin điền sẵn) -> Lock, vàng nhạt
  if (
    defaultValue &&
    (defaultValue.valueText || defaultValue.valueNumber !== null)
  ) {
    const displayValue =
      (defaultValue.valueText || defaultValue.valueNumber) ?? ''
    return (
      <div className='relative'>
        <Input
          value={displayValue}
          readOnly
          disabled
          className='border-yellow-200 bg-yellow-50 pr-8 text-yellow-900'
        />
        <Lock className='absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2 text-yellow-500' />
      </div>
    )
  }

  // 4. Có công thức tính -> Lock, xanh nhạt
  if (config.formula) {
    // For now, display formula or calculated value (if any)
    const displayValue =
      currentValue?.valueNumber ?? currentValue?.valueText ?? ''
    return (
      <div className='relative'>
        <Input
          value={displayValue}
          readOnly
          disabled
          className='border-blue-200 bg-blue-50 pr-8 text-blue-900'
          title={`Công thức: ${config.formula}`}
        />
        <Calculator className='absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2 text-blue-500' />
      </div>
    )
  }

  // 5. Normal input
  const isNumber = config.dataType === 'number'
  const val = currentValue
    ? isNumber
      ? currentValue.valueNumber
      : currentValue.valueText
    : ''
  const displayVal = val ?? ''

  return (
    <Input
      type={isNumber ? 'number' : 'text'}
      value={displayVal}
      readOnly={isReadOnlyMode || config.readOnly}
      disabled={isReadOnlyMode || config.readOnly}
      onChange={(e) => {
        const rawValue = e.target.value
        let numericVal: number | null = null
        let textVal: string | null = null

        if (isNumber) {
          if (rawValue !== '') {
            numericVal = Number(rawValue)
          }
        } else {
          textVal = rawValue
        }

        onChange({
          indicatorId: indicator.id,
          attributeId: field.id,
          valueNumber: numericVal,
          valueText: textVal,
        })
      }}
      className={`min-w-[120px] ${config.readOnly ? 'bg-muted' : ''}`}
      placeholder={config.readOnly ? '-' : 'Nhập...'}
    />
  )
}
