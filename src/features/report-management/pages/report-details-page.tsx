import { useMemo, useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Download,
  Filter,
  Eye,
  History,
  Info,
  Lock,
  MoreVertical,
  PencilLine,
  Rocket,
  Settings2,
  Workflow,
  RotateCcw,
  Send,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'

import { apiClient } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TemplatePreviewMatrix } from '@/features/form-management/components/shared/template-preview-matrix'
import { reportCampaignApi } from '../api/report-management-api'
import type { ReportDetail } from '../api/types'
import { ReportConfirmDialog } from '../components/report-confirm-dialog'
import { ReportStatusBadge } from '../components/report-status'
import { CampaignDefaultValuesTab } from '../components/tabs/campaign-default-values-tab'
import { CampaignScopesTab } from '../components/tabs/campaign-scopes-tab'
import { getErrorMessage, reportQueryKeys } from '../utils/report-query'
import { useSubmissionHistory } from '@/features/submission/hooks/use-my-assignments'
import { useApproveDistrict, useRejectDistrict, useApproveDepartment, useRejectDepartment } from '@/features/submission/hooks/use-approvals'
import { getSubmissionStatusInfo } from '@/features/submission/utils/submission-status'
import { submissionApi } from '@/features/submission/api/submission-api'
import { SubmissionTimeline } from '@/components/submission/submission-timeline'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'


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
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(
    new Date(value)
  )
}

function formatTimeDashDate(value: string | null) {
  if (!value) return '--'
  const date = new Date(value)
  const time = new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
  const day = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
  return `${time} - ${day}`
}


