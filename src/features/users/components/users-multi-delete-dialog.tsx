'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { type Table } from '@tanstack/react-table'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { usersApi } from '../api/users-api'
import { type User } from '../data/schema'

type UserMultiDeleteDialogProps<TData> = {
  open: boolean
  onOpenChange: (open: boolean) => void
  table: Table<TData>
}

const CONFIRM_WORD = 'DELETE'

export function UsersMultiDeleteDialog<TData>({
  open,
  onOpenChange,
  table,
}: UserMultiDeleteDialogProps<TData>) {
  const [value, setValue] = useState('')
  const queryClient = useQueryClient()

  const selectedRows = table.getFilteredSelectedRowModel().rows

  const handleDelete = () => {
    if (value.trim() !== CONFIRM_WORD) {
      toast.error(`Vui lòng nhập "${CONFIRM_WORD}" để xác nhận.`)
      return
    }

    onOpenChange(false)

    const selectedUsers = selectedRows.map((row) => row.original as User)
    const deletePromise = Promise.all(selectedUsers.map((user) => usersApi.remove(user.id)))

    toast.promise(deletePromise, {
      loading: 'Đang xóa người dùng...',
      success: async () => {
        await queryClient.invalidateQueries({ queryKey: ['users'] })
        setValue('')
        table.resetRowSelection()
        return `Đã xóa ${selectedUsers.length} người dùng`
      },
      error: 'Có lỗi xảy ra',
    })
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      form='users-multi-delete-form'
      disabled={value.trim() !== CONFIRM_WORD}
      title={
        <span className='text-destructive'>
          <AlertTriangle
            className='me-1 inline-block stroke-destructive'
            size={18}
          />{' '}
          Xóa {selectedRows.length} người dùng
        </span>
      }
      desc={
        <form
          id='users-multi-delete-form'
          onSubmit={(e) => {
            e.preventDefault()
            handleDelete()
          }}
          className='space-y-4'
        >
          <p className='mb-2'>
            Bạn có chắc chắn muốn xóa các người dùng đã chọn? <br />
            Thao tác này không thể hoàn tác.
          </p>

          <Label className='my-4 flex flex-col items-start gap-1.5'>
            <span className=''>Xác nhận bằng cách nhập "{CONFIRM_WORD}":</span>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`Nhập "${CONFIRM_WORD}" để xác nhận.`}
              autoFocus
            />
          </Label>

          <Alert variant='destructive'>
            <AlertTitle>Cảnh báo!</AlertTitle>
            <AlertDescription>
              Vui lòng cân nhắc, thao tác này không thể hoàn tác.
            </AlertDescription>
          </Alert>
        </form>
      }
      confirmText='Xóa'
      destructive
    />
  )
}
