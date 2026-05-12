import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Pencil,
  XCircle,
} from 'lucide-react'
import type { SubmissionStatus } from '../api/types'
import { normalizeSubmissionStatus } from './submission-status-rules'

export function getSubmissionStatusInfo(
  status: SubmissionStatus | string | null | undefined,
  deadlineTo?: string
) {
  const normalizedStatus = normalizeSubmissionStatus(status)
  const isOverdue = deadlineTo
    ? new Date(deadlineTo) < new Date() &&
      !['DISTRICT_APPROVED', 'COMPLETED'].includes(normalizedStatus || '')
    : false

  if (
    isOverdue &&
    !['PENDING_DEPARTMENT', 'DEPARTMENT_APPROVED'].includes(
      normalizedStatus || ''
    )
  ) {
    return {
      label: 'Quá hạn',
      variant: 'destructive' as const,
      icon: AlertCircle,
      className: 'bg-red-50 text-red-700 border-red-200 animate-pulse',
    }
  }

  switch (normalizedStatus) {
    case 'PENDING_DEPARTMENT':
      return {
        label: 'Chờ phòng duyệt',
        variant: 'outline' as const,
        icon: Clock,
        className: 'text-amber-700 border-amber-200 bg-amber-50',
      }
    case 'DEPARTMENT_APPROVED':
      return {
        label: 'Chờ xã chốt',
        variant: 'outline' as const,
        icon: CheckCircle2,
        className: 'text-blue-700 border-blue-200 bg-blue-50',
      }
    case 'DISTRICT_APPROVED':
      return {
        label: 'Xã đã chốt số',
        variant: 'default' as const,
        icon: CheckCircle2,
        className: 'bg-green-600 text-white border-transparent',
      }
    case 'REJECTED_DEPARTMENT':
      return {
        label: 'Phòng trả lại',
        variant: 'destructive' as const,
        icon: XCircle,
        className: 'bg-red-50 text-red-700 border-red-200',
      }
    case 'REJECTED_DISTRICT':
      return {
        label: 'Xã trả lại',
        variant: 'destructive' as const,
        icon: XCircle,
        className: 'bg-red-50 text-red-700 border-red-200',
      }
    case 'DRAFT':
      return {
        label: 'Đang nhập',
        variant: 'secondary' as const,
        icon: Pencil,
        className: 'bg-slate-100 text-slate-700 border-slate-200',
      }
    case 'NOT_STARTED':
    default:
      return {
        label: 'Chưa bắt đầu',
        variant: 'outline' as const,
        icon: FileText,
        className: 'bg-slate-50 text-slate-500 border-slate-200',
      }
  }
}
