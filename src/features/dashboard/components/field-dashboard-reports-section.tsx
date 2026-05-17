import { useMemo } from 'react'
import type {
  TemplateField,
  TemplateIndicator,
} from '@/features/form-management/api/types'
import { TemplateMatrixGrid } from '@/features/form-management/components/shared/template-matrix-grid'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type {
  DashboardReportItem,
  DashboardSchema,
} from '../api/types'
import { mapDashboardSchema } from '../utils/map-schema-to-template'

function cellKey(indicatorId: string, attributeId: string) {
  return `${indicatorId}__${attributeId}`
}

function formatCellValue(
  valueText: string | null,
  valueNumber: number | string | null
) {
  if (valueText != null && valueText !== '') return valueText
  if (valueNumber == null || valueNumber === '') return '—'
  const numeric = Number(valueNumber)
  if (Number.isFinite(numeric)) {
    return numeric.toLocaleString('vi-VN')
  }
  return String(valueNumber)
}

type FieldDashboardReportsSectionProps = {
  schema: DashboardSchema
  reports: DashboardReportItem[]
}

function ReadOnlyReportMatrix({
  report,
  indicators,
  fields,
}: {
  report: DashboardReportItem
  indicators: TemplateIndicator[]
  fields: TemplateField[]
}) {
  const valuesMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const cell of report.cells) {
      map.set(
        cellKey(cell.indicatorId, cell.attributeId),
        formatCellValue(cell.valueText, cell.valueNumber)
      )
    }
    return map
  }, [report.cells])

  return (
    <TemplateMatrixGrid
      indicators={indicators}
      fields={fields}
      emptyMessage='Không có chỉ tiêu trong biểu mẫu.'
      renderCell={(indicator, field) => {
        if (indicator.type === 'TITLE') return null
        const value = valuesMap.get(cellKey(indicator.id, field.id)) ?? '—'
        return (
          <div className='px-2 py-1.5 text-right text-sm font-medium tabular-nums text-foreground'>
            {value}
          </div>
        )
      }}
    />
  )
}

export function FieldDashboardReportsSection({
  schema,
  reports,
}: FieldDashboardReportsSectionProps) {
  const { indicators, fields } = useMemo(
    () => mapDashboardSchema(schema),
    [schema]
  )

  if (!reports.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Báo cáo theo đơn vị</CardTitle>
          <CardDescription>
            Chưa có dữ liệu báo cáo cho kỳ và bộ lọc đã chọn.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className='space-y-4'>
      {reports.map((report) => (
        <Card key={report.id}>
          <CardHeader className='flex flex-row flex-wrap items-start justify-between gap-2 space-y-0'>
            <div>
              <CardTitle className='text-base'>
                {report.orgName || report.orgCode || report.orgId || report.id}
              </CardTitle>
              {report.orgCode ? (
                <CardDescription>Mã đơn vị: {report.orgCode}</CardDescription>
              ) : null}
            </div>
            {report.status ? (
              <Badge variant='outline'>{report.status}</Badge>
            ) : null}
          </CardHeader>
          <CardContent className='overflow-x-auto'>
            <ReadOnlyReportMatrix
              report={report}
              indicators={indicators}
              fields={fields}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
