import { Badge } from '@/components/ui/badge'
import { getSubmissionStatusInfo } from '../utils/submission-status'
import type { SubmissionStatus } from '../api/types'

type AssignmentStatusBadgeProps = {
  status?: SubmissionStatus | null
  completionPct?: number | null
}

export function AssignmentStatusBadge({
  status,
  completionPct,
}: AssignmentStatusBadgeProps) {
  const statusInfo = getSubmissionStatusInfo(status)

  if (!status || status === 'NOT_STARTED') {
    return (
      <Badge variant='secondary' className='bg-gray-100 text-gray-700'>
        Chưa mở
      </Badge>
    )
  }

  if (statusInfo.label === 'Đang nhập' && completionPct != null) {
    return (
      <Badge variant='outline' className='border-blue-600 text-blue-600'>
        Đang nhập - {completionPct}%
      </Badge>
    )
  }

  return (
    <Badge
      variant={statusInfo.variant}
      className={statusInfo.className}
    >
      {statusInfo.label}
    </Badge>
  )
}
