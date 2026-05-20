import { useState, useEffect } from 'react'
import { Send, CheckCircle2, AlertTriangle, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'

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
  const [note, setNote] = useState('')
  const percent = completionPct ?? 0
  const isComplete = percent === 100

  // Reset note when dialog closes
  useEffect(() => {
    if (!open) {
      setNote('')
    }
  }, [open])

  const handleConfirm = () => {
    onConfirm(note)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[480px] rounded-3xl p-0 overflow-hidden border border-slate-100 shadow-2xl bg-white'>
        {/* Header section with modern contextual styles */}
        <div className={`p-6 px-8 border-b transition-colors duration-300 ${
          isComplete ? 'bg-emerald-50/50 border-emerald-100' : 'bg-amber-50/50 border-amber-100'
        }`}>
          <div className='flex items-start gap-4'>
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm transition-colors duration-300 ${
              isComplete ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
            }`}>
              {isComplete ? <CheckCircle2 className='size-6' /> : <AlertTriangle className='size-6' />}
            </div>
            <DialogHeader className='text-left flex-1'>
              <DialogTitle className='text-lg font-bold text-slate-800'>
                {isComplete ? 'Xác nhận nộp báo cáo' : 'Báo cáo chưa hoàn tất'}
              </DialogTitle>
              <DialogDescription className='text-slate-500 mt-1 text-xs leading-relaxed'>
                Báo cáo của bạn sẽ được chuyển đến cấp trên để phê duyệt. Dữ liệu sẽ được khóa chỉnh sửa cho đến khi có phản hồi mới.
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        {/* Content & Action Area */}
        <div className='p-6 px-8 space-y-5'>
          {/* Progress bar and details */}
          <div className='space-y-2'>
            <div className='flex justify-between items-center text-xs font-semibold'>
              <span className='text-slate-500'>Tỷ lệ hoàn thành chỉ tiêu</span>
              <span className={isComplete ? 'text-emerald-600' : 'text-amber-600'}>
                {percent}%
              </span>
            </div>
            <Progress 
              value={percent} 
              className={`h-2 transition-all ${
                isComplete ? '[&>div]:bg-emerald-500 bg-emerald-100' : '[&>div]:bg-amber-500 bg-amber-100'
              }`} 
            />
            {!isComplete && (
              <p className='text-[11px] text-amber-600 font-medium leading-normal flex items-start gap-1'>
                <AlertTriangle className='size-3.5 shrink-0 mt-0.5' />
                Bạn vẫn có thể nộp ở mức {percent}%, nhưng nên hoàn thiện đầy đủ dữ liệu trước khi gửi để tránh bị từ chối phê duyệt.
              </p>
            )}
          </div>

          {/* Submission Note Input */}
          <div className='space-y-1.5'>
            <div className='flex items-center gap-1.5 text-xs font-semibold text-slate-600'>
              <FileText className='size-3.5 text-slate-400' />
              <span>Ghi chú gửi báo cáo (không bắt buộc)</span>
            </div>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder='Nhập lý do chưa hoàn thành, giải trình số liệu hoặc lời nhắn gửi cấp trên...'
              maxLength={500}
              rows={3}
              disabled={isSubmitting}
              className='text-xs rounded-xl border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary resize-none placeholder:text-slate-400'
            />
            <div className='flex justify-end text-[10px] text-slate-400'>
              {note.length}/500 ký tự
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <DialogFooter className='bg-slate-50 border-t border-slate-100 p-5 px-8 flex flex-row items-center justify-end gap-3'>
          <Button
            variant='ghost'
            className='rounded-xl hover:bg-slate-200 text-slate-600 font-semibold text-xs h-9'
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Quay lại sửa
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className={`rounded-xl px-6 text-xs font-bold text-white shadow-md transition-all active:scale-95 h-9 ${
              isComplete 
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10 hover:shadow-emerald-600/20' 
                : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/10 hover:shadow-amber-600/20'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className='mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent' />
                Đang gửi đi...
              </>
            ) : (
              <>
                {isComplete ? 'Nộp báo cáo ngay' : 'Vẫn nộp báo cáo'}
                <Send className='ml-2 size-3.5' />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}