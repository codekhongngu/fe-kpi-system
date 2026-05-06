import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'

type ReportConfirmDialogProps = {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  destructive?: boolean
  requireReason?: boolean
  isSubmitting?: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (reason: string) => void
}

export function ReportConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  destructive,
  requireReason,
  isSubmitting,
  onOpenChange,
  onConfirm,
}: ReportConfirmDialogProps) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const confirm = () => {
    if (requireReason && !reason.trim()) {
      setError('Cần nhập lý do xử lý.')
      return
    }
    onConfirm(reason)
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        setReason('')
        setError('')
        onOpenChange(nextOpen)
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {requireReason && (
          <div className='space-y-2'>
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder='Nhập lý do'
            />
            {error && <div className='text-sm text-destructive'>{error}</div>}
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Hủy</AlertDialogCancel>
          <AlertDialogAction
            disabled={isSubmitting}
            onClick={(event) => {
              event.preventDefault()
              confirm()
            }}
            className={destructive ? 'bg-destructive text-white hover:bg-destructive/90' : ''}
          >
            {isSubmitting ? 'Đang xử lý...' : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
