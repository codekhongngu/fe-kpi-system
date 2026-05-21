import { useAuthStore, type AuthUser } from '@/stores/auth-store'
import { cn } from '@/lib/utils'
import { useLayout } from '@/context/layout-provider'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
// import { AppTitle } from './app-title'
import { getSidebarNavGroupsForUser, sidebarData } from './data/sidebar-data'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'
import { TeamSwitcher } from './team-switcher'

function getDisplayName(user: AuthUser | null): string {
  if (user) {
    if (user.fullName?.trim()) return user.fullName.trim()
    if (user.username?.trim()) return user.username.trim()
    if (user.email?.trim()) return user.email.trim()
  }
  return sidebarData.user.name
}

function getDisplayEmail(user: AuthUser | null): string {
  if (user) {
    if (user.email?.trim()) return user.email.trim()
  }
  return sidebarData.user.email
}

function getDisplayAvatar(user: AuthUser | null): string {
  if (user) {
    if (user.avatarUrl?.trim()) return user.avatarUrl.trim()
  }
  return sidebarData.user.avatar
}

export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const authUser = useAuthStore((state) => state.auth.user) as AuthUser | null

  const user = {
    name: getDisplayName(authUser),
    email: getDisplayEmail(authUser),
    avatar: getDisplayAvatar(authUser),
  }
  const permissions = authUser?.permissions ?? []
  const navGroups = getSidebarNavGroupsForUser(permissions)
  return (
    <Sidebar
      collapsible={collapsible}
      variant={variant}
      className={cn(
        '[&_[data-slot=sidebar-container]]:p-2 [&_[data-slot=sidebar-inner]]:h-[calc(100svh-1rem)] [&_[data-slot=sidebar-inner]]:rounded-2xl [&_[data-slot=sidebar-inner]]:border [&_[data-slot=sidebar-inner]]:border-sidebar-border',
        'bg-background'
      )}
    >
      <SidebarHeader className='sticky top-0 z-10'>
        <TeamSwitcher />
        {/* Replace <TeamSwitch /> with the following <AppTitle />
         /* if you want to use the normal app title instead of TeamSwitch dropdown */}
        {/* <AppTitle /> */}
      </SidebarHeader>
      <SidebarContent className='min-h-0 flex-1 overflow-y-auto'>
        {navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter className='sticky bottom-0 z-10'>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
