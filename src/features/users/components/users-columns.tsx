import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { type User } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

type CreateUsersColumnsArgs = {
  rolesById: Record<string, string>
}

export function createUsersColumns({
  rolesById,
}: CreateUsersColumnsArgs): ColumnDef<User>[] {
  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label='Chọn tất cả'
          className='translate-y-[2px]'
        />
      ),
      meta: {
        className: cn('max-md:sticky start-0 z-10 rounded-tl-[inherit]'),
      },
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label='Chọn dòng'
          className='translate-y-[2px]'
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'username',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Tài khoản' />
      ),
      cell: ({ row }) => (
        <LongText className='max-w-36 ps-3'>
          {row.getValue('username')}
        </LongText>
      ),
      meta: {
        className: cn(
          'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]',
          'ps-0.5 max-md:sticky start-6 @4xl/content:table-cell @4xl/content:drop-shadow-none'
        ),
      },
      enableHiding: false,
    },
    {
      accessorKey: 'fullName',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Họ và tên' />
      ),
      cell: ({ row }) => (
        <LongText className='max-w-48'>{row.getValue('fullName')}</LongText>
      ),
      meta: { className: 'w-48' },
    },
    {
      accessorKey: 'email',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Email' />
      ),
      cell: ({ row }) => (
        <div className='w-fit ps-2 text-nowrap'>{row.getValue('email')}</div>
      ),
    },
    {
      id: 'status',
      accessorFn: (row) => (row.isActive ? 'active' : 'inactive'),
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Trạng thái' />
      ),
      cell: ({ row }) => {
        const isActive = row.original.isActive
        return (
          <div className='flex space-x-2'>
            <Badge
              variant='outline'
              className={cn(
                'capitalize',
                isActive
                  ? 'border-teal-200 bg-teal-100/30 text-teal-900 dark:text-teal-200'
                  : 'border-neutral-300 bg-neutral-300/40'
              )}
            >
              {isActive ? 'Hoạt động' : 'Không hoạt động'}
            </Badge>
          </div>
        )
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
      enableHiding: false,
      enableSorting: false,
    },
    {
      id: 'role',
      accessorFn: (row) => row.roleIds[0] ?? '',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Vai trò' />
      ),
      cell: ({ row }) => {
        const roleId = row.original.roleIds[0]
        if (!roleId) return null
        return (
          <div className='flex items-center gap-x-2'>
            <span className='text-sm'>{rolesById[roleId] ?? roleId}</span>
          </div>
        )
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: 'actions',
      cell: DataTableRowActions,
    },
  ]
}
