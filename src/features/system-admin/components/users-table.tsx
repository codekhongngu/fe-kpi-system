import { RotateCcw, Trash2, UserPen } from 'lucide-react'
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
import type { OrganizationUnit, Role, SystemUser } from '../api/types'

type UsersTableProps = {
  data: SystemUser[]
  isLoading: boolean
  units: OrganizationUnit[]
  roles: Role[]
  onEdit: (user: SystemUser) => void
  onResetPassword: (userId: string) => void
  onToggleStatus: (user: SystemUser) => void
  onDelete: (user: SystemUser) => void
}

const COLUMN_COUNT = 6

export function UsersTable({
  data,
  isLoading,
  units,
  roles,
  onEdit,
  onResetPassword,
  onToggleStatus,
  onDelete,
}: UsersTableProps) {
  const unitLabel = (unitId: string) =>
    units.find((unit) => unit.id === unitId)?.name ?? 'Không xác định'

  const roleLabel = (roleId: string) =>
    roles.find((role) => role.id === roleId)?.name ?? 'N/A'

  return (
    <div className='max-h-[600px] overflow-auto rounded-md border bg-card'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mã</TableHead>
            <TableHead>Họ tên</TableHead>
            <TableHead>Đơn vị</TableHead>
            <TableHead>Role</TableHead>
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
            data.map((user) => (
              <TableRow key={user.id}>
                <TableCell className='font-medium'>{user.userCode}</TableCell>
                <TableCell>
                  <div>{user.fullName}</div>
                  <div className='text-xs text-muted-foreground'>
                    {user.email}
                  </div>
                </TableCell>
                <TableCell>{unitLabel(user.unitId)}</TableCell>
                <TableCell>
                  <div className='flex flex-wrap gap-1'>
                    {user.roleIds.map((roleId) => (
                      <Badge key={roleId} variant='outline'>
                        {roleLabel(roleId)}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      user.status === 'active' ? 'default' : 'secondary'
                    }
                  >
                    {user.status === 'active'
                      ? 'Hoạt động'
                      : 'Dừng hoạt động'}
                  </Badge>
                </TableCell>
                <TableCell className='text-right'>
                  <PermissionGuard
                    permission={[
                      'users.update',
                      'users.reset-password',
                      'users.toggle-status',
                      'users.delete',
                    ]}
                  >
                    <div className='flex justify-end gap-1'>
                      <PermissionGuard permission='users.update'>
                        <Button
                          size='icon'
                          variant='outline'
                          onClick={() => onEdit(user)}
                          title='Sửa'
                        >
                          <UserPen />
                        </Button>
                      </PermissionGuard>
                      <PermissionGuard permission='users.reset-password'>
                        <Button
                          size='icon'
                          variant='outline'
                          onClick={() => onResetPassword(user.id)}
                          title='Reset mật khẩu'
                        >
                          <RotateCcw />
                        </Button>
                      </PermissionGuard>
                      <PermissionGuard permission='users.toggle-status'>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => onToggleStatus(user)}
                        >
                          {user.status === 'active' ? 'Khóa' : 'Mở'}
                        </Button>
                      </PermissionGuard>
                      <PermissionGuard permission='users.delete'>
                        <Button
                          size='icon'
                          variant='destructive'
                          onClick={() => onDelete(user)}
                          title='Xóa mềm'
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
                    Không có người dùng phù hợp
                  </div>
                  <div className='mt-1 text-sm text-muted-foreground'>
                    Thử thay đổi bộ lọc hoặc thêm người dùng mới.
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
