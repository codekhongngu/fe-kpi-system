import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  CheckCircle2,
  Eye,
  Filter,
  History,
  Workflow,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { SubmissionTimeline } from '@/features/submission/components/submission-timeline'
import { approvalApi } from '@/features/submission/api/approval-api'
import {
  useApproveDepartment,
  useApproveDistrict,
  useRejectDepartment,
  useRejectDistrict,
} from '@/features/submission/hooks/use-approvals'
import { getSubmissionStatusInfo } from '@/features/submission/utils/submission-status'
import { normalizeSubmissionStatus } from '@/features/submission/utils/submission-status-rules'
import { reportCampaignApi } from '../../api/report-management-api'
import type { ReportAssignment, ReportDetail, SubmissionStatus } from '../../api/types'
import { reportQueryKeys } from '../../utils/report-query'
import { useAnyPermission } from '@/hooks/use-permission'

type ApprovalActionType = 'DEPARTMENT' | 'DISTRICT' | null

type ReportApprovalsTabProps = {
  reportId: string
  report: ReportDetail
  onRefetch?: () => void
}

function formatTimeDashDate(value: string | null) {
  if (!value) return '--'
  const date = new Date(value)
  const time = new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
  const day = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
  return `${time} - ${day}`
}

function normalizeAssignmentStatus(status: ReportAssignment['status']) {
  return normalizeSubmissionStatus(status) as SubmissionStatus
}

