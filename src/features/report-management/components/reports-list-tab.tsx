import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formManagementApi } from '@/features/form-management/api/template-management-api'
import type {
  FormTemplate,
  PeriodType,
} from '@/features/form-management/api/types'
import { reportCampaignApi } from '../api/report-management-api'
import type { ReportListItem, ReportStatus } from '../api/types'

const periodTypeLabel: Record<PeriodType, string> = {
  TUAN: 'Tuần',
  THANG: 'Tháng',
  QUY: 'Quý',
  NAM: 'Năm',
}

const EMPTY_REPORTS: ReportListItem[] = []

const _statusLabel: Record<ReportStatus, string> = {
  NOT_STARTED: 'Chưa bắt đầu',
  DRAFT: 'Đang nhập',
  PENDING_DEPARTMENT: 'Chờ phòng duyệt',
  DEPARTMENT_APPROVED: 'Chờ xã chốt',
  DISTRICT_APPROVED: 'Đã chốt',
  REJECTED_DEPARTMENT: 'Phòng trả lại',
  REJECTED_DISTRICT: 'Xã trả lại',
  OVERDUE: 'Quá hạn',
  DRAFT: 'Đang nhập',
  DISPATCHED: 'Đã phát hành',
  CLOSED: 'Đã đóng',
  CANCELLED: 'Đã hủy',
}

function _statusVariant(
  status: ReportStatus
): 'default' | 'destructive' | 'secondary' | 'outline' {
  if (status === 'DISTRICT_APPROVED' || status === 'CLOSED') {
    return 'default'
  }
  if (
    status === 'OVERDUE' ||
    status === 'REJECTED_DEPARTMENT' ||
    status === 'REJECTED_DISTRICT' ||
    status === 'CANCELLED'
  ) {
    return 'destructive'
  }
  if (status === 'PENDING_DEPARTMENT' || status === 'DEPARTMENT_APPROVED' || status === 'DISPATCHED') {
    return 'outline'
  }
  return 'secondary'
}

function effectiveStatus(report: ReportListItem): ReportStatus {
  switch (report.status) {
    case 'DRAFT':
      return 'NOT_STARTED'
    case 'DISPATCHED':
      return 'PENDING_DEPARTMENT'
    case 'CLOSED':
      return 'DISTRICT_APPROVED'
    case 'CANCELLED':
      return 'REJECTED_DISTRICT'
    default:
      return report.status as ReportStatus
  }
}

const statusPriority: Record<ReportStatus, number> = {
  OVERDUE: 6,
  REJECTED_DISTRICT: 5,
  REJECTED_DEPARTMENT: 4,
  PENDING_DEPARTMENT: 3,
  DEPARTMENT_APPROVED: 2,
  DISTRICT_APPROVED: 1,
  NOT_STARTED: 0,
  DRAFT: 0,
  DISPATCHED: 0,
  CLOSED: 0,
  CANCELLED: 0,
}

