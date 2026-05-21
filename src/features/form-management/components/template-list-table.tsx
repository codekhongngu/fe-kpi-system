import { Link } from '@tanstack/react-router'
import {
  Archive,
  Eye,
  MoreHorizontal,
  PencilLine,
  Copy,
  Trash2,
  FilePlus2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import type {
  FormTemplate,
  PeriodType,
  TemplateLifecycleStatus,
  TemplateType,
} from '../api/types'
import { TemplateStatusBadge } from './shared/template-status-badge'
import { usePermission } from '@/hooks/use-permission'

const periodTypeLabel: Record<PeriodType, string> = {
  TUAN: 'Tuần',
  THANG: 'Tháng',
  QUY: 'Quý',
  NAM: 'Năm',
}

const templateTypeLabel: Record<TemplateType, string> = {
  AGGREGATE: 'Tổng hợp',
  UNIQUE: 'Đơn nhất',
}

const lifecycleLabel: Record<TemplateLifecycleStatus, string> = {
  DRAFT: 'Nhập',
  READY: 'Sẵn sàng',
  IN_USE: 'Đang sử dụng',
  ARCHIVED: 'Đã lưu trữ',
}

type TemplateListTableProps = {
  templates: FormTemplate[]
  onEditGeneral: (template: FormTemplate) => void
  onClone?: (template: FormTemplate) => void
  onMarkReady?: (template: FormTemplate) => void
  onArchive?: (template: FormTemplate) => void
  onDelete?: (template: FormTemplate) => void
}

export function TemplateListTable({
  templates,
  onEditGeneral,
  onClone,
  onMarkReady,
  onArchive,
  onDelete,
}: TemplateListTableProps) {
  const canUpdate  = usePermission('forms.update')
  const canPublish = usePermission('forms.publish')
  const canCreate  = usePermission('forms.create')
  const canDelete  = usePermission('forms.delete')
  return (
    <div className='overflow-auto max-h-[600px] rounded-md border bg-card'>
      <Table data-slot="table">
        <TableHeader>
          <TableRow>
            <TableHead>Mã biểu mẫu</TableHead>
            <TableHead>Tên biểu mẫu</TableHead>
            <TableHead>Lĩnh vực</TableHead>
            <TableHead>Loại biểu mẫu</TableHead>
            <TableHead>Kỳ</TableHead>
            <TableHead>Trạng thái vòng đời</TableHead>
            <TableHead>Trạng thái hoạt động</TableHead>
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
                <div className='text-xs text-muted-foreground'>
                  {template.description}
                </div>
              </TableCell>
              <TableCell>
                {template.fieldCategoryName ?? template.fieldCategoryId}
              </TableCell>
              <TableCell>
                {templateTypeLabel[template.templateType ?? 'AGGREGATE']}
              </TableCell>
              <TableCell>
                {periodTypeLabel[template.periodType ?? 'THANG']}
              </TableCell>
              <TableCell>
                <Badge variant='outline'>
                  {lifecycleLabel[template.templateStatus ?? 'DRAFT']}
                </Badge>
              </TableCell>
              <TableCell>
                <TemplateStatusBadge
                  templateStatus={template.templateStatus}
                />
              </TableCell>
              <TableCell className='text-right'>
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button variant='outline' size='icon' className='h-8 w-8'>
                      <MoreHorizontal className='size-4' />
                      <span className='sr-only'>Mở menu thao tác</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end' className='w-52'>
                    <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                    <DropdownMenuItem asChild className='cursor-pointer'>
                      <Link
                        to='/form-management/details/$templateId'
                        params={{ templateId: template.id }}
                      >
                        <Eye className='size-4' />
                        Xem chi tiết
                      </Link>
                    </DropdownMenuItem>
                    {canUpdate && (
                      <DropdownMenuItem
                        onClick={() => onEditGeneral(template)}
                        className='cursor-pointer'
                      >
                        <span className='flex items-center gap-2'>
                          <PencilLine className='size-4' />
                          Chỉnh sửa thông tin
                        </span>
                      </DropdownMenuItem>
                    )}
                    {canPublish && onMarkReady &&
                      (template.templateStatus ?? 'DRAFT') === 'DRAFT' && (
                        <DropdownMenuItem
                          onClick={() => onMarkReady(template)}
                          className='cursor-pointer'
                        >
                          <span className='flex items-center gap-2'>
                            <FilePlus2 className='size-4' />
                            Chuyển sẵn sàng
                          </span>
                        </DropdownMenuItem>
                      )}
                    {canPublish && onArchive &&
                      ['READY', 'IN_USE'].includes(
                        template.templateStatus ?? 'DRAFT'
                      ) && (
                        <DropdownMenuItem
                          onClick={() => onArchive(template)}
                          className='cursor-pointer'
                        >
                          <span className='flex items-center gap-2'>
                            <Archive className='size-4' />
                            Lưu trữ
                          </span>
                        </DropdownMenuItem>
                      )}
                    {canCreate && onClone &&
                      ['IN_USE', 'ARCHIVED'].includes(
                        template.templateStatus ?? 'DRAFT'
                      ) && (
                        <DropdownMenuItem
                          onClick={() => onClone(template)}
                          className='cursor-pointer'
                        >
                          <span className='flex items-center gap-2'>
                            <Copy className='size-4' />
                            Sao chép
                          </span>
                        </DropdownMenuItem>
                      )}
                    {canDelete && onDelete &&
                      (template.templateStatus ?? 'DRAFT') === 'DRAFT' && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDelete(template)}
                            className='cursor-pointer text-destructive'
                          >
                            <span className='flex items-center gap-2'>
                              <Trash2 className='size-4' />
                              Xóa
                            </span>
                          </DropdownMenuItem>
                        </>
                      )}
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
