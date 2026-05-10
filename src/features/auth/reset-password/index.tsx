import { Link, useSearch } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AuthLayout } from '../auth-layout'
import { ResetPasswordForm } from './reset-password-form'

export function ResetPassword() {
  const { token } = useSearch({ from: '/(auth)/reset-password' })

  return (
    <AuthLayout>
      <Card className='gap-4'>
        <CardHeader>
          <CardTitle className='text-lg tracking-tight'>
            Đặt lại mật khẩu
          </CardTitle>
          <CardDescription>
            Nhập mật khẩu mới để hoàn tất đặt lại mật khẩu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm token={token} />
        </CardContent>
        <CardFooter>
          <p className='mx-auto px-8 text-center text-sm text-balance text-muted-foreground'>
            Quay lại{' '}
            <Link
              to='/sign-in'
              className='underline underline-offset-4 hover:text-primary'
            >
              đăng nhập
            </Link>{' '}
            hoặc{' '}
            <Link
              to='/forgot-password'
              className='underline underline-offset-4 hover:text-primary'
            >
              gửi lại email
            </Link>
            .
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
