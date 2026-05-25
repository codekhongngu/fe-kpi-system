import type { ReactNode } from 'react'
import { Main } from '@/components/layout/main'
import { cn } from '@/lib/utils'
import dashboardBackground from '../backgrounds/giaoan.lik-trong-dong.png'

type KtXhDashboardShellProps = {
  children: ReactNode
  contentClassName?: string
}

export function KtXhDashboardShell({
  children,
  contentClassName,
}: KtXhDashboardShellProps) {
  return (
    <Main fixed className='relative overflow-hidden p-0'>
      <div
        className='pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat'
        style={{ backgroundImage: `url(${dashboardBackground})` }}
        aria-hidden
      />
      <div
        className='pointer-events-none absolute inset-0 bg-background/[0.85]'
        aria-hidden
      />

      <div className='relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pt-0 pb-[10px] sm:px-8 sm:pt-0 sm:pb-[10px]'>
        <div className={cn('mx-auto w-full max-w-7xl', contentClassName)}>
          {children}
        </div>
      </div>
    </Main>
  )
}
