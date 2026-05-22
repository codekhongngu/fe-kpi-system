import { useAuthStore } from '@/stores/auth-store'

export function UserContextBadge() {
  const user = useAuthStore((state) => state.auth.user)

  const orgName = user?.orgName ?? null
  const roleName = user?.primaryRole?.name ?? null

  if (!orgName && !roleName) return null

  return (
    <div className='hidden sm:flex flex-col min-w-0 max-w-[220px] gap-px'>
      {orgName && (
        <span className='truncate text-sm font-semibold leading-none text-foreground'>
          {orgName}
        </span>
      )}
      {roleName && (
        <span className='truncate text-xs leading-none text-muted-foreground'>
          {roleName}
        </span>
      )}
    </div>
  )
}

