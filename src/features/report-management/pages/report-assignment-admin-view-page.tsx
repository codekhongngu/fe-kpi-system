import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, Building2, FileText, Hash, Info } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { SubmissionGrid } from '@/features/submission/components/submission-grid'
import { formManagementApi } from '@/features/form-management/api/template-management-api'
import type { FormTemplate } from '@/features/form-management/api/types'
import type { SubmissionDetail } from '@/features/submission/api/types'
import { getSubmissionStatusInfo } from '@/features/submission/utils/submission-status'
import { reportCampaignApi } from '../api/report-management-api'
import { reportQueryKeys } from '../utils/report-query'

type ReportAssignmentAdminViewPageProps = {
  reportId: string
  assignmentId: string
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

export function ReportAssignmentAdminViewPage({
  reportId,
  assignmentId,
}: ReportAssignmentAdminViewPageProps) {
  const campaignQuery = useQuery({
    queryKey: reportQueryKeys.detail(reportId),
    queryFn: () => reportCampaignApi.getCampaign(reportId),
    enabled: Boolean(reportId),
    staleTime: 5 * 60 * 1000,
  })

  const assignmentsQuery = useQuery({
    queryKey: reportQueryKeys.assignments(reportId),
    queryFn: () => reportCampaignApi.listCampaignAssignments(reportId),
    enabled: Boolean(reportId),
    staleTime: 5 * 60 * 1000,
  })

  const selectedAssignment = useMemo(
    () =>
      (assignmentsQuery.data ?? []).find((item) => item.id === assignmentId) ?? null,
    [assignmentId, assignmentsQuery.data]
  )

  const detailQuery = useQuery({
    queryKey: reportQueryKeys.adminAssignmentView(reportId, assignmentId),
    queryFn: () => reportCampaignApi.getAssignmentAdminView(reportId, assignmentId),
    enabled: Boolean(reportId && assignmentId),
    staleTime: 60 * 1000,
  })

  const templateId =
    campaignQuery.data?.formId ??
    campaignQuery.data?.templateId ??
    null

  const templateQuery = useQuery({
    queryKey: reportQueryKeys.template(templateId ?? null),
    queryFn: () => formManagementApi.getTemplate(templateId as string),
    enabled: Boolean(templateId),
    staleTime: 5 * 60 * 1000,
  })

  const campaign = campaignQuery.data ?? null
  const assignment = selectedAssignment
  const detail = detailQuery.data ?? null
  const template = templateQuery.data ?? null
  const status = statusInfo(detail?.status ?? assignment?.status ?? null)
  const StatusIcon = status.icon

  const isLoading =
    campaignQuery.isLoading ||
    assignmentsQuery.isLoading ||
    detailQuery.isLoading ||
    templateQuery.isLoading

  return (
    <div className='flex h-[calc(100vh-64px)] flex-col bg-background'>
      <div className='z-10 flex shrink-0 flex-col border-b bg-background shadow-sm'>
        <div className='flex items-center justify-between gap-3 px-4 py-3'>
          <div className='flex min-w-0 items-center gap-3'>
            <Button variant='ghost' size='icon' asChild title='Quay lại'>
              <Link
                to='/report-management/details/$reportId'
                params={{ reportId }}
                search={{ tab: 'approvals' }}
              >
                <ArrowLeft className='size-5' />
              </Link>
            </Button>
            <div className='min-w-0'>
              <div className='flex flex-wrap items-center gap-2'>
                <h1 className='truncate text-lg font-bold tracking-tight'>
                  {campaign?.templateName ?? 'Chi tiết dữ liệu cho quản trị'}
                </h1>
                {status.label ? (
                  <Badge
                    variant='outline'
                    className={`gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase ${status.className}`}
                  >
                    <StatusIcon className='size-3' />
                    {status.label}
                  </Badge>
                ) : null}
              </div>
              <p className='text-sm text-muted-foreground'>
                Chế độ xem read-only dành cho admin. Không điều hướng sang luồng nhập liệu của phòng ban.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className='flex-1 overflow-auto bg-slate-50/50 p-4'>
        <div className='mx-auto max-w-7xl space-y-4'>
          {isLoading || !assignment || !detail || !template ? (
            <div className='flex h-[50vh] items-center justify-center text-sm text-muted-foreground'>
              Đang tải dữ liệu quản trị...
            </div>
          ) : (
            <>
              <div className='grid gap-4 lg:grid-cols-4'>
                <Card className='rounded-2xl border bg-card shadow-sm lg:col-span-2'>
                  <CardContent className='flex h-full flex-col justify-between gap-4 p-4'>
                    <div className='space-y-2'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <Badge variant='outline' className='rounded-full px-3 py-1'>
                          Tổng hợp dữ liệu
                        </Badge>
                        <Badge variant='outline' className={`gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase ${status.className}`}>
                          <StatusIcon className='size-3' />
                          {status.label}
                        </Badge>
                      </div>
                      <div className='space-y-1'>
                        <h2 className='truncate text-2xl font-bold tracking-tight text-foreground'>
                          {campaign?.templateName ?? '--'}
                        </h2>
                        <p className='text-sm text-muted-foreground'>
                          Xem cấu trúc báo cáo, giá trị mặc định, dữ liệu đã duyệt và kết quả tổng hợp theo kỳ.
                        </p>
                      </div>
                    </div>
                    <div className='grid gap-2 sm:grid-cols-2'>
                      <div className='rounded-xl bg-muted/30 p-3'>
                        <div className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>
                          Biểu mẫu
                        </div>
                        <div className='mt-1 text-sm font-semibold text-foreground'>
                          {campaign?.templateCode ?? campaign?.formId ?? '--'}
                        </div>
                      </div>
                      <div className='rounded-xl bg-muted/30 p-3'>
                        <div className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>
                          Kỳ báo cáo
                        </div>
                        <div className='mt-1 text-sm font-semibold text-foreground'>
                          {campaign?.periodName || campaign?.periodCode || '--'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className='rounded-2xl border bg-card shadow-sm'>
                  <CardContent className='p-4'>
                    <div className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>
                      Trạng thái
                    </div>
                    <div className='mt-2 flex items-center gap-2'>
                      <StatusIcon className={status.className} />
                      <span className='text-sm font-semibold'>{status.label}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className='rounded-2xl border bg-card shadow-sm'>
                  <CardContent className='p-4'>
                    <div className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>
                      Tiến độ
                    </div>
                    <div className='mt-2 text-sm font-semibold'>
                      {formatPercent(detail.completionPct)}
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

                  <div className='rounded-2xl border bg-muted/5 p-4'>
                    <div className='flex items-center gap-2 text-[10px] font-bold uppercase text-muted-foreground'>
                      <Building2 className='size-3.5' />
                      Đơn vị
                    </div>
                    <div className='mt-2 text-sm font-semibold'>{assignment.orgName}</div>
                  </div>

                  <div className='rounded-2xl border bg-muted/5 p-4'>
                    <div className='flex items-center gap-2 text-[10px] font-bold uppercase text-muted-foreground'>
                      <Hash className='size-3.5' />
                      Bản nộp
                    </div>
                    <div className='mt-2 text-sm font-semibold'>{detail.id}</div>
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
                </div>
              </div>

              <Separator className='hidden' />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
