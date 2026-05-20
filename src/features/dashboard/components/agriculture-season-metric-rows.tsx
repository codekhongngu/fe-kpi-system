import type { AgricultureMetricPair } from '../utils/use-agriculture-display-values'

type AgricultureSeasonMetricRowsProps = {
  area: AgricultureMetricPair
  output: AgricultureMetricPair
  yield: AgricultureMetricPair
}

function MetricRow({
  metric,
  label,
  showYoYOnTop = false,
  withBorder = true,
}: {
  metric: AgricultureMetricPair
  label: string
  showYoYOnTop?: boolean
  withBorder?: boolean
}) {
  const borderClass = withBorder ? 'border-b border-[#E66C37]/20 pb-1.5' : ''

  if (showYoYOnTop) {
    return (
      <div className={`flex flex-wrap items-end justify-end gap-2 ${borderClass}`}>
        <div className='flex flex-col items-end leading-tight'>
          <span className='text-base font-bold tabular-nums text-green-700 sm:text-lg'>
            {metric.value}
          </span>
          <span className='text-[11px] text-green-600 sm:text-xs'>{metric.yoy}</span>
        </div>
        <div className='flex shrink-0 items-center gap-1.5'>
          <span className='h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-600' />
          <span className='text-xs font-bold text-orange-600 sm:text-sm'>{label}</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-wrap items-center justify-end gap-2 ${borderClass}`}>
      <div className='flex flex-col items-end leading-tight'>
        <span className='text-base font-bold tabular-nums text-green-700 sm:text-lg'>
          {metric.value}
        </span>
        <span className='text-[11px] text-green-600 sm:text-xs'>{metric.yoy}</span>
      </div>
      <div className='flex shrink-0 items-center gap-1.5'>
        <span className='h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-600' />
        <span className='text-xs font-bold text-orange-600 sm:text-sm'>{label}</span>
      </div>
    </div>
  )
}

export function AgricultureSeasonMetricRows({
  area,
  output,
  yield: yieldMetric,
}: AgricultureSeasonMetricRowsProps) {
  return (
    <div className='min-w-0 flex-1 space-y-1.5 text-right'>
      <MetricRow metric={area} label='Diện tích (ha)' showYoYOnTop />
      <MetricRow metric={output} label='Sản lượng (tấn)' />
      <MetricRow metric={yieldMetric} label='Năng suất (tạ/ha)' withBorder={false} />
    </div>
  )
}
