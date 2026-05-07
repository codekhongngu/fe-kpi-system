import { Link } from '@tanstack/react-router'
import { Eye, MoreHorizontal, PencilLine } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  onEditGeneral: (template: FormTemplate) => void
}

export function TemplateListTable({ templates, onEditGeneral }: TemplateListTableProps) {
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
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button variant='outline' size='icon' className='h-8 w-8'>
                      <MoreHorizontal className='size-4' />
                      <span className='sr-only'>Mở menu thao tác</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end' className='w-48'>
                    <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                    <DropdownMenuItem asChild className='cursor-pointer'>
                      <Link to='/form-management/details/$templateId' params={{ templateId: template.id }}>
                        <Eye className='size-4' />
                        Xem chi tiết
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEditGeneral(template)} className='cursor-pointer'>
                      <span className='flex items-center gap-2'>
                        <PencilLine className='size-4' />
                        Chỉnh sửa
                      </span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
