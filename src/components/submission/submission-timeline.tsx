import { format } from 'date-fns'
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  Send,
  MessageSquare,
  Eye,
  History,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getSubmissionStatusInfo } from '@/features/submission/utils/submission-status'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export type FlowEvent = 'SUBMIT' | 'FORWARD' | 'REJECT' | 'APPROVE'

export interface SubmissionFlowLog {
  id: string
  submission_id: string
  event: FlowEvent
  from_status: string | null
  to_status: string
  user_id: string
  user_name: string
  note?: string | null
  created_at: string
  snapshot?: Record<string, unknown> | null
}

interface SubmissionTimelineProps {
  history: SubmissionFlowLog[]
  onViewSnapshot?: (log: SubmissionFlowLog) => void
  onCompare?: (log: SubmissionFlowLog, prevLog?: SubmissionFlowLog) => void
}

const eventConfig = {
  SUBMIT: {
    icon: Send,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    label: 'Đã nộp',
  },
  FORWARD: {
    icon: ArrowRight,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    label: 'Đã chuyển cấp xã',
  },
  REJECT: {
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    label: 'Đã trả lại',
  },
  APPROVE: {
    icon: CheckCircle2,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    label: 'Đã duyệt chốt số',
  },
}

export function SubmissionTimeline({
  history,
  onViewSnapshot,
  onCompare,
}: SubmissionTimelineProps) {
  const formatStatusLabel = (status: string | null | undefined) => {
    if (!status) return 'Khởi tạo'
    return getSubmissionStatusInfo(status).label
  }

  if (!history || history.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-12 text-muted-foreground'>
        <History className='mb-2 size-8 opacity-20' />
        <p className='text-sm italic'>Chưa có lịch sử luồng dữ liệu</p>
      </div>
    )
  }

  return (
    <div className='relative space-y-8 before:absolute before:top-2 before:bottom-2 before:left-[19px] before:w-0.5 before:bg-gradient-to-b before:from-muted/50 before:via-muted before:to-muted/50'>
      {history.map((log, idx) => {
        const config = eventConfig[log.event] || eventConfig.SUBMIT
        const Icon = config.icon
        return (
          <div key={log.id} className='relative pl-12 transition-all duration-300 hover:translate-x-1'>
            {/* Timeline Node */}
            <div
              className={cn(
                'absolute left-0 top-0 flex size-10 items-center justify-center rounded-full border-4 border-background shadow-sm ring-1',
                config.bgColor,
                config.color,
                config.borderColor.replace('border-', 'ring-')
              )}
            >
              <Icon className='size-5' />
            </div>

            {/* Content Card */}
            <div className='group rounded-2xl border bg-background p-4 shadow-sm transition-all hover:shadow-md'>
              <div className='mb-2 flex items-start justify-between'>
                <div>
                  <div className='flex items-center gap-2'>
                    <span className='font-bold text-foreground'>{log.user_name}</span>
                    <Badge variant='outline' className={cn('h-5 px-1.5 text-[10px] uppercase font-bold', config.color, config.bgColor, config.borderColor)}>
                      {config.label}
                    </Badge>
                  </div>
                  <div className='mt-0.5 text-[10px] text-muted-foreground flex items-center gap-1.5'>
                    <span>{format(new Date(log.created_at), 'HH:mm')}</span>
                    <span className='size-1 rounded-full bg-muted-foreground/30' />
                    <span>{format(new Date(log.created_at), 'dd/MM/yyyy')}</span>
                  </div>
                </div>

                <div className='flex gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='size-8 rounded-full'
                          onClick={() => onViewSnapshot?.(log)}
                        >
                          <Eye className='size-4' />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Xem dữ liệu tại mốc này</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {idx < history.length - 1 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='size-8 rounded-full'
                            onClick={() => onCompare?.(log, history[idx + 1])}
                          >
                            <History className='size-4' />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>So sánh với bản trước</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>

              {log.note && (
                <div className='mt-3 flex gap-2 rounded-xl bg-muted/30 p-3 text-xs text-foreground/80'>
                  <MessageSquare className='mt-0.5 size-3.5 shrink-0 text-muted-foreground' />
                  <div className='flex-1 leading-relaxed italic'>
                    "{log.note}"
                  </div>
                </div>
              )}

              <div className='mt-3 flex items-center gap-3 text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider'>
                <span>{formatStatusLabel(log.from_status)}</span>
                <ArrowRight className='size-3' />
                <span className='text-foreground'>{formatStatusLabel(log.to_status)}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
