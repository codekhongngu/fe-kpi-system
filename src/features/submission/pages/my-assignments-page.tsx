import { useState, useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Search,
  Pencil,
  Eye,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Workflow,
  Calendar,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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

import {
  useMyAssignments,
  useCancelSubmit,
  useSubmissionHistory,
} from '../hooks/use-my-assignments'
import { useApproveDepartment, useRejectDepartment } from '../hooks/use-approvals'
import type { SubmissionStatus } from '../api/types'
import { DataTablePagination } from '@/components/data-table/data-table-pagination'
import { getSubmissionStatusInfo } from '../utils/submission-status'


type AssignmentFilterStatus =
  | 'all'
  | 'NOT_STARTED'
  | 'DRAFTING'
  | 'PENDING_DEPARTMENT'
  | 'DEPARTMENT_APPROVED'
  | 'DISTRICT_APPROVED'
  | 'REJECTED_DEPARTMENT'
  | 'REJECTED_DISTRICT'
  | 'OVERDUE'

export function MyAssignmentsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] =
    useState<AssignmentFilterStatus>('all')
  const [periodTypeFilter, setPeriodTypeFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false)
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [approvingId, setApprovingId] = useState<string | null>(null)

  const handleSearch = useDebounceCallback((val: string) => {
    setDebouncedSearch(val)
    setPage(1)
  }, 500)

  const { data, isLoading } = useMyAssignments({
    q: debouncedSearch || undefined,
    status:
      statusFilter === 'all' || statusFilter === 'OVERDUE'
        ? undefined
        : statusFilter,
    overdue: statusFilter === 'OVERDUE' ? true : undefined,
    periodType: periodTypeFilter === 'all' ? undefined : periodTypeFilter,
    page,
    limit,
  })

  const { mutate: cancelSubmit, isPending: isCanceling } = useCancelSubmit()
  const approveDept = useApproveDepartment()
  const rejectDept = useRejectDepartment()

  const historyQuery = useSubmissionHistory(selectedId)
  const history = historyQuery.data || []

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

  const handleCancelSubmit = (submissionId: string) => {
    if (confirm('Bạn có chắc chắn muốn thu hồi báo cáo này để sửa lại?')) {
      cancelSubmit(submissionId)
    }
  }

  const items = data?.items || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / 10)

  const selectedItem = items.find((i) => i.assignmentId === selectedId)

  return (
    <div className='flex h-[calc(100vh-64px)] flex-col gap-0'>
      <div className='border-b bg-background px-6 py-4'>
        <PageBreadcrumb
          title='Nhiệm vụ & Phê duyệt đơn vị'
          subtitle='Theo dõi nhiệm vụ nhập liệu và phê duyệt cấp đơn vị'
        />
      </div>

      <div className='flex flex-1 overflow-hidden'>
        {/* Sidebar: Master List */}
        <div className='flex w-full flex-col border-e bg-muted/20 md:w-[400px]'>
          <div className='space-y-4 border-b bg-background p-4'>
            <div className='relative'>
              <Search className='absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Tìm báo cáo...'
                className='pl-8'
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  handleSearch(e.target.value)
                }}
              />
            </div>
            <div className='flex gap-2'>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v as AssignmentFilterStatus)
                  setPage(1)
                }}
              >
                <SelectTrigger className='h-8 text-xs'>
                  <SelectValue placeholder='Trạng thái' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tất cả trạng thái</SelectItem>
                  <SelectItem value='NOT_STARTED'>Chưa bắt đầu</SelectItem>
                  <SelectItem value='DRAFTING'>Đang biên tập</SelectItem>
                  <SelectItem value='PENDING_DEPARTMENT'>Chờ phòng duyệt</SelectItem>
                  <SelectItem value='DEPARTMENT_APPROVED'>Phòng đã duyệt</SelectItem>
                  <SelectItem value='DISTRICT_APPROVED'>Xã đã chốt số</SelectItem>
                  <SelectItem value='REJECTED_DEPARTMENT'>Phòng trả lại</SelectItem>
                  <SelectItem value='REJECTED_DISTRICT'>Xã trả lại</SelectItem>
                  <SelectItem value='OVERDUE'>Quá hạn</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='flex-1 overflow-y-auto'>
            {isLoading ? (
              <div className='p-8 text-center text-sm text-muted-foreground'>
                Đang tải...
              </div>
            ) : items.length === 0 ? (
              <div className='p-8 text-center text-sm text-muted-foreground'>
                Không có dữ liệu
              </div>
            ) : (
              <div className='divide-y'>
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
                        'flex w-full flex-col gap-3 p-5 text-left transition-all duration-200 border-l-4',
                        isActive
                          ? 'bg-primary/5 border-primary shadow-sm ring-1 ring-inset ring-primary/10'
                          : 'border-transparent hover:bg-muted/50 hover:border-muted-foreground/20'
                      )}
                      onClick={() => setSelectedId(item.assignmentId)}
                    >
                      <div className='flex items-start justify-between gap-4'>
                        <div className='space-y-1'>
                          <div className='text-[10px] font-bold text-teal-700 uppercase tracking-widest opacity-70'>
                            {item.form.code}
                          </div>
                          <span className={cn(
                            'text-sm font-bold leading-tight line-clamp-2',
                            isActive ? 'text-primary' : 'text-foreground'
                          )}>
                            {item.form.name}
                          </span>
                        </div>
                        <Badge
                          variant={statusInfo.variant}
                          className={cn('shrink-0 whitespace-nowrap px-2 py-0 h-6 text-[10px] font-bold uppercase tracking-wider', statusInfo.className)}
                        >
                          <StatusIcon className='mr-1 size-3' />
                          {statusInfo.label}
                        </Badge>
                      </div>

                      <div className='flex items-center justify-between text-[11px] font-medium text-muted-foreground'>
                        <div className='flex items-center gap-2'>
                          <Calendar className='size-3' />
                          Hạn: {item.deadlineTo ? format(new Date(item.deadlineTo), 'dd/MM/yyyy') : '--'}
                        </div>
                        <div className='flex items-center gap-1.5'>
                          <div className='size-1.5 rounded-full bg-muted-foreground/30' />
                          {item.period.name}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className='border-t bg-background p-2'>
            <div className='flex items-center justify-between px-2 py-1'>
              <div className='text-[11px] text-muted-foreground'>
                Tổng: <strong>{total}</strong>
              </div>
              <div className='flex items-center gap-1'>
                <Button
                  variant='outline'
                  size='icon'
                  className='size-7'
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronLeft className='size-4' />
                </Button>
                <div className='text-[11px] font-medium'>
                  {page} / {Math.ceil(total / limit) || 1}
                </div>
                <Button
                  variant='outline'
                  size='icon'
                  className='size-7'
                  disabled={page >= Math.ceil(total / limit)}
                  onClick={() => setPage(p => p + 1)}
                >
                  <ChevronRight className='size-4' />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content: Detail View */}
        <div className='flex flex-1 flex-col overflow-hidden bg-background'>
          {selectedItem ? (
            <div className='flex flex-1 flex-col overflow-hidden'>
              <div className='flex items-center justify-between border-b px-6 py-4'>
                <div>
                  <h2 className='text-xl font-bold'>{selectedItem.form.name}</h2>
                  <p className='text-sm text-muted-foreground'>
                    Kỳ báo cáo: {selectedItem.period.name} | Hạn nộp: {format(new Date(selectedItem.deadlineTo), 'dd/MM/yyyy')}
                  </p>
                </div>
                <div className='flex flex-wrap gap-2'>
                  <Button variant='outline' size='sm' asChild>
                    <Link
                      to='/my/assignments/$assignmentId/input'
                      params={{ assignmentId: selectedItem.assignmentId }}
                    >
                      {['PENDING_DEPARTMENT', 'DEPARTMENT_APPROVED', 'DISTRICT_APPROVED'].includes(selectedItem.submission?.status || '') ? (
                        <>
                          <Eye className='mr-2 h-4 w-4' />
                          Xem dữ liệu
                        </>
                      ) : (
                        <>
                          <Pencil className='mr-2 h-4 w-4' />
                          Nhập liệu
                        </>
                      )}
                    </Link>
                  </Button>

                  {/* Nhóm hành động Cấp Phòng */}
                  {selectedItem.submission?.status === 'PENDING_DEPARTMENT' && (
                    <>
                      <Button
                        size='sm'
                        className='bg-blue-600 hover:bg-blue-700'
                        onClick={() => handleApproveDept(selectedItem.submission!.id)}
                        disabled={approveDept.isPending}
                      >
                        <CheckCircle className='mr-2 h-4 w-4' />
                        Duyệt Cấp Phòng
                      </Button>
                      <Button
                        variant='destructive'
                        size='sm'
                        onClick={() => handleRejectDept(selectedItem.submission!.id)}
                        disabled={rejectDept.isPending}
                      >
                        <XCircle className='mr-2 h-4 w-4' />
                        Trả lại
                      </Button>
                    </>
                  )}


                  {/* Hủy nộp (Staff) */}
                  {selectedItem.submission?.status === 'PENDING_DEPARTMENT' && (
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handleCancelSubmit(selectedItem.submission!.id)}
                      disabled={isCanceling}
                    >
                      <RotateCcw className='mr-2 h-4 w-4' />
                      Hủy nộp
                    </Button>
                  )}
                </div>
              </div>

              <div className='flex-1 overflow-y-auto p-6'>
                <div className='grid gap-6 lg:grid-cols-3'>
                  <div className='lg:col-span-2 space-y-6'>
                    <Card className='rounded-2xl'>
                      <CardHeader>
                        <CardTitle className='text-base'>Trạng thái bản nộp</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className='flex items-center gap-4 rounded-xl border bg-muted/10 p-4'>
                          <div className='flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary'>
                            <FileText className='size-6' />
                          </div>
                          <div className='flex-1'>
                            <div className='text-sm font-bold uppercase tracking-tight'>
                              {getSubmissionStatusInfo(selectedItem.submission?.status, selectedItem.deadlineTo).label}
                            </div>
                            <div className='text-xs text-muted-foreground'>
                              Tiến độ nhập liệu: {selectedItem.submission?.completionPct ?? 0}%
                            </div>
                          </div>
                          <div className='w-32'>
                            <div className='h-2 w-full overflow-hidden rounded-full bg-muted'>
                              <div
                                className='h-full bg-primary transition-all'
                                style={{ width: `${selectedItem.submission?.completionPct ?? 0}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className='rounded-2xl'>
                      <CardHeader className='border-b bg-muted/5 py-4'>
                        <CardTitle className='text-base text-primary flex items-center gap-2'>
                          <Workflow className='size-4 text-primary' />
                          Lịch sử phản hồi & Quy trình
                        </CardTitle>
                      </CardHeader>
                      <CardContent className='pt-6'>
                        {historyQuery.isLoading ? (
                          <div className='flex justify-center p-4'>Đang tải...</div>
                        ) : history?.length === 0 ? (
                          <div className='text-center py-8 text-muted-foreground italic text-sm'>
                            Chưa có lịch sử phê duyệt cho bản nộp này.
                          </div>
                        ) : (
                          <div className='relative ml-4 space-y-6 border-l-2 border-muted pl-6'>
                            {history?.map((h: any, idx: number) => (
                              <div key={h.id || idx} className='relative'>
                                <div className='absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-background ring-2 ring-muted'>
                                  <div className={cn(
                                    'h-2 w-2 rounded-full',
                                    h.action === 'APPROVE' ? 'bg-green-500' : 'bg-red-500'
                                  )} />
                                </div>
                                <div className='flex flex-col gap-1'>
                                  <div className='flex items-center justify-between'>
                                    <span className='text-sm font-bold'>{h.user_name}</span>
                                    <span className='text-[10px] text-muted-foreground'>
                                      {h.created_at ? format(new Date(h.created_at), 'HH:mm - dd/MM/yyyy') : '---'}
                                    </span>
                                  </div>
                                  <div className='text-xs font-medium'>
                                    <span className={cn(
                                      'mr-2',
                                      h.action === 'APPROVE' ? 'text-green-600' : 'text-red-600'
                                    )}>
                                      {h.action === 'APPROVE' ? 'Đã duyệt' : 'Đã trả lại'}
                                    </span>
                                    <Badge variant='outline' className='text-[9px] h-4 px-1 uppercase'>
                                      {h.approval_level === 'DEPARTMENT' ? 'Cấp Phòng' : 'Cấp Xã'}
                                    </Badge>
                                  </div>
                                  {h.reject_reason && (
                                    <div className='mt-2 rounded-lg bg-red-50/50 p-3 text-xs text-red-700 border border-red-100'>
                                      <strong>Lý do:</strong> {h.reject_reason}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {selectedItem.submission?.rejectReason && (
                          <div className='mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-800 border border-amber-100'>
                            <div className='flex items-center gap-2 font-bold text-amber-900'>
                              <AlertCircle className='size-4' />
                              Lưu ý từ người duyệt mới nhất
                            </div>
                            <div className='mt-1 opacity-90'>
                              {selectedItem.submission.rejectReason}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <div className='space-y-6'>
                    <Card className='rounded-2xl border-teal-100 bg-teal-50/30'>
                      <CardHeader>
                        <CardTitle className='text-sm font-bold uppercase'>Thông báo</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className='text-xs leading-relaxed text-muted-foreground'>
                          Vui lòng hoàn thành báo cáo trước ngày <strong>{format(new Date(selectedItem.deadlineTo), 'dd/MM/yyyy')}</strong>.
                          Sau thời gian này, hệ thống sẽ tự động khóa và đánh dấu quá hạn.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className='flex flex-1 flex-col items-center justify-center text-muted-foreground'>
              <div className='mb-4 flex size-20 items-center justify-center rounded-full bg-muted/30'>
                <FileText className='size-10 opacity-20' />
              </div>
              <p>Chọn một báo cáo từ danh sách bên trái để xem chi tiết</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent className='sm:max-w-[500px] rounded-3xl'>
          <DialogHeader>
            <DialogTitle className='text-xl font-bold flex items-center gap-2 text-destructive'>
              <XCircle className='size-5' />
              Từ chối bản nộp
            </DialogTitle>
            <DialogDescription className='text-sm py-2 italic'>
              Vui lòng cho biết lý do bạn trả lại báo cáo này. Nhân viên nhập liệu sẽ nhận được thông báo để chỉnh sửa.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='reason' className='text-xs font-bold uppercase tracking-wider opacity-70'>
                Lý do trả lại <span className='text-destructive'>*</span>
              </Label>
              <Textarea
                id='reason'
                placeholder='Ví dụ: Số liệu doanh thu tháng này chưa khớp với hóa đơn, vui lòng kiểm tra lại...'
                className='min-h-[120px] rounded-2xl border-muted focus-visible:ring-destructive/20'
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className='gap-2 sm:gap-0'>
            <Button
              variant='ghost'
              className='rounded-xl'
              onClick={() => setIsRejectModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              variant='destructive'
              className='rounded-xl px-8 font-bold'
              onClick={confirmReject}
              disabled={rejectDept.isPending}
            >
              {rejectDept.isPending ? 'Đang xử lý...' : 'Xác nhận từ chối'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isApproveModalOpen} onOpenChange={setIsApproveModalOpen}>
        <DialogContent className='sm:max-w-[400px] rounded-3xl'>
          <DialogHeader>
            <DialogTitle className='text-xl font-bold flex items-center gap-2 text-primary'>
              <CheckCircle2 className='size-5' />
              Xác nhận phê duyệt
            </DialogTitle>
            <DialogDescription className='text-sm py-2'>
              Bạn có chắc chắn muốn phê duyệt bản nộp này không? Hành động này sẽ chuyển báo cáo lên cấp xã để chốt số liệu.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='gap-2 sm:gap-0 mt-4'>
            <Button
              variant='ghost'
              className='rounded-xl'
              onClick={() => setIsApproveModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              className='rounded-xl px-8 font-bold bg-primary hover:bg-primary/90'
              onClick={confirmApprove}
              disabled={approveDept.isPending}
            >
              {approveDept.isPending ? 'Đang xử lý...' : 'Xác nhận duyệt'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