export function ReportDetailsPage({ reportId }: ReportDetailsPageProps) {
  const [unitSearch, setUnitSearch] = useState('')
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null)
  const [indicatorSearch, setIndicatorSearch] = useState('')
  const [viewAssignmentId, setViewAssignmentId] = useState<string | null>(null)

  const [assignmentSearch, setAssignmentSearch] = useState('')
  const [assignmentStatusFilter, setAssignmentStatusFilter] = useState<string>('all')

  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false)
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [actionType, setActionType] = useState<'DEPARTMENT' | 'DISTRICT' | null>(null)
  const [isAggregating, setIsAggregating] = useState(false)

  const approveDept = useApproveDepartment()
  const rejectDept = useRejectDepartment()
  const approveDist = useApproveDistrict()
  const rejectDist = useRejectDistrict()

  const historyQuery = useSubmissionHistory(viewAssignmentId)
  const history = historyQuery.data || []

  const handleApprove = (type: 'DEPARTMENT' | 'DISTRICT') => {
    setActionType(type)
    setIsApproveModalOpen(true)
  }

  const handleReject = (type: 'DEPARTMENT' | 'DISTRICT') => {
    setActionType(type)
    setRejectReason('')
    setIsRejectModalOpen(true)
  }

  const confirmApprove = () => {
    if (!viewAssignmentId || !actionType) return

    const submissionId = report?.assignments?.find(a => a.id === viewAssignmentId)?.id
    if (!submissionId) return

    const mutation = actionType === 'DEPARTMENT' ? approveDept : approveDist
    mutation.mutate(submissionId, {
      onSuccess: () => {
        detailQuery.refetch()
        setIsApproveModalOpen(false)
      }
    })
  }

  const confirmReject = () => {
    if (!viewAssignmentId || !actionType || !rejectReason.trim()) {
      if (!rejectReason.trim()) toast.error('Vui lòng nhập lý do từ chối')
      return
    }

    const submissionId = report?.assignments?.find(a => a.id === viewAssignmentId)?.id
    if (!submissionId) return

    const mutation = actionType === 'DEPARTMENT' ? rejectDept : rejectDist
    mutation.mutate({ submissionId, reason: rejectReason }, {
      onSuccess: () => {
        detailQuery.refetch()
        setIsRejectModalOpen(false)
      }
    })
  }

  const handleAggregate = async () => {
    if (!report) return
    setIsAggregating(true)
    try {
      // 1. Create summary
      const createRes = await apiClient.post('/summaries', {
        formId: report.formId,
        periodType: report.periodType,
        periodFrom: report.deadlineFrom,
        periodTo: report.deadlineTo,
        periodCode: report.periodCode,
        periodName: report.periodName,
        orgId: report.unitId || 'ROOT' // Default to ROOT if not specified
      })

      const summaryId = createRes.data.id

      // 2. Recompute
      await apiClient.post(`/summaries/${summaryId}/recompute`)

      toast.success('Tổng hợp báo cáo thành công')
      detailQuery.refetch()
    } catch (error: any) {
      toast.error('Lỗi tổng hợp: ' + (error.response?.data?.message || error.message))
    } finally {
      setIsAggregating(false)
    }
  }

  const detailQuery = useQuery({
    queryKey: reportQueryKeys.detail(reportId),
    queryFn: async () => {
      const response = await apiClient.get<ReportDetail>(
        `/report-campaigns/${reportId}`
      )
      return response.data
    },
  })

  const orgTreeQuery = useQuery({
    queryKey: ['report-details', 'orgs', { q: unitSearch.trim() }],
    queryFn: async () => {
      const q = unitSearch.trim()
      const response = await apiClient.get<
        OrganizationTreeNode[] | { items?: OrganizationTreeNode[] }
      >('/orgs', { params: { tree: true, q: q.length > 0 ? q : undefined } })
      const payload = response.data
      return Array.isArray(payload) ? payload : (payload.items ?? [])
    },
    retry: false,
  })

  const report = detailQuery.data

  const indicatorsQuery = useQuery({
    queryKey: [
      'report-details',
      'indicators',
      report?.templateId,
      indicatorSearch,
    ],
    queryFn: async () => {
      if (!report?.templateId) return []
      const response = await apiClient.get<
        IndicatorItem[] | { items: IndicatorItem[] }
      >(`/forms/${report.templateId}/indicators`, {
        params: { q: indicatorSearch.trim() || undefined },
      })
      const payload = response.data
      return Array.isArray(payload) ? payload : (payload.items ?? [])
    },
    enabled: !!report?.templateId,
    retry: false,
  })

  const scopesQuery = useQuery({
    queryKey: ['report-campaign-scopes', reportId],
    queryFn: () => reportCampaignApi.listScopes(reportId),
    enabled: !!reportId,
  })

  const defaultValuesQuery = useQuery({
    queryKey: ['report-campaign-default-values', reportId],
    queryFn: () => reportCampaignApi.listDefaultValues(reportId),
    enabled: !!reportId,
  })

  const dispatchMutation = useMutation({
    mutationFn: () => reportCampaignApi.confirmDispatch(reportId),
    onSuccess: () => {
      toast.success('Đã phát hành báo cáo thành công.')
      detailQuery.refetch()
      scopesQuery.refetch()
      setConfirmDispatchOpen(false)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const updateMutation = useMutation({
    mutationFn: (input: UpdateReportInput) =>
      apiClient.patch(`/report-campaigns/${reportId}`, input),
    onSuccess: () => {
      toast.success('Đã cập nhật thông tin báo cáo.')
      detailQuery.refetch()
      setEditOpen(false)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const [confirmDispatchOpen, setConfirmDispatchOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

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
      const canAssign = Boolean(
        node.canAssignReports ?? node.can_assign_reports ?? true
      )
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
                  ? 'font-medium text-foreground hover:bg-muted/50'
                  : 'cursor-not-allowed font-medium text-muted-foreground opacity-50'
            )}
            style={{ paddingLeft: `${8 + depth * 16}px` }}
            onClick={() => canAssign && setSelectedUnitId(node.id)}
          >
            <Building2
              className={cn(
                'size-4',
                isSelected
                  ? 'text-primary'
                  : canAssign
                    ? 'text-muted-foreground'
                    : 'text-muted-foreground/40'
              )}
            />
            <span className='min-w-0 truncate'>{node.name ?? node.id}</span>
          </button>
          {children.length > 0 ? (
            <div className='space-y-1'>
              {renderOrgTree(children, depth + 1)}
            </div>
          ) : null}
        </div>
      )
    })
  }
  const departmentRows = useMemo(() => {
    if (!report) return []

    // Nếu DISPATCHED: hiển thị assignments thực tế
    if (report.status !== 'DRAFT') {
      const assignments = report.assignments || []
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
          status: item.status,
          updatedAt: item.updatedAt || item.submittedAt || null,
        } as const
      })
    }

    // Nếu DRAFT: hiển thị danh sách đơn vị từ scopes
    const scopes = scopesQuery.data || []
    const orgMap = new Map<
      string,
      { id: string; name: string; count: number }
    >()

    scopes.forEach((s) => {
      const existing = orgMap.get(s.orgId)
      if (existing) {
        existing.count++
      } else {
        orgMap.set(s.orgId, {
          id: s.orgId,
          name: s.orgName || s.orgId,
          count: 1,
        })
      }
    })

    return Array.from(orgMap.values()).map(
      (org) =>
        ({
          id: org.id,
          unitName: org.name,
          initials:
            org.name
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((w) => w[0].toUpperCase())
              .join('') || 'DV',
          assigneeName: `${org.count} chỉ tiêu đã gán`,
          status: 'not_started',
          updatedAt: null,
        }) as const
    )
  }, [report, scopesQuery.data])

  const timelineIcon = useMemo(() => {
    return [CheckCircle2, PencilLine, Lock, Rocket] as const
  }, [])

  return (
    <div className='flex w-full flex-col gap-6 p-6'>
      {detailQuery.isLoading ? (
        <div className='py-12 text-center text-sm text-muted-foreground'>
          Đang tải chi tiết báo cáo...
        </div>
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
                <span className='font-medium text-foreground'>
                  {report.code}
                </span>
              </div>
              <h1 className='truncate text-3xl font-bold tracking-tight text-foreground'>
                {report.name}
              </h1>
              <p className='max-w-3xl text-sm text-muted-foreground'>
                Theo dõi thông tin chung, tiến độ nhập liệu, dữ liệu ô và lịch
                sử thao tác của báo cáo.
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
              <TabsList className='grid h-auto w-full grid-cols-2 gap-1 rounded-2xl bg-muted p-1 lg:grid-cols-5'>
                <TabsTrigger
                  className='h-11 justify-center gap-2 rounded-xl'
                  value='general'
                >
                  <Info className='size-4' />
                  Thông tin chung
                </TabsTrigger>
                <TabsTrigger
                  className='h-11 justify-center gap-2 rounded-xl'
                  value='permissions'
                >
                  <Workflow className='size-4' />
                  Phân quyền chỉ tiêu
                </TabsTrigger>
                <TabsTrigger
                  className='h-11 justify-center gap-2 rounded-xl'
                  value='defaults'
                >
                  <Settings2 className='size-4' />
                  Giá trị mặc định
                </TabsTrigger>
                <TabsTrigger
                  className='h-11 justify-center gap-2 rounded-xl'
                  value='approvals'
                >
                  <CheckCircle2 className='size-4' />
                  Phê duyệt & Tổng hợp
                </TabsTrigger>
                <TabsTrigger
                  className='h-11 justify-center gap-2 rounded-xl'
                  value='preview'
                >
                  <Eye className='size-4' />
                  Xem trước
                </TabsTrigger>
              </TabsList>

              <TabsContent value='general'>
                <div className='space-y-6 px-4 pt-6 pb-6 lg:px-6'>
                  <div className='flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between'>
                    <div>
                      <div className='text-2xl font-bold tracking-tight text-primary'>
                        Chi tiết báo cáo
                      </div>
                      <div className='mt-1 text-sm font-medium text-muted-foreground'>
                        Quản lý và theo dõi tiến độ báo cáo định kỳ hệ thống.
                      </div>
                    </div>
                    {report.status === 'CLOSED' && (
                      <Badge
                        variant='outline'
                        className='h-auto gap-2 rounded-xl border-muted-foreground/20 bg-muted px-4 py-2 text-muted-foreground'
                      >
                        <Lock className='size-4' />
                        Đợt báo cáo đã kết thúc
                      </Badge>
                    )}
                    {report.status === 'CANCELLED' && (
                      <Badge
                        variant='destructive'
                        className='h-auto gap-2 rounded-xl px-4 py-2'
                      >
                        Đợt báo cáo đã hủy
                      </Badge>
                    )}
                    <div className='flex flex-wrap gap-2'>
                      <Button
                        type='button'
                        variant='outline'
                        className='h-10 gap-2 font-semibold'
                      >
                        <Download className='size-4' />
                        Xuất dữ liệu
                      </Button>
                      <Button
                        type='button'
                        className='h-10 gap-2 font-semibold'
                        disabled={report.status !== 'DRAFT'}
                        onClick={() => setEditOpen(true)}
                      >
                        <PencilLine className='size-4' />
                        Chỉnh sửa
                      </Button>
                    </div>
                  </div>

                  <section className='grid gap-4 lg:grid-cols-3'>
                    <div className='lg:col-span-2'>
                      <Card className='relative overflow-hidden rounded-3xl border bg-card p-6'>
                        <div className='absolute -top-20 -right-20 size-64 rounded-full bg-primary/5' />
                        <div className='relative space-y-6'>
                          <div className='flex items-center gap-3'>
                            <div className='h-6 w-1.5 rounded-full bg-primary' />
                            <div className='text-xl font-semibold text-primary'>
                              Thông tin chung
                            </div>
                          </div>

                          <div className='grid grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2'>
                            <div>
                              <div className='text-[11px] font-bold tracking-widest text-muted-foreground uppercase'>
                                Tên đợt báo cáo
                              </div>
                              <div className='mt-1 text-lg leading-snug font-semibold text-foreground'>
                                {report.name}
                              </div>
                            </div>

                            <div>
                              <div className='text-[11px] font-bold tracking-widest text-muted-foreground uppercase'>
                                Biểu mẫu gốc
                              </div>
                              <div className='mt-1 flex items-center gap-2 text-lg font-semibold text-foreground'>
                                <span className='rounded bg-primary/10 px-1.5 py-0.5 text-xs font-bold text-primary uppercase'>
                                  {report.templateCode}
                                </span>
                                {report.templateName}
                              </div>
                            </div>

                            <div>
                              <div className='text-[11px] font-bold tracking-widest text-muted-foreground uppercase'>
                                Kỳ báo cáo
                              </div>
                              <div className='mt-1 flex items-center gap-2 text-base font-semibold text-foreground'>
                                <Badge
                                  variant='outline'
                                  className='text-[10px] font-bold uppercase'
                                >
                                  {report.periodType}
                                </Badge>
                                {report.periodName || report.periodCode}
                              </div>
                            </div>

                            <div className='grid grid-cols-2 gap-4'>
                              <div>
                                <div className='text-[11px] font-bold tracking-widest text-muted-foreground uppercase'>
                                  Thời hạn
                                </div>
                                <div className='mt-1 text-sm font-semibold text-foreground'>
                                  {formatDate(report.deadlineFrom)} →{' '}
                                  {formatDate(report.deadlineTo)}
                                </div>
                              </div>
                              <div>
                                <div className='text-[11px] font-bold tracking-widest text-muted-foreground uppercase'>
                                  Trạng thái
                                </div>
                                <div className='mt-1'>
                                  <ReportStatusBadge status={report.status} />
                                </div>
                              </div>
                            </div>

                            <div>
                              <div className='text-[11px] font-bold tracking-widest text-muted-foreground uppercase'>
                                Ngày tạo
                              </div>
                              <div className='mt-1 text-sm font-semibold text-muted-foreground'>
                                {formatDateTime(report.createdAt)}
                              </div>
                            </div>

                            {report.dispatchedAt && (
                              <div>
                                <div className='text-[11px] font-bold tracking-widest text-muted-foreground uppercase'>
                                  Ngày phát hành
                                </div>
                                <div className='mt-1 text-sm font-semibold text-primary'>
                                  {formatDateTime(report.dispatchedAt)}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    </div>

                    <Card className='relative overflow-hidden rounded-3xl border bg-card p-6 shadow-sm'>
                      {report.status === 'DRAFT' ? (
                        <div className='relative space-y-6'>
                          <div className='flex items-center gap-2'>
                            <div className='flex size-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600'>
                              <Settings2 className='size-5' />
                            </div>
                            <div className='text-base font-bold text-foreground'>
                              Cấu hình đợt báo cáo
                            </div>
                          </div>

                          <div className='space-y-4'>
                            <div className='flex items-center justify-between text-sm'>
                              <div className='flex items-center gap-2'>
                                {scopesQuery.data?.length ? (
                                  <CheckCircle2 className='size-4 text-secondary' />
                                ) : (
                                  <div className='size-4 rounded-full border-2' />
                                )}
                                <span>Phân quyền chỉ tiêu</span>
                              </div>
                              <Badge variant='outline'>
                                {scopesQuery.data?.length || 0}
                              </Badge>
                            </div>

                            <div className='flex items-center justify-between text-sm'>
                              <div className='flex items-center gap-2'>
                                {defaultValuesQuery.data?.length ? (
                                  <CheckCircle2 className='size-4 text-secondary' />
                                ) : (
                                  <div className='size-4 rounded-full border-2' />
                                )}
                                <span>Giá trị mặc định</span>
                              </div>
                              <Badge variant='outline'>
                                {defaultValuesQuery.data?.length || 0}
                              </Badge>
                            </div>

                            <div className='flex items-center justify-between text-sm'>
                              <div className='flex items-center gap-2 text-muted-foreground'>
                                <div className='size-4 rounded-full border-2' />
                                <span>Phát hành (Dispatch)</span>
                              </div>
                              <Badge variant='outline' className='opacity-50'>
                                Chờ
                              </Badge>
                            </div>
                          </div>

                          <Button
                            className='w-full'
                            variant='secondary'
                            onClick={() => setConfirmDispatchOpen(true)}
                            disabled={dispatchMutation.isPending}
                          >
                            {dispatchMutation.isPending
                              ? 'Đang xử lý...'
                              : 'Phát hành báo cáo'}
                          </Button>
                        </div>
                      ) : (
                        <div className='relative -m-6 h-[calc(100%+3rem)] space-y-4 bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground'>
                          <div className='text-sm font-medium text-primary-foreground/80'>
                            Tổng quan tiến độ
                          </div>
                          <div className='text-5xl font-bold'>
                            {report.completionPercent ?? 0}%
                          </div>
                          <div className='h-2.5 w-full overflow-hidden rounded-full bg-white/20'>
                            <div
                              className='h-full rounded-full bg-secondary'
                              style={{
                                width: `${Math.max(0, Math.min(100, report.completionPercent ?? 0))}%`,
                              }}
                            />
                          </div>
                          <div className='flex justify-between text-xs font-semibold text-primary-foreground/80'>
                            <span>
                              {Math.round(
                                ((report.assignments?.length ?? 0) *
                                  (report.completionPercent ?? 0)) /
                                100
                              )}{' '}
                              Hoàn thành
                            </span>
                            <span>
                              {Math.max(
                                0,
                                (report.assignments?.length ?? 0) -
                                Math.round(
                                  ((report.assignments?.length ?? 0) *
                                    (report.completionPercent ?? 0)) /
                                  100
                                )
                              )}{' '}
                              Chờ xử lý
                            </span>
                          </div>
                        </div>
                      )}
                    </Card>
                  </section>

                  <section className='overflow-hidden rounded-3xl border bg-card'>
                    <div className='flex items-center justify-between gap-2 border-b bg-muted/20 px-6 py-5'>
                      <div className='flex items-center gap-3'>
                        <div className='h-6 w-1.5 rounded-full bg-secondary' />
                        <div className='text-xl font-semibold text-primary'>
                          Tiến độ phòng ban
                        </div>
                      </div>
                      <div className='flex gap-2'>
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon'
                          className='h-9 w-9'
                        >
                          <Filter className='size-4 text-muted-foreground' />
                        </Button>
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon'
                          className='h-9 w-9'
                        >
                          <MoreVertical className='size-4 text-muted-foreground' />
                        </Button>
                      </div>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow className='bg-muted/30'>
                          <TableHead className='px-6 text-[11px] font-bold tracking-widest text-muted-foreground uppercase'>
                            Đơn vị
                          </TableHead>
                          <TableHead className='px-6 text-[11px] font-bold tracking-widest text-muted-foreground uppercase'>
                            Người thực hiện
                          </TableHead>
                          <TableHead className='px-6 text-center text-[11px] font-bold tracking-widest text-muted-foreground uppercase'>
                            Trạng thái
                          </TableHead>
                          <TableHead className='px-6 text-[11px] font-bold tracking-widest text-muted-foreground uppercase'>
                            Cập nhật lúc
                          </TableHead>
                          <TableHead className='px-6 text-right text-[11px] font-bold tracking-widest text-muted-foreground uppercase'>
                            Thao tác
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {departmentRows.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className='py-16 text-center text-sm text-muted-foreground'
                            >
                              Không có dữ liệu
                            </TableCell>
                          </TableRow>
                        ) : (
                          departmentRows.map((row) => (
                            <TableRow
                              key={row.id}
                              className='hover:bg-muted/20'
                            >
                              <TableCell className='px-6 py-4'>
                                <div className='flex items-center gap-3'>
                                  <div className='flex size-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary'>
                                    {row.initials}
                                  </div>
                                  <div className='font-semibold text-foreground'>
                                    {row.unitName}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className='px-6 py-4'>
                                <div className='flex items-center gap-2'>
                                  <div className='size-7 rounded-full bg-muted' />
                                  <div className='text-sm font-medium text-foreground'>
                                    {row.assigneeName}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className='px-6 py-4 text-center'>
                                {(() => {
                                  const info = getSubmissionStatusInfo(row.status)
                                  const StatusIcon = info.icon
                                  return (
                                    <span
                                      className={cn(
                                        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold border uppercase tracking-wider shadow-sm',
                                        info.className
                                      )}
                                    >
                                      <StatusIcon className='size-3' />
                                      {info.label}
                                    </span>
                                  )
                                })()}
                              </TableCell>
                              <TableCell className='px-6 py-4 text-sm font-medium text-muted-foreground'>
                                {formatTimeDashDate(row.updatedAt)}
                              </TableCell>
                              <TableCell className='px-6 py-4 text-right'>
                                <Button
                                  type='button'
                                  variant='ghost'
                                  size='icon'
                                  className='h-9 w-9'
                                  onClick={() => {
                                    if (row.id) {
                                      setViewAssignmentId(row.id)
                                    }
                                  }}
                                >
                                  <Eye className='size-4 text-primary' />
                                </Button>
                                <Button
                                  type='button'
                                  variant='ghost'
                                  size='icon'
                                  className='h-9 w-9'
                                >
                                  <MoreVertical className='size-4 text-muted-foreground' />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>

                    <div className='flex flex-wrap items-center justify-between gap-2 bg-muted/20 px-6 py-4 text-xs font-semibold text-muted-foreground'>
                      <div>
                        Hiển thị {Math.min(4, departmentRows.length)} trên tổng
                        số {departmentRows.length} đơn vị
                      </div>
                      <div className='flex gap-2'>
                        <Button
                          type='button'
                          variant='outline'
                          size='icon'
                          className='h-8 w-8'
                          disabled
                        >
                          <ArrowLeft className='size-4' />
                        </Button>
                        <Button
                          type='button'
                          className='h-8 w-8 px-0 text-xs font-semibold'
                          disabled
                        >
                          1
                        </Button>
                        <Button
                          type='button'
                          variant='outline'
                          size='icon'
                          className='h-8 w-8'
                          disabled
                        >
                          <ArrowRight className='size-4' />
                        </Button>
                      </div>
                    </div>
                  </section>

                </div>
              </TabsContent>

              <TabsContent value='approvals' className='p-0'>
                <div className='flex h-[700px] overflow-hidden rounded-b-3xl border-t bg-background'>
                  {/* Master Column */}
                  <div className='flex w-full flex-col border-e bg-muted/5 md:w-[350px]'>
                    <div className='space-y-3 p-4'>
                      <div className='relative'>
                        <Filter className='absolute top-2.5 left-3 h-4 w-4 text-muted-foreground' />
                        <Input
                          placeholder='Tìm đơn vị...'
                          className='h-9 pl-9 rounded-xl text-xs'
                          value={assignmentSearch}
                          onChange={(e) => setAssignmentSearch(e.target.value)}
                        />
                      </div>
                      <Select
                        value={assignmentStatusFilter}
                        onValueChange={setAssignmentStatusFilter}
                      >
                        <SelectTrigger className='h-9 rounded-xl border-muted bg-background text-[11px]'>
                          <SelectValue placeholder='Lọc trạng thái' />
                        </SelectTrigger>
                        <SelectContent className='rounded-xl'>
                          <SelectItem value='all'>Tất cả trạng thái</SelectItem>
                          <SelectItem value='NOT_STARTED'>Chưa bắt đầu</SelectItem>
                          <SelectItem value='PENDING_DEPARTMENT'>Chờ phòng duyệt</SelectItem>
                          <SelectItem value='DEPARTMENT_APPROVED'>Phòng đã duyệt</SelectItem>
                          <SelectItem value='DISTRICT_APPROVED'>Đã chốt (Xã)</SelectItem>
                          <SelectItem value='REJECTED'>Bị trả lại</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <ScrollArea className='flex-1'>
                      <div className='divide-y divide-muted/10'>
                        {departmentRows
                          .filter(row => {
                            const matchesSearch = row.unitName.toLowerCase().includes(assignmentSearch.toLowerCase())
                            const matchesStatus = assignmentStatusFilter === 'all' || row.status === assignmentStatusFilter
                            return matchesSearch && matchesStatus
                          })
                          .map((row) => {
                            const isActive = viewAssignmentId === row.id
                            const statusInfo = getSubmissionStatusInfo(row.status)
                            const StatusIcon = statusInfo.icon

                            return (
                              <button
                                key={row.id}
                                className={cn(
                                  'flex w-full flex-col gap-1.5 p-4 text-left transition-all hover:bg-muted/30',
                                  isActive && 'bg-primary/5 shadow-[inset_4px_0_0_0_theme(colors.primary.DEFAULT)]'
                                )}
                                onClick={() => setViewAssignmentId(row.id)}
                              >
                                <div className='flex items-center justify-between gap-2'>
                                  <span className={cn(
                                    'text-sm font-bold truncate',
                                    isActive ? 'text-primary' : 'text-foreground'
                                  )}>
                                    {row.unitName}
                                  </span>
                                  <Badge
                                    variant='outline'
                                    className={cn(
                                      'shrink-0 h-4 px-1 text-[8px] font-bold uppercase tracking-tighter border-none',
                                      statusInfo.className
                                    )}
                                  >
                                    {statusInfo.label}
                                  </Badge>
                                </div>
                                <div className='flex items-center justify-between text-[10px] text-muted-foreground'>
                                  <span>{row.assigneeName}</span>
                                  <span>{formatTimeDashDate(row.updatedAt)}</span>
                                </div>
                              </button>
                            )
                          })}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Detail Column */}
                  <div className='flex flex-1 flex-col overflow-hidden'>
                    {viewAssignmentId ? (
                      <div className='flex flex-1 flex-col overflow-hidden'>
                        <div className='flex items-center justify-between border-b px-6 py-4'>
                          <div>
                            <h3 className='text-lg font-bold text-foreground'>
                              {departmentRows.find(r => r.id === viewAssignmentId)?.unitName}
                            </h3>
                            <p className='text-xs text-muted-foreground'>
                              Chi tiết nhiệm vụ báo cáo và lịch sử phê duyệt
                            </p>
                          </div>
                          <div className='flex items-center gap-2'>
                            <Button variant='outline' size='sm' className='h-9 rounded-xl' asChild>
                              <Link to='/my/assignments/$assignmentId/input' params={{ assignmentId: viewAssignmentId }}>
                                <Eye className='mr-2 size-4' />
                                Xem dữ liệu
                              </Link>
                            </Button>

                            {(() => {
                              const row = departmentRows.find(r => r.id === viewAssignmentId)
                              if (!row) return null

                              if (row.status === 'PENDING_DEPARTMENT') {
                                return (
                                  <>
                                    <Button
                                      size='sm'
                                      className='h-9 rounded-xl bg-green-600 hover:bg-green-700'
                                      onClick={() => handleApprove('DEPARTMENT')}
                                      disabled={approveDept.isPending}
                                    >
                                      <CheckCircle2 className='mr-2 size-4' />
                                      Duyệt Phòng
                                    </Button>
                                    <Button
                                      variant='destructive'
                                      size='sm'
                                      className='h-9 rounded-xl'
                                      onClick={() => handleReject('DEPARTMENT')}
                                      disabled={rejectDept.isPending}
                                    >
                                      <XCircle className='mr-2 size-4' />
                                      Từ chối
                                    </Button>
                                  </>
                                )
                              }

                              if (row.status === 'DEPARTMENT_APPROVED') {
                                return (
                                  <>
                                    <Button
                                      size='sm'
                                      className='h-9 rounded-xl'
                                      onClick={() => handleApprove('DISTRICT')}
                                      disabled={approveDist.isPending}
                                    >
                                      <CheckCircle2 className='mr-2 size-4' />
                                      Chốt Số (Xã)
                                    </Button>
                                    <Button
                                      variant='destructive'
                                      size='sm'
                                      className='h-9 rounded-xl'
                                      onClick={() => handleReject('DISTRICT')}
                                      disabled={rejectDist.isPending}
                                    >
                                      <XCircle className='mr-2 size-4' />
                                      Từ chối
                                    </Button>
                                  </>
                                )
                              }

                              return null
                            })()}
                          </div>
                        </div>

                        <ScrollArea className='flex-1 p-6'>
                          <div className='space-y-8'>
                            {/* Summary Stats */}
                            <div className='grid grid-cols-3 gap-4'>
                              <Card className='p-4 bg-muted/20 border-none rounded-2xl'>
                                <p className='text-[10px] font-bold text-muted-foreground uppercase'>Trạng thái</p>
                                <div className='mt-1 flex items-center gap-2'>
                                  {(() => {
                                    const row = departmentRows.find(r => r.id === viewAssignmentId)
                                    const info = getSubmissionStatusInfo(row?.status)
                                    const Icon = info.icon
                                    return (
                                      <>
                                        <Icon className={cn('size-4', info.className.split(' ')[0])} />
                                        <span className='text-sm font-bold'>{info.label}</span>
                                      </>
                                    )
                                  })()}
                                </div>
                              </Card>
                              <Card className='p-4 bg-muted/20 border-none rounded-2xl'>
                                <p className='text-[10px] font-bold text-muted-foreground uppercase'>Tiến độ</p>
                                <div className='mt-1 flex items-baseline gap-1'>
                                  <span className='text-xl font-bold'>
                                    {report.assignments?.find(a => a.id === viewAssignmentId)?.completionPercent || 0}
                                  </span>
                                  <span className='text-xs font-medium text-muted-foreground'>%</span>
                                </div>
                              </Card>
                              <Card className='p-4 bg-primary/10 border-none rounded-2xl text-primary'>
                                <p className='text-[10px] font-bold opacity-70 uppercase'>Hạn chốt</p>
                                <p className='mt-1 text-sm font-bold'>
                                  {formatDate(report.deadlineTo)}
                                </p>
                              </Card>
                            </div>

                            {/* Timeline */}
                            <div className='space-y-4'>
                              <div className='flex items-center gap-2 text-sm font-bold'>
                                <History className='size-4 text-primary' />
                                Lịch sử quy trình
                              </div>
                              <div className='rounded-2xl border bg-muted/5 p-6'>
                                {historyQuery.isLoading ? (
                                  <div className='py-8 text-center text-xs text-muted-foreground'>
                                    Đang tải lịch sử...
                                  </div>
                                ) : history.length === 0 ? (
                                  <div className='py-8 text-center text-xs text-muted-foreground'>
                                    Chưa có dữ liệu lịch sử
                                  </div>
                                ) : (
                                  <SubmissionTimeline history={history} />
                                )}
                              </div>
                            </div>
                          </div>
                        </ScrollArea>
                      </div>
                    ) : (
                      <div className='flex flex-1 flex-col items-center justify-center p-12 text-center text-muted-foreground'>
                        <div className='mb-4 rounded-3xl bg-muted/20 p-6'>
                          <Workflow className='size-10 opacity-20' />
                        </div>
                        <h4 className='font-bold text-foreground/70'>Chọn đơn vị để xem chi tiết</h4>
                        <p className='mt-1 max-w-[250px] text-xs leading-relaxed'>
                          Hãy chọn một đơn vị từ danh sách bên trái để kiểm tra tiến độ và thực hiện phê duyệt.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className='flex items-center justify-between border-t bg-muted/5 p-4 rounded-b-3xl'>
                  <div className='flex items-center gap-2 text-xs font-medium text-muted-foreground'>
                    <AlertCircle className='size-4' />
                    Số liệu sẽ được tổng hợp vào báo cáo chung sau khi tất cả các đơn vị đã chốt số.
                  </div>
                  <Button
                    className='rounded-xl font-bold shadow-lg shadow-primary/20'
                    onClick={handleAggregate}
                    disabled={isAggregating}
                  >
                    {isAggregating ? (
                      <>
                        <RotateCcw className='mr-2 size-4 animate-spin' />
                        Đang tổng hợp...
                      </>
                    ) : (
                      <>
                        <Rocket className='mr-2 size-4' />
                        Tổng hợp báo cáo
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value='permissions'>
                <div className='px-4 pt-6 pb-6 lg:px-6'>
                  <CampaignScopesTab
                    campaignId={reportId}
                    templateId={report.formId || report.templateId || ''}
                  />
                </div>
              </TabsContent>
              <TabsContent value='defaults'>
                <div className='px-4 pt-6 pb-6 lg:px-6'>
                  <CampaignDefaultValuesTab
                    campaignId={reportId}
                    templateId={report.formId || report.templateId || ''}
                  />
                </div>
              </TabsContent>
              <TabsContent value='preview'>
                <div className='p-4 lg:p-6'>
                  <TemplatePreviewMatrix
                    templateId={report.templateId}
                    lockTemplateSelection={true}
                    mode='preview'
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </>
      )}

      <ReportConfirmDialog
        open={confirmDispatchOpen}
        onOpenChange={setConfirmDispatchOpen}
        title='Xác nhận phát hành báo cáo'
        description='Sau khi phát hành, cấu hình về chỉ tiêu và giá trị mặc định sẽ bị KHÓA. Hệ thống sẽ sinh bảng nhập liệu cho các đơn vị. Bạn có chắc chắn muốn tiếp tục?'
        confirmLabel='Phát hành ngay'
        variant='primary'
        loading={dispatchMutation.isPending}
        onConfirm={() => dispatchMutation.mutate()}
      />

      {report && (
        <EditCampaignDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          report={report}
          isLoading={updateMutation.isPending}
          onSave={(input) => updateMutation.mutate(input)}
        />
      )}

      {/* Approve Modal */}
      <Dialog open={isApproveModalOpen} onOpenChange={setIsApproveModalOpen}>
        <DialogContent className='sm:max-w-[420px] rounded-[2rem] p-8 border-none shadow-2xl'>
          <DialogHeader>
            <div className='mx-auto size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4'>
              <CheckCircle2 className='size-10' />
            </div>
            <DialogTitle className='text-2xl font-black text-center text-foreground'>
              Phê duyệt dữ liệu
            </DialogTitle>
            <DialogDescription className='text-sm text-center font-medium leading-relaxed pt-2'>
              {actionType === 'DEPARTMENT'
                ? 'Phê duyệt báo cáo này ở cấp phòng ban? Dữ liệu sẽ được chuyển lên cấp xã để chốt số.'
                : 'Chốt số báo cáo này ở cấp xã? Sau khi chốt, dữ liệu sẽ chính thức được ghi nhận vào báo cáo tổng hợp.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='mt-8 flex flex-col sm:flex-row gap-3'>
            <Button
              variant='ghost'
              className='flex-1 rounded-xl font-bold h-12'
              onClick={() => setIsApproveModalOpen(false)}
            >
              Xem lại
            </Button>
            <Button
              className='flex-1 rounded-xl font-black h-12 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20'
              onClick={confirmApprove}
              disabled={approveDept.isPending || approveDist.isPending}
            >
              {approveDept.isPending || approveDist.isPending ? 'Đang xử lý...' : 'Xác nhận duyệt'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent className='sm:max-w-[500px] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl'>
          <DialogHeader className='px-8 pt-8'>
            <DialogTitle className='text-2xl font-black flex items-center gap-3 text-destructive'>
              <XCircle className='size-7' />
              Từ chối bản nộp
            </DialogTitle>
            <DialogDescription className='text-sm pt-2 font-medium leading-relaxed'>
              Báo cáo này sẽ được gửi trả lại cho cấp dưới để chỉnh sửa. Vui lòng ghi rõ lý do.
            </DialogDescription>
          </DialogHeader>
          <div className='px-8 py-6'>
            <div className='space-y-3'>
              <Label htmlFor='reason' className='text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1'>
                Lý do trả lại chi tiết
              </Label>
              <Textarea
                id='reason'
                placeholder='Ví dụ: Số liệu doanh thu tháng này chưa khớp với hóa đơn, vui lòng kiểm tra lại...'
                className='min-h-[140px] rounded-2xl border-muted bg-muted/20 focus-visible:ring-destructive/20 p-4 text-sm'
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className='px-8 pb-8 flex sm:justify-between gap-3'>
            <Button
              variant='ghost'
              className='rounded-xl font-bold px-6'
              onClick={() => setIsRejectModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              variant='destructive'
              className='rounded-xl px-8 font-black shadow-lg shadow-destructive/20'
              onClick={confirmReject}
              disabled={rejectDept.isPending || rejectDist.isPending}
            >
              {rejectDept.isPending || rejectDist.isPending ? 'Đang thực hiện...' : 'Xác nhận trả lại'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

type EditCampaignDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  report: ReportDetail
  isLoading: boolean
  onSave: (input: UpdateReportInput) => void
}

function EditCampaignDialog({
  open,
  onOpenChange,
  report,
  isLoading,
  onSave,
}: EditCampaignDialogProps) {
  const [form, setForm] = useState<UpdateReportInput>({
    periodName: report?.periodName ?? '',
    deadlineFrom: report?.deadlineFrom?.split('T')[0] ?? '',
    deadlineTo: report?.deadlineTo?.split('T')[0] ?? '',
  })

  useEffect(() => {
    if (open && report) {
      setForm({
        periodName: report.periodName ?? '',
        deadlineFrom: report.deadlineFrom?.split('T')[0] ?? '',
        deadlineTo: report.deadlineTo?.split('T')[0] ?? '',
      })
    }
  }, [open, report])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chỉnh sửa báo cáo</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin cơ bản cho đợt báo cáo này.
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-4 py-4'>
          <div className='grid gap-2'>
            <Label>Tên kỳ báo cáo</Label>
            <Input
              value={form.periodName}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, periodName: e.target.value }))
              }
            />
          </div>
          <div className='grid grid-cols-2 gap-4'>
            <div className='grid gap-2'>
              <Label>Ngày mở</Label>
              <Input
                type='date'
                value={form.deadlineFrom}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, deadlineFrom: e.target.value }))
                }
              />
            </div>
            <div className='grid gap-2'>
              <Label>Ngày đóng</Label>
              <Input
                type='date'
                value={form.deadlineTo}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, deadlineTo: e.target.value }))
                }
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={() => onSave(form)} disabled={isLoading}>
            {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}