import { useAuthStore } from '@/stores/auth-store'
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getDisplayName(user: unknown): string {
  if (isRecord(user)) {
    const fullName =
      typeof user.fullName === 'string' ? user.fullName.trim() : ''
    if (fullName) return fullName
    const username =
      typeof user.username === 'string' ? user.username.trim() : ''
    if (username) return username
    const email = typeof user.email === 'string' ? user.email.trim() : ''
    if (email) return email
  }
  return sidebarData.user.name
}

function getDisplayEmail(user: unknown): string {
  if (isRecord(user)) {
    const email = typeof user.email === 'string' ? user.email.trim() : ''
    if (email) return email
  }
  return sidebarData.user.email
}

function getDisplayAvatar(user: unknown): string {
  if (isRecord(user)) {
    const avatarUrl =
      typeof user.avatarUrl === 'string' ? user.avatarUrl.trim() : ''
    if (avatarUrl) return avatarUrl
  }
  return sidebarData.user.avatar
}

export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const authUser = useAuthStore((state) => state.auth.user)

  const user = {
    name: getDisplayName(authUser),
    email: getDisplayEmail(authUser),
    avatar: getDisplayAvatar(authUser),
  }
  const navGroups = getSidebarNavGroupsForUser(authUser)
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
