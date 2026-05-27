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
import {
  type OrganizationUnit,
  unitLevelOptions,
} from '../api/types'

type OrganizationSubUnitsTableProps = {
  data: OrganizationUnit[]
  isLoading: boolean
  onEdit: (unit: OrganizationUnit) => void
  onToggleStatus: (unit: OrganizationUnit) => void
  onDelete: (unit: OrganizationUnit) => void
}

const COLUMN_COUNT = 5

function getUnitLevelLabel(level: OrganizationUnit['level']) {
  return (
    unitLevelOptions.find((option) => option.value === level)?.label ?? level
  )
}

export function OrganizationSubUnitsTable({
  data,
  isLoading,
  onEdit,
  onToggleStatus,
  onDelete,
}: OrganizationSubUnitsTableProps) {
  return (
    <div className='max-h-[600px] overflow-auto rounded-md border bg-card'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mã đơn vị</TableHead>
            <TableHead>Tên đơn vị</TableHead>
            <TableHead>Cấp bậc</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className='text-right'>Thao tác</TableHead>
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
            data.map((unit) => (
              <TableRow key={unit.id}>
                <TableCell>
                  <div className='font-medium'>{unit.code}</div>
                </TableCell>
                <TableCell>
                  <div className='min-w-0'>
                    <div
                      className='max-w-[320px] truncate'
                      title={unit.name}
                    >
                      {unit.name}
                    </div>
                    <div
                      className='max-w-[320px] truncate text-xs text-muted-foreground'
                      title={unit.description ?? ''}
                    >
                      {unit.description ?? ''}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className='text-sm'>{getUnitLevelLabel(unit.level)}</div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={unit.status === 'active' ? 'default' : 'secondary'}
                  >
                    {unit.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                  </Badge>
                </TableCell>
                <TableCell className='text-right'>
                  <PermissionGuard
                    permission={['units.update', 'units.delete']}
                  >
                    <div className='flex justify-end gap-1'>
                      <PermissionGuard permission='units.update'>
                        <Button
                          size='icon'
                          variant='outline'
                          onClick={() => onEdit(unit)}
                          title='Sửa đơn vị'
                        >
                          <UserPen />
                        </Button>
                      </PermissionGuard>
                      <PermissionGuard permission='units.update'>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => onToggleStatus(unit)}
                        >
                          {unit.status === 'active' ? 'Khóa' : 'Mở'}
                        </Button>
                      </PermissionGuard>
                      <PermissionGuard permission='units.delete'>
                        <Button
                          size='icon'
                          variant='destructive'
                          onClick={() => onDelete(unit)}
                          title='Xóa đơn vị'
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
                  <div className='text-base font-medium'>Không có dữ liệu</div>
                  <div className='mt-1 text-sm text-muted-foreground'>
                    Không có đơn vị trực thuộc phù hợp với bộ lọc hiện tại.
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
