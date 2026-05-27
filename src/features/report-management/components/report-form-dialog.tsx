import { useEffect, useMemo, useState, type UIEvent } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DateField } from '@/components/ui/date-field'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { formManagementApi } from '@/features/form-management/api/template-management-api'
import type {
  FormTemplate,
  PeriodType,
} from '@/features/form-management/api/types'
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

type FormOption = Pick<FormTemplate, 'id' | 'code' | 'name' | 'periodType'>

const formPageSize = 20
const periodTypes: PeriodType[] = ['TUAN', 'THANG', 'QUY', 'NAM']

function isPeriodType(value: string | undefined): value is PeriodType {
  return (
    value === 'TUAN' ||
    value === 'THANG' ||
    value === 'QUY' ||
    value === 'NAM'
  )
}

function formatFormLabel(form: { code?: string; name?: string }) {
  const code = form.code?.trim() ?? ''
  const name = form.name?.trim() ?? ''
  if (code && name) return `${code} - ${name}`
  return code || name || ''
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
    const q = periodCode.startsWith('Q') ? periodCode.slice(1).split('-')[0] : ''
    return { periodCode: `KBCQ${q}`, periodName: `Kỳ báo cáo quý ${q}` }
  }
  const year = periodCode.split('-').slice(-1)[0] ?? ''
  return { periodCode: `KBCN${year}`, periodName: `Kỳ báo cáo năm ${year}` }
}

