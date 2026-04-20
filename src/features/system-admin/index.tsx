import { Building2, CalendarClock, ShieldCheck, Users } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PeriodsTab } from './components/periods-tab'
import { RolesTab } from './components/roles-tab'
import { UnitsTab } from './components/units-tab'
import { UsersTab } from './components/users-tab'

export function SystemAdmin() {
  return (
    <>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <Card>
          <CardHeader>
            <CardTitle className='text-2xl'>Module A - Quản trị hệ thống</CardTitle>
          </CardHeader>
          <CardContent className='text-muted-foreground'>
            Quản lý User, Roles & Permissions, đơn vị và catalog kỳ báo cáo. Dữ liệu hiện tại
            chạy bằng mock API để phục vụ phát triển UI/logic nghiệp vụ.
          </CardContent>
        </Card>

        <Tabs defaultValue='users' className='space-y-4'>
          <div className='w-full overflow-x-auto'>
            <TabsList>
              <TabsTrigger value='users'>
                <Users />
                User
              </TabsTrigger>
              <TabsTrigger value='roles'>
                <ShieldCheck />
                Roles & Permissions
              </TabsTrigger>
              <TabsTrigger value='units'>
                <Building2 />
                Quản lý đơn vị
              </TabsTrigger>
              <TabsTrigger value='periods'>
                <CalendarClock />
                Kỳ báo cáo
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value='users'>
            <UsersTab />
          </TabsContent>
          <TabsContent value='roles'>
            <RolesTab />
          </TabsContent>
          <TabsContent value='units'>
            <UnitsTab />
          </TabsContent>
          <TabsContent value='periods'>
            <PeriodsTab />
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}
