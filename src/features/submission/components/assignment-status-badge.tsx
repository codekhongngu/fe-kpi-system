import { Badge } from '@/components/ui/badge'
import type { SubmissionStatus } from '../api/types'

type AssignmentStatusBadgeProps = {
  status?: SubmissionStatus | null
  completionPct?: number | null
}

export function AssignmentStatusBadge({
  status,
  completionPct,
}: AssignmentStatusBadgeProps) {
  if (!status) {
    return (
      <Badge variant='secondary' className='bg-gray-100 text-gray-700'>
        Chưa mở
      </Badge>
    )
  }

  switch (status) {
    case 'DRAFT':
      return (
        <Badge variant='outline' className='border-blue-600 text-blue-600'>
          Đang nhập {completionPct != null ? `- ${completionPct}%` : ''}
        </Badge>
      )
    case 'PENDING':
      return (
        <Badge className='bg-orange-500 text-white hover:bg-orange-600'>
          Chờ duyệt
        </Badge>
      )
    case 'APPROVED':
      return (
        <Badge className='bg-green-500 text-white hover:bg-green-600'>
          Đã duyệt
        </Badge>
      )
    case 'REJECTED':
      return <Badge variant='destructive'>Bị trả lại</Badge>
    default:
      return <Badge variant='secondary'>{status}</Badge>
  }
}
