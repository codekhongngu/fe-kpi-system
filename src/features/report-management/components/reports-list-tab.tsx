import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import { reportManagementMockApi } from '../api/mock-report-management-api'
import { reportStatusOptions, type ReportInstance, type ReportStatus } from '../api/types'

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

export function ReportsListTab() {
  const refsQuery = useQuery({
    queryKey: ['report-management', 'refs'],
    queryFn: () => reportManagementMockApi.listReferenceData(),
  })
  const reportsQuery = useQuery({
    queryKey: ['report-management', 'reports'],
    queryFn: () => reportManagementMockApi.listReports(),
  })
  const summaryQuery = useQuery({
    queryKey: ['report-management', 'summary'],
    queryFn: () => reportManagementMockApi.getSummary(),
  })

  const reports = reportsQuery.data ?? EMPTY_REPORTS
  const forms = refsQuery.data?.forms ?? []
  const periods = refsQuery.data?.periods ?? []
  const units = refsQuery.data?.units ?? []

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | ReportStatus>('all')
  const [formTemplateId, setFormTemplateId] = useState('all')
  const [reportPeriodId, setReportPeriodId] = useState('all')
  const [unitId, setUnitId] = useState('all')

  const filteredReports = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return reports
      .filter((report) => {
        const matchesKeyword =
          !keyword ||
          [report.formTemplateName, report.unitName, report.reportPeriodName].some((value) =>
            value.toLowerCase().includes(keyword)
          )
        const matchesStatus = status === 'all' || report.status === status
        const matchesForm = formTemplateId === 'all' || report.formTemplateId === formTemplateId
        const matchesPeriod = reportPeriodId === 'all' || report.reportPeriodId === reportPeriodId
        const matchesUnit = unitId === 'all' || report.unitId === unitId
        return (
          matchesKeyword && matchesStatus && matchesForm && matchesPeriod && matchesUnit
        )
      })
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  }, [search, status, formTemplateId, reportPeriodId, unitId, reports])

  const summary = summaryQuery.data

  return (
    <Card>
      <CardHeader className='gap-4'>
        <div>
          <CardTitle>Danh sách báo cáo</CardTitle>
          <CardDescription>
            Theo dõi báo cáo theo trạng thái nghiệp vụ, ưu tiên gần hạn và quá hạn.
          </CardDescription>
        </div>

        <div className='grid gap-2 sm:grid-cols-2 xl:grid-cols-5'>
          <Input
            placeholder='Tìm theo biểu mẫu, kỳ, đơn vị...'
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select value={status} onValueChange={(value: 'all' | ReportStatus) => setStatus(value)}>
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Trạng thái' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Tất cả trạng thái</SelectItem>
              {reportStatusOptions.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={formTemplateId} onValueChange={setFormTemplateId}>
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Biểu mẫu' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Tất cả biểu mẫu</SelectItem>
              {forms.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.code} - {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={reportPeriodId} onValueChange={setReportPeriodId}>
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Kỳ báo cáo' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Tất cả kỳ báo cáo</SelectItem>
              {periods.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.code} - {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={unitId} onValueChange={setUnitId}>
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Đơn vị' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Tất cả đơn vị</SelectItem>
              {units.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.code} - {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {summary && (
          <div className='grid gap-2 sm:grid-cols-2 xl:grid-cols-4'>
            <div className='rounded-md border p-3 text-sm'>
              <p className='text-muted-foreground'>Tổng báo cáo</p>
              <p className='text-xl font-semibold'>{summary.total}</p>
            </div>
            <div className='rounded-md border p-3 text-sm'>
              <p className='text-muted-foreground'>Chờ duyệt</p>
              <p className='text-xl font-semibold'>{summary.byStatus.PENDING}</p>
            </div>
            <div className='rounded-md border p-3 text-sm'>
              <p className='text-muted-foreground'>Gần đến hạn</p>
              <p className='text-xl font-semibold'>{summary.nearDueCount}</p>
            </div>
            <div className='rounded-md border p-3 text-sm'>
              <p className='text-muted-foreground'>Quá hạn</p>
              <p className='text-xl font-semibold text-destructive'>{summary.overdueCount}</p>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className='overflow-hidden rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Biểu mẫu</TableHead>
                <TableHead>Đơn vị</TableHead>
                <TableHead>Kỳ báo cáo</TableHead>
                <TableHead>Hạn nộp</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>% hoàn thành</TableHead>
                <TableHead>Lưu gần nhất</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className='h-20 text-center'>
                    Không có dữ liệu báo cáo phù hợp.
                  </TableCell>
                </TableRow>
              )}
              {filteredReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className='font-medium'>{report.formTemplateName}</TableCell>
                  <TableCell>{report.unitName}</TableCell>
                  <TableCell>{report.reportPeriodName}</TableCell>
                  <TableCell>{report.dueDate}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(report.status)}>
                      {statusLabel[report.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{report.completionPercent}%</TableCell>
                  <TableCell>
                    {report.lastSavedAt
                      ? new Date(report.lastSavedAt).toLocaleString('vi-VN')
                      : '--'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
