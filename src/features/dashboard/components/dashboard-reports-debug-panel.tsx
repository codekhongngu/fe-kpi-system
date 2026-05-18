import { useMemo } from 'react'
import { Loader2 } from 'lucide-react'
import type { DashboardFieldReportsResponse } from '../api/types'
import { getErrorMessage } from '../utils/dashboard-query'
import { buildCellsLogPayload } from '../utils/map-cells-for-log'

type DashboardReportsDebugPanelProps = {
  pageLabel: string
  isLoading: boolean
  isError: boolean
  error: unknown
  data: DashboardFieldReportsResponse | undefined
  requestLabel?: string
}

export function DashboardReportsDebugPanel({
  pageLabel,
  isLoading,
  isError,
  error,
  data,
  requestLabel,
}: DashboardReportsDebugPanelProps) {
  const cellsPayload = useMemo(
    () => (data ? buildCellsLogPayload(data) : null),
    [data]
  )

  if (!requestLabel && !isLoading && !isError && !cellsPayload) {
    return null
  }

  return (
    <section className='rounded-lg border border-dashed border-orange-300/60 bg-orange-50/40 p-4'>
      <h3 className='mb-2 text-xs font-bold uppercase tracking-wide text-orange-700'>
        Log dữ liệu API — {pageLabel}
      </h3>
      {requestLabel ? (
        <p className='mb-2 break-all font-mono text-[10px] text-muted-foreground'>
          {requestLabel}
        </p>
      ) : null}
      {isLoading ? (
        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
          <Loader2 className='h-4 w-4 animate-spin' />
          Đang tải reports...
        </div>
      ) : null}
      {isError ? (
        <p className='text-sm text-destructive'>{getErrorMessage(error)}</p>
      ) : null}
      {cellsPayload ? (
        <pre className='max-h-64 overflow-auto rounded-md bg-white/80 p-3 text-[10px] leading-relaxed text-foreground'>
          {JSON.stringify(cellsPayload, null, 2)}
        </pre>
      ) : null}
    </section>
  )
}
