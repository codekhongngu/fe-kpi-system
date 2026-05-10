import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { PasswordInput } from '@/components/password-input'
import { authApi } from '@/features/auth/api/auth-api'

const formSchema = z
  .object({
    newPassword: z
      .string()
      .min(1, 'Vui lòng nhập mật khẩu mới')
      .min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
    confirmNewPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu mới'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Mật khẩu xác nhận không khớp.',
    path: ['confirmNewPassword'],
  })

type ResetPasswordFormValues = z.infer<typeof formSchema>

type ResetPasswordFormProps = React.HTMLAttributes<HTMLFormElement> & {
  token?: string
}

export function ResetPasswordForm({
  className,
  token,
  ...props
}: ResetPasswordFormProps) {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newPassword: '',
      confirmNewPassword: '',
    },
  })

  function onSubmit(values: ResetPasswordFormValues) {
    if (!token) {
      toast.error('Thiếu token đặt lại mật khẩu.')
      return
    }

    setIsLoading(true)
    const promise = authApi.resetPassword({
      token,
      newPassword: values.newPassword,
    })
    promise.finally(() => setIsLoading(false))

    toast.promise(promise, {
      loading: 'Đang đặt lại mật khẩu...',
      success: (result) => {
        form.reset()
        navigate({ to: '/sign-in', replace: true })
        return result.message
      },
      error: (error) => {
        return error instanceof Error
          ? error.message
          : 'Không thể đặt lại mật khẩu.'
      },
    })
  }

  if (!token) {
    return (
      <div className='space-y-2'>
        <p className='text-sm text-muted-foreground'>
          Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.
        </p>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-3', className)}
        {...props}
      >
        <FormField
          control={form.control}
          name='newPassword'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mật khẩu mới</FormLabel>
              <FormControl>
                <PasswordInput placeholder='********' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='confirmNewPassword'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Xác nhận mật khẩu mới</FormLabel>
              <FormControl>
                <PasswordInput placeholder='********' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className='mt-2' disabled={isLoading}>
          Đặt lại mật khẩu
        </Button>
      </form>
    </Form>
  )
}