export function ReportsListTab() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [quickStatus, setQuickStatus] = useState<'all' | ReportStatus>('all')

  useEffect(() => {
    const handle = window.setTimeout(
      () => setDebouncedSearch(search.trim()),
      350
    )
    return () => window.clearTimeout(handle)
  }, [search])

  const reportsQuery = useQuery({
    queryKey: [
      'report-management',
      'campaigns',
      {
        q: debouncedSearch,
      },
    ],
    queryFn: async () => {
      const result = await reportCampaignApi.listCampaigns({
        limit: 200,
      })
      return result.items
    },
    retry: false,
  })

  const templatesQuery = useQuery({
    queryKey: ['report-management', 'forms', { q: debouncedSearch }],
    queryFn: () =>
      formManagementApi.listTemplates({
        search: debouncedSearch,
        page: 1,
        limit: 200,
        status: 'all',
        period: '',
        category: '',
      }),
    retry: false,
  })

  const templates = templatesQuery.data?.items ?? []
  const reports = reportsQuery.data ?? EMPTY_REPORTS

  const statusByUnit = useMemo(() => {
    const map = new Map<string, ReportStatus>()
    reports.forEach((report) => {
      const status = effectiveStatus(report)
      const unitId = report.formId || report.id
      const current = map.get(unitId)
      if (!current || statusPriority[status] > statusPriority[current]) {
        map.set(unitId, status)
      }
    })
    return map
  }, [reports])

  const statusCounts = useMemo(() => {
    const initial = {
      PENDING_DEPARTMENT: 0,
      DEPARTMENT_APPROVED: 0,
      DISTRICT_APPROVED: 0,
      REJECTED_DEPARTMENT: 0,
      REJECTED_DISTRICT: 0,
      NOT_STARTED: 0,
      DRAFT: 0,
      OVERDUE: 0,
      DISPATCHED: 0,
      CLOSED: 0,
      CANCELLED: 0,
    } satisfies Record<ReportStatus, number>
    const next = { ...initial }
    statusByUnit.forEach((value) => {
      next[value] += 1
    })
    return next
  }, [statusByUnit])

  const totalUnits = statusByUnit.size

  const percentOfTotal = (value: number) => {
    if (!totalUnits) return '0%'
    return `${Math.round((value / totalUnits) * 100)}%`
  }

  return (
    <>
      <Card>
        <CardHeader className='gap-4'>
          <div>
            <CardTitle>Quản lý báo cáo</CardTitle>
            <CardDescription>
              Giao báo cáo, theo dõi tiến độ nộp và hỗ trợ nhắc nhở các đơn vị.
            </CardDescription>
          </div>

          <div className='grid grid-cols-1 gap-6 lg:grid-cols-12'>
            <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:col-span-8 lg:grid-cols-5'>
              <div className='rounded-xl border bg-background p-4 text-sm'>
                <p className='text-muted-foreground'>Tổng đơn vị</p>
                <div className='mt-2 flex items-end justify-between'>
                  <p className='text-3xl font-semibold tracking-tight'>
                    {totalUnits}
                  </p>
                </div>
              </div>
              <div className='rounded-xl border bg-background p-4 text-sm'>
                <p className='text-muted-foreground'>Chờ xã</p>
                <div className='mt-2 flex items-end justify-between'>
                  <p className='text-3xl font-semibold tracking-tight text-primary'>
                    {statusCounts.DEPARTMENT_APPROVED}
                  </p>
                  <span className='rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary'>
                    {percentOfTotal(statusCounts.DEPARTMENT_APPROVED)}
                  </span>
                </div>
              </div>
              <div className='rounded-xl border bg-background p-4 text-sm'>
                <p className='text-muted-foreground'>Chờ phòng</p>
                <div className='mt-2 flex items-end justify-between'>
                  <p className='text-3xl font-semibold tracking-tight'>
                    {statusCounts.PENDING_DEPARTMENT}
                  </p>
                  <span className='rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground'>
                    {percentOfTotal(statusCounts.PENDING_DEPARTMENT)}
                  </span>
                </div>
              </div>
              <div className='rounded-xl border bg-background p-4 text-sm'>
                <p className='text-muted-foreground'>Chưa bắt đầu</p>
                <div className='mt-2 flex items-end justify-between'>
                  <p className='text-3xl font-semibold tracking-tight text-muted-foreground'>
                    {statusCounts.NOT_STARTED}
                  </p>
                  <span className='rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground'>
                    {percentOfTotal(statusCounts.NOT_STARTED)}
                  </span>
                </div>
              </div>
              <div className='rounded-xl border border-destructive/30 bg-background p-4 text-sm'>
                <p className='text-destructive'>Quá hạn</p>
                <div className='mt-2 flex items-end justify-between'>
                  <p className='text-3xl font-semibold tracking-tight text-destructive'>
                    {statusCounts.OVERDUE}
                  </p>
                </div>
              </div>
            </div>

            <div className='rounded-xl border bg-background p-4 lg:col-span-4'>
              <div className='pb-4'>
                <div className='text-sm font-semibold'>Bộ lọc nhanh</div>
              </div>
              <div className='flex flex-wrap gap-2'>
                <Button
                  size='sm'
                  variant={quickStatus === 'all' ? 'default' : 'outline'}
                  onClick={() => setQuickStatus('all')}
                >
                  Tất cả
                </Button>
                <Button
                  size='sm'
                  variant={
                    quickStatus === 'DEPARTMENT_APPROVED' ? 'default' : 'outline'
                  }
                  onClick={() => setQuickStatus('DEPARTMENT_APPROVED')}
                >
                  Chờ xã ({statusCounts.DEPARTMENT_APPROVED})
                </Button>
                <Button
                  size='sm'
                  variant={
                    quickStatus === 'PENDING_DEPARTMENT' ? 'default' : 'outline'
                  }
                  onClick={() => setQuickStatus('PENDING_DEPARTMENT')}
                >
                  Chờ phòng ({statusCounts.PENDING_DEPARTMENT})
                </Button>
                <Button
                  size='sm'
                  variant={quickStatus === 'NOT_STARTED' ? 'default' : 'outline'}
                  onClick={() => setQuickStatus('NOT_STARTED')}
                >
                  Chưa bắt đầu ({statusCounts.NOT_STARTED})
                </Button>
                <Button
                  size='sm'
                  variant={
                    quickStatus === 'DISTRICT_APPROVED' ? 'default' : 'outline'
                  }
                  onClick={() => setQuickStatus('DISTRICT_APPROVED')}
                >
                  Đã chốt ({statusCounts.DISTRICT_APPROVED})
                </Button>
                <Button
                  size='sm'
                  variant={
                    quickStatus === 'OVERDUE' ? 'destructive' : 'outline'
                  }
                  onClick={() => setQuickStatus('OVERDUE')}
                >
                  Quá hạn ({statusCounts.OVERDUE})
                </Button>
                <Button
                  size='sm'
                  variant={
                    quickStatus === 'REJECTED_DEPARTMENT' ? 'default' : 'outline'
                  }
                  onClick={() => setQuickStatus('REJECTED_DEPARTMENT')}
                >
                  Phòng trả lại ({statusCounts.REJECTED_DEPARTMENT})
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className='overflow-hidden'>
        <CardHeader className='gap-3 sm:flex sm:flex-row sm:items-start sm:justify-between'>
          <div className='min-w-0'>
            <CardTitle className='text-base'>Danh sách báo cáo</CardTitle>
            <CardDescription>
              Danh sách báo cáo phục vụ giao và theo dõi tiến độ.
            </CardDescription>
          </div>
          <div className='w-full sm:w-[320px] sm:shrink-0'>
            <Input
              placeholder='Tìm theo mã, tên...'
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className='p-0'>
          <div className='overflow-hidden border-t'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã biểu mẫu</TableHead>
                  <TableHead>Tên biểu mẫu</TableHead>
                  <TableHead>Lĩnh vực</TableHead>
                  <TableHead>Kỳ</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className='text-right'>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templatesQuery.isLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className='h-20 text-center text-sm text-muted-foreground'
                    >
                      Đang tải danh sách biểu mẫu...
                    </TableCell>
                  </TableRow>
                )}
                {templatesQuery.isError && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className='h-20 text-center text-sm text-destructive'
                    >
                      Không tải được danh sách biểu mẫu.
                    </TableCell>
                  </TableRow>
                )}
                {!templatesQuery.isLoading &&
                  !templatesQuery.isError &&
                  templates.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className='h-20 text-center text-sm text-muted-foreground'
                      >
                        Không có biểu mẫu phù hợp.
                      </TableCell>
                    </TableRow>
                  )}
                {!templatesQuery.isLoading &&
                  !templatesQuery.isError &&
                  templates.map((template: FormTemplate) => (
                    <TableRow key={template.id}>
                      <TableCell className='font-medium'>
                        {template.code}
                      </TableCell>
                      <TableCell>
                        <div>{template.name}</div>
                        <div className='text-xs text-muted-foreground'>
                          {template.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        {template.fieldCategoryName ?? template.fieldCategoryId}
                      </TableCell>
                      <TableCell>
                        {periodTypeLabel[template.periodType ?? 'THANG']}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={template.isActive ? 'default' : 'secondary'}
                        >
                          {template.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-right'>
                        <div className='flex justify-end gap-2'>
                          <Button size='sm' variant='outline' asChild>
                            <Link
                              to='/form-management/details/$templateId'
                              params={{ templateId: template.id }}
                            >
                              <Settings2 />
                              Cấu hình
                            </Link>
                          </Button>
                          <Button size='sm' variant='outline' asChild>
                            <Link
                              to='/report-management'
                              search={{
                                tab: 'assignment',
                                templateId: template.id,
                              }}
                            >
                              Giao
                            </Link>
                          </Button>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() =>
                              toast.message(
                                'Chức năng tổng hợp đang được phát triển.'
                              )
                            }
                          >
                            Tổng hợp
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
