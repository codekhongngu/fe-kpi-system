import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ListChecks, Send, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { apiClient } from '@/lib/api-client'
import type { PeriodType } from '@/features/form-management/api/types'

type PeriodKind = 'week' | 'month' | 'quarter' | 'year'

type OrganizationTreeNode = {
  id: string
  name?: string
  canAssignReports?: boolean
  can_assign_reports?: boolean
  children?: OrganizationTreeNode[]
}

type FormReferenceItem = {
  id: string
  code: string
  name: string
  periodType?: PeriodType
  period_type?: PeriodType
}

type AssignmentListItem = {
  id: string
  formId: string
  formName: string
  orgId: string
  orgName: string
  periodType: PeriodType
  periodFrom: string
  periodTo: string
  periodCode: string | null
  periodName: string | null
  deadlineFrom: string
  deadlineTo: string
  isCancelled: boolean
  cancelReason: string | null
  createdAt: string
}

type NextPeriodAssignmentsInput = {
  formId: string
  fromPeriodType: PeriodType
  fromPeriodFrom: string
  fromPeriodTo: string
  toPeriodType: PeriodType
  toPeriodFrom: string
  toPeriodTo: string
  confirm?: boolean
}

type FormState = {
  formId: string
  periodType: PeriodType | ''
  periodCode: string
  openDate: string
  closeDate: string
  unitIds: string[]
  autoAssignNextPeriod: boolean
}

const defaultState: FormState = {
  formId: '',
  periodType: '',
  periodCode: '',
  openDate: '',
  closeDate: '',
  unitIds: [],
  autoAssignNextPeriod: false,
}

const periodTypeLabel: Record<PeriodType, string> = {
  TUAN: 'Tuần',
  THANG: 'Tháng',
  QUY: 'Quý',
  NAM: 'Năm',
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
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const diff = d.getTime() - yearStart.getTime()
  return Math.ceil((diff / 86400000 + 1) / 7)
}

function formatYMDUTC(date: Date) {
  const y = date.getUTCFullYear()
  const m = pad2(date.getUTCMonth() + 1)
  const d = pad2(date.getUTCDate())
  return `${y}-${m}-${d}`
}

function isoWeekStartEndUTC(year: number, week: number) {
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const jan4Day = jan4.getUTCDay() || 7
  const mondayWeek1 = new Date(jan4)
  mondayWeek1.setUTCDate(jan4.getUTCDate() - (jan4Day - 1))
  const start = new Date(mondayWeek1)
  start.setUTCDate(mondayWeek1.getUTCDate() + (week - 1) * 7)
  const end = new Date(start)
  end.setUTCDate(start.getUTCDate() + 6)
  return { start, end }
}

function monthStartEndUTC(year: number, month: number) {
  const start = new Date(Date.UTC(year, month - 1, 1))
  const end = new Date(Date.UTC(year, month, 0))
  return { start, end }
}

function quarterStartEndUTC(year: number, quarter: number) {
  const startMonth = (quarter - 1) * 3 + 1
  const endMonth = startMonth + 2
  const start = new Date(Date.UTC(year, startMonth - 1, 1))
  const end = new Date(Date.UTC(year, endMonth, 0))
  return { start, end }
}

