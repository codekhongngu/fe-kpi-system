import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { type Table } from '@tanstack/react-table'
import { Trash2, UserX, UserCheck, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'
import { usersApi } from '../api/users-api'
import { type User } from '../data/schema'
import { UsersMultiDeleteDialog } from './users-multi-delete-dialog'

type DataTableBulkActionsProps<TData> = {
  table: Table<TData>
}

export function DataTableBulkActions<TData>({
  table,
}: DataTableBulkActionsProps<TData>) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const queryClient = useQueryClient()
  const selectedRows = table.getFilteredSelectedRowModel().rows

  const handleBulkStatusChange = (status: 'active' | 'inactive') => {
    const selectedUsers = selectedRows.map((row) => row.original as User)

    const promise = Promise.all(
      selectedUsers.map((user) =>
        status === 'active' ? usersApi.activate(user.id) : usersApi.deactivate(user.id)
      )
    )

    toast.promise(promise, {
      loading: `${status === 'active' ? 'Đang kích hoạt' : 'Đang vô hiệu hóa'} người dùng...`,
      success: async () => {
        await queryClient.invalidateQueries({ queryKey: ['users'] })
        table.resetRowSelection()
        return `${status === 'active' ? 'Đã kích hoạt' : 'Đã vô hiệu hóa'} ${selectedUsers.length} người dùng`
      },
      error: `Không thể ${status === 'active' ? 'kích hoạt' : 'vô hiệu hóa'} người dùng`,
    })
    table.resetRowSelection()
  }

  const handleBulkInvite = () => {
    const selectedUsers = selectedRows.map((row) => row.original as User)
    toast.message(`Đã chọn ${selectedUsers.length} người dùng. Chức năng mời chưa được kết nối API.`)
    table.resetRowSelection()
  }

  return (
    <>
      <BulkActionsToolbar table={table} entityName='người dùng'>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='icon'
              onClick={handleBulkInvite}
              className='size-8'
              aria-label='Mời người dùng đã chọn'
              title='Mời người dùng đã chọn'
            >
              <Mail />
              <span className='sr-only'>Mời người dùng đã chọn</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Mời người dùng đã chọn</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='icon'
              onClick={() => handleBulkStatusChange('active')}
              className='size-8'
              aria-label='Kích hoạt người dùng đã chọn'
              title='Kích hoạt người dùng đã chọn'
            >
              <UserCheck />
              <span className='sr-only'>Kích hoạt người dùng đã chọn</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Kích hoạt người dùng đã chọn</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='icon'
              onClick={() => handleBulkStatusChange('inactive')}
              className='size-8'
              aria-label='Vô hiệu hóa người dùng đã chọn'
              title='Vô hiệu hóa người dùng đã chọn'
            >
              <UserX />
              <span className='sr-only'>Vô hiệu hóa người dùng đã chọn</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Vô hiệu hóa người dùng đã chọn</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='destructive'
              size='icon'
              onClick={() => setShowDeleteConfirm(true)}
              className='size-8'
              aria-label='Xóa người dùng đã chọn'
              title='Xóa người dùng đã chọn'
            >
              <Trash2 />
              <span className='sr-only'>Xóa người dùng đã chọn</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Xóa người dùng đã chọn</p>
          </TooltipContent>
        </Tooltip>
      </BulkActionsToolbar>

      <UsersMultiDeleteDialog
        table={table}
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
      />
    </>
  )
}
