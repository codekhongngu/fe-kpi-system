import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { systemAdminMockApi } from '../api/mock-system-admin-api'
import { periodTypeOptions, type PeriodType, type ReportPeriod } from '../api/types'

const EMPTY_PERIODS: ReportPeriod[] = []

type PeriodFormState = {
  code: string
  name: string
  type: PeriodType
  startDate: string
  endDate: string
  status: 'open' | 'closed'
}

const defaultForm: PeriodFormState = {
  code: '',
  name: '',
  type: 'month',
  startDate: '',
  endDate: '',
  status: 'open',
}

export function PeriodsTab() {
  const queryClient = useQueryClient()
  const periodsQuery = useQuery({
    queryKey: ['system-admin', 'periods'],
    queryFn: () => systemAdminMockApi.listPeriods(),
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
    mutationFn: systemAdminMockApi.createPeriod,
    onSuccess: () => {
      toast.success('Đã tạo kỳ báo cáo mới.')
      queryClient.invalidateQueries({ queryKey: ['system-admin'] })
      closeForm()
    },
    onError: (error) => toast.error(error.message),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PeriodFormState }) =>
      systemAdminMockApi.updatePeriod(id, payload),
    onSuccess: () => {
      toast.success('Đã cập nhật kỳ báo cáo.')
      queryClient.invalidateQueries({ queryKey: ['system-admin'] })
      closeForm()
    },
    onError: (error) => toast.error(error.message),
  })

  const deleteMutation = useMutation({
    mutationFn: systemAdminMockApi.deletePeriod,
    onSuccess: () => {
      toast.success('Đã xóa kỳ báo cáo.')
      queryClient.invalidateQueries({ queryKey: ['system-admin'] })
      setDeletingPeriod(null)
    },
    onError: (error) => toast.error(error.message),
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
      type: period.type,
      startDate: period.startDate,
      endDate: period.endDate,
      status: period.status,
    })
    setOpenForm(true)
  }

  const submitForm = () => {
    if (!form.code.trim() || !form.name.trim() || !form.startDate || !form.endDate) {
      toast.error('Vui lòng nhập đủ mã kỳ, tên kỳ và khoảng thời gian.')
      return
    }

    const payload: PeriodFormState = {
      ...form,
      code: form.code.trim(),
      name: form.name.trim(),
    }

    if (editingPeriod) {
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
                  <TableCell>{periodTypeLabel(period.type)}</TableCell>
                  <TableCell>
                    {period.startDate} → {period.endDate}
                  </TableCell>
                  <TableCell>
                    <Badge variant={period.status === 'open' ? 'default' : 'secondary'}>
                      {period.status === 'open' ? 'Đang mở' : 'Đã đóng'}
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
                value={form.type}
                onValueChange={(value: PeriodType) =>
                  setForm((prev) => ({ ...prev, type: value }))
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
              <Select
                value={form.status}
                onValueChange={(value: 'open' | 'closed') =>
                  setForm((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='open'>Đang mở</SelectItem>
                  <SelectItem value='closed'>Đã đóng</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Từ ngày</Label>
              <Input
                type='date'
                value={form.startDate}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, startDate: event.target.value }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>Đến ngày</Label>
              <Input
                type='date'
                value={form.endDate}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, endDate: event.target.value }))
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
              disabled={createMutation.isPending || updateMutation.isPending}
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
