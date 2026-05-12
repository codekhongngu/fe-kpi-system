
import { Send, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type SubmitConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (note: string) => void
  isSubmitting: boolean
  completionPct: number | null
}

export function SubmitConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isSubmitting,
  completionPct,
}: SubmitConfirmDialogProps) {
  const isComplete = completionPct === 100

  const handleConfirm = () => {
    onConfirm('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[480px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl'>
        <div className='bg-primary/5 p-8 border-b border-primary/10'>
          <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
            <Send className='size-6' />
          </div>
          <DialogHeader className='text-left'>
            <DialogTitle className='text-2xl font-bold text-slate-900'>Xác nhận nộp báo cáo</DialogTitle>
            <DialogDescription className='text-slate-500 mt-2 text-sm leading-relaxed'>
              Báo cáo của bạn sẽ được chuyển đến cán bộ quản lý đơn vị để kiểm tra và phê duyệt.
              Dữ liệu sẽ được khóa cho đến khi có phản hồi mới.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className='p-0'>
          {!isComplete && (
            <div className='flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 border border-amber-100'>
              <AlertCircle className='mt-0.5 h-4 w-4 shrink-0 text-amber-600' />
              <div>
                <strong className='block mb-0.5'>Báo cáo chưa hoàn tất (mới đạt {completionPct}%)</strong>
                Bạn vẫn muốn nộp bản ghi này chứ?
              </div>
            </div>
          )}
        </div>

        <DialogFooter className='bg-slate-50 p-6 px-8 flex gap-3 sm:gap-0'>
          <Button
            variant='ghost'
            className='rounded-xl hover:bg-slate-200 text-slate-600 font-medium'
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Quay lại sửa
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className='rounded-xl px-8 font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 transition-all active:scale-95'
          >
            {isSubmitting ? (
              <>
                <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
                Đang gửi đi...
              </>
            ) : (
              <>
                Nộp báo cáo ngay
                <CheckCircle2 className='ml-2 h-4 w-4' />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog >
  )
}