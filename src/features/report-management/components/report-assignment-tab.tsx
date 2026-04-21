import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PlusCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
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
import { type ReportAssignment } from '../api/types'

const EMPTY_ASSIGNMENTS: ReportAssignment[] = []

type AssignmentFormState = {
  formTemplateId: string
  reportPeriodId: string
  unitIds: string[]
  dueDate: string
  autoAssignNextPeriod: boolean
}

const defaultForm: AssignmentFormState = {
  formTemplateId: '',
  reportPeriodId: '',
  unitIds: [],
  dueDate: '2026-05-21',
  autoAssignNextPeriod: false,
}

export function ReportAssignmentTab() {
  const queryClient = useQueryClient()
  const refsQuery = useQuery({
    queryKey: ['report-management', 'refs'],
    queryFn: () => reportManagementMockApi.listReferenceData(),
  })
  const assignmentsQuery = useQuery({
    queryKey: ['report-management', 'assignments'],
    queryFn: () => reportManagementMockApi.listAssignments(),
  })

  const forms = refsQuery.data?.forms ?? []
  const periods = refsQuery.data?.periods ?? []
  const units = refsQuery.data?.units ?? []
  const assignments = assignmentsQuery.data ?? EMPTY_ASSIGNMENTS

  const [search, setSearch] = useState('')
  const [openForm, setOpenForm] = useState(false)
  const [form, setForm] = useState<AssignmentFormState>(defaultForm)
  const [cancelDialog, setCancelDialog] = useState<ReportAssignment | null>(null)
  const [cancelReason, setCancelReason] = useState('')

  const filteredAssignments = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) {
      return assignments
    }
    return assignments.filter((assignment) =>
      [assignment.formTemplateName, assignment.unitName, assignment.reportPeriodName].some(
        (value) => value.toLowerCase().includes(keyword)
      )
    )
  }, [search, assignments])

  const createMutation = useMutation({
    mutationFn: reportManagementMockApi.createAssignments,
    onSuccess: (result) => {
      toast.success(`Đã giao ${result.length} báo cáo và tạo instance tương ứng.`)
      queryClient.invalidateQueries({ queryKey: ['report-management'] })
      setOpenForm(false)
      setForm(defaultForm)
    },
    onError: (error) => toast.error(error.message),
  })

  const cancelMutation = useMutation({
    mutationFn: ({ assignmentId, reason }: { assignmentId: string; reason: string }) =>
      reportManagementMockApi.cancelAssignment(assignmentId, reason),
    onSuccess: () => {
      toast.success('Đã hủy giao báo cáo.')
      queryClient.invalidateQueries({ queryKey: ['report-management'] })
      setCancelDialog(null)
      setCancelReason('')
    },
    onError: (error) => toast.error(error.message),
  })

  const submitAssignment = () => {
    if (!form.formTemplateId || !form.reportPeriodId || form.unitIds.length === 0) {
      toast.error('Vui lòng chọn biểu mẫu, kỳ và ít nhất một đơn vị.')
      return
    }
    if (!form.dueDate) {
      toast.error('Vui lòng chọn hạn nhập liệu.')
      return
    }
    createMutation.mutate(form)
  }

  return (
    <>
      <Card>
        <CardHeader className='gap-4 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <CardTitle>Giao báo cáo (khởi tạo instance)</CardTitle>
            <CardDescription>
              Chặn giao trùng theo khóa nghiệp vụ form + kỳ + đơn vị, hủy giao yêu cầu có lý do.
            </CardDescription>
          </div>
          <div className='flex w-full flex-col gap-2 sm:w-auto sm:flex-row'>
            <Input
              className='sm:w-96'
              placeholder='Tìm theo biểu mẫu, kỳ, đơn vị...'
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Button onClick={() => setOpenForm(true)}>
              <PlusCircle />
              Giao báo cáo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className='overflow-hidden rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Biểu mẫu</TableHead>
                  <TableHead>Kỳ báo cáo</TableHead>
                  <TableHead>Đơn vị</TableHead>
                  <TableHead>Hạn nộp</TableHead>
                  <TableHead>Tự động kỳ sau</TableHead>
                  <TableHead>Trạng thái giao</TableHead>
                  <TableHead className='text-right'>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className='h-20 text-center'>
                      Không có bản ghi giao báo cáo.
                    </TableCell>
                  </TableRow>
                )}
                {filteredAssignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className='font-medium'>{assignment.formTemplateName}</TableCell>
                    <TableCell>{assignment.reportPeriodName}</TableCell>
                    <TableCell>{assignment.unitName}</TableCell>
                    <TableCell>{assignment.dueDate}</TableCell>
                    <TableCell>{assignment.autoAssignNextPeriod ? 'Có' : 'Không'}</TableCell>
                    <TableCell>{assignment.isCancelled ? 'Đã hủy' : 'Đang hiệu lực'}</TableCell>
                    <TableCell className='text-right'>
                      <Button
                        size='sm'
                        variant='destructive'
                        disabled={assignment.isCancelled}
                        onClick={() => setCancelDialog(assignment)}
                      >
                        <XCircle />
                        Hủy giao
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className='sm:max-w-2xl'>
          <DialogHeader className='text-start'>
            <DialogTitle>Tạo giao báo cáo</DialogTitle>
            <DialogDescription>
              Hạn nhập liệu mặc định từ ngày hiện tại đến +30 ngày (đang đặt 2026-05-21).
            </DialogDescription>
          </DialogHeader>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label>Biểu mẫu</Label>
              <Select
                value={form.formTemplateId}
                onValueChange={(value) => setForm((prev) => ({ ...prev, formTemplateId: value }))}
              >
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
              <Select
                value={form.reportPeriodId}
                onValueChange={(value) => setForm((prev) => ({ ...prev, reportPeriodId: value }))}
              >
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
            <div className='space-y-2 sm:col-span-2'>
              <Label>Đơn vị nhận báo cáo</Label>
              <div className='grid max-h-44 grid-cols-2 gap-2 overflow-auto rounded-md border p-3'>
                {units.map((unit) => {
                  const checked = form.unitIds.includes(unit.id)
                  return (
                    <label key={unit.id} className='flex items-center gap-2 text-sm'>
                      <input
                        type='checkbox'
                        checked={checked}
                        onChange={(event) => {
                          if (event.target.checked) {
                            setForm((prev) => ({
                              ...prev,
                              unitIds: [...prev.unitIds, unit.id],
                            }))
                            return
                          }
                          setForm((prev) => ({
                            ...prev,
                            unitIds: prev.unitIds.filter((item) => item !== unit.id),
                          }))
                        }}
                      />
                      {unit.code} - {unit.name}
                    </label>
                  )
                })}
              </div>
            </div>
            <div className='space-y-2'>
              <Label>Hạn nhập liệu</Label>
              <Input
                type='date'
                value={form.dueDate}
                onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))}
              />
            </div>
            <div className='space-y-2'>
              <Label>Tùy chọn</Label>
              <label className='inline-flex items-center gap-2 text-sm'>
                <input
                  type='checkbox'
                  checked={form.autoAssignNextPeriod}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      autoAssignNextPeriod: event.target.checked,
                    }))
                  }
                />
                Tự động giao kỳ sau
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setOpenForm(false)}>
              Hủy
            </Button>
            <Button onClick={submitAssignment} disabled={createMutation.isPending}>
              Lưu giao báo cáo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(cancelDialog)}
        onOpenChange={(open) => {
          if (!open) {
            setCancelDialog(null)
            setCancelReason('')
          }
        }}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader className='text-start'>
            <DialogTitle>Hủy giao báo cáo</DialogTitle>
            <DialogDescription>
              Chỉ hủy giao khi đơn vị chưa bắt đầu nhập liệu. Bắt buộc nhập lý do audit.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={4}
            placeholder='Nhập lý do hủy giao...'
            value={cancelReason}
            onChange={(event) => setCancelReason(event.target.value)}
          />
          <DialogFooter>
            <Button variant='outline' onClick={() => setCancelDialog(null)}>
              Hủy
            </Button>
            <Button
              variant='destructive'
              onClick={() =>
                cancelDialog &&
                cancelMutation.mutate({
                  assignmentId: cancelDialog.id,
                  reason: cancelReason,
                })
              }
              disabled={cancelMutation.isPending}
            >
              Xác nhận hủy giao
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