export function ReportFormDialog({
  open,
  mode,
  report,
  isSubmitting,
  onOpenChange,
  onCreate,
  onUpdate,
}: ReportFormDialogProps) {
  const title = mode === 'create' ? 'Tạo báo cáo' : 'Chỉnh sửa báo cáo';
  const description = mode === 'create'
    ? 'Tạo mới báo cáo từ biểu mẫu.'
    : 'Cập nhật thông tin báo cáo.';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-3xl'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <ReportForm
          active={open}
          mode={mode}
          report={report}
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
  const [selectedFormInfo, setSelectedFormInfo] = useState<FormOption | null>(
    null
  )
  const [formPickerOpen, setFormPickerOpen] = useState(false)
  const [formSearch, setFormSearch] = useState('')
  const [debouncedFormSearch, setDebouncedFormSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFormSearch(formSearch.trim())
    }, 250)
    return () => clearTimeout(timer)
  }, [formSearch])

  const formsQuery = useInfiniteQuery({
    queryKey: ['report-management', 'forms', { search: debouncedFormSearch }],
    queryFn: async ({ pageParam = 1 }) => {
      return formManagementApi.listTemplates({
        search: debouncedFormSearch || undefined,
        page: pageParam,
        limit: formPageSize,
        template_status: 'READY,IN_USE',
      })
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, limit, total } = lastPage.meta
      return page * limit < total ? page + 1 : undefined
    },
    retry: false,
    enabled: active,
  })

  const forms = useMemo(() => {
    const pages = formsQuery.data?.pages ?? []
    return pages.flatMap((page) => page.items)
  }, [formsQuery.data])

  const selectedFormFromList = useMemo(() => {
    return forms.find((item) => item.id === form.templateId)
  }, [form.templateId, forms])

  const selectedForm = selectedFormFromList ?? selectedFormInfo
  const selectedPeriodType = selectedForm?.periodType

  useEffect(() => {
    if (!active) {
      return
    }
    const resetCommonState = () => {
      setPeriodType('THANG')
      setPeriodCode(defaultPeriodCode(toPeriodKind('THANG'), new Date()))
      setOpenDate(todayISO())
      setCloseDate(todayISO())
      setAutoAssignNextPeriod(false)
      setFormPickerOpen(false)
      setFormSearch('')
      setDebouncedFormSearch('')
    }

    if (mode === 'edit' && report) {
      const reportTemplateCode = report.templateCode ?? report.code ?? ''
      const reportTemplateName = report.templateName ?? report.name ?? ''
      setForm({
        name: report.name ?? '',
        templateId: report.formId,
        deadline: report.deadline ?? report.closeDate ?? todayISO(),
        priority: emptyForm.priority,
        note: '',
      })
      setSelectedFormInfo({
        id: report.formId,
        code: reportTemplateCode,
        name: reportTemplateName,
        periodType: isPeriodType(report.periodType) ? report.periodType : undefined,
      })
      resetCommonState()
      setOpenDate(report.deadlineFrom?.split('T')[0] ?? report.openDate ?? todayISO())
      setCloseDate(report.deadlineTo?.split('T')[0] ?? report.closeDate ?? report.deadline ?? todayISO())
      return
    }

    setForm({
      ...emptyForm,
      deadline: todayISO(),
    })
    setSelectedFormInfo(null)
    resetCommonState()
  }, [active, mode, report])

  const periodKind = useMemo(() => toPeriodKind(periodType), [periodType])
  const timeOptions = useMemo(
    () => periodOptions(periodKind, new Date()),
    [periodKind]
  )

  useEffect(() => {
    if (!active) return
    if (mode !== 'create') return
    const nextType = selectedPeriodType
    if (!nextType) return
    setPeriodType((prev) => (prev === nextType ? prev : nextType))
    setPeriodCode((prev) => {
      const nextCode = defaultPeriodCode(toPeriodKind(nextType), new Date())
      return prev === nextCode ? prev : nextCode
    })
  }, [active, mode, selectedPeriodType])

  useEffect(() => {
    if (!active) return
    if (mode !== 'create') return
    setForm((prev) => {
      if (prev.deadline) return prev
      return { ...prev, deadline: closeDate }
    })
  }, [active, closeDate, mode])

  const selectedFormLabel = selectedForm
    ? formatFormLabel(selectedForm)
    : mode === 'edit'
      ? formatFormLabel({
        code: report?.templateCode ?? report?.code ?? '',
        name: report?.templateName ?? report?.name ?? '',
      })
      : ''
  const formsLoading = formsQuery.isLoading && forms.length === 0

  const handleSelectForm = (item: FormOption) => {
    setForm((prev) => ({
      ...prev,
      templateId: item.id,
      name: item.name.trim(),
    }))
    setSelectedFormInfo(item)
    if (item.periodType) {
      setPeriodType(item.periodType)
      setPeriodCode(defaultPeriodCode(toPeriodKind(item.periodType), new Date()))
    }
    setFormPickerOpen(false)
    setFormSearch('')
    setDebouncedFormSearch('')
  }

  const handleFormListScroll = (event: UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget
    const remaining = target.scrollHeight - target.scrollTop - target.clientHeight
    if (remaining > 24) return
    if (!formsQuery.hasNextPage || formsQuery.isFetchingNextPage) return
    void formsQuery.fetchNextPage()
  }

  const submit = () => {
    const reportName = (selectedForm?.name ?? form.name).trim()
    const note = form.note.trim()
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
        note: note || null,
      })
      return
    }

    if (!report) return
    if (!openDate || !closeDate) {
      toast.error('Vui lòng chọn ngày mở và ngày đóng.')
      return
    }
    if (openDate > closeDate) {
      toast.error('Ngày mở không được lớn hơn ngày đóng.')
      return
    }
    onUpdate(report.id, {
      deadlineFrom: openDate,
      deadlineTo: closeDate,
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
            <div className='text-sm font-semibold'>Cấu hình Biểu mẫu &amp; Kỳ</div>
          </div>

          <div className='mt-4 grid gap-5'>
            <div className='grid gap-2'>
              <Label>Biểu mẫu</Label>
              <Popover
                open={formPickerOpen && mode !== 'edit'}
                onOpenChange={(open) => {
                  setFormPickerOpen(open)
                  if (!open) {
                    setFormSearch('')
                    setDebouncedFormSearch('')
                  }
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    type='button'
                    variant='outline'
                    role='combobox'
                    disabled={mode === 'edit'}
                    className='w-full justify-between'
                  >
                    <span className='truncate text-left'>
                      {formsLoading
                        ? 'Đang tải biểu mẫu...'
                        : selectedFormLabel || 'Chọn biểu mẫu'}
                    </span>
                    {formsLoading ? (
                      <Loader2 className='ml-2 h-4 w-4 shrink-0 animate-spin opacity-50' />
                    ) : (
                      <CaretSortIcon className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className='w-[36rem] max-w-[calc(100vw-2rem)] p-0'
                  align='start'
                >
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder='Tìm biểu mẫu...'
                      value={formSearch}
                      onValueChange={setFormSearch}
                    />
                    <CommandList onScroll={handleFormListScroll}>
                      {formsQuery.isLoading ? (
                        <div className='px-3 py-2 text-sm text-muted-foreground'>
                          Đang tải biểu mẫu...
                        </div>
                      ) : formsQuery.isError ? (
                        <div className='px-3 py-2 text-sm text-destructive'>
                          Không tải được biểu mẫu.
                        </div>
                      ) : forms.length === 0 ? (
                        <CommandEmpty>
                          {debouncedFormSearch
                            ? 'Không tìm thấy biểu mẫu.'
                            : 'Chưa có biểu mẫu.'}
                        </CommandEmpty>
                      ) : (
                        <>
                          <CommandGroup>
                            {forms.map((item) => (
                              <CommandItem
                                key={item.id}
                                value={`${item.code} ${item.name}`}
                                onSelect={() => handleSelectForm(item)}
                              >
                                <CheckIcon
                                  className={
                                    form.templateId === item.id
                                      ? 'mr-2 h-4 w-4 opacity-100'
                                      : 'mr-2 h-4 w-4 opacity-0'
                                  }
                                />
                                <span className='truncate'>
                                  {formatFormLabel(item)}
                                </span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                          <div className='flex items-center justify-between gap-3 border-t px-3 py-2 text-xs text-muted-foreground'>
                            <span>
                              {formsQuery.isFetchingNextPage
                                ? 'Đang tải thêm...'
                                : formsQuery.hasNextPage
                                  ? 'Cuộn xuống để tải thêm.'
                                  : 'Đã tải hết biểu mẫu.'}
                            </span>
                            {formsQuery.isFetchingNextPage ? (
                              <Loader2 className='h-3.5 w-3.5 animate-spin' />
                            ) : null}
                          </div>
                        </>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='grid gap-2'>
                <Label>Kỳ báo cáo</Label>
                <Select
                  value={periodType}
                  disabled={Boolean(selectedPeriodType)}
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
                    {periodTypes.map((item) => (
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
              <DateField
                value={openDate}
                onChange={setOpenDate}
              />
            </div>

            <div className='space-y-2'>
              <Label>Ngày đóng</Label>
              <DateField
                value={closeDate}
                onChange={setCloseDate}
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
