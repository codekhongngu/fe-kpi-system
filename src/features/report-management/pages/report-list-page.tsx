import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { FilePlus2 } from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { DataTablePagination } from '@/components/data-table/data-table-pagination'
import { PageBreadcrumb } from '@/components/page-breadcrumb'
import { formManagementApi } from '@/features/form-management/api/template-management-api'
import { reportCampaignApi } from '../api/report-management-api'
import type {
  CreateReportInput,
  CampaignStatus,
  ReportFilters,
  ReportListItem,
  UpdateReportInput,
} from '../api/types'
import { PermissionGuard } from '@/components/permission-guard'
import { ReportConfirmDialog } from '../components/report-confirm-dialog'
import { ReportFilters as ReportFiltersPanel } from '../components/report-filters'
import { ReportFormDialog } from '../components/report-form-dialog'
import { ReportTable } from '../components/report-table'
import { useTemplateInfo } from '../hooks/use-template-info'
import {
  defaultReportFilters,
  getErrorMessage,
  reportQueryKeys,
} from '../utils/report-query'

type ConfirmState = {
  type: 'cancel' | 'assign' | 'approve' | 'reject'
  report: ReportListItem
} | null

type CampaignListParams = {
  page: number
  limit: number
  status?: CampaignStatus
  formId?: string
  periodType?: string
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
  if (confirmState.type === 'cancel') {
    return {
      title: 'Hủy báo cáo',
      description: `Báo cáo "${reportName}" sẽ bị hủy khỏi danh sách quản lý.`,
      confirmLabel: 'Hủy báo cáo',
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

  const [filters, setFilters] = useState<ReportFilters>(defaultReportFilters)
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [editingReport, setEditingReport] = useState<ReportListItem | null>(
    null
  )
  const [confirmState, setConfirmState] = useState<ConfirmState>(null)

  const campaignListParams = useMemo<CampaignListParams>(() => {
    const params: CampaignListParams = {
      page: filters.page,
      limit: filters.pageSize,
    }

    if (filters.status !== 'all') {
      params.status = filters.status
    }

    if (filters.templateId.trim()) {
      params.formId = filters.templateId.trim()
    }

    if (filters.period && filters.period !== 'all') {
      params.periodType = filters.period
    }

    return params
  }, [filters.page, filters.pageSize, filters.period, filters.status, filters.templateId])

  const referencesQuery = useQuery({
    queryKey: reportQueryKeys.references,
    queryFn: async () => {
      const response = await formManagementApi.listTemplates({
        page: 1,
        limit: 200,
        template_status: 'READY,IN_USE',
      })

      return {
        templates: response.items.map((item) => ({
          id: item.id,
          code: item.code,
          name: item.name,
        })),
        units: [],
        periods: [],
      }
    },
  })

  const listQuery = useQuery({
    queryKey: reportQueryKeys.list({
      ...filters,
      keyword: '',
      unitId: '',
    }),
    queryFn: () => reportCampaignApi.listCampaigns(campaignListParams),
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
    mutationFn: async (input: CreateReportInput) =>
      await reportCampaignApi.createCampaign(input),
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
    }) => await reportCampaignApi.updateCampaign(id, input),
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
      if (confirmState.type === 'cancel') {
        return await reportCampaignApi.cancelCampaign(confirmState.report.id)
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
  const total = listQuery.data?.total ?? 0

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
          <PermissionGuard permission='report-campaigns.create'>
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
            onView={(report) =>
              navigate({
                to: '/report-management/details/$reportId',
                params: { reportId: report.id },
              })
            }
            onEdit={openEditForm}
            onCancel={(report) => setConfirmState({ type: 'cancel', report })}
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
    </>
  )
}
