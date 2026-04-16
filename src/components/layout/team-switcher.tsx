import logoSrc from '@/assets/logo/logo.svg'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

export function TeamSwitcher() {

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size='lg'
          className='h-auto rounded-xl border border-sidebar-border/70 bg-sidebar px-2 py-2'
        >
          <div className='flex aspect-square size-9 items-center justify-center overflow-hidden rounded-lg bg-white/70'>
            <img src={logoSrc} alt='Quản lí CSDL' className='size-7 object-contain' />
          </div>
          <div className='grid flex-1 text-start text-sm leading-tight'>
            <span className='truncate font-semibold'>Quản lí CSDL</span>
            <span className='truncate text-xs text-muted-foreground'>Xã Tuy Phước</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
