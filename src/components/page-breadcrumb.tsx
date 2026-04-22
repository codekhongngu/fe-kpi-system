import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type PageBreadcrumbProps = {
  title: string
  subtitle?: string
  children?: ReactNode
  className?: string
}

export function PageBreadcrumb({
  title,
  subtitle,
  children,
  className,
}: PageBreadcrumbProps) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-3', className)}>
      <div className='space-y-1'>
        <h2 className='text-2xl font-bold tracking-tight'>{title}</h2>
        {subtitle && <p className='text-muted-foreground'>{subtitle}</p>}
      </div>
      {children ? <div className='flex flex-wrap items-center gap-2'>{children}</div> : null}
    </div>
  )
}
