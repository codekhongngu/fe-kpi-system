import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { FormTemplate, PeriodType } from '../../api/types'
import { TemplateStatusBadge } from './template-status-badge'

type TemplateMetadataCardProps = {
  template: FormTemplate
}

function periodLabel(periodType?: PeriodType | null) {
  switch (periodType) {
    case 'TUAN':
      return 'Tuẩn'
    case 'THANG':
      return 'Tháng'
    case 'QUY':
      return 'Quý'
    case 'NAM':
      return 'Năm'
    default:
      return '--'
  }
}

const templateTypeLabel: Record<string, string> = {
  AGGREGATE: 'Tổng hợp',
  UNIQUE: 'Đơn nhất',
}

export function TemplateMetadataCard({ template }: TemplateMetadataCardProps) {
  return (
    <Card className='rounded-3xl'>
      <CardHeader className='space-y-2'>
        <CardTitle className='text-lg'>Thông tin chung</CardTitle>
        <TemplateStatusBadge
          templateStatus={template.templateStatus}
          isActive={template.isActive}
        />
      </CardHeader>
      <CardContent className='grid gap-4 sm:grid-cols-3'>
        {/* First row: Thông tin chung, Mã biểu mẫu, Lĩnh vực, Loại biểu mẫu */}
        <div>
          <div className='text-[11px] font-bold tracking-widest text-muted-foreground uppercase'>
            Mã biểu mẫu
          </div>
          <div className='mt-1 text-sm font-semibold'>{template.code}</div>
        </div>
        <div>
          <div className='text-[11px] font-bold tracking-widest text-muted-foreground uppercase'>
            Lĩnh vực
          </div>
          <div className='mt-1 text-sm font-semibold'>
            {template.fieldCategoryName ?? template.fieldCategoryId}
          </div>
        </div>
        <div>
          <div className='text-[11px] font-bold tracking-widest text-muted-foreground uppercase'>
            Loại biểu mẫu
          </div>
          <div className='mt-1 text-sm font-semibold'>
            {template.templateType
              ? (templateTypeLabel[template.templateType] ??
                template.templateType)
              : '--'}
          </div>
        </div>
        
        {/* Second row: Trạng thái, Tên biểu mẫu, Kỳ báo cáo */}
        <div>
          <div className='text-[11px] font-bold tracking-widest text-muted-foreground uppercase'>
            Tên biểu mẫu
          </div>
          <div className='mt-1 text-sm font-semibold'>{template.name}</div>
        </div>
        <div>
          <div className='text-[11px] font-bold tracking-widest text-muted-foreground uppercase'>
            Kỳ báo cáo
          </div>
          <div className='mt-1 text-sm font-semibold'>
            {periodLabel(template.periodType)}
          </div>
        </div>
        <div>
          <div className='text-[11px] font-bold tracking-widest text-muted-foreground uppercase'>
            Cập nhật lần cuối
          </div>
          <div className='mt-1 text-sm font-semibold'>
            {template.updatedAt
              ? new Date(template.updatedAt).toLocaleString('vi-VN')
              : '--'}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
