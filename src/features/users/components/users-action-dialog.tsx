'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'
import { SelectDropdown } from '@/components/select-dropdown'
import { rolesApi, usersApi } from '../api/users-api'
import { type User } from '../data/schema'

const formSchema = z
  .object({
    fullName: z.string().min(1, 'Vui lòng nhập họ và tên.'),
    username: z.string().min(1, 'Vui lòng nhập tài khoản.'),
    phone: z.string().optional(),
    email: z.email({
      error: (iss) => (iss.input === '' ? 'Vui lòng nhập email.' : 'Email không hợp lệ.'),
    }),
    password: z.string().transform((pwd) => pwd.trim()),
    roleId: z.string().min(1, 'Vui lòng chọn vai trò.'),
    confirmPassword: z.string().transform((pwd) => pwd.trim()),
    isEdit: z.boolean(),
  })
  .refine(
    (data) => {
      if (data.isEdit && !data.password) return true
      return data.password.length > 0
    },
    {
      message: 'Vui lòng nhập mật khẩu.',
      path: ['password'],
    }
  )
  .refine(
    ({ isEdit, password }) => {
      if (isEdit && !password) return true
      return password.length >= 8
    },
    {
      message: 'Mật khẩu phải có ít nhất 8 ký tự.',
      path: ['password'],
    }
  )
  .refine(
    ({ isEdit, password }) => {
      if (isEdit && !password) return true
      return /[a-z]/.test(password)
    },
    {
      message: 'Mật khẩu phải có ít nhất 1 chữ thường.',
      path: ['password'],
    }
  )
  .refine(
    ({ isEdit, password }) => {
      if (isEdit && !password) return true
      return /\d/.test(password)
    },
    {
      message: 'Mật khẩu phải có ít nhất 1 chữ số.',
      path: ['password'],
    }
  )
  .refine(
    ({ isEdit, password, confirmPassword }) => {
      if (isEdit && !password) return true
      return password === confirmPassword
    },
    {
      message: 'Mật khẩu nhập lại không khớp.',
      path: ['confirmPassword'],
    }
  )
type UserForm = z.infer<typeof formSchema>

type UserActionDialogProps = {
  currentRow?: User
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UsersActionDialog({
  currentRow,
  open,
  onOpenChange,
}: UserActionDialogProps) {
  const isEdit = !!currentRow
  const queryClient = useQueryClient()

  const rolesQuery = useQuery({
    queryKey: ['roles', { page: 1, limit: 200 }],
    queryFn: () => rolesApi.list({ page: 1, limit: 200 }),
  })

  const form = useForm<UserForm>({
    resolver: zodResolver(formSchema),
    defaultValues: isEdit
      ? {
          fullName: currentRow.fullName,
          username: currentRow.username,
          email: currentRow.email,
          phone: '',
          roleId: currentRow.roleIds[0] ?? '',
          password: '',
          confirmPassword: '',
          isEdit,
        }
      : {
          fullName: '',
          username: '',
          email: '',
          phone: '',
          roleId: '',
          password: '',
          confirmPassword: '',
          isEdit,
        },
  })

  const createMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (payload: { id: string; input: Parameters<typeof usersApi.update>[1] }) =>
      usersApi.update(payload.id, payload.input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const onSubmit = async (values: UserForm) => {
    const roleIds = values.roleId ? [values.roleId] : []
    const phone = values.phone?.trim() ? values.phone.trim() : undefined

    try {
      if (isEdit && currentRow) {
        const input = {
          fullName: values.fullName.trim(),
          username: values.username.trim(),
          email: values.email.trim(),
          phone,
          roleIds,
          ...(values.password ? { password: values.password } : {}),
        }
        await updateMutation.mutateAsync({ id: currentRow.id, input })
        toast.success('Đã cập nhật người dùng')
      } else {
        const input = {
          fullName: values.fullName.trim(),
          username: values.username.trim(),
          email: values.email.trim(),
          phone,
          roleIds,
          password: values.password,
        }
        await createMutation.mutateAsync(input)
        toast.success('Đã tạo người dùng')
      }

      form.reset()
      onOpenChange(false)
    } catch {
      // handled globally
    }
  }

  const isPasswordTouched = !!form.formState.dirtyFields.password

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset()
        onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>
            {isEdit ? 'Cập nhật người dùng' : 'Thêm người dùng'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Cập nhật thông tin người dùng.'
              : 'Tạo mới người dùng.'}{' '}
            Nhấn lưu khi hoàn tất.
          </DialogDescription>
        </DialogHeader>
        <div className='h-105 w-[calc(100%+0.75rem)] overflow-y-auto py-1 pe-3'>
          <Form {...form}>
            <form
              id='user-form'
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-4 px-0.5'
            >
              <FormField
                control={form.control}
                name='fullName'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Họ và tên
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Nguyễn Văn A'
                        className='col-span-4'
                        autoComplete='off'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='username'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Tài khoản
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='nguyenvana'
                        className='col-span-4'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='nguyenvana@gmail.com'
                        className='col-span-4'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='phone'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Số điện thoại
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='VD: 0901234567'
                        className='col-span-4'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='roleId'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>Vai trò</FormLabel>
                    <SelectDropdown
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                      placeholder='Chọn vai trò'
                      className='col-span-4'
                      items={(rolesQuery.data?.data ?? []).map((role) => ({
                        label: role.name,
                        value: role.id,
                      }))}
                    />
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Mật khẩu
                    </FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder='VD: S3cur3P@ssw0rd'
                        className='col-span-4'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='confirmPassword'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Nhập lại mật khẩu
                    </FormLabel>
                    <FormControl>
                      <PasswordInput
                        disabled={!isPasswordTouched}
                        placeholder='Nhập lại mật khẩu'
                        className='col-span-4'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
        <DialogFooter>
          <Button type='submit' form='user-form'>
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
