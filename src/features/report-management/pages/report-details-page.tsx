import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  Info,
  Settings2,
  Workflow,
} from 'lucide-react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { reportCampaignApi } from '../api/report-management-api'
import type { ReportDetail, UpdateReportInput } from '../api/types'
import { ReportConfirmDialog } from '../components/report-confirm-dialog'
import { ReportApprovalsTab } from '../components/tabs/report-approvals-tab'
import { CampaignDefaultValuesTab } from '../components/tabs/campaign-default-values-tab'
import { CampaignScopesTab } from '../components/tabs/campaign-scopes-tab'
import { ReportCampaignSummaryPage } from '../components/tabs/report-campaign-summary-tab'
import { ReportGeneralTab } from '../components/tabs/report-general-tab'
import { getErrorMessage, reportQueryKeys } from '../utils/report-query'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

type ReportDetailsTab =
  | 'general'
  | 'permissions'
  | 'defaults'
  | 'approvals'
  | 'summary'

type ReportDetailsTabConfig = {
  value: ReportDetailsTab
  label: string
  icon: typeof Info
  contentClassName?: string
}

const REPORT_DETAILS_TABS: ReportDetailsTabConfig[] = [
  {
    value: 'general',
    label: 'Thông tin chung',
    icon: Info,
  },
  {
    value: 'permissions',
    label: 'Phân quyền chỉ tiêu',
    icon: Workflow,
    contentClassName: 'px-4 pt-6 pb-6 lg:px-6',
  },
  {
    value: 'defaults',
    label: 'Giá trị mặc định',
    icon: Settings2,
    contentClassName: 'px-4 pt-6 pb-6 lg:px-6',
  },
  {
    value: 'approvals',
    label: 'Phê duyệt & Tổng hợp',
    icon: CheckCircle2,
    contentClassName: 'p-0',
  },
  {
    value: 'summary',
    label: 'Tổng hợp dữ liệu',
    icon: Eye,
    contentClassName: 'p-4 lg:p-6',
  },
] as const

const DEFAULT_REPORT_DETAILS_TAB: ReportDetailsTab = 'general'

type ReportDetailsSearch = {
  tab?: string
}

type ReportDetailsPageProps = {
  reportId: string
}

type ReportDetailsTabContentProps = {
  reportId: string
  report: ReportDetail
  onRefetch: () => void
}

function isReportDetailsTab(value: string | null | undefined): value is ReportDetailsTab {
  return (
    value === 'general' ||
    value === 'permissions' ||
    value === 'defaults' ||
    value === 'approvals' ||
    value === 'summary'
  )
}

function normalizeReportDetailsTab(value: string | null | undefined) {
  if (value === 'preview') return 'summary' as const
  if (isReportDetailsTab(value)) return value
  return null
}

function renderReportDetailsTabContent(
  tab: ReportDetailsTab,
  { reportId, report, onRefetch }: ReportDetailsTabContentProps
) {
  switch (tab) {
    case 'general':
      return <ReportGeneralTab reportId={reportId} report={report} onRefetch={onRefetch} />
    case 'permissions':
      return (
        <CampaignScopesTab
          campaignId={reportId}
          templateId={report.formId || report.templateId || ''}
        />
      )
    case 'defaults':
      return (
        <CampaignDefaultValuesTab
          campaignId={reportId}
          templateId={report.formId || report.templateId || ''}
        />
      )
    case 'approvals':
      return <ReportApprovalsTab reportId={reportId} report={report} onRefetch={onRefetch} />
    case 'summary':
      return <ReportCampaignSummaryPage reportId={reportId} report={report} />
  }
}

