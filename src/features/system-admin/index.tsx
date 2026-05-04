import { useLocation } from '@tanstack/react-router'
import { useMemo } from 'react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { RolesTab } from './components/roles-tab'
import { UnitsTab } from './components/units-tab'
import { UsersTab } from './components/users-tab'

export function SystemAdmin() {
  const href = useLocation({ select: (location) => location.href })
  const activeTab = useMemo(() => {
    const url = new URL(href, window.location.origin)
    const tab = url.searchParams.get('tab')
    if (tab === 'users' || tab === 'roles' || tab === 'units') {
      return tab
    }
    return 'users'
  }, [href])

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
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'roles' && <RolesTab />}
        {activeTab === 'units' && <UnitsTab />}
      </Main>
    </>
  )
}
