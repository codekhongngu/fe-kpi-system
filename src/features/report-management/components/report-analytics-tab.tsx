import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Download, RefreshCcw } from 'lucide-react'
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
import { Label } from '@/components/ui/label'
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
import { type AggregateResult, type ReportInstance } from '../api/types'

const EMPTY_PENDING: ReportInstance[] = []

export function ReportAnalyticsTab() {
  const refsQuery = useQuery({
    queryKey: ['report-management', 'refs'],
    queryFn: () => reportManagementMockApi.listReferenceData(),
  })
  const pendingQuery = useQuery({
    queryKey: ['report-management', 'pending-approvals'],
    queryFn: () => reportManagementMockApi.listPendingApprovals(),
  })

  const forms = refsQuery.data?.forms ?? []
  const periods = refsQuery.data?.periods ?? []
  const pendingApprovals = pendingQuery.data ?? EMPTY_PENDING

  const [formTemplateId, setFormTemplateId] = useState('')
  const [reportPeriodId, setReportPeriodId] = useState('')
  const [aggregateResult, setAggregateResult] = useState<AggregateResult | null>(null)

  const aggregateMutation = useMutation({
    mutationFn: ({ formId, periodId }: { formId: string; periodId: string }) =>
      reportManagementMockApi.aggregateReports(formId, periodId),
    onSuccess: (result) => {
      setAggregateResult(result)
      toast.success('Đã tổng hợp số liệu báo cáo.')
    },
    onError: (error) => toast.error(error.message),
  })

  const exportMutation = useMutation({
    mutationFn: (format: 'excel' | 'pdf') => reportManagementMockApi.exportReports(format),
    onSuccess: (result) => {
      toast.success(`Đã xuất file ${result.fileName} (${result.format.toUpperCase()}).`)
    },
    onError: (error) => toast.error(error.message),
  })

  return (
    <Card>
      <CardHeader className='gap-4'>
        <div>
          <CardTitle>Tổng hợp, phê duyệt và tra cứu</CardTitle>
          <CardDescription>
            Chạy tổng hợp lại khi có đơn vị nộp muộn, theo dõi danh sách chờ duyệt và xuất
            Excel/PDF.
          </CardDescription>
        </div>

        <div className='grid gap-2 lg:grid-cols-[minmax(220px,360px)_minmax(220px,360px)_auto_auto]'>
          <div className='space-y-2'>
            <Label>Biểu mẫu</Label>
            <Select value={formTemplateId} onValueChange={setFormTemplateId}>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Chọn biểu mẫu' />
              </SelectTrigger>
              <SelectContent>
                {forms.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.code} - {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label>Kỳ báo cáo</Label>
            <Select value={reportPeriodId} onValueChange={setReportPeriodId}>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Chọn kỳ báo cáo' />
              </SelectTrigger>
              <SelectContent>
                {periods.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.code} - {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            className='self-end'
            onClick={() => {
              if (!formTemplateId || !reportPeriodId) {
                toast.error('Vui lòng chọn biểu mẫu và kỳ báo cáo.')
                return
              }
              aggregateMutation.mutate({
                formId: formTemplateId,
                periodId: reportPeriodId,
              })
            }}
          >
            <RefreshCcw />
            Chạy tổng hợp
          </Button>

          <div className='flex self-end gap-2'>
            <Button variant='outline' onClick={() => exportMutation.mutate('excel')}>
              <Download />
              Xuất Excel
            </Button>
            <Button variant='outline' onClick={() => exportMutation.mutate('pdf')}>
              <Download />
              Xuất PDF
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-4'>
        {aggregateResult && (
          <div className='grid gap-2 sm:grid-cols-2 xl:grid-cols-5'>
            <div className='rounded-md border p-3 text-sm'>
              <p className='text-muted-foreground'>Biểu mẫu</p>
              <p className='font-semibold'>{aggregateResult.formTemplateName}</p>
            </div>
            <div className='rounded-md border p-3 text-sm'>
              <p className='text-muted-foreground'>Kỳ báo cáo</p>
              <p className='font-semibold'>{aggregateResult.reportPeriodName}</p>
            </div>
            <div className='rounded-md border p-3 text-sm'>
              <p className='text-muted-foreground'>Số đơn vị thu thập</p>
              <p className='text-xl font-semibold'>{aggregateResult.collectedUnits}</p>
            </div>
            <div className='rounded-md border p-3 text-sm'>
              <p className='text-muted-foreground'>Đơn vị đã duyệt</p>
              <p className='text-xl font-semibold'>{aggregateResult.approvedUnits}</p>
            </div>
            <div className='rounded-md border p-3 text-sm'>
              <p className='text-muted-foreground'>% hoàn thành trung bình</p>
              <p className='text-xl font-semibold'>{aggregateResult.averageCompletion}%</p>
            </div>
          </div>
        )}

        <div>
          <p className='mb-2 text-sm font-medium'>Danh sách báo cáo chờ duyệt</p>
          <div className='overflow-hidden rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Biểu mẫu</TableHead>
                  <TableHead>Đơn vị</TableHead>
                  <TableHead>Kỳ báo cáo</TableHead>
                  <TableHead>Hạn nộp</TableHead>
                  <TableHead>% hoàn thành</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingApprovals.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className='h-20 text-center'>
                      Không còn báo cáo chờ duyệt.
                    </TableCell>
                  </TableRow>
                )}
                {pendingApprovals.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className='font-medium'>{report.formTemplateName}</TableCell>
                    <TableCell>{report.unitName}</TableCell>
                    <TableCell>{report.reportPeriodName}</TableCell>
                    <TableCell>{report.dueDate}</TableCell>
                    <TableCell>{report.completionPercent}%</TableCell>
                    <TableCell>
                      <Badge variant='outline'>Chờ duyệt</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
