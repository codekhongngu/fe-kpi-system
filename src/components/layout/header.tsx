import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'

type HeaderProps = React.HTMLAttributes<HTMLElement> & {
  fixed?: boolean
  ref?: React.Ref<HTMLElement>
}

export function Header({ className, fixed, children, ...props }: HeaderProps) {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      setOffset(document.body.scrollTop || document.documentElement.scrollTop)
    }

    // Add scroll listener to the body
    document.addEventListener('scroll', onScroll, { passive: true })

    // Clean up the event listener on unmount
    return () => document.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'z-40 h-16',
        fixed && 'header-fixed peer/header sticky top-0 w-[inherit]',
        offset > 10 && fixed ? 'shadow-sm' : 'shadow-none',
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'xia-shell relative flex h-[3.25rem] items-center gap-2 px-3 sm:gap-3 sm:px-4',
          offset > 10 &&
            fixed &&
            'after:absolute after:inset-0 after:-z-10 after:rounded-xl after:bg-card/95'
        )}
      >
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
