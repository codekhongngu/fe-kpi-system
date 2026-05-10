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

type AssignmentCardProps = {
  assignment: MyAssignment
}

export function AssignmentCard({ assignment }: AssignmentCardProps) {
  const { form, period, deadlineTo, submission, assignmentId } = assignment

  const status = submission?.status
  const isOverdue =
    new Date(deadlineTo) < new Date() &&
    status !== 'APPROVED' &&
    status !== 'PENDING'

  let actionText = 'Bắt đầu nhập liệu'
  let actionVariant: 'default' | 'outline' | 'secondary' | 'destructive' =
    'default'
  let actionUrl = `/my/assignments/${assignmentId}/input`

  if (status === 'DRAFT') {
    actionText = 'Tiếp tục nhập liệu'
  } else if (status === 'REJECTED') {
    actionText = 'Sửa và nộp lại'
    actionVariant = 'destructive'
  } else if (status === 'PENDING' || status === 'APPROVED') {
    actionText = 'Xem chi tiết'
    actionVariant = 'outline'
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
