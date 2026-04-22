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
import type { FormTemplate } from '../api/types'

type TemplateListTableProps = {
  templates: FormTemplate[]
  cycleLabel: (cycle: string) => string
  onPreview: (template: FormTemplate) => void
}

export function TemplateListTable({ templates, cycleLabel, onPreview }: TemplateListTableProps) {
  return (
    <div className='overflow-hidden rounded-md border bg-card'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mã biểu mẫu</TableHead>
            <TableHead>Tên biểu mẫu</TableHead>
            <TableHead>Lĩnh vực</TableHead>
            <TableHead>Chu kỳ</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Đơn vị đã giao</TableHead>
            <TableHead>Tỷ lệ hoàn thành</TableHead>
            <TableHead className='text-right'>Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className='h-20 text-center'>
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
              <TableCell>{template.domain}</TableCell>
              <TableCell>{cycleLabel(template.cycle)}</TableCell>
              <TableCell>
                <Badge variant={template.status === 'active' ? 'default' : 'secondary'}>
                  {template.status === 'active' ? 'Hoạt động' : 'Ngừng sử dụng'}
                </Badge>
              </TableCell>
              <TableCell>{template.assignedUnits}</TableCell>
              <TableCell>{template.completionRate}%</TableCell>
              <TableCell className='text-right'>
                <div className='flex justify-end gap-2'>
                  <Button size='sm' variant='outline' asChild>
                    <Link to='/form-management/edit/$templateId' params={{ templateId: template.id }}>
                      <PencilLine />
                      Chỉnh sửa
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
