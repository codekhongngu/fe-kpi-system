import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, FileUp, Save, Send, ShieldCheck, Trash2, XCircle } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import { reportManagementMockApi } from '../api/mock-report-management-api'
import { type ReportInstance, type ReportStatus } from '../api/types'

const EMPTY_REPORTS: ReportInstance[] = []

const statusLabel: Record<ReportStatus, string> = {
  NOT_STARTED: 'Chưa nhập',
  DRAFT: 'Lưu nháp',
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  OVERDUE: 'Quá hạn',
}

function varianceWarning(previousValue: number | null, currentValue: number | null) {
  if (previousValue === null || previousValue === 0 || currentValue === null) {
    return false
  }
  return Math.abs(currentValue - previousValue) / Math.abs(previousValue) > 0.5
}

export function ReportEditingTab() {
  const queryClient = useQueryClient()
  const reportsQuery = useQuery({
    queryKey: ['report-management', 'reports'],
    queryFn: () => reportManagementMockApi.listReports(),
  })
  const reports = reportsQuery.data ?? EMPTY_REPORTS

  const [selectedReportId, setSelectedReportId] = useState('')
  const [dirty, setDirty] = useState(false)
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false)
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [actionNote, setActionNote] = useState('')

  const selectedReport = useMemo(
    () => reports.find((item) => item.id === (selectedReportId || reports[0]?.id)) ?? null,
    [selectedReportId, reports]
  )

  const updateValueMutation = useMutation({
    mutationFn: ({
      reportId,
      rowId,
      value,
    }: {
      reportId: string
      rowId: string
      value: number | null
    }) => reportManagementMockApi.updateReportValue(reportId, rowId, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-management', 'reports'] })
      setDirty(true)
    },
    onError: (error) => toast.error(error.message),
  })

  const autosaveMutation = useMutation({
    mutationFn: (reportId: string) => reportManagementMockApi.autosaveReport(reportId),
    onSuccess: () => {
      toast.success('Đã auto-save báo cáo.')
      queryClient.invalidateQueries({ queryKey: ['report-management', 'reports'] })
      setDirty(false)
    },
    onError: (error) => toast.error(error.message),
  })
  const { mutate: autosaveNow } = autosaveMutation

  const importMutation = useMutation({
    mutationFn: (reportId: string) => reportManagementMockApi.importExcelData(reportId),
    onSuccess: () => {
      toast.success('Đã import dữ liệu từ Excel (mock).')
      queryClient.invalidateQueries({ queryKey: ['report-management'] })
      setDirty(true)
    },
    onError: (error) => toast.error(error.message),
  })

  const copyMutation = useMutation({
    mutationFn: (reportId: string) => reportManagementMockApi.copyPreviousPeriod(reportId),
    onSuccess: () => {
      toast.success('Đã sao chép dữ liệu kỳ trước.')
      queryClient.invalidateQueries({ queryKey: ['report-management'] })
      setDirty(true)
    },
    onError: (error) => toast.error(error.message),
  })

  const submitMutation = useMutation({
    mutationFn: ({ reportId, note }: { reportId: string; note: string }) =>
      reportManagementMockApi.submitReport(reportId, note),
    onSuccess: () => {
      toast.success('Đã gửi duyệt báo cáo.')
      queryClient.invalidateQueries({ queryKey: ['report-management'] })
      setSubmitDialogOpen(false)
      setActionNote('')
      setDirty(false)
    },
    onError: (error) => toast.error(error.message),
  })

  const approveMutation = useMutation({
    mutationFn: ({ reportId, note }: { reportId: string; note: string }) =>
      reportManagementMockApi.approveReport(reportId, note),
    onSuccess: () => {
      toast.success('Đã phê duyệt báo cáo.')
      queryClient.invalidateQueries({ queryKey: ['report-management'] })
      setApproveDialogOpen(false)
      setActionNote('')
    },
    onError: (error) => toast.error(error.message),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ reportId, note }: { reportId: string; note: string }) =>
      reportManagementMockApi.rejectReport(reportId, note),
    onSuccess: () => {
      toast.success('Đã từ chối báo cáo.')
      queryClient.invalidateQueries({ queryKey: ['report-management'] })
      setRejectDialogOpen(false)
      setActionNote('')
    },
    onError: (error) => toast.error(error.message),
  })

  const softDeleteMutation = useMutation({
    mutationFn: ({ reportId, reason }: { reportId: string; reason: string }) =>
      reportManagementMockApi.softDeleteReport(reportId, reason),
    onSuccess: () => {
      toast.success('Đã soft delete báo cáo.')
      queryClient.invalidateQueries({ queryKey: ['report-management'] })
      setDeleteDialogOpen(false)
      setActionNote('')
    },
    onError: (error) => toast.error(error.message),
  })

  useEffect(() => {
    if (!selectedReport || !dirty) {
      return
    }
    const intervalId = window.setInterval(() => {
      autosaveNow(selectedReport.id)
    }, 30000)
    return () => window.clearInterval(intervalId)
  }, [selectedReport, dirty, autosaveNow])

  return (
    <>
      <Card>
        <CardHeader className='gap-4'>
          <div>
            <CardTitle>Nhập liệu và duyệt báo cáo</CardTitle>
            <CardDescription>
              Hỗ trợ nhập liệu lưới chỉ tiêu, auto-save 30 giây, submit/approve/reject theo vòng
              đời.
            </CardDescription>
          </div>

          <div className='grid gap-2 lg:grid-cols-[minmax(280px,420px)_1fr]'>
            <div className='space-y-2'>
              <Label>Chọn báo cáo</Label>
              <Select
                value={selectedReport?.id ?? ''}
                onValueChange={(value) => setSelectedReportId(value)}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Chọn báo cáo' />
                </SelectTrigger>
                <SelectContent>
                  {reports.map((report) => (
                    <SelectItem key={report.id} value={report.id}>
                      {report.formTemplateName} - {report.unitName} - {report.reportPeriodName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='flex flex-wrap items-end gap-2'>
              <Button
                variant='outline'
                onClick={() => selectedReport && importMutation.mutate(selectedReport.id)}
                disabled={!selectedReport}
              >
                <FileUp />
                Import Excel
              </Button>
              <Button
                variant='outline'
                onClick={() => selectedReport && copyMutation.mutate(selectedReport.id)}
                disabled={!selectedReport}
              >
                <Copy />
                Copy kỳ trước
              </Button>
              <Button
                variant='outline'
                onClick={() => selectedReport && autosaveMutation.mutate(selectedReport.id)}
                disabled={!selectedReport}
              >
                <Save />
                Lưu ngay
              </Button>
              <Button onClick={() => setSubmitDialogOpen(true)} disabled={!selectedReport}>
                <Send />
                Gửi duyệt
              </Button>
              <Button
                variant='outline'
                onClick={() => setApproveDialogOpen(true)}
                disabled={!selectedReport}
              >
                <ShieldCheck />
                Duyệt
              </Button>
              <Button
                variant='outline'
                onClick={() => setRejectDialogOpen(true)}
                disabled={!selectedReport}
              >
                <XCircle />
                Từ chối
              </Button>
              <Button
                variant='destructive'
                onClick={() => setDeleteDialogOpen(true)}
                disabled={!selectedReport}
              >
                <Trash2 />
                Soft delete
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className='space-y-4'>
          {!selectedReport && (
            <div className='rounded-md border border-dashed p-6 text-sm text-muted-foreground'>
              Chưa có báo cáo để thao tác.
            </div>
          )}

          {selectedReport && (
            <>
              <div className='grid gap-2 rounded-md border p-3 text-sm sm:grid-cols-2 xl:grid-cols-4'>
                <div>
                  <span className='text-muted-foreground'>Đơn vị: </span>
                  {selectedReport.unitName}
                </div>
                <div>
                  <span className='text-muted-foreground'>Kỳ: </span>
                  {selectedReport.reportPeriodName}
                </div>
                <div>
                  <span className='text-muted-foreground'>Hạn nộp: </span>
                  {selectedReport.dueDate}
                </div>
                <div>
                  <span className='text-muted-foreground'>Trạng thái: </span>
                  <Badge variant='outline'>{statusLabel[selectedReport.status]}</Badge>
                </div>
              </div>

              <div className='overflow-hidden rounded-md border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã chỉ tiêu</TableHead>
                      <TableHead>Tên chỉ tiêu</TableHead>
                      <TableHead>Giá trị kỳ trước</TableHead>
                      <TableHead>Giá trị hiện tại</TableHead>
                      <TableHead>Ràng buộc</TableHead>
                      <TableHead>Cảnh báo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedReport.values.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.indicatorCode}</TableCell>
                        <TableCell>
                          <div>{row.indicatorName}</div>
                          <div className='text-xs text-muted-foreground'>{row.unit}</div>
                        </TableCell>
                        <TableCell>{row.previousValue ?? '--'}</TableCell>
                        <TableCell>
                          <Input
                            type='number'
                            value={row.currentValue ?? ''}
                            onChange={(event) => {
                              const raw = event.target.value.trim()
                              const parsed = raw === '' ? null : Number(raw)
                              if (raw !== '' && Number.isNaN(parsed)) {
                                return
                              }
                              updateValueMutation.mutate({
                                reportId: selectedReport.id,
                                rowId: row.id,
                                value: parsed,
                              })
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          {row.required ? 'Bắt buộc' : 'Không bắt buộc'} |{' '}
                          {row.minValue ?? '--'} → {row.maxValue ?? '--'}
                        </TableCell>
                        <TableCell>
                          {varianceWarning(row.previousValue, row.currentValue)
                            ? 'Lệch > 50% so với kỳ trước'
                            : '--'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader className='text-start'>
            <DialogTitle>Gửi duyệt báo cáo</DialogTitle>
            <DialogDescription>
              Chỉ gửi duyệt khi đã hoàn thành các chỉ tiêu bắt buộc.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={4}
            placeholder='Ghi chú gửi duyệt...'
            value={actionNote}
            onChange={(event) => setActionNote(event.target.value)}
          />
          <DialogFooter>
            <Button variant='outline' onClick={() => setSubmitDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={() =>
                selectedReport &&
                submitMutation.mutate({ reportId: selectedReport.id, note: actionNote })
              }
            >
              Gửi duyệt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader className='text-start'>
            <DialogTitle>Phê duyệt báo cáo</DialogTitle>
            <DialogDescription>
              Phê duyệt dành cho báo cáo trạng thái chờ duyệt.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={4}
            placeholder='Nhập ghi chú phê duyệt (tuỳ chọn)...'
            value={actionNote}
            onChange={(event) => setActionNote(event.target.value)}
          />
          <DialogFooter>
            <Button variant='outline' onClick={() => setApproveDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={() =>
                selectedReport &&
                approveMutation.mutate({ reportId: selectedReport.id, note: actionNote })
              }
            >
              Xác nhận duyệt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader className='text-start'>
            <DialogTitle>Từ chối báo cáo</DialogTitle>
            <DialogDescription>
              Bắt buộc có nội dung từ chối để đơn vị nhập liệu chỉnh sửa và gửi lại.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={4}
            placeholder='Nhập nội dung từ chối...'
            value={actionNote}
            onChange={(event) => setActionNote(event.target.value)}
          />
          <DialogFooter>
            <Button variant='outline' onClick={() => setRejectDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              variant='destructive'
              onClick={() =>
                selectedReport &&
                rejectMutation.mutate({ reportId: selectedReport.id, note: actionNote })
              }
            >
              Xác nhận từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader className='text-start'>
            <DialogTitle>Soft delete báo cáo</DialogTitle>
            <DialogDescription>
              Chỉ dùng cho nghiệp vụ quản trị đặc biệt và bắt buộc lưu lý do audit.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={4}
            placeholder='Nhập lý do soft delete...'
            value={actionNote}
            onChange={(event) => setActionNote(event.target.value)}
          />
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              variant='destructive'
              onClick={() =>
                selectedReport &&
                softDeleteMutation.mutate({ reportId: selectedReport.id, reason: actionNote })
              }
            >
              Xác nhận xóa mềm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
