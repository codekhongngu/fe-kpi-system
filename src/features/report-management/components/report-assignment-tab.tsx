import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Send, XCircle } from 'lucide-react'
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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { reportManagementApi } from '../api/mock-report-management-api'
import { type ReportReferenceItem } from '../api/types'

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

type PeriodKind = 'month' | 'quarter' | 'year'

const periodKindLabel: Record<PeriodKind, string> = {
  month: 'Tháng',
  quarter: 'Quý',
  year: 'Năm',
}

const getPeriodKind = (period: ReportReferenceItem): PeriodKind => {
  const code = period.code ?? ''
  if (code.startsWith('M-')) return 'month'
  if (code.startsWith('Q')) return 'quarter'
  return 'year'
}

export function ReportAssignmentTab() {
  const queryClient = useQueryClient()
  const refsQuery = useQuery({
    queryKey: ['report-management', 'refs'],
    queryFn: () => reportManagementApi.listReferenceData(),
  })

  const forms = refsQuery.data?.forms ?? []
  const periods = refsQuery.data?.periods ?? []
  const units = refsQuery.data?.units ?? []

  const [form, setForm] = useState<AssignmentFormState>(defaultForm)
  const [periodKind, setPeriodKind] = useState<PeriodKind>('month')
  const [unitSearch, setUnitSearch] = useState('')

  const filteredPeriods = useMemo(() => {
    return periods.filter((item) => getPeriodKind(item) === periodKind)
  }, [periodKind, periods])

  const visibleUnits = useMemo(() => {
    const keyword = unitSearch.trim().toLowerCase()
    if (!keyword) return units
    return units.filter((unit) => [unit.code, unit.name].some((value) => value.toLowerCase().includes(keyword)))
  }, [unitSearch, units])

  const createMutation = useMutation({
    mutationFn: reportManagementApi.createAssignments,
    onSuccess: (result) => {
      toast.success(`Đã giao ${result.length} báo cáo và tạo instance tương ứng.`)
      queryClient.invalidateQueries({ queryKey: ['report-management'] })
      setForm(defaultForm)
      setUnitSearch('')
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

  const resetForm = () => {
    setForm(defaultForm)
    setPeriodKind('month')
    setUnitSearch('')
  }

  return (
    <>
      <Card>
        <CardHeader className='gap-4 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <CardTitle className='text-2xl'>Quy trình phân phối báo cáo</CardTitle>
            <CardDescription>Thiết lập kỳ báo cáo, chọn đơn vị nhận và cấu hình thời hạn nộp.</CardDescription>
          </div>
          <div className='flex w-full flex-col gap-2 sm:ms-auto sm:w-auto sm:flex-row sm:justify-end'>
            <Button variant='outline' onClick={resetForm} disabled={createMutation.isPending}>
              <XCircle />
              Hủy giao
            </Button>
            <Button onClick={submitAssignment} disabled={createMutation.isPending}>
              <Send />
              Xác nhận &amp; Giao báo cáo
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        <div className='space-y-6 lg:col-span-2'>
          <Card>
            <CardHeader className='pb-4'>
              <div className='flex items-center gap-2'>
                <div className='flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary'>
                  1
                </div>
                <CardTitle className='text-base'>Cấu hình Biểu mẫu &amp; Kỳ báo cáo</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='space-y-2 sm:col-span-2'>
                  <Label>Biểu mẫu cần giao</Label>
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
                    value={periodKind}
                    onValueChange={(value: PeriodKind) => {
                      setPeriodKind(value)
                      setForm((prev) => ({ ...prev, reportPeriodId: '' }))
                    }}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Chọn kỳ báo cáo' />
                    </SelectTrigger>
                    <SelectContent>
                      {(['month', 'quarter', 'year'] as const).map((item) => (
                        <SelectItem key={item} value={item}>
                          {periodKindLabel[item]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label>Thời gian</Label>
                  <Select
                    value={form.reportPeriodId}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, reportPeriodId: value }))}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Chọn thời gian' />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredPeriods.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.code} - {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-4'>
              <div className='flex items-center gap-2'>
                <div className='flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary'>
                  2
                </div>
                <CardTitle className='text-base'>Thiết lập Thời hạn &amp; Tự động hóa</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='space-y-2'>
                  <Label>Hạn nhập liệu (Deadline)</Label>
                  <Input
                    type='date'
                    value={form.dueDate}
                    onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))}
                  />
                  <p className='text-xs text-muted-foreground'>Hệ thống sẽ khóa nhập liệu sau thời gian này.</p>
                </div>

                <div className='rounded-lg border bg-muted/30 p-4'>
                  <div className='flex items-center justify-between gap-3'>
                    <Label className='text-sm'>Tự động giao kỳ sau</Label>
                    <Switch
                      checked={form.autoAssignNextPeriod}
                      onCheckedChange={(checked) =>
                        setForm((prev) => ({ ...prev, autoAssignNextPeriod: checked }))
                      }
                    />
                  </div>
                  <p className='mt-2 text-xs text-muted-foreground'>
                    Biểu mẫu sẽ tự động được gửi vào kỳ tiếp theo tương ứng.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className='overflow-hidden lg:col-span-1'>
          <CardHeader className='flex flex-row items-center justify-between gap-3'>
            <div className='flex items-center gap-2'>
              <div className='flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary'>
                3
              </div>
              <CardTitle className='text-base'>Đơn vị nhận báo cáo</CardTitle>
            </div>
            <Badge variant='secondary'>Đã chọn: {form.unitIds.length}</Badge>
          </CardHeader>
          <CardContent className='p-0'>
            <div className='border-b p-4'>
              <Input
                placeholder='Tìm kiếm đơn vị...'
                value={unitSearch}
                onChange={(event) => setUnitSearch(event.target.value)}
              />
            </div>
            <div className='max-h-[420px] overflow-auto p-4'>
              <div className='space-y-2'>
                {visibleUnits.map((unit) => {
                  const checked = form.unitIds.includes(unit.id)
                  return (
                    <label
                      key={unit.id}
                      className='flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50'
                    >
                      <input
                        type='checkbox'
                        checked={checked}
                        onChange={(event) => {
                          if (event.target.checked) {
                            setForm((prev) => ({ ...prev, unitIds: [...prev.unitIds, unit.id] }))
                            return
                          }
                          setForm((prev) => ({ ...prev, unitIds: prev.unitIds.filter((id) => id !== unit.id) }))
                        }}
                      />
                      <span className='font-medium'>
                        {unit.code} - {unit.name}
                      </span>
                    </label>
                  )
                })}
                {visibleUnits.length === 0 && (
                  <div className='rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground'>
                    Không có đơn vị phù hợp.
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
