import { Send, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

type SubmissionToolbarProps = {
  completionPct: number | null
  isSaving: boolean
  isReadOnly: boolean
  onSubmitClick: () => void
}

export function SubmissionToolbar({
  completionPct,
  isSaving,
  isReadOnly,
  onSubmitClick,
}: SubmissionToolbarProps) {
  const percent = completionPct ?? 0

  return (
    <div className='fixed right-0 bottom-0 left-0 z-40 flex items-center justify-between border-t bg-background p-4 shadow-lg'>
      <div className='flex w-1/3 items-center gap-4'>
        <div className='flex-1'>
          <div className='mb-1 flex justify-between text-sm'>
            <span className='font-medium text-muted-foreground'>
              Tiến độ điền:
            </span>
            <span className='font-medium'>{percent}%</span>
          </div>
          <Progress value={percent} className='h-2' />
        </div>
      </div>

      <div className='flex items-center gap-3'>
        {!isReadOnly && (
          <div className='mr-4 flex items-center text-sm text-muted-foreground'>
            {isSaving ? (
              <span className='flex items-center gap-2'>
                <span className='h-4 w-4 animate-spin rounded-full border-b-2 border-primary'></span>
                Đang lưu...
              </span>
            ) : (
              <span className='flex items-center gap-2'>
                <Save className='h-4 w-4' />
                Đã lưu nháp
              </span>
            )}
          </div>
        )}

        {!isReadOnly && (
          <Button onClick={onSubmitClick} className='min-w-[120px]'>
            <Send className='mr-2 h-4 w-4' />
            Nộp báo cáo
          </Button>
        )}
      </div>
    </div>
  )
}
