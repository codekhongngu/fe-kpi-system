import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  ChartNoAxesColumn,
  CheckCircle2,
  Download,
  Filter,
  Eye,
  Info,
  List,
  Lock,
  MoreVertical,
  PencilLine,
  Rocket,
  ShieldCheck,
  Settings2,
  Workflow,
  Search,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { apiClient } from '@/lib/api-client'
import { reportManagementApi } from '../api/mock-report-management-api'
import type { ReportDetail } from '../api/types'
import { getErrorMessage, reportQueryKeys } from '../utils/report-query'
import { ReportPriorityBadge, ReportStatusBadge } from '../components/report-status'

type OrganizationTreeNode = {
  id: string
  name?: string
  canAssignReports?: boolean
  can_assign_reports?: boolean
  children?: OrganizationTreeNode[]
 }
 
 type IndicatorItem = {
   id: string
   code: string
   name: string
   parentId: string | null
   hasChildren?: boolean
 }
 
 type ReportDetailsPageProps = {
  reportId: string
}

function formatDateTime(value: string | null) {
  if (!value) return '--'
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatDate(value: string | null | undefined) {
  if (!value) return '--'
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(value))
}

function formatTimeDashDate(value: string | null) {
  if (!value) return '--'
  const date = new Date(value)
  const time = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(date)
  const day = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
  return `${time} - ${day}`
}

