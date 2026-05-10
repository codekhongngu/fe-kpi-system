import { useState } from 'react'
import { z } from 'zod'
import axios from 'axios'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { Loader2, LogIn } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
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
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'
import { authApi } from '@/features/auth/api/auth-api'

const formSchema = z.object({
  usernameOrEmail: z.string().min(1, 'Vui lòng nhập email hoặc username'),
  password: z
    .string()
    .min(1, 'Vui lòng nhập mật khẩu')
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
})

interface UserAuthFormProps extends React.HTMLAttributes<HTMLFormElement> {
  redirectTo?: string
}

export function UserAuthForm({
  className,
  redirectTo,
  ...props
}: UserAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { auth } = useAuthStore()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      usernameOrEmail: '',
      password: '',
    },
  })

  function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)

    const promise = authApi.login(data)
    promise.finally(() => setIsLoading(false))

    toast.promise(promise, {
      loading: 'Đang đăng nhập...',
      success: async (result) => {
        auth.setAccessToken(result.accessToken)
        if (result.refreshToken) {
          auth.setRefreshToken(result.refreshToken)
        }

        auth.setUser(result.user)

        const targetPath = redirectTo || '/'
        navigate({ to: targetPath, replace: true })
        return 'Đăng nhập thành công.'
      },
      error: (error) => {
        if (axios.isAxiosError(error)) {
          const data = error.response?.data as unknown
          if (data && typeof data === 'object') {
            const message = (data as { message?: unknown }).message
            if (typeof message === 'string' && message.trim()) return message
            if (Array.isArray(message)) {
              const parts = message.filter(
                (item): item is string =>
                  typeof item === 'string' && item.trim().length > 0
              )
              if (parts.length > 0) return parts.join('\n')
            }
          }
        }

        return error instanceof Error ? error.message : 'Không thể đăng nhập.'
      },
    })
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
          name='usernameOrEmail'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email hoặc username</FormLabel>
              <FormControl>
                <Input
                  placeholder='Email hoặc username'
                  autoComplete='username'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem className='relative'>
              <FormLabel>Mật khẩu</FormLabel>
              <FormControl>
                <PasswordInput
                  placeholder='********'
                  autoComplete='current-password'
                  {...field}
                />
              </FormControl>
              <FormMessage />
              <Link
                to='/forgot-password'
                className='absolute end-0 -top-0.5 text-sm font-medium text-muted-foreground hover:opacity-75'
              >
                Quên mật khẩu?
              </Link>
            </FormItem>
          )}
        />
        <Button className='mt-2' disabled={isLoading}>
          {isLoading ? <Loader2 className='animate-spin' /> : <LogIn />}
          Đăng nhập
        </Button>
      </form>
    </Form>
  )
}
