import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Outlet } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'
import { LayoutProvider } from '@/context/layout-provider'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
// import { SkipToMain } from '@/components/skip-to-main'
import { Header } from '@/components/layout/header'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { UserContextBadge } from '@/components/layout/user-context-badge'
import { authApi } from '@/features/auth/api/auth-api'

type AuthenticatedLayoutProps = {
  children?: React.ReactNode
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const accessToken = useAuthStore((state) => state.auth.accessToken)
  const user = useAuthStore((state) => state.auth.user)
  const setUser = useAuthStore((state) => state.auth.setUser)

  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
    enabled: !!accessToken,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (meQuery.data) {
      setUser(meQuery.data)
    }
  }, [meQuery.data, setUser])

  // Block rendering when accessToken exists but user is not yet in store:
  // - isLoading: initial /me fetch in progress
  // - isError: /me failed (401 → QueryCache.onError redirects to sign-in; other errors → hold screen)
  // - data loaded but setUser effect hasn't run yet (very brief)
  if (!!accessToken && !user && !meQuery.isSuccess) {
    return (
      <div className='flex min-h-svh items-center justify-center p-6'>
        <p className='text-sm text-muted-foreground'>
          {meQuery.isError ? 'Đang chuyển hướng...' : 'Đang tải phiên đăng nhập...'}
        </p>
      </div>
    )
  }

  return (
    <LayoutProvider>
        <SidebarProvider defaultOpen className='min-h-svh w-full bg-background'>
          {/* <SkipToMain /> */}
          <AppSidebar />
          <SidebarInset
            className={cn(
              // Set content container, so we can use container queries
              '@container/content',
              'transition-[width,margin] duration-200',
              // Always fixed to viewport height — header stays put, only content area scrolls
              'h-svh'
            )}
          >
            <Header fixed className='h-14 w-auto -mx-2 -mt-2 rounded-t-lg top-0'>
              <UserContextBadge />
              <div className='ms-auto flex items-center space-x-4'>
                <ProfileDropdown />
              </div>
            </Header>
            {/* flex-col so Main fixed's `grow` works; overflow-y-auto is the real scroll container */}
            <div className='flex flex-col flex-1 overflow-y-auto pt-4'>
              {children ?? <Outlet />}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </LayoutProvider>
  )
}