export function ReportDetailsPage({ reportId }: ReportDetailsPageProps) {
   const [unitSearch, setUnitSearch] = useState('')
   const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null)
   const [indicatorSearch, setIndicatorSearch] = useState('')
 
   const detailQuery = useQuery({
    queryKey: reportQueryKeys.detail(reportId),
    queryFn: async () => {
      const response = await apiClient.get<ReportDetail>(`/assignments/batches/${reportId}`)
      return response.data
    },
  })
 
   const orgTreeQuery = useQuery({
     queryKey: ['report-details', 'orgs', { q: unitSearch.trim() }],
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
 
   const report = detailQuery.data
 
   const indicatorsQuery = useQuery({
     queryKey: ['report-details', 'indicators', report?.templateId, indicatorSearch],
     queryFn: async () => {
       if (!report?.templateId) return []
       const response = await apiClient.get<IndicatorItem[] | { items: IndicatorItem[] }>(
         `/forms/${report.templateId}/indicators`,
         { params: { q: indicatorSearch.trim() || undefined } },
       )
       const payload = response.data
       return Array.isArray(payload) ? payload : payload.items ?? []
     },
     enabled: !!report?.templateId,
     retry: false,
   })
 
   const openDate = report?.openDate ?? null
  const closeDate = report?.closeDate ?? report?.deadline ?? null
  const updatedAt = report?.updatedAt ?? null

  const currentUnitId = selectedUnitId || report?.unitId
  const currentUnitName = useMemo(() => {
    if (selectedUnitId === report?.unitId) return report?.unitName
    
    const findName = (nodes: OrganizationTreeNode[]): string | null => {
      for (const node of nodes) {
        if (node.id === selectedUnitId) return node.name ?? node.id
        if (node.children) {
          const found = findName(node.children)
          if (found) return found
        }
      }
      return null
    }
    return findName(orgTreeQuery.data ?? []) || report?.unitName
  }, [selectedUnitId, report, orgTreeQuery.data])

   const renderOrgTree = (nodes: OrganizationTreeNode[], depth = 0) => {
     return nodes.map((node) => {
       const isSelected = currentUnitId === node.id
       const canAssign = Boolean(node.canAssignReports ?? node.can_assign_reports ?? true)
       const children = Array.isArray(node.children) ? node.children : []
       return (
         <div key={node.id}>
           <button
             type='button'
             disabled={!canAssign}
             className={cn(
               'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
               isSelected
                 ? 'bg-primary/10 font-bold text-primary'
                 : canAssign
                   ? 'hover:bg-muted/50 font-medium text-foreground'
                   : 'cursor-not-allowed opacity-50 font-medium text-muted-foreground',
             )}
             style={{ paddingLeft: `${8 + depth * 16}px` }}
             onClick={() => canAssign && setSelectedUnitId(node.id)}
           >
             <Building2
               className={cn(
                 'size-4',
                 isSelected ? 'text-primary' : canAssign ? 'text-muted-foreground' : 'text-muted-foreground/40',
               )}
             />
             <span className='min-w-0 truncate'>{node.name ?? node.id}</span>
           </button>
           {children.length > 0 ? <div className='space-y-1'>{renderOrgTree(children, depth + 1)}</div> : null}
         </div>
       )
     })
   }
  const departmentRows = useMemo(() => {
    if (!report) return []
    
    // Ưu tiên sử dụng danh sách assignments thực tế từ API mới
    const assignments = report.assignments || []
    
    if (assignments.length > 0) {
      return assignments.map((item) => {
        const initials = (item.orgName || item.orgId || 'DV')
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((word) => word[0]?.toUpperCase() ?? '')
          .join('')
          
        return {
          id: item.id,
          unitName: item.orgName,
          initials: initials || 'DV',
          assigneeName: item.assigneeName ?? 'Chưa phân công',
          status: item.status === 'APPROVED' || item.status === 'COMPLETED' 
            ? 'done' 
            : ['SUBMITTED', 'UNDER_REVIEW', 'DRAFTING'].includes(item.status)
              ? 'doing'
              : 'not_started',
          updatedAt: item.updatedAt || item.submittedAt || null,
        } as const
      })
    }

    // Fallback cho trường hợp API cũ hoặc dữ liệu mock
    const units = (report.assignees ?? [])
    const fallback = units.length > 0 ? units.slice(0, 10) : ([report.unitName].filter(Boolean) as string[])
    const names = fallback.length > 0 ? fallback : ['Đơn vị chưa xác định']
    const completedCount = Math.max(
      0,
      Math.min(names.length, Math.round((names.length * (report.completionPercent ?? 0)) / 100)),
    )
    const mockAssignees = ['Nguyễn Văn An', 'Trần Thị Bích', 'Lê Hoàng Nam', 'Phạm Minh Tuấn']

    return names.map((unitName, index) => {
      const initials = (unitName || 'DV')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0]?.toUpperCase() ?? '')
        .join('')
      const status =
        index < completedCount ? 'done' : index === completedCount ? 'doing' : 'not_started'
      return {
        id: `${report.id}-${index}`,
        unitName,
        initials: initials || 'DV',
        assigneeName: mockAssignees[index] ?? 'Người thực hiện',
        status,
        updatedAt: index < completedCount ? updatedAt : null,
      } as const
    })
  }, [report, updatedAt])

  const defaultRows = useMemo(() => {
    const cells = report?.cells
    if (!Array.isArray(cells)) return []
    
    const unique = new Map<string, (typeof cells)[number]>()
    cells.forEach((cell) => {
      if (!cell) return
      const key = `${cell.indicatorCode}-${cell.attributeName}`
      if (unique.has(key)) return
      unique.set(key, cell)
    })
    return Array.from(unique.entries())
      .slice(0, 10)
      .map(([key, cell], index) => {
        const rawType = (cell.dataType ?? '').toString().toLowerCase()
        const isNumber = rawType.includes('number')
        const isText = rawType.includes('text') || rawType.includes('string')
        const control: 'number' | 'text' | 'select' = index === 1 ? 'select' : isNumber ? 'number' : 'text'

        return {
          key,
          metricName: cell.indicatorName,
          metricCode: cell.indicatorCode,
          attribute: cell.attributeName,
          typeLabel: isNumber ? 'Number' : isText ? 'String' : cell.dataType,
          typeVariant: (isNumber ? 'secondary' : isText ? 'outline' : 'default') as any,
          required: Boolean(cell.required),
          control,
          initialValue: cell.value != null ? String(cell.value) : '',
        } as const
      })
  }, [report])
  const timelineIcon = useMemo(() => {
    return [CheckCircle2, PencilLine, Lock, Rocket] as const
  }, [])

  return (
    <div className='flex w-full flex-col gap-6 p-6'>
      {detailQuery.isLoading ? (
        <div className='py-12 text-center text-sm text-muted-foreground'>Đang tải chi tiết báo cáo...</div>
      ) : detailQuery.isError || !report ? (
        <div className='rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive'>
          {getErrorMessage(detailQuery.error)}
        </div>
      ) : (
        <>
          <div className='flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between'>
            <div className='min-w-0 space-y-2'>
              <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                <span>Quản lý báo cáo</span>
                <span>/</span>
                <span className='font-medium text-foreground'>{report.code}</span>
              </div>
              <h1 className='truncate text-3xl font-bold tracking-tight text-foreground'>{report.name}</h1>
              <p className='max-w-3xl text-sm text-muted-foreground'>
                Theo dõi thông tin chung, tiến độ nhập liệu, dữ liệu ô và lịch sử thao tác của báo cáo.
              </p>
            </div>
            <div className='flex flex-wrap gap-2'>
              <Button variant='outline' asChild>
                <Link to='/report-management' search={{ tab: 'list' }}>
                  <ArrowLeft />
                  Quay lại
                </Link>
              </Button>
              <Button type='button' onClick={() => detailQuery.refetch()}>
                Tải lại
              </Button>
            </div>
          </div>

          <div className='rounded-3xl border bg-card p-2'>
            <Tabs defaultValue='general'>
              <TabsList className='grid h-auto w-full grid-cols-2 gap-1 rounded-2xl bg-muted p-1 lg:grid-cols-4'>
                <TabsTrigger className='h-11 justify-center gap-2 rounded-xl' value='general'>
                  <Info className='size-4' />
                  Thông tin chung
                </TabsTrigger>
                <TabsTrigger className='h-11 justify-center gap-2 rounded-xl' value='permissions'>
                  <Workflow className='size-4' />
                  Phân quyền chỉ tiêu
                </TabsTrigger>
                <TabsTrigger className='h-11 justify-center gap-2 rounded-xl' value='defaults'>
                  <Settings2 className='size-4' />
                  Giá trị mặc định
                </TabsTrigger>
                <TabsTrigger className='h-11 justify-center gap-2 rounded-xl' value='preview'>
                  <Eye className='size-4' />
                  Xem trước
                </TabsTrigger>
              </TabsList>

              <TabsContent value='general'>
                <div className='space-y-6 px-4 pb-6 pt-6 lg:px-6'>
                  <div className='flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between'>
                    <div>
                      <div className='text-2xl font-bold tracking-tight text-primary'>Chi tiết báo cáo</div>
                      <div className='mt-1 text-sm font-medium text-muted-foreground'>
                        Quản lý và theo dõi tiến độ báo cáo định kỳ hệ thống.
                      </div>
                    </div>
                    <div className='flex flex-wrap gap-2'>
                      <Button type='button' variant='outline' className='h-10 gap-2 font-semibold'>
                        <Download className='size-4' />
                        Xuất dữ liệu
                      </Button>
                      <Button type='button' className='h-10 gap-2 font-semibold'>
                        <PencilLine className='size-4' />
                        Chỉnh sửa
                      </Button>
                    </div>
                  </div>

                  <section className='grid gap-4 lg:grid-cols-3'>
                    <div className='lg:col-span-2'>
                      <Card className='relative overflow-hidden rounded-3xl border bg-card p-6'>
                        <div className='absolute -right-20 -top-20 size-64 rounded-full bg-primary/5' />
                        <div className='relative space-y-6'>
                          <div className='flex items-center gap-3'>
                            <div className='h-6 w-1.5 rounded-full bg-primary' />
                            <div className='text-xl font-semibold text-primary'>Thông tin chung</div>
                          </div>

                          <div className='grid grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2'>
                            <div>
                              <div className='text-[11px] font-bold uppercase tracking-widest text-muted-foreground'>
                                Tên báo cáo
                              </div>
                              <div className='mt-1 text-lg font-semibold leading-snug text-foreground'>
                                {report.name}
                              </div>
                            </div>

                            <div>
                              <div className='text-[11px] font-bold uppercase tracking-widest text-muted-foreground'>
                                Kỳ báo cáo
                              </div>
                              <div className='mt-1 flex items-center gap-2 text-lg font-semibold text-foreground'>
                                <span className='text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded uppercase font-bold'>
                                  {report.periodCode}
                                </span>
                                {report.periodName || report.period}
                              </div>
                            </div>

                            <div className='grid grid-cols-2 gap-4 sm:col-span-1'>
                              <div>
                                <div className='text-[11px] font-bold uppercase tracking-widest text-muted-foreground'>
                                  Ngày mở
                                </div>
                                <div className='mt-1 text-sm font-semibold text-foreground'>
                                  {formatDate(report.deadlineFrom || openDate)}
                                </div>
                              </div>
                              <div>
                                <div className='text-[11px] font-bold uppercase tracking-widest text-muted-foreground'>
                                  Ngày đóng
                                </div>
                                <div className='mt-1 text-sm font-semibold text-foreground'>
                                  {formatDate(report.deadlineTo || closeDate)}
                                </div>
                              </div>
                            </div>

                            <div>
                              <div className='text-[11px] font-bold uppercase tracking-widest text-muted-foreground'>
                                Trạng thái
                              </div>
                              <div className='mt-2 inline-flex items-center gap-2 rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary'>
                                <span className='size-2 rounded-full bg-secondary' />
                                <ReportStatusBadge status={report.status} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>

                    <Card className='relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground'>
                      <div className='relative space-y-4'>
                        <div className='text-sm font-medium text-primary-foreground/80'>Tổng quan tiến độ</div>
                        <div className='text-5xl font-bold'>{report.completionPercent ?? 0}%</div>
                        <div className='h-2.5 w-full overflow-hidden rounded-full bg-white/20'>
                          <div
                            className='h-full rounded-full bg-secondary'
                            style={{ width: `${Math.max(0, Math.min(100, report.completionPercent ?? 0))}%` }}
                          />
                        </div>
                        <div className='flex justify-between text-xs font-semibold text-primary-foreground/80'>
                          <span>{Math.round(((report.assignees?.length ?? 0) * (report.completionPercent ?? 0)) / 100)} Đã hoàn thành</span>
                          <span>
                            {Math.max(
                              0,
                              (report.assignees?.length ?? 0) -
                                Math.round(((report.assignees?.length ?? 0) * (report.completionPercent ?? 0)) / 100),
                            )}{' '}
                            Đang chờ
                          </span>
                        </div>
                      </div>
                    </Card>
                  </section>

                  <section className='overflow-hidden rounded-3xl border bg-card'>
                    <div className='flex items-center justify-between gap-2 border-b bg-muted/20 px-6 py-5'>
                      <div className='flex items-center gap-3'>
                        <div className='h-6 w-1.5 rounded-full bg-secondary' />
                        <div className='text-xl font-semibold text-primary'>Tiến độ phòng ban</div>
                      </div>
                      <div className='flex gap-2'>
                        <Button type='button' variant='ghost' size='icon' className='h-9 w-9'>
                          <Filter className='size-4 text-muted-foreground' />
                        </Button>
                        <Button type='button' variant='ghost' size='icon' className='h-9 w-9'>
                          <MoreVertical className='size-4 text-muted-foreground' />
                        </Button>
                      </div>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow className='bg-muted/30'>
                          <TableHead className='px-6 text-[11px] font-bold uppercase tracking-widest text-muted-foreground'>
                            Đơn vị
                          </TableHead>
                          <TableHead className='px-6 text-[11px] font-bold uppercase tracking-widest text-muted-foreground'>
                            Người thực hiện
                          </TableHead>
                          <TableHead className='px-6 text-center text-[11px] font-bold uppercase tracking-widest text-muted-foreground'>
                            Trạng thái
                          </TableHead>
                          <TableHead className='px-6 text-[11px] font-bold uppercase tracking-widest text-muted-foreground'>
                            Cập nhật lúc
                          </TableHead>
                          <TableHead className='px-6 text-right text-[11px] font-bold uppercase tracking-widest text-muted-foreground'>
                            Thao tác
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {departmentRows.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className='py-16 text-center text-sm text-muted-foreground'>
                              Không có dữ liệu
                            </TableCell>
                          </TableRow>
                        ) : (
                          departmentRows.map((row) => (
                            <TableRow key={row.id} className='hover:bg-muted/20'>
                              <TableCell className='px-6 py-4'>
                                <div className='flex items-center gap-3'>
                                  <div className='flex size-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary'>
                                    {row.initials}
                                  </div>
                                  <div className='font-semibold text-foreground'>{row.unitName}</div>
                                </div>
                              </TableCell>
                              <TableCell className='px-6 py-4'>
                                <div className='flex items-center gap-2'>
                                  <div className='size-7 rounded-full bg-muted' />
                                  <div className='text-sm font-medium text-foreground'>{row.assigneeName}</div>
                                </div>
                              </TableCell>
                              <TableCell className='px-6 py-4 text-center'>
                                <span
                                  className={cn(
                                    'inline-flex rounded-full px-3 py-1 text-[11px] font-semibold',
                                    row.status === 'done'
                                      ? 'bg-secondary/15 text-secondary'
                                      : row.status === 'doing'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-destructive/10 text-destructive',
                                  )}
                                >
                                  {row.status === 'done'
                                    ? 'Hoàn thành'
                                    : row.status === 'doing'
                                      ? 'Đang thực hiện'
                                      : 'Chưa bắt đầu'}
                                </span>
                              </TableCell>
                              <TableCell className='px-6 py-4 text-sm font-medium text-muted-foreground'>
                                {formatTimeDashDate(row.updatedAt)}
                              </TableCell>
                              <TableCell className='px-6 py-4 text-right'>
                                <Button type='button' variant='ghost' size='icon' className='h-9 w-9'>
                                  <Eye className='size-4 text-primary' />
                                </Button>
                                <Button type='button' variant='ghost' size='icon' className='h-9 w-9'>
                                  <MoreVertical className='size-4 text-muted-foreground' />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>

                    <div className='flex flex-wrap items-center justify-between gap-2 bg-muted/20 px-6 py-4 text-xs font-semibold text-muted-foreground'>
                      <div>Hiển thị {Math.min(4, departmentRows.length)} trên tổng số {departmentRows.length} đơn vị</div>
                      <div className='flex gap-2'>
                        <Button type='button' variant='outline' size='icon' className='h-8 w-8' disabled>
                          <ArrowLeft className='size-4' />
                        </Button>
                        <Button type='button' className='h-8 w-8 px-0 text-xs font-semibold' disabled>
                          1
                        </Button>
                        <Button type='button' variant='outline' size='icon' className='h-8 w-8' disabled>
                          <ArrowRight className='size-4' />
                        </Button>
                      </div>
                    </div>
                  </section>

                  <div className='relative h-48 overflow-hidden rounded-3xl border bg-muted'>
                    <div className='absolute inset-0 bg-gradient-to-r from-primary/40 to-transparent' />
                    <div className='relative flex h-full items-center px-8'>
                      <div className='max-w-md text-primary-foreground'>
                        <div className='text-lg font-semibold'>Hỗ trợ kỹ thuật</div>
                        <div className='mt-2 text-sm text-primary-foreground/90'>
                          Nếu gặp khó khăn trong quá trình tổng hợp báo cáo, vui lòng liên hệ đội ngũ quản trị hệ thống để
                          được hỗ trợ kịp thời.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value='permissions'>
                <div className='space-y-6 px-4 pb-6 pt-6 lg:px-6'>
                  <div className='grid grid-cols-1 gap-6 lg:grid-cols-4'>
                    <div className='lg:col-span-1'>
                      <Card className='overflow-hidden rounded-2xl border shadow-sm'>
                        <CardHeader className='pb-4'>
                          <CardTitle className='text-base font-bold'>Đơn vị nhận báo cáo</CardTitle>
                          <CardDescription className='text-xs'>
                            Chọn đơn vị để thiết lập phân quyền chỉ tiêu.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className='p-0'>
                          <div className='border-y bg-muted/20 px-4 py-3'>
                            <div className='relative'>
                              <Search className='absolute left-2.5 top-2.5 size-4 text-muted-foreground' />
                              <Input
                                placeholder='Tìm kiếm đơn vị...'
                                className='h-9 rounded-lg pl-9 text-xs focus-visible:ring-primary'
                                value={unitSearch}
                                onChange={(e) => setUnitSearch(e.target.value)}
                              />
                            </div>
                          </div>
                          <div className='max-h-[600px] overflow-auto p-3'>
                            {orgTreeQuery.isLoading ? (
                              <div className='py-12 text-center text-xs text-muted-foreground'>
                                Đang tải cây đơn vị...
                              </div>
                            ) : (orgTreeQuery.data?.length ?? 0) > 0 ? (
                              <div className='space-y-1'>{renderOrgTree(orgTreeQuery.data ?? [])}</div>
                            ) : (
                              <div className='py-12 text-center text-xs text-muted-foreground'>
                                Không tìm thấy đơn vị.
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className='space-y-6 lg:col-span-3'>
                      <div className='rounded-2xl border bg-background p-5 shadow-sm'>
                        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                          <div className='flex items-center gap-4'>
                            <div className='flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
                              <Building2 className='size-6' />
                            </div>
                            <div>
                              <Label className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>
                                Đơn vị đang thiết lập
                              </Label>
                              <div className='mt-0.5 text-lg font-bold text-foreground'>
                                {currentUnitName}
                              </div>
                            </div>
                          </div>

                          <div className='flex items-center gap-2'>
                            <Button type='button' variant='outline' className='h-10 gap-2 rounded-xl text-xs font-bold'>
                              <Filter className='size-4' />
                              Bộ lọc nâng cao
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className='grid gap-6 lg:grid-cols-2'>
                        <Card className='overflow-hidden rounded-2xl border shadow-sm'>
                          <CardHeader className='border-b bg-muted/10 pb-4 pt-5'>
                            <div className='flex items-center justify-between'>
                              <CardTitle className='flex items-center gap-2 text-base font-bold'>
                                  <List className='size-4 text-muted-foreground' />
                                  Chỉ tiêu chưa phân quyền
                                </CardTitle>
                                <Badge variant='outline' className='rounded-full px-2 py-0 text-[10px]'>
                                  {indicatorsQuery.data?.length ?? 0} chỉ tiêu
                                </Badge>
                              </div>
                              <div className='mt-4 flex flex-col gap-2 sm:flex-row'>
                                <div className='relative flex-1'>
                                  <Search className='absolute left-2.5 top-2.5 size-3.5 text-muted-foreground' />
                                  <Input
                                    placeholder='Tìm mã hoặc tên...'
                                    className='h-9 rounded-lg pl-9 text-xs'
                                    value={indicatorSearch}
                                    onChange={(e) => setIndicatorSearch(e.target.value)}
                                  />
                                </div>
                                <Button type='button' className='h-9 gap-2 rounded-lg bg-primary text-xs font-bold'>
                                  Gán <ArrowRight className='size-4' />
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent className='p-0'>
                              <Table>
                                <TableHeader>
                                  <TableRow className='bg-muted/30 hover:bg-muted/30'>
                                    <TableHead className='w-12 text-center'>
                                      <div className='flex justify-center'>
                                        <Checkbox />
                                      </div>
                                    </TableHead>
                                    <TableHead className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
                                      Mã chỉ tiêu
                                    </TableHead>
                                    <TableHead className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
                                      Tên chỉ tiêu
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {indicatorsQuery.isLoading ? (
                                    <TableRow>
                                      <TableCell colSpan={3} className='py-12 text-center text-xs text-muted-foreground'>
                                        Đang tải danh sách chỉ tiêu...
                                      </TableCell>
                                    </TableRow>
                                  ) : (indicatorsQuery.data?.length ?? 0) === 0 ? (
                                    <TableRow>
                                      <TableCell colSpan={3} className='py-24 text-center text-xs text-muted-foreground'>
                                        <div className='flex flex-col items-center gap-2'>
                                          <div className='rounded-full bg-muted p-3'>
                                            <List className='size-6 opacity-20' />
                                          </div>
                                          <span>Không có dữ liệu chỉ tiêu</span>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ) : (
                                    indicatorsQuery.data?.map((item) => (
                                      <TableRow key={item.id} className='hover:bg-muted/10'>
                                        <TableCell className='w-12 text-center'>
                                          <div className='flex justify-center'>
                                            <Checkbox />
                                          </div>
                                        </TableCell>
                                        <TableCell className='text-xs font-medium'>{item.code}</TableCell>
                                        <TableCell className='text-xs'>{item.name}</TableCell>
                                      </TableRow>
                                    ))
                                  )}
                                </TableBody>
                              </Table>
                            </CardContent>
                          </Card>

                        <Card className='overflow-hidden rounded-2xl border shadow-sm'>
                          <CardHeader className='border-b bg-muted/10 pb-4 pt-5'>
                            <div className='flex items-center justify-between'>
                              <CardTitle className='flex items-center gap-2 text-base font-bold'>
                                <ShieldCheck className='size-4 text-primary' />
                                Chỉ tiêu đã phân quyền
                              </CardTitle>
                              <Badge className='rounded-full bg-primary/10 px-2 py-0 text-[10px] text-primary hover:bg-primary/10'>
                                {defaultRows.length} chỉ tiêu
                              </Badge>
                            </div>
                            <div className='mt-4 flex flex-col gap-2 sm:flex-row'>
                              <div className='relative flex-1'>
                                <Search className='absolute left-2.5 top-2.5 size-3.5 text-muted-foreground' />
                                <Input
                                  placeholder='Tìm mã hoặc tên...'
                                  className='h-9 rounded-lg pl-9 text-xs'
                                />
                              </div>
                              <Button
                                type='button'
                                variant='outline'
                                className='h-9 gap-2 rounded-lg border-destructive/20 text-xs font-bold text-destructive hover:bg-destructive/5'
                              >
                                <ArrowLeft className='size-4' />
                                Hủy gán
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className='p-0'>
                            <Table>
                              <TableHeader>
                                <TableRow className='bg-muted/30 hover:bg-muted/30'>
                                  <TableHead className='w-12 text-center'>
                                    <div className='flex justify-center'>
                                      <Checkbox />
                                    </div>
                                  </TableHead>
                                  <TableHead className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
                                    Mã chỉ tiêu
                                  </TableHead>
                                  <TableHead className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
                                    Tên chỉ tiêu
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                <TableRow>
                                  <TableCell colSpan={3} className='py-24 text-center text-xs text-muted-foreground'>
                                    <div className='flex flex-col items-center gap-2'>
                                      <div className='rounded-full bg-primary/5 p-3 text-primary/30'>
                                        <ShieldCheck className='size-6' />
                                      </div>
                                      <span>Chọn đơn vị để xem danh sách</span>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value='defaults'>
                <div className='space-y-6 px-4 pb-6 pt-6 lg:px-6'>
                  <div className='overflow-hidden rounded-xl border bg-gradient-to-r from-primary to-primary/70'>
                    <div className='flex items-center justify-between gap-4 p-6 text-primary-foreground'>
                      <div className='min-w-0'>
                        <div className='text-xs font-semibold opacity-90'>Cấu hình giá trị mặc định</div>
                        <div className='mt-1 truncate text-xl font-bold'>{report.name}</div>
                        <div className='mt-1 text-sm opacity-90'>Mã báo cáo: {report.formCode || report.code}</div>
                      </div>
                    </div>
                  </div>

                  <div className='grid grid-cols-12 gap-6'>
                    <div className='col-span-12 space-y-4 lg:col-span-8'>
                      <div className='flex flex-wrap items-center justify-between gap-2'>
                        <div className='text-base font-semibold text-foreground'>Cấu hình giá trị mặc định</div>
                        <div className='flex gap-2'>
                          <Button type='button' variant='outline' className='h-9 text-xs font-semibold'>
                            Hủy bỏ
                          </Button>
                          <Button type='button' className='h-9 text-xs font-semibold'>
                            Lưu cấu hình
                          </Button>
                        </div>
                      </div>

                      <Card className='overflow-hidden'>
                        <CardContent className='p-0'>
                          <Table>
                            <TableHeader>
                              <TableRow className='bg-muted/40'>
                                <TableHead className='text-xs font-bold'>Chỉ tiêu (Metric)</TableHead>
                                <TableHead className='text-xs font-bold'>Thuộc tính</TableHead>
                                <TableHead className='text-xs font-bold'>Kiểu</TableHead>
                                <TableHead className='text-xs font-bold'>Giá trị</TableHead>
                                <TableHead className='w-[110px] text-center text-xs font-bold'>Bắt buộc</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {defaultRows.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={5} className='py-16 text-center text-sm text-muted-foreground'>
                                    Không có dữ liệu
                                  </TableCell>
                                </TableRow>
                              ) : (
                                defaultRows.map((row) => (
                                  <TableRow key={row.key} className='hover:bg-muted/20'>
                                    <TableCell className='px-4 py-3'>
                                      <div className='flex flex-col'>
                                        <div className='text-sm font-semibold text-foreground'>{row.metricName}</div>
                                        <div className='text-[10px] font-medium text-muted-foreground'>{row.metricCode}</div>
                                      </div>
                                    </TableCell>
                                    <TableCell className='px-4 py-3 text-sm text-muted-foreground'>{row.attribute}</TableCell>
                                    <TableCell className='px-4 py-3'>
                                      <Badge variant={row.typeVariant}>{row.typeLabel}</Badge>
                                    </TableCell>
                                    <TableCell className='px-4 py-3'>
                                      {row.control === 'select' ? (
                                        <Select defaultValue={row.initialValue || 'VND'}>
                                          <SelectTrigger className='w-full' size='sm'>
                                            <SelectValue placeholder='Chọn giá trị' />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value='VND'>VND</SelectItem>
                                            <SelectItem value='USD'>USD</SelectItem>
                                            <SelectItem value='EUR'>EUR</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      ) : (
                                        <Input
                                          defaultValue={row.initialValue}
                                          type={row.control}
                                          className='h-9 text-sm'
                                          placeholder={row.control === 'number' ? '0.00' : 'Nhập giá trị...'}
                                        />
                                      )}
                                    </TableCell>
                                    <TableCell className='px-4 py-3 text-center'>
                                      <div className='flex justify-center'>
                                        <Checkbox checked={row.required} disabled />
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                          <div className='flex flex-wrap items-center justify-between gap-2 border-t bg-muted/20 px-4 py-3'>
                            <div className='text-xs text-muted-foreground'>
                              Hiển thị {defaultRows.length} trên {defaultRows.length} chỉ tiêu
                            </div>
                            <div className='flex items-center gap-1'>
                              <Button type='button' variant='ghost' size='icon' className='h-8 w-8' disabled>
                                <ArrowLeft className='size-4' />
                              </Button>
                              <Button type='button' variant='secondary' className='h-8 px-3 text-xs font-semibold' disabled>
                                1
                              </Button>
                              <Button type='button' variant='ghost' size='icon' className='h-8 w-8' disabled>
                                <ArrowRight className='size-4' />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className='col-span-12 space-y-4 lg:col-span-4'>
                      <div className='text-base font-semibold text-foreground'>Lịch sử xử lý</div>
                      <Card>
                        <CardContent className='relative space-y-6 p-6'>
                          <div className='absolute bottom-6 left-9 top-6 w-px bg-border' />
                          {(report.history ?? []).slice(0, 4).map((item, index) => {
                            const Icon = timelineIcon[index] ?? CheckCircle2
                            return (
                              <div key={item.id} className='relative flex gap-4'>
                                <div className='mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground'>
                                  <Icon className='size-3.5' />
                                </div>
                                <div className='flex min-w-0 flex-1 flex-col gap-1'>
                                  <div className='flex items-center justify-between gap-2'>
                                    <div className='truncate text-sm font-semibold text-foreground'>{item.action}</div>
                                    <div className='shrink-0 text-[10px] font-medium text-muted-foreground'>
                                      {formatDateTime(item.createdAt)}
                                    </div>
                                  </div>
                                  <div className='text-xs text-muted-foreground'>
                                    {item.note}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                          {(report.history ?? []).length === 0 && (
                            <div className='py-10 text-center text-sm text-muted-foreground'>Chưa có lịch sử.</div>
                          )}
                          <Button type='button' variant='outline' className='w-full text-xs font-semibold'>
                            Xem toàn bộ lịch sử
                          </Button>
                        </CardContent>
                      </Card>
                      <div className='flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/20 px-4 py-3'>
                        <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                          <span className='size-2 rounded-full bg-secondary' />
                          Sẵn sàng nhập dữ liệu
                        </div>
                        <div className='text-xs text-muted-foreground'>
                          © 2023 QLDD System
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value='preview'>
                <div className='px-4 pb-6 pt-6 text-sm text-muted-foreground lg:px-6'>
                  Chưa hỗ trợ.
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </>
      )}
    </div>
  )
}
