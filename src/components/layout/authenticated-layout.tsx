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
    staleTime: 2 * 60 * 1000,
  })

  useEffect(() => {
    if (meQuery.data) {
      setUser(meQuery.data)
    }
  }, [meQuery.data, setUser])

  // Only block rendering when no cached user AND actively loading
  if (!!accessToken && !user && meQuery.isLoading) {
    return (
      <div className='flex min-h-svh items-center justify-center p-6'>
        <p className='text-sm text-muted-foreground'>
          Đang tải phiên đăng nhập...
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

              // If layout is fixed, set the height
              // to 100svh to prevent overflow
              'has-data-[layout=fixed]:h-svh',

              // If layout is fixed and sidebar is inset,
              // set the height to 100svh - spacing (total margins) to prevent overflow
              'peer-data-[variant=inset]:has-data-[layout=fixed]:h-[calc(100svh-(var(--spacing)*4))]'
            )}
          >
            <Header fixed>
              <UserContextBadge />
              <div className='ms-auto flex items-center space-x-4'>
                <ProfileDropdown />
              </div>
            </Header>
            <div className="pt-4">
            {children ?? <Outlet />}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </LayoutProvider>
  )
}