export function ReportDetailsPage({ reportId }: ReportDetailsPageProps) {
  const navigate:any = useNavigate()
  const search = useSearch({ strict: false }) as ReportDetailsSearch
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [confirmDispatchOpen, setConfirmDispatchOpen] = useState(false)

  const activeTab = normalizeReportDetailsTab(search.tab) ?? DEFAULT_REPORT_DETAILS_TAB

  const detailQuery = useQuery({
    queryKey: reportQueryKeys.detail(reportId),
    queryFn: async () => {
      const response = await apiClient.get<ReportDetail>(
        `/report-campaigns/${reportId}`
      )
      return response.data
    },
  })

  const assignmentsQuery = useQuery({
    queryKey: reportQueryKeys.assignments(reportId),
    queryFn: () => reportCampaignApi.listCampaignAssignments(reportId),
    enabled: !!reportId,
  })

  const report = useMemo(() => {
    if (!detailQuery.data) return detailQuery.data
    return {
      ...detailQuery.data,
      assignments: assignmentsQuery.data ?? detailQuery.data.assignments,
    }
  }, [assignmentsQuery.data, detailQuery.data])

  const dispatchMutation = useMutation({
    mutationFn: () => reportCampaignApi.confirmDispatch(reportId),
    onSuccess: () => {
      toast.success('Đã phát hành báo cáo thành công.')
      void queryClient.invalidateQueries({ queryKey: reportQueryKeys.detail(reportId) })
      void queryClient.invalidateQueries({ queryKey: reportQueryKeys.assignments(reportId) })
      void queryClient.invalidateQueries({ queryKey: reportQueryKeys.scopes(reportId) })
      void queryClient.invalidateQueries({
        queryKey: reportQueryKeys.summaryReadiness(reportId),
      })
      void queryClient.invalidateQueries({
        queryKey: reportQueryKeys.campaignSummary(reportId),
      })
      setConfirmDispatchOpen(false)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const updateMutation = useMutation({
    mutationFn: (input: UpdateReportInput) =>
      apiClient.patch(`/report-campaigns/${reportId}`, input),
    onSuccess: () => {
      toast.success('Đã cập nhật thông tin báo cáo.')
      void queryClient.invalidateQueries({ queryKey: reportQueryKeys.detail(reportId) })
      void queryClient.invalidateQueries({
        queryKey: reportQueryKeys.campaignSummary(reportId),
      })
      setEditOpen(false)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const handleTabChange = (nextTab: string) => {
    const normalizedTab = normalizeReportDetailsTab(nextTab)
    if (!normalizedTab) return

    navigate({
      to: '.',
      search: (prev: Record<string, unknown>) => ({ ...prev, tab: normalizedTab }),
      replace: true,
    })
  }

  const handleRefetch = () => {
    void queryClient.invalidateQueries({ queryKey: reportQueryKeys.detail(reportId) })
    void queryClient.invalidateQueries({ queryKey: reportQueryKeys.assignments(reportId) })
    void queryClient.invalidateQueries({ queryKey: reportQueryKeys.scopes(reportId) })
    void queryClient.invalidateQueries({
      queryKey: reportQueryKeys.defaultValues(reportId),
    })
    void queryClient.invalidateQueries({
      queryKey: reportQueryKeys.summaryReadiness(reportId),
    })
    void queryClient.invalidateQueries({
      queryKey: reportQueryKeys.campaignSummary(reportId),
    })
  }

  const isApprovalsDisabled = report?.status !== 'DISPATCHED'
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
              <h1 className='truncate text-3xl font-bold tracking-tight text-foreground'>
                {report.templateName}
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
              <Button type='button' onClick={handleRefetch}>
                Tải lại
              </Button>
            </div>
          </div>

          <div className='rounded-3xl border bg-card p-2'>
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className='grid h-auto w-full grid-cols-2 gap-1 rounded-2xl bg-muted p-1 lg:grid-cols-5'>
                {REPORT_DETAILS_TABS.map((tab) => {
                  const TabIcon = tab.icon
                  const isDisabled = tab.value === 'approvals' && isApprovalsDisabled

                  const trigger = (
                    <TabsTrigger
                      key={tab.value}
                      className='h-11 justify-center gap-2 rounded-xl'
                      value={tab.value}
                      disabled={isDisabled}
                    >
                      <TabIcon className='size-4' />
                      {tab.label}
                    </TabsTrigger>
                  )

                  if (isDisabled) {
                    return (
                      <TooltipProvider key={tab.value}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className='cursor-not-allowed'>{trigger}</div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              Báo cáo cần được phát hành trước khi có thể phê duyệt & tổng hợp.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )
                  }

                  return trigger
                })}
              </TabsList>

              {REPORT_DETAILS_TABS.map((tab) => (
                <TabsContent
                  key={tab.value}
                  value={tab.value}
                  className={tab.contentClassName}
                >
                  {renderReportDetailsTabContent(tab.value, {
                    reportId,
                    report,
                    onRefetch: handleRefetch,
                  })}
                </TabsContent>
              ))}
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
        isSubmitting={dispatchMutation.isPending}
        onConfirm={() => dispatchMutation.mutate()}
      />

      {report && (
        <EditCampaignDialog
          key={`${report.id}-${editOpen ? 'open' : 'closed'}`}
          open={editOpen}
          onOpenChange={setEditOpen}
          report={report}
          isLoading={updateMutation.isPending}
          onSave={(input) => updateMutation.mutate(input)}
        />
      )}
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

function getInitialEditForm(report: ReportDetail): UpdateReportInput {
  return {
    periodName: report.periodName ?? '',
    deadlineFrom: report.deadlineFrom?.split('T')[0] ?? '',
    deadlineTo: report.deadlineTo?.split('T')[0] ?? '',
  }
}

function EditCampaignDialog({
  open,
  onOpenChange,
  report,
  isLoading,
  onSave,
}: EditCampaignDialogProps) {
  const [form, setForm] = useState<UpdateReportInput>(() =>
    getInitialEditForm(report)
  )

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
