import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
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
import type { PeriodType } from '@/features/form-management/api/types'
import type {
  CreateReportInput,
  ReportListItem,
  ReportPriority,
  ReportReferences,
  UpdateReportInput,
} from '../api/types'

type ReportFormDialogProps = {
  open: boolean
  mode: 'create' | 'edit'
  report?: ReportListItem | null
  references?: ReportReferences
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (input: CreateReportInput) => void
  onUpdate: (id: string, input: UpdateReportInput) => void
}

type ReportFormProps = Omit<ReportFormDialogProps, 'open' | 'onOpenChange'> & {
  active: boolean
  onCancel: () => void
}

const emptyForm = {
  name: '',
  templateId: '',
  deadline: '',
  priority: 'normal' as ReportPriority,
  note: '',
}

type PeriodKind = 'week' | 'month' | 'quarter' | 'year'

type FormItem = {
  id: string
  code?: string
  name?: string
  periodType?: PeriodType
  period_type?: PeriodType
}

function todayISO() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function pad2(value: number) {
  return String(value).padStart(2, '0')
}

function toPeriodKind(value: PeriodType): PeriodKind {
  if (value === 'TUAN') return 'week'
  if (value === 'THANG') return 'month'
  if (value === 'QUY') return 'quarter'
  return 'year'
}

function getISOWeekNumber(date: Date) {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  )
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const diff = d.getTime() - yearStart.getTime()
  return Math.ceil((diff / 86400000 + 1) / 7)
}

function defaultPeriodCode(kind: PeriodKind, date: Date) {
  const year = date.getFullYear()
  if (kind === 'week') {
    const week = Math.min(52, Math.max(1, getISOWeekNumber(date)))
    return `W-${year}-${pad2(week)}`
  }
  if (kind === 'month') {
    const month = date.getMonth() + 1
    return `M-${year}-${pad2(month)}`
  }
  if (kind === 'quarter') {
    const quarter = Math.floor(date.getMonth() / 3) + 1
    return `Q${quarter}-${year}`
  }
  const boundedYear = Math.min(2035, Math.max(2022, year))
  return `Y-${boundedYear}`
}

function periodOptions(kind: PeriodKind, date: Date) {
  const year = date.getFullYear()
  if (kind === 'week') {
    return Array.from({ length: 52 }, (_, index) => {
      const week = index + 1
      return {
        code: `W-${year}-${pad2(week)}`,
        label: `Tuần ${pad2(week)}/${year}`,
      }
    })
  }
  if (kind === 'month') {
    return Array.from({ length: 12 }, (_, index) => {
      const month = index + 1
      return {
        code: `M-${year}-${pad2(month)}`,
        label: `Tháng ${pad2(month)}/${year}`,
      }
    })
  }
  if (kind === 'quarter') {
    return Array.from({ length: 4 }, (_, index) => {
      const quarter = index + 1
      return { code: `Q${quarter}-${year}`, label: `Quý ${quarter}/${year}` }
    })
  }
  return Array.from({ length: 2035 - 2022 + 1 }, (_, index) => {
    const y = 2022 + index
    return { code: `Y-${y}`, label: `Năm ${y}` }
  })
}

function buildAssignmentPeriod(periodType: PeriodType, periodCode: string) {
  if (periodType === 'THANG') {
    const month = periodCode.split('-').slice(-1)[0] ?? ''
    const mm = month.padStart(2, '0')
    return { periodCode: `KBCT${mm}`, periodName: `Kỳ báo cáo tháng ${mm}` }
  }
  if (periodType === 'TUAN') {
    const week = periodCode.split('-').slice(-1)[0] ?? ''
    const ww = week.padStart(2, '0')
    return { periodCode: `KBCW${ww}`, periodName: `Kỳ báo cáo tuần ${ww}` }
  }
  if (periodType === 'QUY') {
    const q = periodCode.startsWith('Q')
      ? periodCode.slice(1).split('-')[0]
      : ''
    return { periodCode: `KBCQ${q}`, periodName: `Kỳ báo cáo quý ${q}` }
  }
  const year = periodCode.split('-').slice(-1)[0] ?? ''
  return { periodCode: `KBCN${year}`, periodName: `Kỳ báo cáo năm ${year}` }
}

export function ReportFormDialog({
  open,
  mode,
  report,
  references,
  isSubmitting,
  onOpenChange,
  onCreate,
  onUpdate,
}: ReportFormDialogProps) {
  const title = mode === 'create' ? 'Tạo báo cáo' : 'Chỉnh sửa báo cáo'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-3xl'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Tạo report instance từ template đã khóa hoặc cập nhật thông tin báo
            cáo chưa chốt.
          </DialogDescription>
        </DialogHeader>

        <ReportForm
          active={open}
          mode={mode}
          report={report}
          references={references}
          isSubmitting={isSubmitting}
          onCancel={() => onOpenChange(false)}
          onCreate={onCreate}
          onUpdate={onUpdate}
        />
      </DialogContent>
    </Dialog>
  )
}

