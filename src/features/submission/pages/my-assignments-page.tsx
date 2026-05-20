import { useState, useMemo, useEffect, useCallback } from 'react'
import { Link, useSearch, useNavigate } from '@tanstack/react-router'
import {
  Search,
  Pencil,
  Eye,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  CheckCircle,
  XCircle,
  Workflow,
  Calendar,
  Filter,
  History,
  LayoutDashboard,
  TrendingUp,
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PageBreadcrumb } from '@/components/page-breadcrumb'
import { useDebounceCallback } from '@/hooks/use-debounce-callback'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import {
  useMyAssignments,
  useCancelSubmit,
  useSubmissionHistory,
} from '../hooks/use-my-assignments'
import { useApproveDepartment, useRejectDepartment } from '../hooks/use-approvals'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { DataTablePagination } from '@/components/data-table/data-table-pagination'
import { getSubmissionStatusInfo } from '../utils/submission-status'
import { isSubmissionReadOnlyStatus, normalizeSubmissionStatus } from '../utils/submission-status-rules'
import { SubmissionTimeline, type SubmissionFlowLog } from '@/components/submission/submission-timeline'
import { SubmissionDiffModal } from '@/components/submission/submission-diff-modal'
import { submissionApi } from '../api/submission-api'
import type { SubmissionSnapshot } from '../utils/data-diff'

type AssignmentFilterStatus =
  | 'all'
  | 'NOT_STARTED'
  | 'DRAFT'
  | 'PENDING_DEPARTMENT'
  | 'DEPARTMENT_APPROVED'
  | 'DISTRICT_APPROVED'
  | 'REJECTED_DEPARTMENT'
  | 'REJECTED_DISTRICT'
  | 'OVERDUE'

type AssignmentSearchParams = {
  assignmentId?: string
  q?: string
  status?: string
  page?: string | number
  limit?: string | number
}

type SearchUpdateParams = Partial<AssignmentSearchParams>

const assignmentFilterStatuses = new Set<AssignmentFilterStatus>([
  'all',
  'NOT_STARTED',
  'DRAFT',
  'PENDING_DEPARTMENT',
  'DEPARTMENT_APPROVED',
  'DISTRICT_APPROVED',
  'REJECTED_DEPARTMENT',
  'REJECTED_DISTRICT',
  'OVERDUE',
])

function isAssignmentFilterStatus(
  value: string | undefined
): value is AssignmentFilterStatus {
  return value !== undefined && assignmentFilterStatuses.has(value as AssignmentFilterStatus)
}

