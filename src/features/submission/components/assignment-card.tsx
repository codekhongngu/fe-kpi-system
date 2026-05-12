import { Link } from '@tanstack/react-router'
import { FileText, Calendar, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { MyAssignment } from '../api/types'
import { AssignmentStatusBadge } from './assignment-status-badge'
import {
  getSubmissionStatusInfo,
} from '../utils/submission-status'
import {
  isSubmissionEditableStatus,
  isSubmissionReadOnlyStatus,
  isSubmissionRejectedStatus,
} from '../utils/submission-status-rules'

type AssignmentCardProps = {
  assignment: MyAssignment
}

export function AssignmentCard({ assignment }: AssignmentCardProps) {
  const { form, period, deadlineTo, submission, assignmentId } = assignment
  const status = submission?.status
  const statusInfo = getSubmissionStatusInfo(status)
  const isOverdue =
    new Date(deadlineTo) < new Date() && !isSubmissionReadOnlyStatus(status)

  const actionUrl = `/my/assignments/${assignmentId}/input`
  let actionText = 'Xem chi tiết'
  let actionVariant: 'default' | 'outline' | 'secondary' | 'destructive' =
    'outline'

  if (isSubmissionEditableStatus(status) || status === 'NOT_STARTED') {
    actionText = 'Nhập báo cáo'
    actionVariant = 'default'
  } else if (isSubmissionRejectedStatus(status)) {
    actionText = 'Sửa và nộp lại'
    actionVariant = 'destructive'
  }

  return (
    <Card className='flex flex-col'>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between gap-4'>
          <CardTitle className='flex items-center gap-2 text-lg font-semibold'>
            <FileText className='h-5 w-5 text-primary' />
            {form.name}
          </CardTitle>
          <AssignmentStatusBadge
            status={status}
            completionPct={submission?.completionPct}
          />
        </div>
        <div className='mt-1 text-sm text-muted-foreground'>
          {form.code} — {period.name}
        </div>
      </CardHeader>
      <CardContent className='flex-1 pb-3'>
        <div
          className={`flex items-center gap-2 text-sm ${isOverdue ? 'font-medium text-destructive' : 'text-muted-foreground'}`}
        >
          <Calendar className='h-4 w-4' />
          Hạn nộp: {new Date(deadlineTo).toLocaleDateString('vi-VN')}
          {isOverdue && ' (Quá hạn)'}
        </div>
        {!isSubmissionEditableStatus(status) && statusInfo.label && (
          <div className='mt-2 text-xs text-muted-foreground'>
            Trạng thái hiện tại: {statusInfo.label}
          </div>
        )}
      </CardContent>
      <CardFooter className='pt-0'>
        <Button asChild variant={actionVariant} className='w-full'>
          <Link to={actionUrl}>
            {actionText}
            <ArrowRight className='ml-2 h-4 w-4' />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
