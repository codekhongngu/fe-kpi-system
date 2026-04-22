import { Outlet } from '@tanstack/react-router'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'

export function FormManagement() {
  return (
    <>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        {/* <div className='space-y-0.5'>
          <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
            Module B - Quản lý biểu mẫu
          </h1>
          <p className='text-muted-foreground'>
            Mô hình Form Builder theo thiết kế mới: tách trang Danh sách, Tạo mới, Chỉnh sửa và Chi
            tiết để tối ưu điều hướng và trải nghiệm thao tác.
          </p>
        </div>

        <Separator className='my-4 lg:my-6' /> */}

        <div className='flex w-full flex-1 overflow-y-auto p-1'>
          <Outlet />
        </div>
      </Main>
    </>
  )
}