export function ReportForm({
  active,
  mode,
  report,
  references,
  isSubmitting,
  onCancel,
  onCreate,
  onUpdate,
}: ReportFormProps) {
  const [form, setForm] = useState(emptyForm)
  const [periodType, setPeriodType] = useState<PeriodType>('THANG')
  const [periodCode, setPeriodCode] = useState<string>(() =>
    defaultPeriodCode(toPeriodKind('THANG'), new Date())
  )
  const [openDate, setOpenDate] = useState(todayISO())
  const [closeDate, setCloseDate] = useState(todayISO())
  const [autoAssignNextPeriod, setAutoAssignNextPeriod] = useState(false)

  const formsQuery = useQuery({
    queryKey: ['report-management', 'forms', 'list'],
    queryFn: async () => {
      const response = await apiClient.get<{ items: FormItem[] } | FormItem[]>(
        '/forms',
        {
          params: { page: 1, limit: 200 },
        }
      )
      const payload = response.data
      return Array.isArray(payload) ? payload : (payload.items ?? [])
    },
    retry: false,
    enabled: active,
  })

  const forms = useMemo(() => {
    return (formsQuery.data ?? []).map((item) => ({
      id: item.id,
      code: item.code ?? '',
      name: item.name ?? '',
      periodType: item.periodType ?? item.period_type,
    }))
  }, [formsQuery.data])

  const selectedForm = useMemo(() => {
    return forms.find((item) => item.id === form.templateId)
  }, [form.templateId, forms])

  useEffect(() => {
    if (!active) {
      return
    }
    if (mode === 'edit' && report) {
      setForm({
        name: report.name,
        templateId: report.templateId,
        deadline: report.deadline,
        priority: report.priority,
        note: report.note ?? '',
      })
      setPeriodType('THANG')
      setPeriodCode(defaultPeriodCode(toPeriodKind('THANG'), new Date()))
      setOpenDate(todayISO())
      setCloseDate(todayISO())
      setAutoAssignNextPeriod(false)
      return
    }
    setForm({
      ...emptyForm,
      deadline: todayISO(),
    })
    setPeriodType('THANG')
    setPeriodCode(defaultPeriodCode(toPeriodKind('THANG'), new Date()))
    setOpenDate(todayISO())
    setCloseDate(todayISO())
    setAutoAssignNextPeriod(false)
  }, [active, mode, report])

  const periodKind = useMemo(() => toPeriodKind(periodType), [periodType])
  const timeOptions = useMemo(
    () => periodOptions(periodKind, new Date()),
    [periodKind]
  )

  useEffect(() => {
    if (!active) return
    if (mode !== 'create') return
    if (form.templateId) return
    if (forms.length === 0) return
    setForm((prev) => ({ ...prev, templateId: forms[0].id }))
  }, [active, form.templateId, forms, mode])

  useEffect(() => {
    if (!active) return
    if (mode !== 'create') return
    if (!selectedForm) return
    const nextName = (selectedForm.name ?? '').trim()
    setForm((prev) =>
      prev.name === nextName ? prev : { ...prev, name: nextName }
    )
  }, [active, mode, selectedForm])

  useEffect(() => {
    if (!active) return
    if (mode !== 'create') return
    const nextType = selectedForm?.periodType
    if (!nextType) return
    setPeriodType((prev) => (prev === nextType ? prev : nextType))
    setPeriodCode((prev) => {
      const nextCode = defaultPeriodCode(toPeriodKind(nextType), new Date())
      return prev === nextCode ? prev : nextCode
    })
  }, [active, mode, selectedForm?.periodType])

  useEffect(() => {
    if (!active) return
    if (mode !== 'create') return
    setForm((prev) => {
      if (prev.deadline) return prev
      return { ...prev, deadline: closeDate }
    })
  }, [active, closeDate, mode])

  const submit = () => {
    const reportName = (selectedForm?.name ?? form.name).trim()
    if (!reportName) {
      toast.error('Tên biểu mẫu là bắt buộc.')
      return
    }

    if (mode === 'create') {
      if (!form.templateId) {
        toast.error('Vui lòng chọn biểu mẫu.')
        return
      }
      if (!openDate || !closeDate) {
        toast.error('Vui lòng chọn ngày mở và ngày đóng.')
        return
      }
      if (openDate > closeDate) {
        toast.error('Ngày mở không được lớn hơn ngày đóng.')
        return
      }
      const { periodCode: assignmentPeriodCode, periodName } =
        buildAssignmentPeriod(periodType, periodCode)
      onCreate({
        name: reportName,
        templateId: form.templateId,
        periodType,
        periodCode: assignmentPeriodCode,
        periodName,
        openDate,
        closeDate,
        deadline: closeDate,
        autoAssignNextPeriod,
        priority: form.priority,
        note: form.note.trim() || null,
      })
      return
    }

    if (!report) return
    if (!form.deadline) {
      toast.error('Hạn nộp là bắt buộc.')
      return
    }
    onUpdate(report.id, {
      name: reportName,
      deadline: form.deadline,
      priority: form.priority,
      note: form.note.trim() || null,
    })
  }

  return (
    <>
      <div className='grid gap-5 py-2'>
        <div className='rounded-lg border p-4'>
          <div className='flex items-center gap-2'>
            <div className='flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary'>
              1
            </div>
            <div className='text-sm font-semibold'>
              Cấu hình Biểu mẫu &amp; Kỳ
            </div>
          </div>

          <div className='mt-4 grid gap-5'>
            <div className='grid gap-2'>
              <Label>Biểu mẫu</Label>
              <Select
                value={form.templateId}
                disabled={mode === 'edit'}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, templateId: value }))
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Chọn biểu mẫu' />
                </SelectTrigger>
                <SelectContent>
                  {formsQuery.isLoading ? (
                    <div className='px-2 py-1.5 text-sm text-muted-foreground'>
                      Đang tải biểu mẫu...
                    </div>
                  ) : formsQuery.isError ? (
                    <div className='px-2 py-1.5 text-sm text-destructive'>
                      Không tải được biểu mẫu.
                    </div>
                  ) : forms.length === 0 ? (
                    <div className='px-2 py-1.5 text-sm text-muted-foreground'>
                      Chưa có biểu mẫu.
                    </div>
                  ) : (
                    forms.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.code} - {item.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='grid gap-2'>
                <Label>Kỳ báo cáo</Label>
                <Select
                  value={periodType}
                  disabled={Boolean(selectedForm?.periodType)}
                  onValueChange={(value: PeriodType) => {
                    const nextKind = toPeriodKind(value)
                    setPeriodType(value)
                    setPeriodCode(defaultPeriodCode(nextKind, new Date()))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Chọn kỳ báo cáo' />
                  </SelectTrigger>
                  <SelectContent>
                    {(['TUAN', 'THANG', 'QUY', 'NAM'] as const).map((item) => (
                      <SelectItem key={item} value={item}>
                        {item === 'TUAN'
                          ? 'Tuần'
                          : item === 'THANG'
                            ? 'Tháng'
                            : item === 'QUY'
                              ? 'Quý'
                              : 'Năm'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='grid gap-2'>
                <Label>Thời gian</Label>
                <Select value={periodCode} onValueChange={setPeriodCode}>
                  <SelectTrigger>
                    <SelectValue placeholder='Chọn thời gian' />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((item) => (
                      <SelectItem key={item.code} value={item.code}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <div className='rounded-lg border p-4'>
          <div className='flex items-center gap-2'>
            <div className='flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary'>
              2
            </div>
            <div className='text-sm font-semibold'>
              Thiết lập Thời hạn &amp; Tự động
            </div>
          </div>

          <div className='mt-4 grid gap-4 sm:grid-cols-3'>
            <div className='space-y-2'>
              <Label>Ngày mở</Label>
              <Input
                type='date'
                value={openDate}
                onChange={(event) => setOpenDate(event.target.value)}
              />
            </div>

            <div className='space-y-2'>
              <Label>Ngày đóng</Label>
              <Input
                type='date'
                value={closeDate}
                onChange={(event) => setCloseDate(event.target.value)}
              />
            </div>

            <div className='rounded-lg border bg-muted/30 p-4'>
              <div className='flex items-center justify-between gap-3'>
                <Label className='text-sm'>Tự động giao kỳ sau</Label>
                <Switch
                  checked={autoAssignNextPeriod}
                  onCheckedChange={setAutoAssignNextPeriod}
                />
              </div>
              <p className='mt-2 text-xs text-muted-foreground'>
                Tự động giao báo cáo kỳ sau
              </p>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button type='button' variant='outline' onClick={onCancel}>
          Hủy
        </Button>
        <Button type='button' onClick={submit} disabled={isSubmitting}>
          {isSubmitting
            ? 'Đang lưu...'
            : mode === 'create'
              ? 'Tạo báo cáo'
              : 'Lưu thay đổi'}
        </Button>
      </DialogFooter>
    </>
  )
}
