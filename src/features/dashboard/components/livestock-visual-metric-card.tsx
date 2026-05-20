import type { LucideIcon } from 'lucide-react'
import { TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { LivestockMetricPair } from '../utils/use-livestock-display-values'
import { KT_XH_METRIC_ICON_SIZE } from '../utils/kt-xh-theme'

type LivestockVisualMetricCardProps = {
  title: string
  icon: LucideIcon
  iconClassName?: string
  metric: LivestockMetricPair
  unit?: string
  unitLabel?: string
  borderClassName?: string
  labelAtBottom?: boolean
}

export function LivestockVisualMetricCard({
  title,
  icon: Icon,
  iconClassName = 'text-[#E66C37]',
  metric,
  unit,
  unitLabel,
  borderClassName = 'border-l-[#E66C37]',
  labelAtBottom = false,
}: LivestockVisualMetricCardProps) {
  const unitText = unitLabel ?? unit

  const valueBlock = (
    <div className='min-w-0 flex-1 text-right'>
      <p className='flex items-center justify-end gap-2 text-2xl font-bold text-green-700 sm:text-3xl'>
        {metric.value}
        <span className='text-green-600'>
          <TrendingUp size={16} />
        </span>
      </p>
      {unitText ? (
        <p className='text-xs text-orange-600'>{unitText}</p>
      ) : null}
      <p className='text-xs text-orange-600'>
        So với cùng kỳ (%):{' '}
        {labelAtBottom ? (
          <span className='font-bold'>{metric.yoy}</span>
        ) : (
          metric.yoy
        )}
      </p>
    </div>
  )

  return (
    <Card
      className={cn(
        'overflow-hidden border-l-4 border-[#E66C37]/50 transition-all hover:border-[#E66C37]/80',
        borderClassName
      )}
    >
      <CardContent className='p-4 sm:p-5'>
        {!labelAtBottom ? (
          <h3 className='mb-3 text-lg font-bold text-green-700 sm:text-xl'>{title}</h3>
        ) : null}
        <div className='flex flex-row items-start gap-3 sm:gap-4'>
          <div
            className='flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-[#F5C5A2]/30 sm:h-28 sm:w-28'
            aria-hidden
          >
            <Icon
              size={KT_XH_METRIC_ICON_SIZE}
              className={cn('opacity-50', iconClassName)}
              strokeWidth={1.25}
            />
          </div>
          {valueBlock}
        </div>
        {labelAtBottom ? (
          <p className='mt-4 text-xs font-bold text-orange-600 uppercase'>{title}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
