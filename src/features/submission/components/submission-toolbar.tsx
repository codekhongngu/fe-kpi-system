import { Send, Save, ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

type SubmissionToolbarProps = {
  completionPct: number | null
  isSaving: boolean
  hasUnsavedChanges: boolean
  isReadOnly: boolean
  onBackClick: () => void
  onSaveDraft: () => void
  onSubmitClick: () => void
}

export function SubmissionToolbar({
  completionPct,
  isSaving,
  hasUnsavedChanges,
  isReadOnly,
  onBackClick,
  onSaveDraft,
  onSubmitClick,
}: SubmissionToolbarProps) {
  const percent = completionPct ?? 0

  return (
    <div className='fixed right-0 bottom-0 left-0 z-40 flex items-center justify-between border-t bg-background p-4 shadow-lg'>
      {/* Left: Back button + progress */}
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='sm' onClick={onBackClick}>
          <ArrowLeft className='mr-2 h-4 w-4' />
          Quay lại
        </Button>
        <div className='hidden w-48 sm:block'>
          <div className='mb-1 flex justify-between text-xs'>
            <span className='text-muted-foreground'>Tiến độ</span>
            <span className='font-medium'>{percent}%</span>
          </div>
          <Progress value={percent} className='h-2' />
        </div>
      </div>

      {/* Right: Save + Submit actions */}
      <div className='flex items-center gap-3'>
        {!isReadOnly && (
          <>
            {/* Save Draft */}
            <Button
              variant='outline'
              size='sm'
              onClick={onSaveDraft}
              disabled={isSaving || !hasUnsavedChanges}
            >
              {isSaving ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <Save className='mr-2 h-4 w-4' />
              )}
              {isSaving ? 'Đang lưu...' : 'Lưu nháp'}
            </Button>

            {/* Submit */}
            <Button onClick={onSubmitClick} size='sm' className='min-w-[120px]'>
              <Send className='mr-2 h-4 w-4' />
              Nộp báo cáo
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
