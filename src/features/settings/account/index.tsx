import { Separator } from '@/components/ui/separator'
import { ContentSection } from '../components/content-section'
import { AccountForm } from './account-form'
import { ChangePasswordForm } from './change-password-form'

export function SettingsAccount() {
  return (
    <ContentSection
      title='Tài khoản'
      desc='Cập nhật thông tin tài khoản và thiết lập bảo mật.'
    >
      <>
        <AccountForm />
        <Separator className='my-8' />
        <div className='space-y-1'>
          <h4 className='text-base font-medium'>Bảo mật</h4>
          <p className='text-sm text-muted-foreground'>
            Đổi mật khẩu đăng nhập.
          </p>
        </div>
        <div className='mt-4'>
          <ChangePasswordForm />
        </div>
      </>
    </ContentSection>
  )
}
