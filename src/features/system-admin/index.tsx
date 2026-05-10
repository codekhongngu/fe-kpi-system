import { useMemo } from 'react'
import { useLocation } from '@tanstack/react-router'
import { Main } from '@/components/layout/main'
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
    <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
      {activeTab === 'users' && <UsersTab />}
      {activeTab === 'roles' && <RolesTab />}
      {activeTab === 'units' && <UnitsTab />}
    </Main>
  )
}
