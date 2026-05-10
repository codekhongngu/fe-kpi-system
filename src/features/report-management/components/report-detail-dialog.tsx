import { Clock3, FileText, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { ReportDetail } from '../api/types'
import { ReportPriorityBadge, ReportStatusBadge } from './report-status'

type ReportDetailDialogProps = {
  open: boolean
  report?: ReportDetail
  isLoading: boolean
  onOpenChange: (open: boolean) => void
  onEdit: () => void
  onApprove: () => void
  onReject: () => void
}

function formatDateTime(value: string | null) {
  if (!value) return '--'
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function ReportDetailDialog({
  open,
  report,
  isLoading,
  onOpenChange,
  onEdit,
  onApprove,
  onReject,
}: ReportDetailDialogProps) {
  const canReview =
    report && ['SUBMITTED', 'UNDER_REVIEW'].includes(report.status)
  const canEdit =
    report && !['APPROVED', 'COMPLETED', 'CANCELLED'].includes(report.status)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[92vh] overflow-y-auto sm:max-w-5xl'>
        <DialogHeader>
          <DialogTitle>{report?.name ?? 'Chi tiết báo cáo'}</DialogTitle>
          <DialogDescription>
            Xem snapshot report instance, dữ liệu ô và lịch sử thao tác.
          </DialogDescription>
        </DialogHeader>

        {isLoading || !report ? (
          <div className='py-12 text-center text-sm text-muted-foreground'>
            Đang tải chi tiết báo cáo...
          </div>
        ) : (
          <div className='space-y-5'>
            <div className='grid gap-3 rounded-xl border bg-muted/30 p-4 md:grid-cols-4'>
              <div>
                <div className='text-xs text-muted-foreground'>Mã báo cáo</div>
                <div className='font-medium'>{report.code}</div>
              </div>
              <div>
                <div className='text-xs text-muted-foreground'>Template</div>
                <div className='font-medium'>{report.templateName}</div>
              </div>
              <div>
                <div className='text-xs text-muted-foreground'>Đơn vị</div>
                <div className='font-medium'>{report.unitName}</div>
              </div>
              <div>
                <div className='text-xs text-muted-foreground'>Kỳ báo cáo</div>
                <div className='font-medium'>{report.period}</div>
              </div>
              <div>
                <div className='text-xs text-muted-foreground'>Hạn nộp</div>
                <div className='font-medium'>{report.deadline}</div>
              </div>
              <div>
                <div className='text-xs text-muted-foreground'>Trạng thái</div>
                <div className='mt-1'>
                  <ReportStatusBadge status={report.status} />
                </div>
              </div>
              <div>
                <div className='text-xs text-muted-foreground'>Ưu tiên</div>
                <div className='mt-1'>
                  <ReportPriorityBadge priority={report.priority} />
                </div>
              </div>
              <div>
                <div className='text-xs text-muted-foreground'>Tiến độ</div>
                <div className='font-medium'>{report.completionPercent}%</div>
              </div>
            </div>

            <div className='grid gap-4 lg:grid-cols-[1.3fr_.7fr]'>
              <div className='rounded-xl border'>
                <div className='flex items-center gap-2 border-b p-4 font-medium'>
                  <FileText className='size-4 text-teal-700' />
                  Dữ liệu báo cáo
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Chỉ tiêu</TableHead>
                      <TableHead>Thuộc tính</TableHead>
                      <TableHead>Kiểu</TableHead>
                      <TableHead>Giá trị</TableHead>
                      <TableHead>Bắt buộc</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.cells.map((cell) => (
                      <TableRow key={cell.id}>
                        <TableCell>
                          <div className='font-medium'>
                            {cell.indicatorName}
                          </div>
                          <div className='text-xs text-muted-foreground'>
                            {cell.indicatorCode}
                          </div>
                        </TableCell>
                        <TableCell>{cell.attributeName}</TableCell>
                        <TableCell>{cell.dataType}</TableCell>
                        <TableCell>{cell.value ?? '--'}</TableCell>
                        <TableCell>{cell.required ? 'Có' : 'Không'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className='rounded-xl border'>
                <div className='flex items-center gap-2 border-b p-4 font-medium'>
                  <History className='size-4 text-teal-700' />
                  Lịch sử xử lý
                </div>
                <div className='space-y-4 p-4'>
                  {report.history.map((item) => (
                    <div key={item.id} className='relative ps-6'>
                      <span className='absolute start-0 top-1.5 size-2 rounded-full bg-teal-600' />
                      <div className='font-medium'>{item.action}</div>
                      <div className='text-sm text-muted-foreground'>
                        {item.note}
                      </div>
                      <div className='mt-1 flex items-center gap-1 text-xs text-muted-foreground'>
                        <Clock3 className='size-3' />
                        {formatDateTime(item.createdAt)} bởi {item.actor}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {report.rejectionReason && (
              <>
                <Separator />
                <div className='rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700'>
                  Lý do trả lại: {report.rejectionReason}
                </div>
              </>
            )}
          </div>
        )}

        <DialogFooter className='gap-2 sm:justify-between'>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
          >
            Đóng
          </Button>
          <div className='flex gap-2'>
            {canEdit && (
              <Button type='button' variant='outline' onClick={onEdit}>
                Chỉnh sửa
              </Button>
            )}
            {canReview && (
              <>
                <Button type='button' variant='outline' onClick={onReject}>
                  Trả lại
                </Button>
                <Button type='button' onClick={onApprove}>
                  Phê duyệt
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
