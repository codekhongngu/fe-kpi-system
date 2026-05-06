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
import { formManagementApi } from '@/features/form-management/api/mock-form-management-api'
import type { FormTemplate, PeriodType } from '@/features/form-management/api/types'
import { reportManagementApi } from '../api/mock-report-management-api'
import { type ReportInstance, type ReportStatus } from '../api/types'

const periodTypeLabel: Record<PeriodType, string> = {
  TUAN: 'Tuần',
  THANG: 'Tháng',
  QUY: 'Quý',
  NAM: 'Năm',
}

const EMPTY_REPORTS: ReportInstance[] = []

const statusLabel: Record<ReportStatus, string> = {
  NOT_STARTED: 'Chưa nhập',
  DRAFT: 'Lưu nháp',
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  OVERDUE: 'Quá hạn',
}

function statusVariant(status: ReportStatus): 'default' | 'destructive' | 'secondary' | 'outline' {
  if (status === 'APPROVED') {
    return 'default'
  }
  if (status === 'OVERDUE' || status === 'REJECTED') {
    return 'destructive'
  }
  if (status === 'PENDING') {
    return 'outline'
  }
  return 'secondary'
}

function effectiveStatus(report: ReportInstance): ReportStatus {
  if (
    report.status !== 'APPROVED' &&
    report.status !== 'PENDING' &&
    report.status !== 'REJECTED' &&
    report.dueDate
  ) {
    const due = new Date(report.dueDate)
    if (!Number.isNaN(due.getTime()) && due.getTime() < Date.now()) {
      return 'OVERDUE'
    }
  }
  return report.status
}

const statusPriority: Record<ReportStatus, number> = {
  OVERDUE: 6,
  REJECTED: 5,
  PENDING: 4,
  DRAFT: 3,
  NOT_STARTED: 2,
  APPROVED: 1,
}

