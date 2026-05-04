import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { CalendarPlus, PlusCircle, Trash2, UserPen } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
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
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { periodsApi } from '../api/mock-system-admin-api'
import { periodTypeOptions, type PeriodType, type ReportPeriod } from '../api/types'

const EMPTY_PERIODS: ReportPeriod[] = []

type PeriodFormState = {
  code: string
  name: string
  periodType: PeriodType
  dateFrom: string
  dateTo: string
  isActive: boolean
}

const defaultForm: PeriodFormState = {
  code: '',
  name: '',
  periodType: 'THANG',
  dateFrom: '',
  dateTo: '',
  isActive: true,
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getApiErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const payload = error.response?.data
    if (isRecord(payload)) {
      if (payload.message === 'PERIOD_CODE_DUPLICATE') {
        return 'Mã kỳ bị trùng (PERIOD_CODE_DUPLICATE). Vui lòng chọn loại kỳ/khoảng ngày khác hoặc tạo kỳ mới.'
      }
      if (payload.message === 'PERIOD_DUPLICATE') {
        return 'Kỳ báo cáo bị trùng (PERIOD_DUPLICATE). Đã tồn tại kỳ với loại kỳ và khoảng ngày này.'
      }
      const message =
        (typeof payload.message === 'string' && payload.message) ||
        (Array.isArray(payload.message) &&
          payload.message.length > 0 &&
          typeof payload.message[0] === 'string' &&
          payload.message[0]) ||
        (typeof payload.error === 'string' && payload.error)
      if (message) return message
      if (isRecord(payload.error) && typeof payload.error.message === 'string') {
        const details = payload.error.details
        if (Array.isArray(details) && details.length > 0) {
          const first = details[0]
          if (isRecord(first) && typeof first.message === 'string') {
            return first.message
          }
          if (typeof first === 'string') return first
        }
        return payload.error.message
      }
    }
    return error.message
  }

  if (error instanceof Error) return error.message
  return 'Có lỗi xảy ra.'
}

