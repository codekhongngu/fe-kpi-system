import { Link } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AuthLayout } from '../auth-layout'
import { SignUpForm } from './components/sign-up-form'

export function SignUp() {
  return (
    <AuthLayout>
      <Card className='gap-4'>
        <CardHeader>
          <CardTitle className='text-lg tracking-tight'>
            Đăng ký tài khoản
          </CardTitle>
          <CardDescription>
            Nhập thông tin để tạo tài khoản. <br />
            Đã có tài khoản?{' '}
            <Link
              to='/sign-in'
              className='underline underline-offset-4 hover:text-primary'
            >
              Đăng nhập
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignUpForm />
        </CardContent>
        <CardFooter>
          <p className='px-8 text-center text-sm text-muted-foreground'>
            Khi tạo tài khoản, bạn đồng ý với{' '}
            <a
              href='/terms'
              className='underline underline-offset-4 hover:text-primary'
            >
              Điều khoản dịch vụ
            </a>{' '}
            và{' '}
            <a
              href='/privacy'
              className='underline underline-offset-4 hover:text-primary'
            >
              Chính sách bảo mật
            </a>
            .
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
