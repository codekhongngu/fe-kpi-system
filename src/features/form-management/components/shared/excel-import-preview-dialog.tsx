import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB'] as const
  const i = Math.min(
    sizes.length - 1,
    Math.floor(Math.log(bytes) / Math.log(k))
  )
  const value = bytes / Math.pow(k, i)
  const decimals = i === 0 ? 0 : value < 10 ? 2 : 1
  return `${value.toFixed(decimals)} ${sizes[i]}`
}

export type ExcelImportPreviewDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: File | null
  title: string
  description?: string
  isConfirming: boolean
  onConfirm: () => void
}

export function ExcelImportPreviewDialog({
  open,
  onOpenChange,
  file,
  title,
  description = 'Kiểm tra thông tin tệp trước khi gửi lên máy chủ.',
  isConfirming,
  onConfirm,
}: ExcelImportPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className='sm:max-w-md'
        showCloseButton={!isConfirming}
        onPointerDownOutside={(e) => {
          if (isConfirming) e.preventDefault()
        }}
        onEscapeKeyDown={(e) => {
          if (isConfirming) e.preventDefault()
        }}
      >
        <DialogHeader className='text-start'>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {file ? (
          <div className='grid gap-3 rounded-md border bg-muted/30 p-3 text-sm'>
            <div className='grid gap-1'>
              <span className='text-muted-foreground'>Tên tệp</span>
              <span className='break-all font-medium'>{file.name}</span>
            </div>
            <div className='grid gap-1'>
              <span className='text-muted-foreground'>Dung lượng</span>
              <p className='font-medium'>{formatFileSize(file.size)}</p>
            </div>
            <div className='grid gap-1'>
              <span className='text-muted-foreground'>Cập nhật lần cuối</span>
              <span className='font-medium'>
                {new Date(file.lastModified).toLocaleString('vi-VN')}
              </span>
            </div>
          </div>
        ) : null}

        <DialogFooter className='gap-2 sm:gap-0'>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isConfirming}
          >
            Hủy
          </Button>
          <Button
            type='button'
            onClick={onConfirm}
            disabled={!file || isConfirming}
          >
            Xác nhận
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