export function PeriodsTab() {
  const queryClient = useQueryClient()
  const periodsQuery = useQuery({
    queryKey: ['periods', 'list'],
    queryFn: () => periodsApi.list(),
  })

  const [search, setSearch] = useState('')
  const [openForm, setOpenForm] = useState(false)
  const [editingPeriod, setEditingPeriod] = useState<ReportPeriod | null>(null)
  const [form, setForm] = useState<PeriodFormState>(defaultForm)
  const [deletingPeriod, setDeletingPeriod] = useState<ReportPeriod | null>(null)

  const periods = periodsQuery.data ?? EMPTY_PERIODS

  const filteredPeriods = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) {
      return periods
    }
    return periods.filter((period) =>
      [period.code, period.name].some((value) => value.toLowerCase().includes(keyword))
    )
  }, [search, periods])

  const createMutation = useMutation({
    mutationFn: periodsApi.create,
    onSuccess: () => {
      toast.success('Đã tạo kỳ báo cáo mới.')
      queryClient.invalidateQueries({ queryKey: ['periods'] })
      closeForm()
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PeriodFormState }) =>
      periodsApi.update(id, payload),
    onSuccess: () => {
      toast.success('Đã cập nhật kỳ báo cáo.')
      queryClient.invalidateQueries({ queryKey: ['periods'] })
      closeForm()
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })

  const setActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      periodsApi.setActive(id, isActive),
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái kỳ báo cáo.')
      queryClient.invalidateQueries({ queryKey: ['periods'] })
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: periodsApi.delete,
    onSuccess: () => {
      toast.success('Đã xóa kỳ báo cáo.')
      queryClient.invalidateQueries({ queryKey: ['periods'] })
      setDeletingPeriod(null)
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })

  const closeForm = () => {
    setOpenForm(false)
    setEditingPeriod(null)
    setForm(defaultForm)
  }

  const openCreateDialog = () => {
    setEditingPeriod(null)
    setForm(defaultForm)
    setOpenForm(true)
  }

  const openEditDialog = (period: ReportPeriod) => {
    setEditingPeriod(period)
    setForm({
      code: period.code,
      name: period.name,
      periodType: period.periodType,
      dateFrom: period.dateFrom,
      dateTo: period.dateTo,
      isActive: period.isActive,
    })
    setOpenForm(true)
  }

  const submitForm = () => {
    if (
      (!editingPeriod && !form.code.trim()) ||
      !form.name.trim() ||
      !form.dateFrom ||
      !form.dateTo
    ) {
      toast.error('Vui lòng nhập đủ mã kỳ, tên kỳ và khoảng thời gian.')
      return
    }

    if (form.dateFrom && form.dateTo) {
      const start = new Date(form.dateFrom).getTime()
      const end = new Date(form.dateTo).getTime()
      if (!Number.isNaN(start) && !Number.isNaN(end) && start > end) {
        toast.error('Ngày bắt đầu không được lớn hơn ngày kết thúc.')
        return
      }
    }

    const payload: PeriodFormState = {
      ...form,
      code: form.code.trim(),
      name: form.name.trim(),
    }

    if (editingPeriod) {
      const onlyActiveChanged =
        payload.name === editingPeriod.name &&
        payload.periodType === editingPeriod.periodType &&
        payload.dateFrom === editingPeriod.dateFrom &&
        payload.dateTo === editingPeriod.dateTo &&
        payload.isActive !== editingPeriod.isActive

      if (onlyActiveChanged) {
        setActiveMutation.mutate({ id: editingPeriod.id, isActive: payload.isActive })
        return
      }

      updateMutation.mutate({ id: editingPeriod.id, payload })
      return
    }
    createMutation.mutate(payload)
  }

  const periodTypeLabel = (type: PeriodType) =>
    periodTypeOptions.find((item) => item.value === type)?.label ?? type

  return (
    <Card>
      <CardHeader className='gap-4 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <CardTitle>Catalog kỳ báo cáo</CardTitle>
          <CardDescription>
            Quản lý kỳ tuần/tháng/quý/năm với quy tắc chống trùng thời gian theo loại kỳ.
          </CardDescription>
        </div>
        <div className='flex w-full flex-col gap-2 sm:w-auto sm:flex-row'>
          <Input
            className='sm:w-80'
            placeholder='Tìm theo mã kỳ hoặc tên kỳ...'
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Button onClick={openCreateDialog}>
            <PlusCircle />
            Thêm kỳ báo cáo
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className='overflow-hidden rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã kỳ</TableHead>
                <TableHead>Tên kỳ</TableHead>
                <TableHead>Loại kỳ</TableHead>
                <TableHead>Khoảng thời gian</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className='text-right'>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPeriods.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className='h-20 text-center'>
                    Không có dữ liệu kỳ báo cáo.
                  </TableCell>
                </TableRow>
              )}
              {filteredPeriods.map((period) => (
                <TableRow key={period.id}>
                  <TableCell className='font-medium'>{period.code}</TableCell>
                  <TableCell>
                    <div>{period.name}</div>
                    <div className='text-xs text-muted-foreground'>
                      Đã giao {period.assignedFormsCount} biểu mẫu
                    </div>
                  </TableCell>
                  <TableCell>{periodTypeLabel(period.periodType)}</TableCell>
                  <TableCell>
                    {period.dateFrom} → {period.dateTo}
                  </TableCell>
                  <TableCell>
                    <Badge variant={period.isActive ? 'default' : 'secondary'}>
                      {period.isActive ? 'Hoạt động' : 'Đã khóa'}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-right'>
                    <div className='flex justify-end gap-1'>
                      <Button
                        size='icon'
                        variant='outline'
                        onClick={() => openEditDialog(period)}
                        title='Sửa kỳ báo cáo'
                      >
                        <UserPen />
                      </Button>
                      <Button
                        size='icon'
                        variant='destructive'
                        onClick={() => setDeletingPeriod(period)}
                        title='Xóa kỳ báo cáo'
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className='sm:max-w-xl'>
          <DialogHeader className='text-start'>
            <DialogTitle>
              {editingPeriod ? 'Cập nhật kỳ báo cáo' : 'Thêm kỳ báo cáo'}
            </DialogTitle>
            <DialogDescription>
              Kỳ có biểu mẫu đã giao sẽ không được phép xóa theo nghiệp vụ.
            </DialogDescription>
          </DialogHeader>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label>Mã kỳ</Label>
              <Input
                value={form.code}
                placeholder='Nhập mã kỳ'
                disabled={Boolean(editingPeriod)}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, code: event.target.value }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>Tên kỳ</Label>
              <Input
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>Loại kỳ</Label>
              <Select
                value={form.periodType}
                onValueChange={(value: PeriodType) =>
                  setForm((prev) => ({ ...prev, periodType: value }))
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periodTypeOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Trạng thái</Label>
              <div className='flex h-10 items-center justify-between rounded-md border px-3'>
                <div
                  className={
                    form.isActive
                      ? 'text-sm text-muted-foreground'
                      : 'text-sm font-medium text-destructive'
                  }
                >
                  {form.isActive ? 'Hoạt động' : 'Đã khóa'}
                </div>
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({ ...prev, isActive: checked }))
                  }
                />
              </div>
            </div>
            <div className='space-y-2'>
              <Label>Từ ngày</Label>
              <Input
                type='date'
                value={form.dateFrom}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, dateFrom: event.target.value }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>Đến ngày</Label>
              <Input
                type='date'
                value={form.dateTo}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, dateTo: event.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={closeForm}>
              Hủy
            </Button>
            <Button
              onClick={submitForm}
              disabled={
                createMutation.isPending ||
                updateMutation.isPending ||
                setActiveMutation.isPending
              }
            >
              <CalendarPlus />
              {editingPeriod ? 'Lưu thay đổi' : 'Tạo kỳ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deletingPeriod)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingPeriod(null)
          }
        }}
        title='Xóa kỳ báo cáo'
        desc={
          deletingPeriod
            ? `Xóa kỳ ${deletingPeriod.name}. Hệ thống sẽ chặn nếu kỳ đã có biểu mẫu giao.`
            : ''
        }
        destructive
        handleConfirm={() => deletingPeriod && deleteMutation.mutate(deletingPeriod.id)}
        confirmText='Xóa kỳ'
        isLoading={deleteMutation.isPending}
      />
    </Card>
  )
}
