import { useState } from 'react'
import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { type Row } from '@tanstack/react-table'
import { Trash2, UserCheck, UserPen, UserX } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { usersApi } from '../api/users-api'
import { type User } from '../data/schema'
import { useUsers } from './users-provider'

type DataTableRowActionsProps = {
  row: Row<User>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const { setOpen, setCurrentRow } = useUsers()
  const queryClient = useQueryClient()
  const isActive = row.original.isActive
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)

  const statusMutation = useMutation({
    mutationFn: async () => {
      return isActive
        ? usersApi.deactivate(row.original.id)
        : usersApi.activate(row.original.id)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            className='flex h-8 w-8 p-0 data-[state=open]:bg-muted'
          >
            <DotsHorizontalIcon className='h-4 w-4' />
            <span className='sr-only'>Mở menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-[160px]'>
          <DropdownMenuItem
            onClick={() => {
              setCurrentRow(row.original)
              setOpen('edit')
            }}
          >
            Chỉnh sửa
            <DropdownMenuShortcut>
              <UserPen size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={statusMutation.isPending}
            onClick={() => {
              setStatusDialogOpen(true)
            }}
          >
            {isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
            <DropdownMenuShortcut>
              {isActive ? <UserX size={16} /> : <UserCheck size={16} />}
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              setCurrentRow(row.original)
              setOpen('delete')
            }}
            className='text-red-500!'
          >
            Xóa
            <DropdownMenuShortcut>
              <Trash2 size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        title={isActive ? 'Vô hiệu hóa người dùng' : 'Kích hoạt người dùng'}
        desc={`Xác nhận ${isActive ? 'vô hiệu hóa' : 'kích hoạt'} người dùng ${row.original.username}.`}
        handleConfirm={() => {
          toast.promise(statusMutation.mutateAsync(), {
            loading: isActive
              ? 'Đang vô hiệu hóa người dùng...'
              : 'Đang kích hoạt người dùng...',
            success: isActive
              ? 'Đã vô hiệu hóa người dùng'
              : 'Đã kích hoạt người dùng',
            error: isActive
              ? 'Không thể vô hiệu hóa người dùng'
              : 'Không thể kích hoạt người dùng',
          })
        }}
        confirmText={isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
        destructive={isActive}
        isLoading={statusMutation.isPending}
      />
    </>
  )
}