function yearStartEndUTC(year: number) {
  const start = new Date(Date.UTC(year, 0, 1))
  const end = new Date(Date.UTC(year, 11, 31))
  return { start, end }
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
      return { code: `W-${year}-${pad2(week)}`, label: `Tuần ${pad2(week)}/${year}` }
    })
  }
  if (kind === 'month') {
    return Array.from({ length: 12 }, (_, index) => {
      const month = index + 1
      return { code: `M-${year}-${pad2(month)}`, label: `Tháng ${pad2(month)}/${year}` }
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

function periodInfoFromCode(kind: PeriodKind, code: string) {
  const now = new Date()
  const fallback = defaultPeriodCode(kind, now)
  const value = code || fallback

  if (kind === 'week') {
    const match = /^W-(\d{4})-(\d{2})$/.exec(value)
    const year = match ? Number(match[1]) : now.getFullYear()
    const week = match ? Number(match[2]) : Math.min(52, Math.max(1, getISOWeekNumber(now)))
    const boundedWeek = Math.min(52, Math.max(1, week))
    const { start, end } = isoWeekStartEndUTC(year, boundedWeek)
    return {
      periodCode: `W-${year}-${pad2(boundedWeek)}`,
      periodName: `Tuần ${pad2(boundedWeek)}/${year}`,
      periodFrom: formatYMDUTC(start),
      periodTo: formatYMDUTC(end),
    }
  }

  if (kind === 'month') {
    const match = /^M-(\d{4})-(\d{2})$/.exec(value)
    const year = match ? Number(match[1]) : now.getFullYear()
    const month = match ? Number(match[2]) : now.getMonth() + 1
    const boundedMonth = Math.min(12, Math.max(1, month))
    const { start, end } = monthStartEndUTC(year, boundedMonth)
    return {
      periodCode: `M-${year}-${pad2(boundedMonth)}`,
      periodName: `Tháng ${pad2(boundedMonth)}/${year}`,
      periodFrom: formatYMDUTC(start),
      periodTo: formatYMDUTC(end),
    }
  }

  if (kind === 'quarter') {
    const match = /^Q([1-4])-(\d{4})$/.exec(value)
    const year = match ? Number(match[2]) : now.getFullYear()
    const quarter = match ? Number(match[1]) : Math.floor(now.getMonth() / 3) + 1
    const boundedQuarter = Math.min(4, Math.max(1, quarter))
    const { start, end } = quarterStartEndUTC(year, boundedQuarter)
    return {
      periodCode: `Q${boundedQuarter}-${year}`,
      periodName: `Quý ${boundedQuarter}/${year}`,
      periodFrom: formatYMDUTC(start),
      periodTo: formatYMDUTC(end),
    }
  }

  const match = /^Y-(\d{4})$/.exec(value)
  const yearRaw = match ? Number(match[1]) : now.getFullYear()
  const year = Math.min(2035, Math.max(2022, yearRaw))
  const { start, end } = yearStartEndUTC(year)
  return {
    periodCode: `Y-${year}`,
    periodName: `Năm ${year}`,
    periodFrom: formatYMDUTC(start),
    periodTo: formatYMDUTC(end),
  }
}

function nextPeriodCode(kind: PeriodKind, code: string) {
  const now = new Date()
  const current = periodInfoFromCode(kind, code || defaultPeriodCode(kind, now))

  if (kind === 'week') {
    const match = /^W-(\d{4})-(\d{2})$/.exec(current.periodCode)
    const year = match ? Number(match[1]) : now.getFullYear()
    const week = match ? Number(match[2]) : Math.min(52, Math.max(1, getISOWeekNumber(now)))
    const nextWeek = week >= 52 ? 1 : week + 1
    const nextYear = week >= 52 ? year + 1 : year
    return `W-${nextYear}-${pad2(nextWeek)}`
  }

  if (kind === 'month') {
    const match = /^M-(\d{4})-(\d{2})$/.exec(current.periodCode)
    const year = match ? Number(match[1]) : now.getFullYear()
    const month = match ? Number(match[2]) : now.getMonth() + 1
    const nextMonth = month >= 12 ? 1 : month + 1
    const nextYear = month >= 12 ? year + 1 : year
    return `M-${nextYear}-${pad2(nextMonth)}`
  }

  if (kind === 'quarter') {
    const match = /^Q([1-4])-(\d{4})$/.exec(current.periodCode)
    const quarter = match ? Number(match[1]) : Math.floor(now.getMonth() / 3) + 1
    const year = match ? Number(match[2]) : now.getFullYear()
    const nextQuarter = quarter >= 4 ? 1 : quarter + 1
    const nextYear = quarter >= 4 ? year + 1 : year
    return `Q${nextQuarter}-${nextYear}`
  }

  const match = /^Y-(\d{4})$/.exec(current.periodCode)
  const yearRaw = match ? Number(match[1]) : now.getFullYear()
  const nextYear = Math.min(2035, Math.max(2022, yearRaw + 1))
  return `Y-${nextYear}`
}

function todayISO() {
  const now = new Date()
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`
}

export function ReportCoordinationTab() {
  const queryClient = useQueryClient()
  const [state, setState] = useState<FormState>(() => ({
    ...defaultState,
    openDate: todayISO(),
    closeDate: todayISO(),
  }))
  const [periodKind, setPeriodKind] = useState<PeriodKind>('month')
  const [unitSearch, setUnitSearch] = useState('')
  const [showAssignedList, setShowAssignedList] = useState(false)
  const [assignedFilters, setAssignedFilters] = useState({
    reportName: '',
    periodName: '',
    unitName: '',
  })

  const formsQuery = useQuery({
    queryKey: ['report-coordination', 'forms'],
    queryFn: async () => {
      const response = await apiClient.get<{ items: FormReferenceItem[] } | FormReferenceItem[]>(
        '/forms',
        { params: { page: 1, limit: 200 } },
      )
      const payload = response.data
      const items = Array.isArray(payload) ? payload : payload.items ?? []
      return items.map((item) => ({
        id: item.id,
        code: item.code ?? '',
        name: item.name ?? '',
        periodType: item.periodType ?? item.period_type,
      }))
    },
    retry: false,
  })

  const orgTreeQuery = useQuery({
    queryKey: ['report-coordination', 'orgs', { q: unitSearch.trim() }],
    queryFn: async () => {
      const q = unitSearch.trim()
      const response = await apiClient.get<OrganizationTreeNode[] | { items?: OrganizationTreeNode[] }>(
        '/orgs',
        { params: { tree: true, q: q.length > 0 ? q : undefined } },
      )
      const payload = response.data
      return Array.isArray(payload) ? payload : payload.items ?? []
    },
    retry: false,
  })

  const assignmentsQuery = useQuery({
    queryKey: ['report-coordination', 'assignments', 'list'],
    queryFn: async () => {
      const response = await apiClient.get<{ items: AssignmentListItem[] } | AssignmentListItem[]>(
        '/assignments',
        { params: { page: 1, limit: 200 } },
      )
      const payload = response.data
      return Array.isArray(payload) ? payload : payload.items ?? []
    },
    enabled: showAssignedList,
    retry: false,
  })

  const forms = formsQuery.data ?? []
  const selectedForm = forms.find((item) => item.id === state.formId)

  useEffect(() => {
    if (!selectedForm?.periodType) return
    const kind = toPeriodKind(selectedForm.periodType)
    setPeriodKind(kind)
    setState((prev) => ({
      ...prev,
      periodType: selectedForm.periodType ?? prev.periodType,
      periodCode: defaultPeriodCode(kind, new Date()),
    }))
  }, [selectedForm?.periodType])

  useEffect(() => {
    setState((prev) => {
      if (prev.periodCode) return prev
      return { ...prev, periodCode: defaultPeriodCode(periodKind, new Date()) }
    })
  }, [periodKind])

  const allowedUnitIds = useMemo(() => {
    const allowed = new Set<string>()
    const walk = (nodes: OrganizationTreeNode[]) => {
      nodes.forEach((node) => {
        const canAssign = Boolean(node.canAssignReports ?? node.can_assign_reports ?? true)
        if (canAssign) allowed.add(node.id)
        const children = Array.isArray(node.children) ? node.children : []
        if (children.length > 0) walk(children)
      })
    }
    if (orgTreeQuery.data) walk(orgTreeQuery.data)
    return allowed
  }, [orgTreeQuery.data])

  useEffect(() => {
    setState((prev) => {
      if (prev.unitIds.length === 0) return prev
      const next = prev.unitIds.filter((id) => allowedUnitIds.has(id))
      if (next.length === prev.unitIds.length) return prev
      return { ...prev, unitIds: next }
    })
  }, [allowedUnitIds])

  const normalize = (value: string) => value.trim().toLowerCase()

  const filteredAssignments = useMemo(() => {
    const reportName = normalize(assignedFilters.reportName)
    const periodName = normalize(assignedFilters.periodName)
    const unitName = normalize(assignedFilters.unitName)

    return (assignmentsQuery.data ?? []).filter((item) => {
      const matchesReportName = !reportName || normalize(item.formName).includes(reportName)
      const matchesPeriodName =
        !periodName ||
        normalize(item.periodName ?? item.periodCode ?? `${item.periodFrom} ${item.periodTo}`).includes(
          periodName,
        )
      const matchesUnitName = !unitName || normalize(item.orgName).includes(unitName)
      return matchesReportName && matchesPeriodName && matchesUnitName
    })
  }, [assignedFilters.periodName, assignedFilters.reportName, assignedFilters.unitName, assignmentsQuery.data])

  const renderOrgTree = (nodes: OrganizationTreeNode[], depth = 0) => {
    return nodes.map((node) => {
      const checked = state.unitIds.includes(node.id)
      const canAssign = Boolean(node.canAssignReports ?? node.can_assign_reports ?? true)
      const children = Array.isArray(node.children) ? node.children : []
      return (
        <div key={node.id}>
          <label
            className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
              canAssign ? 'cursor-pointer hover:bg-muted/50' : 'cursor-not-allowed opacity-60'
            }`}
            style={{ paddingLeft: `${8 + depth * 16}px` }}
          >
            <input
              type='checkbox'
              checked={checked}
              disabled={!canAssign}
              onChange={(event) => {
                if (event.target.checked) {
                  setState((prev) => ({ ...prev, unitIds: [...prev.unitIds, node.id] }))
                  return
                }
                setState((prev) => ({ ...prev, unitIds: prev.unitIds.filter((id) => id !== node.id) }))
              }}
            />
            <span className='min-w-0 truncate font-medium'>{node.name ?? node.id}</span>
          </label>
          {children.length > 0 ? <div className='space-y-1'>{renderOrgTree(children, depth + 1)}</div> : null}
        </div>
      )
    })
  }

  const createMutation = useMutation({
    mutationFn: async (input: {
      formId: string
      periodType: PeriodType
      periodFrom: string
      periodTo: string
      periodCode?: string
      periodName?: string
      orgIds: string[]
      deadlineFrom: string
      deadlineTo: string
    }) => {
      const response = await apiClient.post('/assignments', input)
      return response.data as unknown
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-coordination', 'assignments', 'list'] })
    },
    onError: (error) => toast.error(error.message),
  })

  const cancelMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      await apiClient.post(`/assignments/${id}/cancel`, { reason })
      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-coordination', 'assignments', 'list'] })
    },
    onError: (error) => toast.error(error.message),
  })

  const nextPeriodMutation = useMutation({
    mutationFn: async (input: NextPeriodAssignmentsInput) => {
      const response = await apiClient.post('/assignments/next-period', input)
      return response.data as unknown
    },
    onError: (error) => toast.error(error.message),
  })

  const submit = async () => {
    if (!state.formId || !state.periodType) {
      toast.error('Vui lòng chọn biểu mẫu và kỳ báo cáo.')
      return
    }
    if (state.unitIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất một đơn vị.')
      return
    }
    if (!state.openDate || !state.closeDate) {
      toast.error('Vui lòng chọn ngày mở và ngày đóng.')
      return
    }
    if (state.openDate > state.closeDate) {
      toast.error('Ngày mở không được lớn hơn ngày đóng.')
      return
    }

    const kind = toPeriodKind(state.periodType)
    const currentPeriod = periodInfoFromCode(kind, state.periodCode)
    await createMutation.mutateAsync({
      formId: state.formId,
      periodType: state.periodType,
      periodFrom: currentPeriod.periodFrom,
      periodTo: currentPeriod.periodTo,
      periodCode: currentPeriod.periodCode,
      periodName: currentPeriod.periodName,
      orgIds: state.unitIds,
      deadlineFrom: state.openDate,
      deadlineTo: state.closeDate,
    })

    if (state.autoAssignNextPeriod) {
      const nextCode = nextPeriodCode(kind, state.periodCode)
      const nextPeriod = periodInfoFromCode(kind, nextCode)
      await nextPeriodMutation.mutateAsync({
        formId: state.formId,
        fromPeriodType: state.periodType,
        fromPeriodFrom: currentPeriod.periodFrom,
        fromPeriodTo: currentPeriod.periodTo,
        toPeriodType: state.periodType,
        toPeriodFrom: nextPeriod.periodFrom,
        toPeriodTo: nextPeriod.periodTo,
        confirm: true,
      })
    }

    toast.success('Đã giao báo cáo.')
  }

  const reset = () => {
    setState(() => ({
      ...defaultState,
      openDate: todayISO(),
      closeDate: todayISO(),
    }))
    setPeriodKind('month')
    setUnitSearch('')
  }

  const canChangePeriodType = !selectedForm?.periodType

  return (
    <>
      <Card>
        <CardHeader className='gap-4 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <CardTitle className='text-2xl'>Điều phối báo cáo</CardTitle>
            <CardDescription>
              Giao báo cáo theo kỳ (tuần/tháng/quý/năm), cấu hình thời hạn và theo dõi danh sách đã giao.
            </CardDescription>
          </div>
          <div className='flex w-full flex-col gap-2 sm:ms-auto sm:w-auto sm:flex-row sm:justify-end'>
            <Button
              variant='outline'
              onClick={() => setShowAssignedList((prev) => !prev)}
              disabled={createMutation.isPending}
            >
              <ListChecks />
              Danh sách đã giao
            </Button>
            <Button variant='outline' onClick={reset} disabled={createMutation.isPending}>
              <XCircle />
              Làm mới
            </Button>
            <Button onClick={submit} disabled={createMutation.isPending}>
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
                <CardTitle className='text-base'>Cấu hình Biểu mẫu &amp; Kỳ</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='space-y-2 sm:col-span-2'>
                  <Label>Biểu mẫu cần giao</Label>
                  <Select value={state.formId} onValueChange={(value) => setState((p) => ({ ...p, formId: value }))}>
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Chọn biểu mẫu' />
                    </SelectTrigger>
                    <SelectContent>
                      {formsQuery.isLoading ? (
                        <div className='px-2 py-1.5 text-sm text-muted-foreground'>Đang tải biểu mẫu...</div>
                      ) : formsQuery.isError ? (
                        <div className='px-2 py-1.5 text-sm text-destructive'>Không tải được biểu mẫu.</div>
                      ) : forms.length === 0 ? (
                        <div className='px-2 py-1.5 text-sm text-muted-foreground'>Chưa có biểu mẫu.</div>
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

                <div className='space-y-2'>
                  <Label>Kỳ báo cáo</Label>
                  <Select
                    value={state.periodType || ''}
                    disabled={!canChangePeriodType}
                    onValueChange={(value: PeriodType) => {
                      const kind = toPeriodKind(value)
                      const code = defaultPeriodCode(kind, new Date())
                      setPeriodKind(kind)
                      setState((prev) => ({ ...prev, periodType: value, periodCode: code }))
                    }}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Chọn kỳ báo cáo' />
                    </SelectTrigger>
                    <SelectContent>
                      {(['TUAN', 'THANG', 'QUY', 'NAM'] as const).map((item) => (
                        <SelectItem key={item} value={item}>
                          {periodTypeLabel[item]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label>Thời gian</Label>
                  <Select
                    value={state.periodCode}
                    onValueChange={(value) => setState((prev) => ({ ...prev, periodCode: value }))}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Chọn thời gian' />
                    </SelectTrigger>
                    <SelectContent>
                      {periodOptions(periodKind, new Date()).map((item) => (
                        <SelectItem key={item.code} value={item.code}>
                          {item.label}
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
                <CardTitle className='text-base'>Thiết lập Thời hạn &amp; Tự động</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className='grid gap-4 sm:grid-cols-3'>
                <div className='space-y-2'>
                  <Label>Ngày mở</Label>
                  <Input
                    type='date'
                    value={state.openDate}
                    onChange={(event) => setState((prev) => ({ ...prev, openDate: event.target.value }))}
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Ngày đóng</Label>
                  <Input
                    type='date'
                    value={state.closeDate}
                    onChange={(event) => setState((prev) => ({ ...prev, closeDate: event.target.value }))}
                  />
                </div>
                <div className='rounded-lg border bg-muted/30 p-4'>
                  <div className='flex items-center justify-between gap-3'>
                    <Label className='text-sm'>Tự động giao kỳ sau</Label>
                    <Switch
                      checked={state.autoAssignNextPeriod}
                      onCheckedChange={(checked) =>
                        setState((prev) => ({ ...prev, autoAssignNextPeriod: checked }))
                      }
                    />
                  </div>
                  <p className='mt-2 text-xs text-muted-foreground'>Tự động giao báo cáo kỳ sau</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className='overflow-hidden lg:col-span-1'>
          <CardHeader className='flex flex-row items-center justify-between gap-3'>
            <CardTitle className='text-base'>Đơn vị nhận báo cáo</CardTitle>
            <Badge variant='secondary'>Đã chọn: {state.unitIds.length}</Badge>
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
              {orgTreeQuery.isLoading ? (
                <div className='rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground'>
                  Đang tải cây đơn vị...
                </div>
              ) : orgTreeQuery.isError ? (
                <div className='rounded-md border border-dashed p-4 text-center text-sm text-destructive'>
                  Không tải được cây đơn vị.
                </div>
              ) : (orgTreeQuery.data?.length ?? 0) > 0 ? (
                <div className='space-y-1'>{renderOrgTree(orgTreeQuery.data ?? [])}</div>
              ) : (
                <div className='rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground'>
                  Không có đơn vị phù hợp.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {showAssignedList ? (
        <Card className='overflow-hidden'>
          <CardHeader className='gap-2 sm:flex sm:flex-row sm:items-start sm:justify-between'>
            <div className='min-w-0'>
              <CardTitle className='text-base'>Danh sách đã giao</CardTitle>
              <CardDescription>Danh sách báo cáo đã được giao cho các đơn vị.</CardDescription>
            </div>
            <Badge variant='secondary'>Tổng: {filteredAssignments.length}</Badge>
          </CardHeader>
          <CardContent className='p-0'>
            <div className='border-y p-4'>
              <div className='grid gap-4 sm:grid-cols-3'>
                <div className='space-y-2'>
                  <Label>Tên báo cáo</Label>
                  <Input
                    value={assignedFilters.reportName}
                    onChange={(event) =>
                      setAssignedFilters((prev) => ({ ...prev, reportName: event.target.value }))
                    }
                    placeholder='Nhập tên báo cáo...'
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Kỳ dữ liệu</Label>
                  <Input
                    value={assignedFilters.periodName}
                    onChange={(event) =>
                      setAssignedFilters((prev) => ({ ...prev, periodName: event.target.value }))
                    }
                    placeholder='Nhập kỳ dữ liệu...'
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Đơn vị thực hiện</Label>
                  <Input
                    value={assignedFilters.unitName}
                    onChange={(event) =>
                      setAssignedFilters((prev) => ({ ...prev, unitName: event.target.value }))
                    }
                    placeholder='Nhập đơn vị...'
                  />
                </div>
              </div>
            </div>

            <div className='overflow-hidden'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên biểu mẫu</TableHead>
                    <TableHead>Kỳ dữ liệu</TableHead>
                    <TableHead>Ngày mở</TableHead>
                    <TableHead>Ngày đóng</TableHead>
                    <TableHead>Kỳ báo cáo</TableHead>
                    <TableHead>Ngày bắt đầu</TableHead>
                    <TableHead>Ngày kết thúc</TableHead>
                    <TableHead>Đơn vị nhận</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className='text-right'>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignmentsQuery.isLoading && (
                    <TableRow>
                      <TableCell colSpan={10} className='h-20 text-center text-sm text-muted-foreground'>
                        Đang tải danh sách đã giao...
                      </TableCell>
                    </TableRow>
                  )}
                  {assignmentsQuery.isError && (
                    <TableRow>
                      <TableCell colSpan={10} className='h-20 text-center text-sm text-destructive'>
                        Không tải được danh sách đã giao.
                      </TableCell>
                    </TableRow>
                  )}
                  {!assignmentsQuery.isLoading &&
                    !assignmentsQuery.isError &&
                    filteredAssignments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={10} className='h-20 text-center text-sm text-muted-foreground'>
                          Không có dữ liệu phù hợp.
                        </TableCell>
                      </TableRow>
                    )}
                  {!assignmentsQuery.isLoading &&
                    !assignmentsQuery.isError &&
                    filteredAssignments.map((item) => {
                      const periodLabel =
                        item.periodName ?? item.periodCode ?? `${item.periodFrom} - ${item.periodTo}`
                      return (
                        <TableRow key={item.id}>
                          <TableCell>{item.formName || item.formId}</TableCell>
                          <TableCell>{periodLabel}</TableCell>
                          <TableCell>{item.deadlineFrom || '-'}</TableCell>
                          <TableCell>{item.deadlineTo || '-'}</TableCell>
                          <TableCell>{periodTypeLabel[item.periodType] ?? '-'}</TableCell>
                          <TableCell>{item.periodFrom || '-'}</TableCell>
                          <TableCell>{item.periodTo || '-'}</TableCell>
                          <TableCell>{item.orgName || item.orgId}</TableCell>
                          <TableCell>
                            <Badge variant={item.isCancelled ? 'secondary' : 'default'}>
                              {item.isCancelled ? 'Đã hủy' : 'Đã giao'}
                            </Badge>
                          </TableCell>
                          <TableCell className='text-right'>
                            <div className='flex justify-end gap-2'>
                              <Button
                                size='sm'
                                variant='outline'
                                disabled={item.isCancelled || cancelMutation.isPending}
                                onClick={() => {
                                  const confirmed = window.confirm('Bạn có chắc chắn muốn hủy giao báo cáo?')
                                  if (!confirmed) return
                                  const reason = window.prompt('Nhập lý do hủy (có thể bỏ trống):') ?? undefined
                                  cancelMutation.mutate({ id: item.id, reason })
                                }}
                              >
                                Hủy giao
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </>
  )
}

