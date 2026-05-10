import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  type ReportPriority,
  type ReportStatus,
  reportPriorityOptions,
  reportStatusOptions,
} from '../api/types'

const statusClassName: Record<ReportStatus, string> = {
  DRAFT: 'border-slate-200 bg-slate-50 text-slate-700',
  ASSIGNED: 'border-cyan-200 bg-cyan-50 text-cyan-700',
  NOT_STARTED: 'border-slate-200 bg-slate-50 text-slate-700',
  DRAFTING: 'border-blue-200 bg-blue-50 text-blue-700',
  SUBMITTED: 'border-amber-200 bg-amber-50 text-amber-700',
  UNDER_REVIEW: 'border-amber-200 bg-amber-50 text-amber-700',
  APPROVED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  REJECTED: 'border-rose-200 bg-rose-50 text-rose-700',
  OVERDUE: 'border-red-200 bg-red-50 text-red-700',
  COMPLETED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  CANCELLED: 'border-zinc-200 bg-zinc-50 text-zinc-600',
}

const priorityClassName: Record<ReportPriority, string> = {
  low: 'border-slate-200 bg-slate-50 text-slate-600',
  normal: 'border-sky-200 bg-sky-50 text-sky-700',
  high: 'border-orange-200 bg-orange-50 text-orange-700',
}

export function getStatusLabel(status: ReportStatus) {
  return (
    reportStatusOptions.find((item) => item.value === status)?.label ?? status
  )
}

export function getPriorityLabel(priority: ReportPriority) {
  return (
    reportPriorityOptions.find((item) => item.value === priority)?.label ??
    priority
  )
}

export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  return (
    <Badge
      variant='outline'
      className={cn('font-medium', statusClassName[status])}
    >
      {getStatusLabel(status)}
    </Badge>
  )
}

export function ReportPriorityBadge({
  priority,
}: {
  priority: ReportPriority
}) {
  return (
    <Badge
      variant='outline'
      className={cn('font-medium', priorityClassName[priority])}
    >
      {getPriorityLabel(priority)}
    </Badge>
  )
}