export function ReportsListTab() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [quickStatus, setQuickStatus] = useState<'all' | ReportStatus>('all')

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedSearch(search.trim()), 350)
    return () => window.clearTimeout(handle)
  }, [search])

  const reportsQuery = useQuery({
    queryKey: [
      'report-management',
      'reports',
      {
        q: debouncedSearch,
      },
    ],
    queryFn: () =>
      reportManagementApi.listReports({
        keyword: debouncedSearch.length > 0 ? debouncedSearch : undefined,
        formTemplateId: 'all',
        reportPeriodId: 'all',
        status: 'all',
        unitId: 'all',
      }),
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
      const current = map.get(report.unitId)
      if (!current || statusPriority[status] > statusPriority[current]) {
        map.set(report.unitId, status)
      }
    })
    return map
  }, [reports])

  const statusCounts = useMemo(() => {
    const initial = {
      APPROVED: 0,
      PENDING: 0,
      DRAFT: 0,
      OVERDUE: 0,
      REJECTED: 0,
      NOT_STARTED: 0,
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
            <CardDescription>Giao báo cáo, theo dõi tiến độ nộp và hỗ trợ nhắc nhở các đơn vị.</CardDescription>
          </div>

          <div className='grid grid-cols-1 gap-6 lg:grid-cols-12'>
            <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:col-span-8 lg:grid-cols-5'>
              <div className='rounded-xl border bg-background p-4 text-sm'>
                <p className='text-muted-foreground'>Tổng đơn vị</p>
                <div className='mt-2 flex items-end justify-between'>
                  <p className='text-3xl font-semibold tracking-tight'>{totalUnits}</p>
                </div>
              </div>
              <div className='rounded-xl border bg-background p-4 text-sm'>
                <p className='text-muted-foreground'>Approved</p>
                <div className='mt-2 flex items-end justify-between'>
                  <p className='text-3xl font-semibold tracking-tight text-primary'>{statusCounts.APPROVED}</p>
                  <span className='rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary'>
                    {percentOfTotal(statusCounts.APPROVED)}
                  </span>
                </div>
              </div>
              <div className='rounded-xl border bg-background p-4 text-sm'>
                <p className='text-muted-foreground'>Pending</p>
                <div className='mt-2 flex items-end justify-between'>
                  <p className='text-3xl font-semibold tracking-tight'>{statusCounts.PENDING}</p>
                  <span className='rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground'>
                    {percentOfTotal(statusCounts.PENDING)}
                  </span>
                </div>
              </div>
              <div className='rounded-xl border bg-background p-4 text-sm'>
                <p className='text-muted-foreground'>Draft</p>
                <div className='mt-2 flex items-end justify-between'>
                  <p className='text-3xl font-semibold tracking-tight text-muted-foreground'>{statusCounts.DRAFT}</p>
                  <span className='rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground'>
                    {percentOfTotal(statusCounts.DRAFT)}
                  </span>
                </div>
              </div>
              <div className='rounded-xl border border-destructive/30 bg-background p-4 text-sm'>
                <p className='text-destructive'>Overdue</p>
                <div className='mt-2 flex items-end justify-between'>
                  <p className='text-3xl font-semibold tracking-tight text-destructive'>{statusCounts.OVERDUE}</p>
                </div>
              </div>
            </div>

            <div className='rounded-xl border bg-background p-4 lg:col-span-4'>
              <div className='pb-4'>
                <div className='text-sm font-semibold'>Bộ lọc nhanh</div>
              </div>
              <div className='flex flex-wrap gap-2'>
                <Button size='sm' variant={quickStatus === 'all' ? 'default' : 'outline'} onClick={() => setQuickStatus('all')}>
                  Tất cả
                </Button>
                <Button size='sm' variant={quickStatus === 'APPROVED' ? 'default' : 'outline'} onClick={() => setQuickStatus('APPROVED')}>
                  Approved ({statusCounts.APPROVED})
                </Button>
                <Button size='sm' variant={quickStatus === 'PENDING' ? 'default' : 'outline'} onClick={() => setQuickStatus('PENDING')}>
                  Pending ({statusCounts.PENDING})
                </Button>
                <Button size='sm' variant={quickStatus === 'DRAFT' ? 'default' : 'outline'} onClick={() => setQuickStatus('DRAFT')}>
                  Draft ({statusCounts.DRAFT})
                </Button>
                <Button size='sm' variant={quickStatus === 'OVERDUE' ? 'destructive' : 'outline'} onClick={() => setQuickStatus('OVERDUE')}>
                  Overdue ({statusCounts.OVERDUE})
                </Button>
                <Button size='sm' variant={quickStatus === 'REJECTED' ? 'default' : 'outline'} onClick={() => setQuickStatus('REJECTED')}>
                  Rejected ({statusCounts.REJECTED})
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
            <CardDescription>Danh sách báo cáo phục vụ giao và theo dõi tiến độ.</CardDescription>
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
                    <TableCell colSpan={6} className='h-20 text-center text-sm text-muted-foreground'>
                      Đang tải danh sách biểu mẫu...
                    </TableCell>
                  </TableRow>
                )}
                {templatesQuery.isError && (
                  <TableRow>
                    <TableCell colSpan={6} className='h-20 text-center text-sm text-destructive'>
                      Không tải được danh sách biểu mẫu.
                    </TableCell>
                  </TableRow>
                )}
                {!templatesQuery.isLoading && !templatesQuery.isError && templates.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className='h-20 text-center text-sm text-muted-foreground'>
                      Không có biểu mẫu phù hợp.
                    </TableCell>
                  </TableRow>
                )}
                {!templatesQuery.isLoading &&
                  !templatesQuery.isError &&
                  templates.map((template: FormTemplate) => (
                    <TableRow key={template.id}>
                      <TableCell className='font-medium'>{template.code}</TableCell>
                      <TableCell>
                        <div>{template.name}</div>
                        <div className='text-xs text-muted-foreground'>{template.description}</div>
                      </TableCell>
                      <TableCell>{template.fieldCategoryName ?? template.fieldCategoryId}</TableCell>
                      <TableCell>{periodTypeLabel[template.periodType ?? 'THANG']}</TableCell>
                      <TableCell>
                        <Badge variant={template.isActive ? 'default' : 'secondary'}>
                          {template.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-right'>
                        <div className='flex justify-end gap-2'>
                          <Button
                            size='sm'
                            variant='outline'
                          asChild
                          >
                          <Link to='/form-management/details/$templateId' params={{ templateId: template.id }}>
                            <Settings2 />
                            Cấu hình
                          </Link>
                          </Button>
                          <Button size='sm' variant='outline' asChild>
                          <Link to='/report-management' search={{ tab: 'assignment', templateId: template.id }}>
                            Giao
                          </Link>
                          </Button>
                          <Button
                            size='sm'
                            variant='outline'
                          onClick={() => toast.message('Chức năng tổng hợp đang được phát triển.')}
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
