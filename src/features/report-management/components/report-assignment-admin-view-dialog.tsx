import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Building2,
  FileText,
  Hash,
  Info,
  Maximize2,
  Minimize2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { SubmissionGrid } from '@/features/submission/components/submission-grid'
import { formManagementApi } from '@/features/form-management/api/template-management-api'
import type { FormTemplate } from '@/features/form-management/api/types'
import type { ReportAssignment } from '../api/types'
import { reportCampaignApi } from '../api/report-management-api'
import type { SubmissionDetail } from '@/features/submission/api/types'
import { getSubmissionStatusInfo } from '@/features/submission/utils/submission-status'
import { reportQueryKeys } from '../utils/report-query'

type ReportAssignmentAdminViewDialogProps = {
  open: boolean
  fullscreen: boolean
  campaignId: string
  assignment: ReportAssignment | null
  templateId?: string | null
  onOpenChange: (open: boolean) => void
  onFullscreenChange: (fullscreen: boolean) => void
}

function formatDateTime(value: string | null) {
  if (!value) return '--'
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatPercent(value: number | null) {
  if (value === null || value === undefined) return '--'
  return `${value.toFixed(2)}%`
}

function statusInfo(status: string | null | undefined) {
  return getSubmissionStatusInfo(status ?? null)
}

export function ReportAssignmentAdminViewDialog({
  open,
  fullscreen,
  campaignId,
  assignment,
  templateId,
  onOpenChange,
  onFullscreenChange,
}: ReportAssignmentAdminViewDialogProps) {
  const submissionId = assignment?.submissionId ?? null

  const detailQuery = useQuery({
    queryKey: reportQueryKeys.adminAssignmentView(campaignId, assignment?.id ?? null),
    queryFn: () => {
      if (!assignment?.id) {
        throw new Error('ASSIGNMENT_NOT_SELECTED')
      }
      return reportCampaignApi.getAssignmentAdminView(campaignId, assignment.id)
    },
    enabled: open && Boolean(assignment?.id),
    staleTime: 60 * 1000,
  })

  const templateQuery = useQuery({
    queryKey: reportQueryKeys.template(templateId ?? null),
    queryFn: () => formManagementApi.getTemplate(templateId as string),
    enabled: open && Boolean(templateId),
    staleTime: 5 * 60 * 1000,
  })

  const detail = detailQuery.data ?? null
  const template = templateQuery.data ?? null
  const status = statusInfo(detail?.status ?? assignment?.status ?? null)
  const StatusIcon = status.icon

  useEffect(() => {
    if (!open || !fullscreen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onFullscreenChange(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [fullscreen, onFullscreenChange, open])

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onFullscreenChange(false)
    }
    onOpenChange(nextOpen)
  }

  const dialogContentClassName = fullscreen
    ? 'fixed inset-0 z-50 h-screen w-screen max-w-none translate-x-0 translate-y-0 rounded-none border-0 p-0'
    : 'max-h-[92vh] overflow-y-auto sm:max-w-6xl'

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={dialogContentClassName}>
        <div className='flex h-full min-h-0 flex-col bg-background'>
          <DialogHeader className='flex flex-row items-start justify-between gap-4 border-b px-6 py-4'>
            <div className='space-y-1'>
              <DialogTitle>Chi tiết dữ liệu cho quản trị</DialogTitle>
              <DialogDescription>
                Chế độ xem read-only dành cho admin. Không điều hướng sang luồng nhập liệu của phòng ban.
              </DialogDescription>
            </div>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className='shrink-0 rounded-xl'
              onClick={() => onFullscreenChange(!fullscreen)}
              title={fullscreen ? 'Thu nhỏ' : 'Mở rộng toàn màn hình'}
            >
              {fullscreen ? (
                <Minimize2 className='size-4' />
              ) : (
                <Maximize2 className='size-4' />
              )}
            </Button>
          </DialogHeader>

        {!assignment ? (
          <div className='py-10 text-center text-sm text-muted-foreground'>
            Chưa chọn đơn vị để xem dữ liệu.
          </div>
        ) : detailQuery.isLoading || templateQuery.isLoading || !detail || !template ? (
          <div className='py-10 text-center text-sm text-muted-foreground'>
            Đang tải dữ liệu quản trị...
          </div>
        ) : (
          <div className='space-y-5'>
            <div className='grid gap-3 md:grid-cols-4'>
              <Card className='rounded-2xl border-none bg-muted/30'>
                <CardContent className='p-4'>
                  <div className='flex items-center gap-2 text-[10px] font-bold uppercase text-muted-foreground'>
                    <Building2 className='size-3.5' />
                    Đơn vị
                  </div>
                  <div className='mt-2 text-sm font-semibold'>{assignment.orgName}</div>
                </CardContent>
              </Card>
              <Card className='rounded-2xl border-none bg-muted/30'>
                <CardContent className='p-4'>
                  <div className='flex items-center gap-2 text-[10px] font-bold uppercase text-muted-foreground'>
                    <Hash className='size-3.5' />
                    Trạng thái
                  </div>
                  <div className='mt-2 flex items-center gap-2'>
                    <StatusIcon className={status.className} />
                    <span className='text-sm font-semibold'>{status.label}</span>
                  </div>
                </CardContent>
              </Card>
              <Card className='rounded-2xl border-none bg-muted/30'>
                <CardContent className='p-4'>
                  <div className='text-[10px] font-bold uppercase text-muted-foreground'>
                    Tiến độ
                  </div>
                  <div className='mt-2 text-sm font-semibold'>
                    {formatPercent(detail.completionPct)}
                  </div>
                </CardContent>
              </Card>
              <Card className='rounded-2xl border-none bg-muted/30'>
                <CardContent className='p-4'>
                  <div className='text-[10px] font-bold uppercase text-muted-foreground'>
                    Bản nộp
                  </div>
                  <div className='mt-2 text-sm font-semibold'>
                    {submissionId ?? '--'}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className='grid gap-4 lg:grid-cols-[1.35fr_.65fr]'>
              <div className='space-y-4'>
                <div className='rounded-2xl border bg-muted/5 p-4'>
                  <div className='flex items-center gap-2 text-sm font-bold'>
                    <FileText className='size-4 text-primary' />
                    Dữ liệu báo cáo
                  </div>
                  <p className='mt-1 text-xs text-muted-foreground'>
                    Dữ liệu này được lấy theo luồng admin và chỉ dùng để xem.
                  </p>
                </div>
                <div className='overflow-hidden rounded-2xl border bg-background p-3'>
                  <SubmissionGrid
                    template={template as FormTemplate}
                    detail={detail as SubmissionDetail}
                    isReadOnly
                    onCellChange={() => undefined}
                  />
                </div>
              </div>

              <div className='space-y-4'>
                <div className='rounded-2xl border bg-muted/5 p-4'>
                  <div className='flex items-center gap-2 text-sm font-bold'>
                    <Info className='size-4 text-primary' />
                    Thông tin xử lý
                  </div>
                  <div className='mt-4 space-y-3 text-sm'>
                    <div className='flex items-center justify-between gap-3'>
                      <span className='text-muted-foreground'>Mã bản nộp</span>
                      <span className='font-medium'>{detail.code}</span>
                    </div>
                    <div className='flex items-center justify-between gap-3'>
                      <span className='text-muted-foreground'>Ngày nộp</span>
                      <span className='font-medium'>{formatDateTime(detail.submittedAt)}</span>
                    </div>
                    <div className='flex items-center justify-between gap-3'>
                      <span className='text-muted-foreground'>Đơn vị</span>
                      <span className='font-medium'>{assignment.orgName}</span>
                    </div>
                    <div className='flex items-center justify-between gap-3'>
                      <span className='text-muted-foreground'>Lần cập nhật</span>
                      <span className='font-medium'>{detail.version}</span>
                    </div>
                  </div>
                </div>

                {detail.note && (
                  <div className='rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900'>
                    <div className='text-xs font-bold uppercase tracking-widest text-amber-700'>
                      Ghi chú
                    </div>
                    <div className='mt-2 whitespace-pre-wrap'>{detail.note}</div>
                  </div>
                )}

                {detail.rejectReason && (
                  <div className='rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800'>
                    <div className='text-xs font-bold uppercase tracking-widest text-rose-700'>
                      Lý do trả lại
                    </div>
                    <div className='mt-2 whitespace-pre-wrap'>{detail.rejectReason}</div>
                  </div>
                )}

                <Separator />
                <div className='rounded-2xl border bg-muted/5 p-4 text-xs text-muted-foreground'>
                  Nút tổng hợp báo cáo không nằm trong màn chi tiết này. Tác vụ tổng hợp được điều khiển ở cấp campaign.
                </div>
              </div>
            </div>
          </div>
        )}
              </div>
      </DialogContent>
    </Dialog>
  )
}



