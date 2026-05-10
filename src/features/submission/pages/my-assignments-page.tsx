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
} from 'lucide-react'
import { format } from 'date-fns'

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
import { PageBreadcrumb } from '@/components/page-breadcrumb'
import { useDebounceCallback } from '@/hooks/use-debounce-callback'

import {
  useMyAssignments,
  useCancelSubmit,
} from '../hooks/use-my-assignments'
import type { SubmissionStatus } from '../api/types'
import { DataTablePagination } from '@/components/data-table/data-table-pagination'

function getStatusInfo(
  status: SubmissionStatus | null | undefined,
  deadlineTo: string
) {
  const isOverdue = new Date(deadlineTo) < new Date() && status !== 'APPROVED'

  if (isOverdue && status !== 'PENDING') {
    return {
      label: 'Quá hạn',
      variant: 'destructive' as const,
      icon: AlertCircle,
    }
  }

  switch (status) {
    case 'APPROVED':
      return {
        label: 'Đã duyệt',
        variant: 'default' as const,
        icon: CheckCircle2,
        className: 'bg-green-500 hover:bg-green-600',
      }
    case 'PENDING':
      return {
        label: 'Chờ duyệt',
        variant: 'secondary' as const,
        icon: Clock,
        className: 'bg-yellow-500 hover:bg-yellow-600 text-white',
      }
    case 'REJECTED':
      return {
        label: 'Bị trả lại',
        variant: 'destructive' as const,
        icon: AlertCircle,
      }
    case 'DRAFT':
      return { label: 'Đang nhập', variant: 'outline' as const, icon: FileText }
    default:
      return {
        label: 'Chưa bắt đầu',
        variant: 'secondary' as const,
        icon: FileText,
      }
  }
}

type AssignmentFilterStatus =
  | 'all'
  | 'NOT_STARTED'
  | 'DRAFT'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'OVERDUE'

export function MyAssignmentsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] =
    useState<AssignmentFilterStatus>('all')
  const [periodTypeFilter, setPeriodTypeFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

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

  const handleCancelSubmit = (submissionId: string) => {
    if (confirm('Bạn có chắc chắn muốn thu hồi báo cáo này để sửa lại?')) {
      cancelSubmit(submissionId)
    }
  }

  const items = data?.items || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / 10)

  return (
    <div className='flex flex-col gap-6 p-6'>
      <div className='flex items-center justify-between'>
        <PageBreadcrumb
          title='Danh sách giao việc'
          subtitle='Quản lý và thực hiện các báo cáo được giao'
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc tìm kiếm</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex flex-col justify-between gap-4 sm:flex-row'>
            <div className='flex flex-1 flex-col gap-4 sm:flex-row'>
              <div className='relative w-full sm:w-[300px]'>
                <Search className='absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground' />
                <Input
                  type='search'
                  placeholder='Tìm theo tên biểu mẫu...'
                  className='pl-8'
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    handleSearch(e.target.value)
                  }}
                />
              </div>

              <Select
                value={periodTypeFilter}
                onValueChange={(v) => {
                  setPeriodTypeFilter(v)
                  setPage(1)
                }}
              >
                <SelectTrigger className='w-full sm:w-[180px]'>
                  <SelectValue placeholder='Loại kỳ báo cáo' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tất cả kỳ</SelectItem>
                  <SelectItem value='NAM'>Năm</SelectItem>
                  <SelectItem value='QUY'>Quý</SelectItem>
                  <SelectItem value='THANG'>Tháng</SelectItem>
                  <SelectItem value='TUAN'>Tuần</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v as AssignmentFilterStatus)
                  setPage(1)
                }}
              >
                <SelectTrigger className='w-full sm:w-[180px]'>
                  <SelectValue placeholder='Trạng thái' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tất cả trạng thái</SelectItem>
                  <SelectItem value='NOT_STARTED'>Chưa bắt đầu</SelectItem>
                  <SelectItem value='DRAFT'>Chưa nộp</SelectItem>
                  <SelectItem value='PENDING'>Chờ duyệt</SelectItem>
                  <SelectItem value='APPROVED'>Đã duyệt</SelectItem>
                  <SelectItem value='REJECTED'>Bị trả lại</SelectItem>
                  <SelectItem value='OVERDUE'>Quá hạn</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên biểu mẫu</TableHead>
                  <TableHead>Kỳ báo cáo</TableHead>
                  <TableHead>Hạn nộp</TableHead>
                  <TableHead>Tiến độ</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className='text-right'>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className='h-24 text-center'>
                      Đang tải dữ liệu...
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className='h-24 text-center'>
                      Không tìm thấy báo cáo nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => {
                    const statusInfo = getStatusInfo(
                      item.submission?.status,
                      item.deadlineTo
                    )
                    const StatusIcon = statusInfo.icon
                    const isDraftOrRejected =
                      !item.submission?.status ||
                      item.submission.status === 'DRAFT' ||
                      item.submission.status === 'REJECTED'

                    const isPending = item.submission?.status === 'PENDING'

                    return (
                      <TableRow key={item.assignmentId}>
                        <TableCell className='font-medium'>
                          {item.form.name}
                        </TableCell>
                        <TableCell>{item.period.name}</TableCell>
                        <TableCell>
                          {format(new Date(item.deadlineTo), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell>
                          <span className='text-sm text-muted-foreground'>
                            {item.submission?.completionPct ?? 0}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={statusInfo.variant}
                            className={statusInfo.className}
                          >
                            <StatusIcon className='mr-1 h-3 w-3' />
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className='text-right'>
                          <div className='flex justify-end gap-2'>
                            {isDraftOrRejected ? (
                              <Button variant='outline' size='sm' asChild>
                                <Link
                                  to='/my/assignments/$assignmentId/input'
                                  params={{
                                    assignmentId: item.assignmentId,
                                  }}
                                >
                                  <Pencil className='mr-2 h-4 w-4' />
                                  Nhập liệu
                                </Link>
                              </Button>
                            ) : (
                              <Button variant='outline' size='sm' asChild>
                                <Link
                                  to='/my/assignments/$assignmentId/input'
                                  params={{
                                    assignmentId: item.assignmentId,
                                  }}
                                >
                                  <Eye className='mr-2 h-4 w-4' />
                                  Xem chi tiết
                                </Link>
                              </Button>
                            )}

                            {isPending && item.submission?.id && (
                              <Button
                                variant='outline'
                                size='sm'
                                onClick={() =>
                                  handleCancelSubmit(item.submission!.id)
                                }
                                disabled={isCanceling}
                              >
                                <RotateCcw className='mr-2 h-4 w-4' />
                                Hủy nộp
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <DataTablePagination
            page={page}
            pageSize={limit}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={(s) => {
              setLimit(s)
              setPage(1)
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