export function MyAssignmentsPage() {
  const search = useSearch({ strict: false }) as AssignmentSearchParams
  const navigate = useNavigate()

  const selectedId = search.assignmentId || null
  const [searchTerm, setSearchTerm] = useState(search.q || '')
  const [debouncedSearch, setDebouncedSearch] = useState(search.q || '')
  const [statusFilter, setStatusFilter] =
    useState<AssignmentFilterStatus>(
      isAssignmentFilterStatus(search.status) ? search.status : 'all'
    )
  const [page, setPage] = useState(Number(search.page) || 1)
  const [limit, setLimit] = useState(Number(search.limit) || 20)

  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false)
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false)
  const [cancelSubmitId, setCancelSubmitId] = useState<string | null>(null)

  // States for history and diff
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false)
  const [oldSnapshot, setOldSnapshot] = useState<SubmissionSnapshot | null>(null)
  const [newSnapshot, setNewSnapshot] = useState<SubmissionSnapshot | null>(null)

  const updateUrl = useCallback((params: SearchUpdateParams) => {
    navigate({
      to: '.',
      search: (prev: any) => ({ ...prev, ...params }),
      replace: true,
    })
  }, [navigate])

  const handleSearch = useDebounceCallback((val: string) => {
    setDebouncedSearch(val)
    setPage(1)
    updateUrl({ q: val || undefined, page: 1 })
  }, 500)

  const { data, isLoading } = useMyAssignments({
    q: debouncedSearch || undefined,
    status:
      statusFilter === 'all' || statusFilter === 'OVERDUE'
        ? undefined
        : statusFilter,
    overdue: statusFilter === 'OVERDUE' ? true : undefined,
    page,
    limit,
  })

  const { mutate: cancelSubmit, isPending: isCanceling } = useCancelSubmit()
  const approveDept = useApproveDepartment()
  const rejectDept = useRejectDepartment()

  const historyQuery = useSubmissionHistory(selectedId)
  const history = historyQuery.data || []

  const items = useMemo(() => data?.items ?? [], [data?.items])
  const total = data?.total ?? 0

  // Auto-select first item if none selected
  useEffect(() => {
    if (!selectedId && items.length > 0 && !isLoading) {
      updateUrl({ assignmentId: items[0].assignmentId })
    }
  }, [items, selectedId, isLoading, updateUrl])

  const selectedItem = useMemo(() =>
    items.find((i) => i.assignmentId === selectedId),
    [items, selectedId]
  )

  const handleApproveDept = (id: string) => {
    setApprovingId(id)
    setIsApproveModalOpen(true)
  }

  const confirmApprove = () => {
    if (approvingId) {
      approveDept.mutate(approvingId, {
        onSuccess: () => {
          setIsApproveModalOpen(false)
          setApprovingId(null)
        }
      })
    }
  }

  const handleRejectDept = (id: string) => {
    setApprovingId(id)
    setRejectReason('')
    setIsRejectModalOpen(true)
  }

  const confirmReject = () => {
    if (!rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối')
      return
    }
    if (approvingId) {
      rejectDept.mutate(
        { submissionId: approvingId, reason: rejectReason },
        {
          onSuccess: () => {
            setIsRejectModalOpen(false)
            setApprovingId(null)
          },
        }
      )
    }
  }

  const handleCompare = async (log: SubmissionFlowLog, prevLog?: SubmissionFlowLog) => {
    try {
      let currentSnap: SubmissionSnapshot | null =
        (log.snapshot as SubmissionSnapshot | null | undefined) ?? null
      if (!currentSnap) {
        const details = await submissionApi.getFlowLogDetails(log.id)
        currentSnap = (details.snapshot as SubmissionSnapshot | null | undefined) ?? null
      }

      let previousSnap: SubmissionSnapshot | null = null
      if (prevLog) {
        previousSnap =
          (prevLog.snapshot as SubmissionSnapshot | null | undefined) ?? null
        if (!previousSnap) {
          const details = await submissionApi.getFlowLogDetails(prevLog.id)
          previousSnap = (details.snapshot as SubmissionSnapshot | null | undefined) ?? null
        }
      }

      setNewSnapshot(currentSnap)
      setOldSnapshot(previousSnap)
      setIsDiffModalOpen(true)
    } catch {
      toast.error('Không thể tải dữ liệu snapshot')
    }
  }

  const handleViewSnapshot = (log: SubmissionFlowLog) => {
    navigate({
      to: '/my/submissions/flow-logs/$logId',
      params: { logId: log.id }
    })
  }

  const handleCancelSubmit = (submissionId: string) => {
    setCancelSubmitId(submissionId)
    setIsCancelConfirmOpen(true)
  }

  const confirmCancelSubmit = () => {
    if (!cancelSubmitId) return

    cancelSubmit(cancelSubmitId, {
      onSuccess: () => {
        setIsCancelConfirmOpen(false)
        setCancelSubmitId(null)
      },
    })
  }

  return (
    <div className='flex h-[calc(100vh-64px)] flex-col gap-0 overflow-hidden bg-background'>
      <div className='shrink-0 border-b bg-background px-6 py-4'>
        <PageBreadcrumb
          title='Nhiệm vụ báo cáo'
          subtitle='Theo dõi nhiệm vụ nhập liệu và phê duyệt cấp đơn vị'
        />
      </div>

      <div className='flex flex-1 overflow-hidden'>
        {/* Master Column: List of Assignments */}
        <div className='flex w-full flex-col border-e bg-muted/10 md:w-[400px]'>
          <div className='space-y-3 border-b bg-background p-4'>
            <div className='flex items-center gap-2'>
              <div className='relative flex-1'>
                <Search className='absolute top-2.5 left-3 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Tìm theo tên biểu mẫu...'
                  className='h-10 pl-9 rounded-2xl bg-muted/20 border-none focus-visible:ring-primary/20'
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    handleSearch(e.target.value)
                  }}
                />
              </div>
              <Button variant='outline' size='icon' className='size-10 rounded-2xl shrink-0'>
                <Filter className='size-4' />
              </Button>
            </div>

            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v as AssignmentFilterStatus)
                setPage(1)
                updateUrl({ status: v === 'all' ? undefined : v, page: 1 })
              }}
            >
              <SelectTrigger className='h-9 rounded-xl border-muted bg-background text-xs'>
                <SelectValue placeholder='Lọc theo trạng thái' />
              </SelectTrigger>
              <SelectContent className='rounded-xl'>
                <SelectItem value='all'>Tất cả trạng thái</SelectItem>
                <SelectItem value='NOT_STARTED'>Chưa bắt đầu</SelectItem>
                <SelectItem value='DRAFT'>Đang biên tập (Nháp)</SelectItem>
                <SelectItem value='PENDING_DEPARTMENT'>Chờ phòng duyệt</SelectItem>
                <SelectItem value='DEPARTMENT_APPROVED'>Phòng đã duyệt</SelectItem>
                <SelectItem value='DISTRICT_APPROVED'>Xã đã chốt số</SelectItem>
                <SelectItem value='REJECTED_DEPARTMENT'>Phòng trả lại</SelectItem>
                <SelectItem value='OVERDUE'>Quá hạn</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='flex-1 overflow-y-auto custom-scrollbar'>
            {isLoading ? (
              <div className='flex flex-col items-center justify-center p-12 gap-3 opacity-50'>
                <div className='size-8 border-2 border-primary border-t-transparent animate-spin rounded-full' />
                <p className='text-xs font-medium'>Đang tải danh sách...</p>
              </div>
            ) : items.length === 0 ? (
              <div className='flex flex-col items-center justify-center p-12 text-center opacity-40'>
                <FileText className='size-12 mb-2' />
                <p className='text-sm font-medium'>Không tìm thấy nhiệm vụ nào</p>
              </div>
            ) : (
              <div className='divide-y divide-muted/10'>
                {items.map((item) => {
                  const statusInfo = getSubmissionStatusInfo(
                    item.submission?.status,
                    item.deadlineTo
                  )
                  const isActive = selectedId === item.assignmentId
                  const StatusIcon = statusInfo.icon

                  return (
                    <button
                      key={item.assignmentId}
                      className={cn(
                        'flex w-full flex-col gap-2 p-4 text-left transition-all duration-200 border-l-4 relative',
                        isActive
                          ? 'bg-primary/5 border-primary z-10 shadow-[inset_0_0_0_1px_rgba(var(--primary),0.1)]'
                          : 'border-transparent hover:bg-muted/50'
                      )}
                      onClick={() => updateUrl({ assignmentId: item.assignmentId })}
                    >
                      <div className='flex items-start justify-between gap-3'>
                        <div className='space-y-0.5'>
                          <div className='text-[10px] font-bold text-primary/60 uppercase tracking-tight'>
                            {item.form.code}
                          </div>
                          <span className={cn(
                            'text-sm font-bold leading-tight line-clamp-2',
                            isActive ? 'text-primary' : 'text-foreground/90'
                          )}>
                            {item.form.name}
                          </span>
                        </div>
                        <Badge
                          variant='outline'
                          className={cn(
                            'shrink-0 h-5 px-1.5 text-[9px] font-bold uppercase tracking-tighter border-none',
                            statusInfo.className
                          )}
                        >
                          <StatusIcon className='mr-1 size-2.5' />
                          {statusInfo.label}
                        </Badge>
                      </div>

                      <div className='flex items-center gap-3 text-[10px] font-medium text-muted-foreground/70'>
                        <div className='flex items-center gap-1'>
                          <Calendar className='size-3 opacity-60' />
                          Hạn: {item.deadlineTo ? format(new Date(item.deadlineTo), 'dd/MM/yyyy') : '--'}
                        </div>
                        <div className='flex items-center gap-1'>
                          <Clock className='size-3 opacity-60' />
                          {item.period.name}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className='shrink-0 border-t bg-background p-2'>
            <DataTablePagination
              className='w-full'
              total={total}
              page={page}
              pageSize={limit}
              variant='simple'
              onPageChange={(p) => {
                setPage(p)
                updateUrl({ page: p })
              }}
              onPageSizeChange={(s) => {
                setLimit(s)
                setPage(1)
                updateUrl({ limit: s, page: 1 })
              }}
            />
          </div>
        </div>

        {/* Detail Column: Assignment & Submission Info */}
        <div className='flex flex-1 flex-col overflow-hidden bg-background'>
          {selectedItem ? (
            <div className='flex flex-1 flex-col overflow-hidden'>
              {/* Header Details */}
              <div className='flex items-center justify-between border-b px-8 py-5 bg-muted/5'>
                <div className='space-y-1'>
                  <div className='flex items-center gap-2'>
                    <Badge variant='outline' className='rounded-sm px-1.5 py-0 text-[10px] bg-primary/10 text-primary border-primary/20'>
                      {selectedItem.form.code}
                    </Badge>
                    <span className='text-xs font-medium text-muted-foreground uppercase tracking-widest'>
                      {selectedItem.period.name}
                    </span>
                  </div>
                  <h2 className='text-2xl font-black tracking-tight text-foreground'>
                    {selectedItem.form.name}
                  </h2>
                </div>

                <div className='flex items-center gap-3'>
                  {/* Primary Action Button */}
                  <Button size='lg' className='rounded-2xl px-6 font-bold shadow-lg shadow-primary/20' asChild>
                    <Link
                      to='/my/assignments/$assignmentId/input'
                      params={{ assignmentId: selectedItem.assignmentId }}
                    >
                      {isSubmissionReadOnlyStatus(selectedItem.submission?.status) ? (
                        <>
                          <Eye className='mr-2 h-5 w-5' />
                          Xem dữ liệu
                        </>
                      ) : (
                        <>
                          <Pencil className='mr-2 h-5 w-5' />
                          Nhập báo cáo
                        </>
                      )}
                    </Link>
                  </Button>

                  {/* Context Actions */}
                  {normalizeSubmissionStatus(selectedItem.submission?.status) === 'PENDING_DEPARTMENT' && (
                    <div className='flex items-center gap-2 border-l pl-3 ml-1'>
                      <Button
                        size='sm'
                        variant='secondary'
                        className='bg-green-600 text-white hover:bg-green-700 rounded-xl'
                        onClick={() => handleApproveDept(selectedItem.submission!.id)}
                        disabled={approveDept.isPending}
                      >
                        <CheckCircle className='mr-2 h-4 w-4' />
                        Duyệt
                      </Button>
                      <Button
                        variant='destructive'
                        size='sm'
                        className='rounded-xl'
                        onClick={() => handleRejectDept(selectedItem.submission!.id)}
                        disabled={rejectDept.isPending}
                      >
                        <XCircle className='mr-2 h-4 w-4' />
                        Từ chối
                      </Button>
                    </div>
                  )}

                  {normalizeSubmissionStatus(selectedItem.submission?.status) === 'PENDING_DEPARTMENT' && (
                    <Button
                      variant='outline'
                      size='sm'
                      className='rounded-xl text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700'
                      onClick={() => handleCancelSubmit(selectedItem.submission!.id)}
                      disabled={isCanceling}
                    >
                      <RotateCcw className='mr-2 h-4 w-4' />
                      Thu hồi
                    </Button>
                  )}
                </div>
              </div>

              {/* Detail Content with Tabs */}
              <div className='flex-1 overflow-hidden flex flex-col'>
                <Tabs defaultValue='overview' className='flex-1 flex flex-col'>
                  <div className='px-8 border-b bg-background shrink-0'>
                    <TabsList className='h-12 bg-transparent gap-8 p-0'>
                      <TabsTrigger
                        value='overview'
                        className='h-12 rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 data-[state=active]:text-foreground transition-all'
                      >
                        Tổng quan
                      </TabsTrigger>
                      <TabsTrigger
                        value='timeline'
                        className='h-12 rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 data-[state=active]:text-foreground transition-all'
                      >
                        Lịch trình nộp dữ liệu
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <div className='flex-1 overflow-y-auto py-4 px-6 custom-scrollbar'>
                    <TabsContent value='overview' className='mt-0 space-y-8 px-4'>
                      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
                        {/* Status Card */}
                        <Card className='rounded-3xl bg-muted/30'>
                          <CardContent className='pt-6'>
                            <div className='flex items-center gap-4'>
                              <div className={cn(
                                'size-12 rounded-2xl flex items-center justify-center',
                                getSubmissionStatusInfo(selectedItem.submission?.status, selectedItem.deadlineTo).className.replace('text-', 'bg-').replace('700', '100')
                              )}>
                                {(() => {
                                  const Icon = getSubmissionStatusInfo(selectedItem.submission?.status, selectedItem.deadlineTo).icon
                                  return <Icon className='size-6' />
                                })()}
                              </div>
                              <div>
                                <p className='text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest'>Trạng thái hiện tại</p>
                                <h3 className='font-bold text-lg leading-tight'>
                                  {getSubmissionStatusInfo(selectedItem.submission?.status, selectedItem.deadlineTo).label}
                                </h3>
                              </div>
                            </div>
                            <div className='mt-6 space-y-2'>
                              <div className='flex items-center justify-between text-xs'>
                                <span className='font-bold text-muted-foreground'>Tiến độ nhập liệu</span>
                                <span className='font-black text-primary'>{selectedItem.submission?.completionPct ?? 0}%</span>
                              </div>
                              <div className='h-2 w-full bg-muted rounded-full overflow-hidden'>
                                <div
                                  className='h-full bg-primary transition-all duration-1000'
                                  style={{ width: `${selectedItem.submission?.completionPct ?? 0}%` }}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Deadline Card */}
                        <Card className='rounded-3xl bg-muted/30'>
                          <CardContent className='pt-6'>
                            <div className='flex items-center gap-4'>
                              <div className='size-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center'>
                                <Calendar className='size-6' />
                              </div>
                              <div>
                                <p className='text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest'>Hạn chốt báo cáo</p>
                                <h3 className='font-bold text-lg leading-tight'>
                                  {selectedItem.deadlineTo ? format(new Date(selectedItem.deadlineTo), 'dd/MM/yyyy') : '--'}
                                </h3>
                              </div>
                            </div>
                            <p className='mt-4 text-xs text-muted-foreground leading-relaxed'>
                              Vui lòng nộp báo cáo đúng hạn. Sau ngày này biểu mẫu sẽ bị khóa.
                            </p>
                          </CardContent>
                        </Card>

                        {/* KPI Card */}
                        <Card className='rounded-3xl border-none bg-primary text-primary-foreground shadow-xl shadow-primary/20'>
                          <CardContent className='pt-6'>
                            <div className='flex items-center gap-4'>
                              <div className='size-12 rounded-2xl bg-white/20 flex items-center justify-center'>
                                <TrendingUp className='size-6' />
                              </div>
                              <div>
                                <p className='text-[10px] font-black uppercase text-white/60 tracking-widest'>Tỷ lệ hoàn thành</p>
                                <h3 className='font-bold text-lg leading-tight'>KPI Đơn vị</h3>
                              </div>
                            </div>
                            <div className='mt-4 flex items-baseline gap-1'>
                              <span className='text-3xl font-black'>{selectedItem.submission?.completionPct ?? 0}</span>
                              <span className='text-sm font-bold opacity-60'>%</span>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Rejection Alert */}
                      {selectedItem.submission?.rejectReason && (
                        <div className='flex items-start gap-4 rounded-3xl bg-destructive/5 border border-destructive/10 p-6'>
                          <div className='size-10 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0'>
                            <AlertCircle className='size-5' />
                          </div>
                          <div>
                            <h4 className='text-sm font-black uppercase text-destructive tracking-widest'>Ghi chú từ cấp trên</h4>
                            <p className='mt-2 text-sm text-foreground/80 font-medium leading-relaxed italic'>
                              "{selectedItem.submission.rejectReason}"
                            </p>
                            <p className='mt-4 text-[11px] text-muted-foreground font-bold'>
                              Vui lòng chỉnh sửa lại dữ liệu theo yêu cầu và nộp lại sớm nhất có thể.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Summary Info Grid */}
                      <div className='grid gap-8 pt-4'>
                        <div className='space-y-4'>
                          <h4 className='text-xs font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2'>
                            <LayoutDashboard className='size-3' />
                            Thông tin biểu mẫu
                          </h4>
                          <div className='grid grid-cols-2 gap-x-12 gap-y-6 rounded-3xl border p-8'>
                            <div className='space-y-1'>
                              <p className='text-[11px] font-bold text-muted-foreground/60 uppercase'>Mã biểu mẫu</p>
                              <p className='font-bold'>{selectedItem.form.code}</p>
                            </div>
                            <div className='space-y-1'>
                              <p className='text-[11px] font-bold text-muted-foreground/60 uppercase'>Tên biểu mẫu</p>
                              <p className='font-bold'>{selectedItem.form.name}</p>
                            </div>
                            <div className='space-y-1'>
                              <p className='text-[11px] font-bold text-muted-foreground/60 uppercase'>Loại kỳ báo cáo</p>
                              <p className='font-bold'>{selectedItem.period.type}</p>
                            </div>
                            <div className='space-y-1'>
                              <p className='text-[11px] font-bold text-muted-foreground/60 uppercase'>Tên kỳ báo cáo</p>
                              <p className='font-bold'>{selectedItem.period.name}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value='timeline' className='mt-0'>
                      <Card className='rounded-3xl border-none bg-muted/10 shadow-none'>
                        <CardHeader className='pb-0 pt-0 px-4'>
                          <CardTitle className='text-sm font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2'>
                            <History className='size-4' />
                            Dòng thời gian phê duyệt
                          </CardTitle>
                        </CardHeader>
                        <CardContent className='px-4 pt-6'>
                          {historyQuery.isLoading ? (
                            <div className='flex flex-col items-center justify-center p-12 gap-3 opacity-40'>
                              <div className='size-6 border-2 border-primary border-t-transparent animate-spin rounded-full' />
                              <p className='text-xs font-medium tracking-tight'>Đang tải dữ liệu quy trình...</p>
                            </div>
                          ) : history.length === 0 ? (
                            <div className='flex flex-col items-center justify-center p-12 text-center opacity-30'>
                              <Workflow className='size-10 mb-2' />
                              <p className='text-sm font-medium'>Chưa có lịch sử quy trình</p>
                            </div>
                          ) : (
                            <SubmissionTimeline
                              history={history}
                              onViewSnapshot={handleViewSnapshot}
                              onCompare={handleCompare}
                            />
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </div>
          ) : (
            <div className='flex flex-1 flex-col items-center justify-center text-muted-foreground p-12 text-center'>
              <div className='mb-6 flex size-24 items-center justify-center rounded-[2.5rem] bg-muted/20 animate-pulse'>
                <LayoutDashboard className='size-10 opacity-20' />
              </div>
              <h3 className='text-lg font-bold text-foreground/70'>Sẵn sàng kiểm tra nhiệm vụ</h3>
              <p className='max-w-[300px] mt-2 text-sm leading-relaxed opacity-60'>
                Hãy chọn một bản báo cáo từ danh sách bên trái để bắt đầu nhập liệu hoặc xem tiến trình phê duyệt.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals & Dialogs */}
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent className='sm:max-w-[500px] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl'>
          <DialogHeader className='px-8 pt-8'>
            <DialogTitle className='text-2xl font-black flex items-center gap-3 text-destructive'>
              <XCircle className='size-7' />
              Từ chối bản nộp
            </DialogTitle>
            <DialogDescription className='text-sm pt-2 font-medium leading-relaxed'>
              Báo cáo này sẽ được gửi trả lại cho người lập biểu để chỉnh sửa. Vui lòng ghi rõ lý do.
            </DialogDescription>
          </DialogHeader>
          <div className='px-8 py-6'>
            <div className='space-y-3'>
              <Label htmlFor='reason' className='text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1'>
                Lý do trả lại chi tiết
              </Label>
              <Textarea
                id='reason'
                placeholder='Ví dụ: Số liệu doanh thu tháng này chưa khớp với hóa đơn, vui lòng kiểm tra lại...'
                className='min-h-[140px] rounded-2xl border-muted bg-muted/20 focus-visible:ring-destructive/20 p-4 text-sm'
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className='px-8 pb-8 flex sm:justify-between gap-3'>
            <Button
              variant='ghost'
              className='rounded-xl font-bold px-6'
              onClick={() => setIsRejectModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              variant='destructive'
              className='rounded-xl px-8 font-black shadow-lg shadow-destructive/20'
              onClick={confirmReject}
              disabled={rejectDept.isPending}
            >
              {rejectDept.isPending ? 'Đang thực hiện...' : 'Xác nhận trả lại'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isApproveModalOpen} onOpenChange={setIsApproveModalOpen}>
        <DialogContent className='sm:max-w-[420px] rounded-[2rem] p-8 border-none shadow-2xl'>
          <DialogHeader>
            <div className='mx-auto size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4'>
              <CheckCircle2 className='size-10' />
            </div>
            <DialogTitle className='text-2xl font-black text-center text-foreground'>
              Phê duyệt dữ liệu
            </DialogTitle>
            <DialogDescription className='text-sm text-center font-medium leading-relaxed pt-2'>
              Bạn đã kiểm tra kỹ số liệu chưa? Hành động này sẽ khóa dữ liệu tại cấp đơn vị và chuyển lên cấp trên.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='mt-8 flex flex-col sm:flex-row gap-3'>
            <Button
              variant='ghost'
              className='flex-1 rounded-xl font-bold h-12'
              onClick={() => setIsApproveModalOpen(false)}
            >
              Xem lại
            </Button>
            <Button
              className='flex-1 rounded-xl font-black h-12 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20'
              onClick={confirmApprove}
              disabled={approveDept.isPending}
            >
              {approveDept.isPending ? 'Đang duyệt...' : 'Đồng ý duyệt'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SubmissionDiffModal
        isOpen={isDiffModalOpen}
        onClose={() => setIsDiffModalOpen(false)}
        oldSnapshot={oldSnapshot}
        newSnapshot={newSnapshot}
        title={oldSnapshot ? 'So sánh thay đổi dữ liệu' : 'Chi tiết dữ liệu tại thời điểm này'}
      />

      <ConfirmDialog
        open={isCancelConfirmOpen}
        onOpenChange={(open) => {
          setIsCancelConfirmOpen(open)
          if (!open) {
            setCancelSubmitId(null)
          }
        }}
        title={
          <span className='flex items-center gap-2 text-destructive'>
            <RotateCcw className='size-5' />
            Thu hồi báo cáo
          </span>
        }
        desc='Báo cáo sẽ được đưa về trạng thái "Đang nhập" để bạn chỉnh sửa lại nội dung trước khi nộp lại.'
        cancelBtnText='Đóng'
        confirmText={isCanceling ? 'Đang thu hồi...' : 'Xác nhận thu hồi'}
        destructive
        isLoading={isCanceling}
        handleConfirm={confirmCancelSubmit}
        className='sm:max-w-[420px]'
      />
    </div>
  )
}
