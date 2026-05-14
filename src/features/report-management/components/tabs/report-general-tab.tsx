import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  Info,
  ListChecks,
  PencilLine,
  Rocket,
  Settings2,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'

import { apiClient } from '@/lib/api-client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { reportCampaignApi } from '../../api/report-management-api'
import type { CampaignScope, ReportDetail, UpdateReportInput } from '../../api/types'
import { getErrorMessage, reportQueryKeys } from '../../utils/report-query'
import { ReportConfirmDialog } from '../report-confirm-dialog'
import { ReportStatusBadge } from '../report-status'

type ReportGeneralTabProps = {
  reportId: string
  report: ReportDetail
  onRefetch?: () => void
}

function formatDateTime(value: string | null) {
  if (!value) return '--'
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatDate(value: string | null | undefined) {
  if (!value) return '--'
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(
    new Date(value)
  )
}

type EditCampaignDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  report: ReportDetail
  isLoading: boolean
  onSave: (input: UpdateReportInput) => void
}

function getInitialEditForm(report: ReportDetail): UpdateReportInput {
  return {
    periodName: report.periodName ?? '',
    deadlineFrom: report.deadlineFrom?.split('T')[0] ?? '',
    deadlineTo: report.deadlineTo?.split('T')[0] ?? '',
  }
}

