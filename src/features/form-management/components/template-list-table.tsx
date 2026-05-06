import { Link } from '@tanstack/react-router'
import { Eye, PencilLine } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { FormTemplate, PeriodType } from '../api/types'

const periodTypeLabel: Record<PeriodType, string> = {
  TUAN: 'Tuần',
  THANG: 'Tháng',
  QUY: 'Quý',
  NAM: 'Năm',
}

type TemplateListTableProps = {
  templates: FormTemplate[]
  onPreview: (template: FormTemplate) => void
  onEditGeneral: (template: FormTemplate) => void
}

export function TemplateListTable({ templates, onPreview, onEditGeneral }: TemplateListTableProps) {
  return (
    <div className='overflow-hidden rounded-md border bg-card'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mã biểu mẫu</TableHead>
            <TableHead>Tên biểu mẫu</TableHead>
            <TableHead>Lĩnh vực</TableHead>
            <TableHead>Kỳ</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className='text-right'>Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className='h-20 text-center'>
                Không có biểu mẫu phù hợp điều kiện lọc.
              </TableCell>
            </TableRow>
          )}
          {templates.map((template) => (
            <TableRow key={template.id}>
              <TableCell className='font-medium'>{template.code}</TableCell>
              <TableCell>
                <div>{template.name}</div>
                <div className='text-xs text-muted-foreground'>{template.description}</div>
              </TableCell>
              <TableCell>{template.fieldCategoryName ?? template.fieldCategoryId}</TableCell>
              <TableCell>{periodTypeLabel[template.periodType ?? 'THANG']}</TableCell>
              <TableCell>
                <Badge variant={template.isActive ? 'default' : 'secondary'}>
                  {template.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
                </Badge>
              </TableCell>
              <TableCell className='text-right'>
                <div className='flex justify-end gap-2'>
                  <Button size='sm' variant='outline' onClick={() => onEditGeneral(template)}>
                    <PencilLine />
                    Sửa thông tin
                  </Button>
                  <Button size='sm' variant='outline' asChild>
                    <Link to='/form-management/details/$templateId' params={{ templateId: template.id }}>
                      Cấu hình
                    </Link>
                  </Button>
                  <Button size='sm' variant='outline' onClick={() => onPreview(template)}>
                    <Eye />
                    Xem nhanh
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
