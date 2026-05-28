import { Trash2, UserPen } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PermissionGuard } from '@/components/permission-guard'
import type { FieldCategory } from '../api/types'

type FieldCategoriesTableProps = {
  data: FieldCategory[]
  isLoading: boolean
  onEdit: (category: FieldCategory) => void
  onDelete: (category: FieldCategory) => void
}

const COLUMN_COUNT = 5

export function FieldCategoriesTable({
  data,
  isLoading,
  onEdit,
  onDelete,
}: FieldCategoriesTableProps) {
  return (
    <div className='max-h-[600px] overflow-auto rounded-md border bg-card'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mã</TableHead>
            <TableHead>Tên lĩnh vực</TableHead>
            <TableHead className='w-[140px]'>Trạng thái</TableHead>
            <TableHead>Mô tả</TableHead>
            <TableHead className='w-[120px] text-right'>Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading &&
            Array.from({ length: 6 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={COLUMN_COUNT}>
                  <Skeleton className='h-12 w-full' />
                </TableCell>
              </TableRow>
            ))}
          {!isLoading &&
            data.map((item) => (
              <TableRow key={item.id}>
                <TableCell className='font-medium'>{item.code}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>
                  <Badge variant={item.isActive ? 'default' : 'secondary'}>
                    {item.isActive ? 'Hoạt động' : 'Ngừng'}
                  </Badge>
                </TableCell>
                <TableCell className='max-w-[420px] truncate'>
                  {item.description ?? '-'}
                </TableCell>
                <TableCell className='text-right'>
                  <PermissionGuard
                    permission={[
                      'field-categories.update',
                      'field-categories.delete',
                    ]}
                  >
                    <div className='flex justify-end gap-1'>
                      <PermissionGuard permission='field-categories.update'>
                        <Button
                          size='icon'
                          variant='outline'
                          onClick={() => onEdit(item)}
                          title='Sửa lĩnh vực'
                        >
                          <UserPen />
                        </Button>
                      </PermissionGuard>
                      <PermissionGuard permission='field-categories.delete'>
                        <Button
                          size='icon'
                          variant='destructive'
                          onClick={() => onDelete(item)}
                          title='Xóa lĩnh vực'
                        >
                          <Trash2 />
                        </Button>
                      </PermissionGuard>
                    </div>
                  </PermissionGuard>
                </TableCell>
              </TableRow>
            ))}
          {!isLoading && data.length === 0 && (
            <TableRow>
              <TableCell colSpan={COLUMN_COUNT} className='h-44 text-center'>
                <div className='mx-auto max-w-sm'>
                  <div className='text-base font-medium'>
                    Không có lĩnh vực phù hợp
                  </div>
                  <div className='mt-1 text-sm text-muted-foreground'>
                    Thử thay đổi bộ lọc hoặc thêm lĩnh vực mới.
                  </div>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