export function EditCampaignDialog({
  open,
  onOpenChange,
  report,
  isLoading,
  onSave,
}: EditCampaignDialogProps) {
  const [form, setForm] = useState<UpdateReportInput>(() =>
    getInitialEditForm(report)
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chỉnh sửa báo cáo</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin cơ bản cho đợt báo cáo này.
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-4 py-4'>
          <div className='grid gap-2'>
            <Label>Tên kỳ báo cáo</Label>
            <Input
              value={form.periodName}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, periodName: e.target.value }))
              }
            />
          </div>
          <div className='grid grid-cols-2 gap-4'>
            <div className='grid gap-2'>
              <Label>Ngày mở</Label>
              <Input
                type='date'
                value={form.deadlineFrom}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, deadlineFrom: e.target.value }))
                }
              />
            </div>
            <div className='grid gap-2'>
              <Label>Ngày đóng</Label>
              <Input
                type='date'
                value={form.deadlineTo}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, deadlineTo: e.target.value }))
                }
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={() => onSave(form)} disabled={isLoading}>
            {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function formatPeriodType(type: string) {
  const map: Record<string, string> = {
    NAM: 'Năm',
    THANG: 'Tháng',
    QUY: 'Quý',
    TUAN: 'Tuần',
  }
  return map[type] || type
}

type IndicatorScopeByUnit = {
  orgId: string
  orgName: string
  indicators: string[]
}

function buildIndicatorScopesByUnit(
  scopes: CampaignScope[]
) {
  const unitMap = new Map<string, IndicatorScopeByUnit>()

  scopes.forEach((scope) => {
    const existing = unitMap.get(scope.orgId)

    if (existing) {
      if (scope.indicatorName) {
        existing.indicators.push(scope.indicatorName)
      }
      return
    }

    unitMap.set(scope.orgId, {
      orgId: scope.orgId,
      orgName: scope.orgName || 'Đơn vị không tên',
      indicators: scope.indicatorName ? [scope.indicatorName] : [],
    })
  })

  return Array.from(unitMap.values())
}

export function ReportGeneralTab({
  reportId,
  report,
  onRefetch,
}: ReportGeneralTabProps) {
  const [confirmDispatchOpen, setConfirmDispatchOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5

  const scopesQuery = useQuery({
    queryKey: reportQueryKeys.scopes(reportId),
    queryFn: () => reportCampaignApi.listScopes(reportId),
    enabled: !!reportId,
    staleTime: 5 * 60 * 1000,
  })

  const assignmentsQuery = useQuery({
    queryKey: reportQueryKeys.assignments(reportId),
    queryFn: () => reportCampaignApi.listCampaignAssignments(reportId),
    enabled: !!reportId,
    staleTime: 5 * 60 * 1000,
  })

  const dispatchMutation = useMutation({
    mutationFn: () => reportCampaignApi.confirmDispatch(reportId),
    onSuccess: () => {
      toast.success('Đã phát hành báo cáo thành công.')
      onRefetch?.()
      setConfirmDispatchOpen(false)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const updateMutation = useMutation({
    mutationFn: (input: UpdateReportInput) =>
      apiClient.patch(`/report-campaigns/${reportId}`, input),
    onSuccess: () => {
      toast.success('Đã cập nhật thông tin báo cáo.')
      onRefetch?.()
      setEditOpen(false)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const indicatorScopesByUnit = useMemo(() => {
    return buildIndicatorScopesByUnit(scopesQuery.data ?? [])
  }, [scopesQuery.data])

  const assignments = useMemo(
    () => assignmentsQuery.data ?? [],
    [assignmentsQuery.data]
  )
  const totalPages = Math.ceil(assignments.length / pageSize)
  const safeCurrentPage = totalPages > 0 ? Math.min(currentPage, totalPages) : 1

  const paginatedAssignments = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize
    return assignments.slice(start, start + pageSize)
  }, [assignments, safeCurrentPage])

  return (
    <div className='space-y-6 px-4 pt-6 pb-6 lg:px-6'>
      <section className='grid gap-6 lg:grid-cols-3'>
        <div className='lg:col-span-2'>
          <Card className='relative overflow-hidden rounded-3xl border bg-card p-6 h-full'>
            <div className='absolute -top-20 -right-20 size-64 rounded-full bg-primary/5' />
            <div className='relative space-y-6'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='h-6 w-1.5 rounded-full bg-primary' />
                  <div className='text-xl font-semibold text-primary'>
                    Thông tin chung
                  </div>
                </div>
                <div className='flex gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    disabled={report.status !== 'DRAFT'}
                    onClick={() => setEditOpen(true)}
                  >
                    <PencilLine className='size-3 mr-1' />
                    Chỉnh sửa
                  </Button>
                </div>
              </div>

              <div className='grid grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2'>
                <div className='sm:col-span-2'>
                  <div className='text-[11px] font-bold tracking-widest text-muted-foreground uppercase'>
                    Tên báo cáo
                  </div>
                  <div className='mt-1 text-base font-semibold text-foreground'>
                    {report.templateName}
                  </div>
                </div>

                <div>
                  <div className='text-[11px] font-bold tracking-widest text-muted-foreground uppercase'>
                    Biểu mẫu gốc
                  </div>
                  <div className='mt-1 flex items-center gap-2 text-sm font-semibold text-foreground'>
                    <span className='rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary uppercase'>
                      {report.templateCode}
                    </span>
                    {report.templateName}
                  </div>
                </div>

                <div>
                  <div className='text-[11px] font-bold tracking-widest text-muted-foreground uppercase'>
                    Kỳ báo cáo
                  </div>
                  <div className='mt-1 flex items-center gap-2 text-sm font-semibold text-foreground'>
                    <Badge variant='outline' className='text-[10px] font-bold uppercase'>
                      {formatPeriodType(report.periodType)}
                    </Badge>
                    {report.periodName || report.periodCode}
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <div className='text-[11px] font-bold tracking-widest text-muted-foreground uppercase'>
                      Thời hạn
                    </div>
                    <div className='mt-1 text-sm font-semibold text-foreground'>
                      {formatDate(report.deadlineFrom)} → {formatDate(report.deadlineTo)}
                    </div>
                  </div>
                  <div>
                    <div className='text-[11px] font-bold tracking-widest text-muted-foreground uppercase'>
                      Trạng thái
                    </div>
                    <div className='mt-1'>
                      <ReportStatusBadge status={report.status} />
                    </div>
                  </div>
                </div>

                <div>
                  <div className='text-[11px] font-bold tracking-widest text-muted-foreground uppercase'>
                    Ngày tạo
                  </div>
                  <div className='mt-1 text-sm font-semibold text-muted-foreground'>
                    {formatDateTime(report.createdAt)}
                  </div>
                </div>

                {report.dispatchedAt && (
                  <div>
                    <div className='text-[11px] font-bold tracking-widest text-muted-foreground uppercase'>
                      Ngày phát hành
                    </div>
                    <div className='mt-1 text-sm font-semibold text-primary'>
                      {formatDateTime(report.dispatchedAt)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        <Card className='relative flex flex-col overflow-hidden rounded-3xl border bg-card p-6 shadow-sm min-h-[280px]'>
          <div className='relative flex-1 space-y-6'>
            <div className='flex items-center gap-2'>
              <div className='flex size-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600'>
                <ListChecks className='size-5' />
              </div>
              <div className='text-base font-bold text-foreground uppercase tracking-tight'>
                Phân quyền chỉ tiêu
              </div>
            </div>

            <ScrollArea className='h-[320px] pr-4'>
              <div className='space-y-3'>
                {indicatorScopesByUnit.length === 0 ? (
                  <div className='py-8 text-center text-xs text-muted-foreground'>
                    Chưa có đơn vị nào được phân quyền chỉ tiêu.
                  </div>
                ) : (
                  <TooltipProvider delayDuration={200}>
                    {indicatorScopesByUnit.map((item) => (
                      <div
                        key={item.orgId}
                        className='group flex items-center justify-between rounded-xl border border-transparent bg-muted/30 p-3 transition-all hover:border-primary/20 hover:bg-muted/50'
                      >
                        <div className='min-w-0 space-y-0.5'>
                          <div className='truncate text-xs font-bold text-foreground'>
                            {item.orgName}
                          </div>
                          <div className='text-[10px] text-muted-foreground font-medium'>
                            {item.indicators.length} chỉ tiêu được giao
                          </div>
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className='flex size-6 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground shadow-sm transition-colors group-hover:bg-primary group-hover:text-primary-foreground'>
                              <Info className='size-3.5' />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className='w-64 rounded-xl p-3 shadow-xl' side='left'>
                            <div className='space-y-2'>
                              <div className='text-[10px] font-black uppercase tracking-widest'>
                                Danh sách chỉ tiêu
                              </div>
                              <div className='space-y-1.5'>
                                {item.indicators.slice(0, 5).map((name, i) => (
                                  <div key={i} className='text-[11px] leading-tight font-medium line-clamp-1 border-l-2 border-primary/30 pl-2'>
                                    {name}
                                  </div>
                                ))}
                                {item.indicators.length > 5 && (
                                  <div className='text-[10px] italic text-muted-foreground pl-3'>
                                    ... và {item.indicators.length - 5} chỉ tiêu khác
                                  </div>
                                )}
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    ))}
                  </TooltipProvider>
                )}
              </div>
            </ScrollArea>

            {report.status === 'DRAFT' && (
              <div className='pt-2 border-t mt-auto'>
                <Button
                  className='w-full rounded-xl bg-secondary font-bold text-secondary-foreground hover:bg-secondary/90 shadow-lg shadow-secondary/20'
                  onClick={() => setConfirmDispatchOpen(true)}
                  disabled={dispatchMutation.isPending}
                >
                  {dispatchMutation.isPending ? (
                    <span className='flex items-center gap-2'>
                      <Settings2 className='size-4 animate-spin' />
                      Đang phát hành...
                    </span>
                  ) : (
                    <span className='flex items-center gap-2'>
                      <Rocket className='size-4' />
                      Phát hành báo cáo
                    </span>
                  )}
                </Button>
              </div>
            )}
          </div>
        </Card>
      </section>

      <section className='overflow-hidden rounded-3xl border bg-card'>
        <div className='flex items-center justify-between gap-2 border-b bg-muted/20 px-6 py-5'>
          <div className='flex items-center gap-3'>
            <div className='h-6 w-1.5 rounded-full bg-secondary' />
            <div className='flex items-center gap-2 text-xl font-semibold text-foreground'>
              <Users className='size-5 text-secondary' />
              Tiến độ thực hiện
            </div>
          </div>
          <Badge variant='outline' className='rounded-full px-3 py-1'>
            {assignments.length} Đơn vị
          </Badge>
        </div>
        <div className='p-0'>
          <Table>
            <TableHeader className='bg-muted/30'>
              <TableRow>
                <TableHead className='w-[80px]'>STT</TableHead>
                <TableHead>Đơn vị thực hiện</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Tiến độ</TableHead>
                <TableHead className='text-right'>Cập nhật cuối</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className='h-24 text-center text-muted-foreground'
                  >
                    Chưa có nhiệm vụ nào được khởi tạo.
                  </TableCell>
                </TableRow>
                ) : (
                paginatedAssignments.map((row, index) => {
                  const stt = (safeCurrentPage - 1) * pageSize + index + 1
                  return (
                    <TableRow key={row.id}>
                      <TableCell className='font-medium'>{stt}</TableCell>
                      <TableCell>
                        <div className='flex flex-col'>
                          <span className='font-bold text-foreground'>{row.orgName}</span>
                          <span className='text-[10px] text-muted-foreground uppercase font-mono'>{row.orgId.substring(0, 8)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <ReportStatusBadge status={row.status} />
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center gap-2'>
                          <div className='h-1.5 w-16 overflow-hidden rounded-full bg-muted'>
                            <div
                              className='h-full bg-primary'
                              style={{ width: `${row.completionPercent || 0}%` }}
                            />
                          </div>
                          <span className='text-xs font-bold'>{row.completionPercent || 0}%</span>
                        </div>
                      </TableCell>
                      <TableCell className='text-right text-xs text-muted-foreground'>
                        {formatDateTime(row.updatedAt)}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
        {totalPages > 1 && (
          <div className='flex items-center justify-end gap-2 border-t px-6 py-4'>
            <Button
              variant='outline'
              size='sm'
              disabled={safeCurrentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            >
              Trước
            </Button>
            <div className='text-xs font-medium'>
              Trang {safeCurrentPage} / {totalPages}
            </div>
            <Button
              variant='outline'
              size='sm'
              disabled={safeCurrentPage === totalPages}
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
            >
              Sau
            </Button>
          </div>
        )}
      </section>

      <ReportConfirmDialog
        open={confirmDispatchOpen}
        onOpenChange={setConfirmDispatchOpen}
        title='Xác nhận phát hành báo cáo'
        description='Sau khi phát hành, cấu hình về chỉ tiêu và giá trị mặc định sẽ bị khóa. Hệ thống sẽ sinh bảng nhập liệu cho các đơn vị. Bạn có chắc chắn muốn tiếp tục?'
        confirmLabel='Phát hành ngay'
        isSubmitting={dispatchMutation.isPending}
        onConfirm={() => dispatchMutation.mutate()}
      />

      <EditCampaignDialog
        key={`${report.id}-${report.updatedAt ?? 'initial'}-${editOpen ? 'open' : 'closed'}`}
        open={editOpen}
        onOpenChange={setEditOpen}
        report={report}
        isLoading={updateMutation.isPending}
        onSave={(input) => updateMutation.mutate(input)}
      />
    </div>
  )
}
