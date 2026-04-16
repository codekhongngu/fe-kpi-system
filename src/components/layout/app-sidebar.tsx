import { useLayout } from '@/context/layout-provider'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
// import { AppTitle } from './app-title'
import { sidebarData } from './data/sidebar-data'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'
import { TeamSwitcher } from './team-switcher'
import { cn } from '@/lib/utils'

export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  return (
    <Sidebar
      collapsible={collapsible}
      variant={variant}
      className={cn(
        '[&_[data-slot=sidebar-container]]:p-2 [&_[data-slot=sidebar-inner]]:h-[calc(100svh-1rem)] [&_[data-slot=sidebar-inner]]:rounded-2xl [&_[data-slot=sidebar-inner]]:border [&_[data-slot=sidebar-inner]]:border-sidebar-border',
        'bg-background',
      )}
    >
      <SidebarHeader className='sticky top-0 z-10'>
        <TeamSwitcher/>
        {/* Replace <TeamSwitch /> with the following <AppTitle />
         /* if you want to use the normal app title instead of TeamSwitch dropdown */}
        {/* <AppTitle /> */}
      </SidebarHeader>
      <SidebarContent className='min-h-0 flex-1 overflow-y-auto'>
        {sidebarData.navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter className='sticky bottom-0 z-10'>
        <NavUser user={sidebarData.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
