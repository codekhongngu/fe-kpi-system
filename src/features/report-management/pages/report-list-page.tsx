import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { Download, FilePlus2, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { apiClient } from '@/lib/api-client'
import { reportManagementApi } from '../api/mock-report-management-api'
import type {
  CreateReportInput,
  ReportFilters,
  ReportListItem,
  UpdateReportInput,
} from '../api/types'
import { PermissionGuard } from '../components/permission-guard'
import { ReportConfirmDialog } from '../components/report-confirm-dialog'
import { ReportFilters as ReportFiltersPanel } from '../components/report-filters'
import { ReportFormDialog } from '../components/report-form-dialog'
import { ReportSummaryStrip } from '../components/report-summary-strip'
import { ReportTable } from '../components/report-table'
import { ReportTabs } from '../components/report-tabs'
import { RoleVariantsDialog } from '../components/role-variants-dialog'
import { usePermission } from '../hooks/use-permission'
import {
  defaultReportFilters,
  getErrorMessage,
  reportQueryKeys,
} from '../utils/report-query'

type ConfirmState =
  | { type: 'delete' | 'assign' | 'approve' | 'reject'; report: ReportListItem }
  | null

function getInitialTab(href: string, defaultTab: ReportFilters['tab']) {
  const url = new URL(href, window.location.origin)
  const tab = url.searchParams.get('tab')
  if (
    tab === 'unsubmitted' ||
    tab === 'pending_approval' ||
    tab === 'approved' ||
    tab === 'rejected' ||
    tab === 'overdue' ||
    tab === 'all'
  ) {
    return tab
  }
  return defaultTab
}

function getConfirmCopy(confirmState: ConfirmState) {
  if (!confirmState) {
    return {
      title: '',
      description: '',
      confirmLabel: '',
      destructive: false,
      requireReason: false,
    }
  }

  const reportName = confirmState.report.name
  if (confirmState.type === 'delete') {
    return {
      title: 'Xóa báo cáo',
      description: `Báo cáo "${reportName}" sẽ bị xóa khỏi danh sách quản lý.`,
      confirmLabel: 'Xóa báo cáo',
      destructive: true,
      requireReason: false,
    }
  }
  if (confirmState.type === 'assign') {
    return {
      title: 'Giao báo cáo',
      description: `Giao báo cáo "${reportName}" cho đơn vị nhập liệu.`,
      confirmLabel: 'Giao báo cáo',
      destructive: false,
      requireReason: false,
    }
  }
  if (confirmState.type === 'approve') {
    return {
      title: 'Phê duyệt báo cáo',
      description: `Xác nhận phê duyệt báo cáo "${reportName}".`,
      confirmLabel: 'Phê duyệt',
      destructive: false,
      requireReason: false,
    }
  }
  return {
    title: 'Trả lại báo cáo',
    description: `Nhập lý do trả lại báo cáo "${reportName}" để đơn vị bổ sung.`,
    confirmLabel: 'Trả lại',
    destructive: true,
    requireReason: true,
  }
}

export function ReportListPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const href = useLocation({ select: (location) => location.href })
  const permission = usePermission()
  const initialTab = useMemo(
    () => getInitialTab(href, permission.defaultTab),
    [href, permission.defaultTab]
  )
  const [filters, setFilters] = useState<ReportFilters>({
    ...defaultReportFilters,
    tab: initialTab,
  })
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [editingReport, setEditingReport] = useState<ReportListItem | null>(null)
  const [confirmState, setConfirmState] = useState<ConfirmState>(null)
  const [roleVariantsOpen, setRoleVariantsOpen] = useState(false)

  const referencesQuery = useQuery({
    queryKey: reportQueryKeys.references,
    queryFn: reportManagementApi.listReferences,
  })

  const summaryQuery = useQuery({
    queryKey: reportQueryKeys.summary,
    queryFn: reportManagementApi.getSummary,
  })

  const listQuery = useQuery({
    queryKey: reportQueryKeys.list(filters),
    queryFn: () => reportManagementApi.listReports(filters),
  })

  const invalidateReports = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['report-management', 'list'] }),
      queryClient.invalidateQueries({ queryKey: reportQueryKeys.summary }),
      queryClient.invalidateQueries({ queryKey: ['report-management', 'detail'] }),
    ])
  }

  const createMutation = useMutation({
    mutationFn: async (input: CreateReportInput) => {
      await apiClient.post('/assignments', {
        formId: input.templateId,
        periodType: input.periodType,
        periodCode: input.periodCode,
        periodName: input.periodName,
        deadlineFrom: input.openDate,
        deadlineTo: input.closeDate,
      })
      return true
    },
    onSuccess: async () => {
      toast.success('Đã tạo báo cáo thành công.')
      setFormOpen(false)
      await invalidateReports()
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateReportInput }) =>
      reportManagementApi.updateReport(id, input),
    onSuccess: async () => {
      toast.success('Đã cập nhật báo cáo.')
      setFormOpen(false)
      setEditingReport(null)
      await invalidateReports()
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const actionMutation = useMutation({
    mutationFn: async ({ reason }: { reason: string }): Promise<unknown> => {
      if (!confirmState) {
        throw new Error('Chưa chọn báo cáo.')
      }
      if (confirmState.type === 'delete') {
        return await reportManagementApi.deleteReport(confirmState.report.id)
      }
      if (confirmState.type === 'assign') {
        return await reportManagementApi.assignReport(confirmState.report.id)
      }
      if (confirmState.type === 'approve') {
        return await reportManagementApi.approveReport(confirmState.report.id, reason)
      }
      return await reportManagementApi.rejectReport(confirmState.report.id, reason)
    },
    onSuccess: async () => {
      toast.success('Đã xử lý báo cáo.')
      setConfirmState(null)
      await invalidateReports()
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const exportMutation = useMutation({
    mutationFn: (format: 'excel' | 'pdf') => reportManagementApi.exportReports(format),
    onSuccess: (result) => toast.success(`Đã chuẩn bị file ${result.fileName}.`),
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const confirmCopy = useMemo(() => getConfirmCopy(confirmState), [confirmState])
  const listData = listQuery.data?.items ?? []
  const total = listQuery.data?.total ?? 0

  const openCreateForm = () => {
    setFormMode('create')
    setEditingReport(null)
    setFormOpen(true)
  }

  const openEditForm = (report: ReportListItem) => {
    setFormMode('edit')
    setEditingReport(report)
    setFormOpen(true)
  }

  return (
    <>
      <div className='flex flex-col gap-3 md:flex-row md:items-start md:justify-between'>
        <div>
          <div className='inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700'>
            Quản lý báo cáo
          </div>
          <h1 className='mt-3 text-2xl font-bold tracking-tight'>Danh sách báo cáo</h1>
          <p className='mt-1 max-w-3xl text-sm text-muted-foreground'>
            Theo dõi report instance được tạo từ template, giao đơn vị nhập liệu và xử lý phê duyệt.
          </p>
        </div>
        <div className='flex flex-wrap gap-2'>
          <PermissionGuard action='report:role-variants'>
            <Button type='button' variant='outline' onClick={() => setRoleVariantsOpen(true)}>
              <ShieldCheck className='me-2 size-4' />
              Role/biến thể
            </Button>
          </PermissionGuard>
          <Button
            type='button'
            variant='outline'
            onClick={() => exportMutation.mutate('excel')}
            disabled={exportMutation.isPending}
          >
            <Download className='me-2 size-4' />
            Xuất Excel
          </Button>
          <PermissionGuard action='report:create'>
            <Button type='button' onClick={openCreateForm}>
              <FilePlus2 className='me-2 size-4' />
              Tạo báo cáo
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <ReportSummaryStrip summary={summaryQuery.data} isLoading={summaryQuery.isLoading} />

      <Card>
        <CardHeader className='gap-4'>
          <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
            <CardTitle>Quản lý danh sách báo cáo</CardTitle>
            <ReportTabs
              value={filters.tab}
              visibleTabs={permission.visibleTabs}
              onValueChange={(tab) => setFilters((prev) => ({ ...prev, tab, page: 1 }))}
            />
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          <ReportFiltersPanel
            filters={filters}
            references={referencesQuery.data}
            onChange={setFilters}
          />

          {listQuery.isError ? (
            <div className='rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive'>
              {getErrorMessage(listQuery.error)}
            </div>
          ) : (
            <ReportTable
              data={listData}
              total={total}
              page={filters.page}
              pageSize={filters.pageSize}
              isLoading={listQuery.isLoading || listQuery.isFetching}
              can={permission.can}
              onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
              onView={(report) =>
                navigate({ to: '/report-management/details/$reportId', params: { reportId: report.id } })
              }
              onEdit={openEditForm}
              onDelete={(report) => setConfirmState({ type: 'delete', report })}
              onAssign={(report) => setConfirmState({ type: 'assign', report })}
              onApprove={(report) => setConfirmState({ type: 'approve', report })}
              onReject={(report) => setConfirmState({ type: 'reject', report })}
            />
          )}
        </CardContent>
      </Card>

      <ReportFormDialog
        open={formOpen}
        mode={formMode}
        report={editingReport}
        references={referencesQuery.data}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        onOpenChange={setFormOpen}
        onCreate={(input) => createMutation.mutate(input)}
        onUpdate={(id, input) => updateMutation.mutate({ id, input })}
      />

      <ReportConfirmDialog
        open={Boolean(confirmState)}
        title={confirmCopy.title}
        description={confirmCopy.description}
        confirmLabel={confirmCopy.confirmLabel}
        destructive={confirmCopy.destructive}
        requireReason={confirmCopy.requireReason}
        isSubmitting={actionMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmState(null)
          }
        }}
        onConfirm={(reason) => actionMutation.mutate({ reason })}
      />

      <RoleVariantsDialog
        open={roleVariantsOpen}
        variants={permission.roleVariants}
        onOpenChange={setRoleVariantsOpen}
      />
    </>
  )
}
