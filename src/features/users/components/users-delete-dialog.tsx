'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { usersApi } from '../api/users-api'
import { type User } from '../data/schema'

type UserDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: User
}

export function UsersDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: UserDeleteDialogProps) {
  const [value, setValue] = useState('')
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => usersApi.remove(currentRow.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const handleDelete = async () => {
    if (value.trim() !== currentRow.username) return

    try {
      await deleteMutation.mutateAsync()
      setValue('')
      onOpenChange(false)
      toast.success('Đã xóa người dùng')
    } catch {
      // handled globally
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      form='users-delete-form'
      disabled={value.trim() !== currentRow.username}
      title={
        <span className='text-destructive'>
          <AlertTriangle
            className='me-1 inline-block stroke-destructive'
            size={18}
          />{' '}
          Xóa người dùng
        </span>
      }
      desc={
        <form
          id='users-delete-form'
          onSubmit={(e) => {
            e.preventDefault()
            handleDelete()
          }}
          className='space-y-4'
        >
          <p className='mb-2'>
            Bạn có chắc chắn muốn xóa{' '}
            <span className='font-bold'>{currentRow.username}</span>? <br />
            Thao tác này không thể hoàn tác.
          </p>

          <Label className='my-2'>
            Tài khoản:
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder='Nhập tài khoản để xác nhận xóa.'
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
