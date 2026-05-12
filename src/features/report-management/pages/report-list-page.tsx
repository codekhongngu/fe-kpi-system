import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { FilePlus2 } from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { DataTablePagination } from '@/components/data-table/data-table-pagination'
import { PageBreadcrumb } from '@/components/page-breadcrumb'
import { reportCampaignApi } from '../api/report-management-api'
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
import { ReportTable } from '../components/report-table'
import { RoleVariantsDialog } from '../components/role-variants-dialog'
import { usePermission } from '../hooks/use-permission'
import { useTemplateInfo } from '../hooks/use-template-info'
import {
  defaultReportFilters,
  getErrorMessage,
  reportQueryKeys,
} from '../utils/report-query'

type ConfirmState = {
  type: 'delete' | 'assign' | 'approve' | 'reject'
  report: ReportListItem
} | null

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
  const [editingReport, setEditingReport] = useState<ReportListItem | null>(
    null
  )
  const [confirmState, setConfirmState] = useState<ConfirmState>(null)
  const [roleVariantsOpen, setRoleVariantsOpen] = useState(false)

  const referencesQuery = useQuery({
    queryKey: reportQueryKeys.references,
    queryFn: async () => {
      // References come from template API now
      const response = await apiClient.get<{
        items?: Array<{ id: string; code: string; name: string }>
      }>('/forms', { params: { limit: 200 } })
      const templates = Array.isArray(response.data)
        ? response.data
        : (response.data.items ?? [])
      return {
        templates: templates.map(
          (t: { id: string; code: string; name: string }) => ({
            id: t.id,
            code: t.code,
            name: t.name,
          })
        ),
        units: [],
        periods: [],
      }
    },
  })

  const listQuery = useQuery({
    queryKey: reportQueryKeys.list(filters),
    queryFn: async () => {
      // Xây dựng params một cách rõ ràng để tránh undefined
      const requestParams: Record<string, any> = {
        page: filters.page,
        limit: filters.pageSize,
      }
      
      // Chỉ thêm status khi không phải 'all'
      if (filters.status && filters.status !== 'all') {
        requestParams.status = filters.status
      }
      
      // Chỉ thêm formId khi có giá trị
      if (filters.templateId && filters.templateId.trim() !== '') {
        requestParams.formId = filters.templateId
      }
      
      // Chỉ thêm periodType khi không phải 'all' và có giá trị hợp lệ
      if (filters.period && filters.period !== 'all') {
        const validPeriods = ['TUAN', 'THANG', 'QUY', 'NAM']
        if (validPeriods.includes(filters.period)) {
          requestParams.periodType = filters.period
        }
      }

      console.log('API Request Params:', requestParams)

      const response = await apiClient.get<{
        items: ReportListItem[]
        meta?: { total: number }
        total?: number
      }>('/report-campaigns', { params: requestParams })
      return response.data
    },
  })

  const invalidateReports = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ['report-management', 'list'],
      }),
      queryClient.invalidateQueries({ queryKey: reportQueryKeys.summary }),
      queryClient.invalidateQueries({
        queryKey: ['report-management', 'detail'],
      }),
    ])
  }

  const createMutation = useMutation({
    mutationFn: async (input: CreateReportInput) => {
      await apiClient.post('/report-campaigns', {
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
    mutationFn: async ({
      id,
      input,
    }: {
      id: string
      input: UpdateReportInput
    }) => {
      await apiClient.patch(`/report-campaigns/${id}`, input)
      return true
    },
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
        return await apiClient.delete(
          `/report-campaigns/${confirmState.report.id}`
        )
      }
      if (confirmState.type === 'assign') {
        return await reportCampaignApi.confirmDispatch(confirmState.report.id)
      }
      if (confirmState.type === 'approve') {
        return await apiClient.post(
          `/report-campaigns/${confirmState.report.id}/approve`,
          { note: reason }
        )
      }
      return await apiClient.post(
        `/report-campaigns/${confirmState.report.id}/reject`,
        { reason }
      )
    },
    onSuccess: async () => {
      toast.success('Đã xử lý báo cáo.')
      setConfirmState(null)
      await invalidateReports()
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const confirmCopy = useMemo(
    () => getConfirmCopy(confirmState),
    [confirmState]
  )
  const listData = listQuery.data?.items ?? []
  const total = listQuery.data?.total ?? listQuery.data?.meta?.total ?? 0

  // Sử dụng hook để lấy thông tin template
  const { enrichedReports, isLoading: templateLoading } =
    useTemplateInfo(listData)

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
      <div className='flex w-full flex-col gap-4'>
        <PageBreadcrumb
          title='Danh sách báo cáo'
          subtitle='Quản lý danh sách báo cáo'
        >
          <PermissionGuard action='report:create'>
            <Button onClick={openCreateForm}>
              <FilePlus2 />
              Tạo báo cáo
            </Button>
          </PermissionGuard>
        </PageBreadcrumb>

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
            data={enrichedReports}
            isLoading={
              listQuery.isLoading || listQuery.isFetching || templateLoading
            }
            can={permission.can}
            onView={(report) =>
              navigate({
                to: '/report-management/details/$reportId',
                params: { reportId: report.id },
              })
            }
            onEdit={openEditForm}
            onDelete={(report) => setConfirmState({ type: 'delete', report })}
            onAssign={(report) => setConfirmState({ type: 'assign', report })}
            onApprove={(report) =>
              setConfirmState({ type: 'approve', report })
            }
            onReject={(report) => setConfirmState({ type: 'reject', report })}
          />
        )}

        <DataTablePagination
          total={total}
          page={filters.page}
          pageSize={filters.pageSize}
          onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
          onPageSizeChange={(size) =>
            setFilters((prev) => ({ ...prev, pageSize: size, page: 1 }))
          }
        />
      </div>

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
