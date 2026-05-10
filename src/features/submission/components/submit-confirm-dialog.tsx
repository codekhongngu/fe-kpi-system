import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
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
  const isComplete = completionPct === 100

  const handleConfirm = () => {
    onConfirm(note)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Xác nhận nộp báo cáo</DialogTitle>
          <DialogDescription>
            Sau khi nộp, báo cáo sẽ được chuyển đến cán bộ quản lý để phê duyệt.
            Bạn sẽ không thể chỉnh sửa trừ khi báo cáo bị trả lại.
          </DialogDescription>
        </DialogHeader>

        <div className='py-4'>
          {!isComplete && (
            <div className='mb-4 flex items-start gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-800'>
              <AlertCircle className='mt-0.5 h-4 w-4 shrink-0' />
              <div>
                <strong>Báo cáo chưa hoàn thành 100%.</strong> Bạn vẫn muốn nộp?
              </div>
            </div>
          )}

          <div className='space-y-2'>
            <label htmlFor='note' className='text-sm font-medium'>
              Ghi chú thêm (tùy chọn)
            </label>
            <Textarea
              id='note'
              placeholder='Nhập ghi chú cho người duyệt...'
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Đang nộp...' : 'Xác nhận nộp'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
