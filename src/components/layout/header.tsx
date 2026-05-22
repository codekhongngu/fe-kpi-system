import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'

type HeaderProps = React.HTMLAttributes<HTMLElement> & {
  fixed?: boolean
  ref?: React.Ref<HTMLElement>
}

export function Header({ className, fixed, children, ...props }: HeaderProps) {
  return (
    <header
      className={cn(
        'z-40 h-14 w-full border-b border-border bg-card',
        fixed && 'sticky top-2',
        className
      )}
      {...props}
    >
      <div className='flex h-full items-center gap-2 px-3 sm:gap-3 sm:px-4'>
        <SidebarTrigger
          variant='outline'
          className='size-8 rounded-lg border-border bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
        />
        <Separator orientation='vertical' className='h-5 bg-border/70' />
        {children}
      </div>
    </header>
  )
}