export function ReportApprovalsTab({
  reportId,
  report,
  onRefetch,
}: ReportApprovalsTabProps) {
  const queryClient = useQueryClient()
  const canApprove = useAnyPermission(['approvals.approve'])
  const canReject = useAnyPermission(['approvals.reject'])
  const [assignmentSearch, setAssignmentSearch] = useState('')
  const [assignmentStatusFilter, setAssignmentStatusFilter] =
    useState<'all' | SubmissionStatus>('all')
  const [viewAssignmentId, setViewAssignmentId] = useState<string | null>(null)
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false)
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [actionType, setActionType] = useState<ApprovalActionType>(null)

  const approveDept = useApproveDepartment()
  const rejectDept = useRejectDepartment()
  const approveDist = useApproveDistrict()
  const rejectDist = useRejectDistrict()

  const assignmentsQuery = useQuery({
    queryKey: reportQueryKeys.assignments(reportId),
    queryFn: () => reportCampaignApi.listCampaignAssignments(reportId),
    enabled: !!reportId,
    staleTime: 5 * 60 * 1000,
  })

  const normalizedAssignments = useMemo(
    () =>
      (assignmentsQuery.data ?? report.assignments ?? []).map((item) => ({
        ...item,
        normalizedStatus: normalizeAssignmentStatus(item.status),
      })),
    [assignmentsQuery.data, report.assignments]
  )

  const effectiveViewAssignmentId =
    viewAssignmentId ?? normalizedAssignments[0]?.id ?? null

  const selectedAssignment = useMemo(
    () =>
      normalizedAssignments.find((item) => item.id === effectiveViewAssignmentId) ??
      null,
    [effectiveViewAssignmentId, normalizedAssignments]
  )

  const historyQuery = useQuery({
    queryKey: reportQueryKeys.approvalHistory(
      selectedAssignment?.submissionId ?? null
    ),
    queryFn: () => approvalApi.getHistory(selectedAssignment!.submissionId!),
    enabled: Boolean(selectedAssignment?.submissionId),
    staleTime: 60 * 1000,
  })

  const history = historyQuery.data || []

  const filteredAssignments = useMemo(() => {
    const searchTerm = assignmentSearch.trim().toLowerCase()
    return normalizedAssignments.filter((item) => {
      const matchesSearch =
        searchTerm.length === 0 ||
        item.orgName.toLowerCase().includes(searchTerm) ||
        item.assigneeName?.toLowerCase().includes(searchTerm)
      const matchesStatus =
        assignmentStatusFilter === 'all' ||
        item.normalizedStatus === assignmentStatusFilter
      return matchesSearch && matchesStatus
    })
  }, [assignmentSearch, assignmentStatusFilter, normalizedAssignments])

  const currentStatusInfo = getSubmissionStatusInfo(
    selectedAssignment?.normalizedStatus ?? null,
    report.deadlineTo
  )
  const CurrentStatusIcon = currentStatusInfo.icon

  const closeAndRefresh = () => {
    setIsApproveModalOpen(false)
    setIsRejectModalOpen(false)
    setActionType(null)
    onRefetch?.()
    void queryClient.invalidateQueries({
      queryKey: reportQueryKeys.assignments(reportId),
    })
    void queryClient.invalidateQueries({
      queryKey: reportQueryKeys.summaryReadiness(reportId),
    })
    void queryClient.invalidateQueries({
      queryKey: reportQueryKeys.campaignSummary(reportId),
    })
  }

  const confirmApprove = () => {
    if (!selectedAssignment || !actionType) return
    const submissionId = selectedAssignment.submissionId
    if (!submissionId) {
      toast.error('Không tìm thấy bản nộp của đơn vị này')
      return
    }
    const mutation = actionType === 'DEPARTMENT' ? approveDept : approveDist
    mutation.mutate(submissionId, {
      onSuccess: closeAndRefresh,
    })
  }

  const confirmReject = () => {
    if (!selectedAssignment || !actionType) return
    if (!rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối')
      return
    }
    const submissionId = selectedAssignment.submissionId
    if (!submissionId) {
      toast.error('Không tìm thấy bản nộp của đơn vị này')
      return
    }
    const mutation = actionType === 'DEPARTMENT' ? rejectDept : rejectDist
    mutation.mutate(
      { submissionId, reason: rejectReason },
      {
        onSuccess: closeAndRefresh,
      }
    )
  }

  return (
    <div className='flex h-[700px] overflow-hidden rounded-b-3xl border-t bg-background'>
      <div className='flex w-full flex-col border-e bg-muted/5 md:w-[350px]'>
        <div className='space-y-3 p-4'>
          <div className='relative'>
            <Filter className='absolute top-2.5 left-3 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Tìm đơn vị...'
              className='h-9 rounded-xl pl-9 text-xs'
              value={assignmentSearch}
              onChange={(e) => setAssignmentSearch(e.target.value)}
            />
          </div>
          <Select
            value={assignmentStatusFilter}
            onValueChange={(value) =>
              setAssignmentStatusFilter(value as 'all' | SubmissionStatus)
            }
          >
            <SelectTrigger className='h-9 rounded-xl border-muted bg-background text-[11px]'>
              <SelectValue placeholder='Lọc trạng thái' />
            </SelectTrigger>
            <SelectContent className='rounded-xl'>
              <SelectItem value='all'>Tất cả trạng thái</SelectItem>
              <SelectItem value='NOT_STARTED'>Chưa bắt đầu</SelectItem>
              <SelectItem value='DRAFT'>Đang nhập</SelectItem>
              <SelectItem value='PENDING_DEPARTMENT'>Chờ phòng duyệt</SelectItem>
              <SelectItem value='DEPARTMENT_APPROVED'>Chờ xã chốt</SelectItem>
              <SelectItem value='DISTRICT_APPROVED'>Đã chốt</SelectItem>
              <SelectItem value='REJECTED_DEPARTMENT'>Phòng trả lại</SelectItem>
              <SelectItem value='REJECTED_DISTRICT'>Xã trả lại</SelectItem>
              <SelectItem value='OVERDUE'>Quá hạn</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className='flex-1'>
          <div className='divide-y divide-muted/10'>
            {filteredAssignments.map((row) => {
              const isActive = viewAssignmentId === row.id
              const statusInfo = getSubmissionStatusInfo(
                row.normalizedStatus,
                report.deadlineTo
              )
              const StatusIcon = statusInfo.icon

              return (
                <button
                  key={row.id}
                  className={cn(
                    'flex w-full flex-col gap-1.5 p-4 text-left transition-all hover:bg-muted/30',
                    isActive &&
                    'bg-primary/5 shadow-[inset_4px_0_0_0_theme(colors.primary.DEFAULT)]'
                  )}
                  onClick={() => setViewAssignmentId(row.id)}
                >
                  <div className='flex items-center justify-between gap-2'>
                    <span
                      className={cn(
                        'truncate text-sm font-bold',
                        isActive ? 'text-primary' : 'text-foreground'
                      )}
                    >
                      {row.orgName}
                    </span>
                    <Badge
                      variant='outline'
                      className={cn(
                        'shrink-0 border-none px-1 text-[8px] font-bold uppercase tracking-tighter',
                        statusInfo.className
                      )}
                    >
                      <StatusIcon className='mr-1 size-2.5' />
                      {statusInfo.label}
                    </Badge>
                  </div>
                  <div className='flex items-center justify-between text-[10px] text-muted-foreground'>
                    <span>{row.assigneeName ?? 'Chưa phân công'}</span>
                    <span>{formatTimeDashDate(row.updatedAt)}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </ScrollArea>
      </div>

      <div className='flex flex-1 flex-col overflow-hidden'>
        {selectedAssignment ? (
          <div className='flex flex-1 flex-col overflow-hidden'>
            <div className='flex items-center justify-between border-b px-6 py-4'>
              <div>
                <h3 className='text-lg font-bold text-foreground'>
                  {selectedAssignment.orgName}
                </h3>
                <p className='text-xs text-muted-foreground'>
                  Chi tiết nhiệm vụ báo cáo và lịch sử phê duyệt
                </p>
              </div>
              <div className='flex items-center gap-2'>
                <Button variant='outline' size='sm' className='h-9 rounded-xl' asChild>
                  <Link
                    to='/report-management/admin-view/$reportId/$assignmentId'
                    params={{ reportId, assignmentId: selectedAssignment.id }}
                  >
                    <Eye className='mr-2 size-4' />
                    Xem dữ liệu
                  </Link>
                </Button>
                {selectedAssignment.normalizedStatus === 'PENDING_DEPARTMENT' && (
                  <>
                    {canApprove && (
                      <Button
                        size='sm'
                        className='h-9 rounded-xl bg-green-600 hover:bg-green-700'
                        onClick={() => {
                          setActionType('DEPARTMENT')
                          setIsApproveModalOpen(true)
                        }}
                        disabled={approveDept.isPending}
                      >
                        <CheckCircle2 className='mr-2 size-4' />
                        Duyệt phòng
                      </Button>
                    )}
                    {canReject && (
                      <Button
                        variant='destructive'
                        size='sm'
                        className='h-9 rounded-xl'
                        onClick={() => {
                          setActionType('DEPARTMENT')
                          setRejectReason('')
                          setIsRejectModalOpen(true)
                        }}
                        disabled={rejectDept.isPending}
                      >
                        <XCircle className='mr-2 size-4' />
                        Từ chối
                      </Button>
                    )}
                  </>
                )}

                {selectedAssignment.normalizedStatus === 'DEPARTMENT_APPROVED' && (
                  <>
                    {canApprove && (
                      <Button
                        size='sm'
                        className='h-9 rounded-xl'
                        onClick={() => {
                          setActionType('DISTRICT')
                          setIsApproveModalOpen(true)
                        }}
                        disabled={approveDist.isPending}
                      >
                        <CheckCircle2 className='mr-2 size-4' />
                        Chốt số (xã)
                      </Button>
                    )}
                    {canReject && (
                      <Button
                        variant='destructive'
                        size='sm'
                        className='h-9 rounded-xl'
                        onClick={() => {
                          setActionType('DISTRICT')
                          setRejectReason('')
                          setIsRejectModalOpen(true)
                        }}
                        disabled={rejectDist.isPending}
                      >
                        <XCircle className='mr-2 size-4' />
                        Trả lại
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>

            <ScrollArea className='flex-1 p-6'>
              <div className='space-y-8'>
                <div className='grid grid-cols-3 gap-4'>
                  <Card className='rounded-2xl border-none bg-muted/20 p-0'>
                    <CardContent className='p-4'>
                      <p className='text-[10px] font-bold uppercase text-muted-foreground'>
                        Trạng thái
                      </p>
                      <div className='mt-1 flex items-center gap-2'>
                        <CurrentStatusIcon
                          className={cn(
                            'size-4',
                            currentStatusInfo.className.split(' ')[0]
                          )}
                        />
                        <span className='text-sm font-bold'>{currentStatusInfo.label}</span>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className='rounded-2xl border-none bg-muted/20 p-0'>
                    <CardContent className='p-4'>
                      <p className='text-[10px] font-bold uppercase text-muted-foreground'>
                        Tiến độ
                      </p>
                      <div className='mt-1 flex items-baseline gap-1'>
                        <span className='text-xl font-bold'>
                          {selectedAssignment.completionPercent ?? 0}
                        </span>
                        <span className='text-xs font-medium text-muted-foreground'>%</span>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className='rounded-2xl border-none bg-primary/10 p-0 text-primary'>
                    <CardContent className='p-4'>
                      <p className='text-[10px] font-bold uppercase opacity-70'>Hạn chót</p>
                      <p className='mt-1 text-sm font-bold'>
                        {formatTimeDashDate(selectedAssignment.updatedAt)}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className='space-y-4'>
                  <div className='flex items-center gap-2 text-sm font-bold'>
                    <History className='size-4 text-primary' />
                    Lịch sử quy trình
                  </div>
                  <div className='rounded-2xl border bg-muted/5 p-6'>
                    {historyQuery.isLoading ? (
                      <div className='py-8 text-center text-xs text-muted-foreground'>
                        Đang tải lịch sử...
                      </div>
                    ) : history.length === 0 ? (
                      <div className='py-8 text-center text-xs text-muted-foreground'>
                        Chưa có dữ liệu lịch sử
                      </div>
                    ) : (
                      <SubmissionTimeline history={history} />
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className='flex flex-1 flex-col items-center justify-center p-12 text-center text-muted-foreground'>
            <div className='mb-4 rounded-3xl bg-muted/20 p-6'>
              <Workflow className='size-10 opacity-20' />
            </div>
            <h4 className='font-bold text-foreground/70'>
              Chọn đơn vị để xem chi tiết
            </h4>
            <p className='mt-1 max-w-[250px] text-xs leading-relaxed'>
              Hãy chọn một đơn vị từ danh sách bên trái để kiểm tra tiến độ và
              thực hiện phê duyệt.
            </p>
          </div>
        )}
      </div>

      <Dialog open={isApproveModalOpen} onOpenChange={setIsApproveModalOpen}>
        <DialogContent className='sm:max-w-[420px] rounded-[2rem] p-8 border-none shadow-2xl'>
          <DialogHeader>
            <div className='mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
              <CheckCircle2 className='size-10' />
            </div>
            <DialogTitle className='text-center text-2xl font-black text-foreground'>
              Phê duyệt dữ liệu
            </DialogTitle>
            <DialogDescription className='pt-2 text-center text-sm font-medium leading-relaxed'>
              {actionType === 'DEPARTMENT'
                ? 'Phê duyệt ở cấp phòng sẽ đẩy thẳng lên cấp xã để chốt số.'
                : 'Chốt số ở cấp xã là bước cuối, sau đó dữ liệu sẽ được khóa hoàn toàn.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='mt-8 flex flex-col gap-3 sm:flex-row'>
            <Button
              variant='ghost'
              className='flex-1 h-12 rounded-xl font-bold'
              onClick={() => setIsApproveModalOpen(false)}
            >
              Xem lại
            </Button>
            <Button
              className='h-12 flex-1 rounded-xl font-black shadow-lg shadow-primary/20'
              onClick={confirmApprove}
              disabled={approveDept.isPending || approveDist.isPending}
            >
              {approveDept.isPending || approveDist.isPending
                ? 'Đang duyệt...'
                : 'Đồng ý duyệt'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent className='sm:max-w-[500px] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl'>
          <DialogHeader className='px-8 pt-8'>
            <DialogTitle className='flex items-center gap-3 text-2xl font-black text-destructive'>
              <XCircle className='size-7' />
              Trả lại bản nộp
            </DialogTitle>
            <DialogDescription className='pt-2 text-sm font-medium leading-relaxed'>
              {actionType === 'DEPARTMENT'
                ? 'Bản nộp sẽ quay lại vòng nhập liệu để chỉnh sửa theo góp ý của phòng.'
                : 'Bản nộp sẽ quay lại vòng nhập liệu sau khi xã từ chối chốt số.'}
            </DialogDescription>
          </DialogHeader>
          <div className='px-8 py-6'>
            <div className='space-y-3'>
              <Label
                htmlFor='reason'
                className='ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground'
              >
                Lý do trả lại chi tiết
              </Label>
              <Textarea
                id='reason'
                placeholder='Nhập lý do trả lại...'
                className='min-h-[140px] rounded-2xl border-muted bg-muted/20 p-4 text-sm focus-visible:ring-destructive/20'
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className='flex gap-3 px-8 pb-8 sm:justify-between'>
            <Button
              variant='ghost'
              className='rounded-xl px-6 font-bold'
              onClick={() => setIsRejectModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              variant='destructive'
              className='rounded-xl px-8 font-black shadow-lg shadow-destructive/20'
              onClick={confirmReject}
              disabled={rejectDept.isPending || rejectDist.isPending}
            >
              {rejectDept.isPending || rejectDist.isPending
                ? 'Đang thực hiện...'
                : 'Xác nhận trả lại'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Separator className='hidden' />
    </div>
  )
}
