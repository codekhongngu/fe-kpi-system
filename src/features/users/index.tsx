import { getRouteApi } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { rolesApi, usersApi } from './api/users-api'
import { UsersDialogs } from './components/users-dialogs'
import { UsersPrimaryButtons } from './components/users-primary-buttons'
import { UsersProvider } from './components/users-provider'
import { UsersTable } from './components/users-table'

const route = getRouteApi('/_authenticated/users/')

export function Users() {
  const search = route.useSearch()
  const navigate = route.useNavigate()

  const page = search.page ?? 1
  const pageSize = search.pageSize ?? 10

  const rolesQuery = useQuery({
    queryKey: ['roles', { page: 1, limit: 200 }],
    queryFn: () => rolesApi.list({ page: 1, limit: 200 }),
  })

  const usersQuery = useQuery({
    queryKey: [
      'users',
      {
        page,
        pageSize,
        username: search.username ?? '',
        status: search.status ?? [],
        role: search.role ?? [],
      },
    ],
    queryFn: () => {
      const selectedStatuses = search.status ?? []
      const normalizedStatuses = selectedStatuses.filter(
        (status) => status === 'active' || status === 'inactive'
      )

      const isActive =
        normalizedStatuses.length === 1
          ? normalizedStatuses[0] === 'active'
          : undefined

      const roleId = (search.role ?? [])[0]
      const q = (search.username ?? '').trim()

      return usersApi.list({
        page,
        limit: pageSize,
        q: q ? q : undefined,
        isActive,
        roleId: roleId || undefined,
      })
    },
  })

  const rolesById = useMemo(() => {
    const entries = (rolesQuery.data?.data ?? []).map((role) => [
      role.id,
      role.name,
    ] as const)
    return Object.fromEntries(entries)
  }, [rolesQuery.data])

  const total = usersQuery.data?.meta.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  return (
    <UsersProvider>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Danh sách người dùng</h2>
            <p className='text-muted-foreground'>
              Quản lý người dùng và vai trò tại đây.
            </p>
          </div>
          <UsersPrimaryButtons />
        </div>
        <UsersTable
          data={usersQuery.data?.items ?? []}
          search={search}
          navigate={navigate}
          pageCount={pageCount}
          roles={rolesQuery.data?.data ?? []}
          rolesById={rolesById}
        />
      </Main>

      <UsersDialogs />
    </UsersProvider>
  )
}
