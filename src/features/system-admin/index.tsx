import { useEffect, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Main } from '@/components/layout/main'
import {
  PermissionGuard,
  usePermissionGuard,
} from '@/components/permission-guard'
import { Route } from '@/routes/_authenticated/system-admin/index'
import { RolesTab } from './components/roles-tab'
import { UnitsTab } from './components/units-tab'
import { UsersTab } from './components/users-tab'

type SystemAdminTab = 'users' | 'roles' | 'units'

const TAB_ORDER: SystemAdminTab[] = ['users', 'roles', 'units']

const TAB_VIEW_PERMISSION: Record<SystemAdminTab, string> = {
  users: 'users.view',
  roles: 'roles.view',
  units: 'units.view',
}

export function SystemAdmin() {
  const navigate = useNavigate()
  const { tab: requestedTab } = Route.useSearch()
  const canViewUsers = usePermissionGuard(TAB_VIEW_PERMISSION.users)
  const canViewRoles = usePermissionGuard(TAB_VIEW_PERMISSION.roles)
  const canViewUnits = usePermissionGuard(TAB_VIEW_PERMISSION.units)

  const tabAccess = useMemo(
    () => ({
      users: canViewUsers,
      roles: canViewRoles,
      units: canViewUnits,
    }),
    [canViewUsers, canViewRoles, canViewUnits]
  )

  const allowedTabs = useMemo(
    () => TAB_ORDER.filter((tab) => tabAccess[tab]),
    [tabAccess]
  )

  const activeTab = useMemo((): SystemAdminTab | null => {
    if (requestedTab && tabAccess[requestedTab]) {
      return requestedTab
    }
    return allowedTabs[0] ?? null
  }, [allowedTabs, requestedTab, tabAccess])

  useEffect(() => {
    if (!activeTab) {
      navigate({ to: '/' })
      return
    }
    if (requestedTab === activeTab) return
    navigate({
      to: '/system-admin',
      search: { tab: activeTab },
      replace: true,
    })
  }, [activeTab, navigate, requestedTab])

  return (
    <Main fixed>
      <div className='flex w-full flex-1 overflow-y-auto'>
        <PermissionGuard
          permission={['users.view', 'roles.view', 'units.view']}
          fallback={
            <p className='text-sm text-muted-foreground'>
              Bạn không có quyền truy cập Quản trị hệ thống.
            </p>
          }
        >
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'roles' && <RolesTab />}
          {activeTab === 'units' && <UnitsTab />}
        </PermissionGuard>
      </div>
    </Main>
  )
}
