import type { FormTemplate } from '@/features/form-management/api/types'
import { TemplateMatrixGrid } from '@/features/form-management/components/shared/template-matrix-grid'
import type { SubmissionDetail, CellChange } from '../api/types'
import { SubmissionCellComponent } from './submission-cell'

type SubmissionGridProps = {
  template: FormTemplate
  detail: SubmissionDetail
  isReadOnly: boolean
  onCellChange: (change: CellChange) => void
}

export function SubmissionGrid({
  template,
  detail,
  isReadOnly,
  onCellChange,
}: SubmissionGridProps) {
  const { indicators, fields, cellConfigs } = template

  return (
    <TemplateMatrixGrid
      indicators={indicators}
      fields={fields}
      renderCell={(indicator, field) => {
        if (indicator.type === 'TITLE') {
          return null
        }

        // Find config
        const config = cellConfigs?.find(
          (c) => c.indicatorId === indicator.id && c.attributeId === field.id
        )

        // Find default value
        const defaultVal = detail.defaultValues.find(
          (d) => d.indicatorId === indicator.id && d.attributeId === field.id
        )

        // Find current value
        const currentVal = detail.cells.find(
          (c) => c.indicatorId === indicator.id && c.attributeId === field.id
        )

        return (
          <SubmissionCellComponent
            indicator={indicator}
            field={field}
            config={config}
            defaultValue={defaultVal}
            currentValue={currentVal}
            isReadOnlyMode={isReadOnly}
            onChange={onCellChange}
          />
        )
      }}
    />
  )
}
