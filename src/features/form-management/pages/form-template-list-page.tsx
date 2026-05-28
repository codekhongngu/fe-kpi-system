import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { PlusCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DataTablePagination } from '@/components/data-table/data-table-pagination'
import { PageBreadcrumb } from '@/components/page-breadcrumb'
import { PermissionGuard } from '@/components/permission-guard'
import { getApiErrorMessage } from '@/lib/get-api-error-message'
import { useFieldCategoriesCatalogQuery } from '../api/catalog-queries'
import { formManagementApi } from '../api/template-management-api'
import type { FormTemplate, PeriodType, TemplateType } from '../api/types'
import {
  type FormModalState,
  TemplateGeneralInfoDialog,
} from '../components/template-general-info-dialog'
import { TemplateListFilter } from '../components/template-list-filter'
import { TemplateListTable } from '../components/template-list-table'
import {
  canMarkTemplateReady,
  isSwitchingToUniqueTemplateType,
  validateUniqueScopes,
} from '../utils/template-scope-rules'

const defaultFormModalState: FormModalState = {
  code: '',
  name: '',
  fieldCategoryId: '',
  periodType: 'THANG',
  templateType: 'AGGREGATE',
  description: '',
}

const REPORT_PERIOD_OPTIONS = [
  { value: 'all', label: 'Tất cả kỳ báo cáo' },
  { value: 'TUAN', label: 'Tuần' },
  { value: 'THANG', label: 'Tháng' },
  { value: 'QUY', label: 'Quý' },
  { value: 'NAM', label: 'Năm' },
]

export function FormTemplateListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [editingTemplate, setEditingTemplate] = useState<FormTemplate | null>(
    null
  )
  const [openFormModal, setOpenFormModal] = useState(false)
  const [formState, setFormState] = useState<FormModalState>(
    defaultFormModalState
  )

  const templatesQuery = useQuery({
    queryKey: [
      'form-management',
      'templates',
      { search, selectedPeriod, selectedCategory, selectedStatus, page, limit },
    ],
    queryFn: () =>
      formManagementApi.listTemplates({
        search,
        page,
        limit,
        template_status: selectedStatus.length > 0 ? selectedStatus.join(',') : '',
        period: selectedPeriod === 'all' ? '' : selectedPeriod,
        category: selectedCategory === 'all' ? '' : selectedCategory,
      } as any),
  })

  const categoriesQuery = useFieldCategoriesCatalogQuery()
  const templates = templatesQuery.data?.items ?? []
  const meta = templatesQuery.data?.meta
  const total = meta?.total ?? 0
  const categories = categoriesQuery.data ?? []

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['form-management'] })
  }

  const createMutation = useMutation({
    mutationFn: formManagementApi.createTemplate,
    onSuccess: async () => {
      toast.success('Đã tạo biểu mẫu thành công.')
      await invalidate()
      handleCloseModal()
    },
    onError: (error: Error) => toast.error(getApiErrorMessage(error)),
  })

  const patchMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: {
        name: string
        fieldCategoryId: string
        periodType: PeriodType
        templateType: TemplateType
        description: string
        isActive: boolean
      }
    }) => formManagementApi.updateTemplate(id, payload),
    onSuccess: async () => {
      toast.success('Đã cập nhật thông tin biểu mẫu.')
      await invalidate()
      handleCloseModal()
    },
    onError: (error: Error) => toast.error(getApiErrorMessage(error)),
  })

  const markReadyMutation = useMutation({
    mutationFn: (templateId: string) =>
      formManagementApi.markReadyTemplate(templateId),
    onSuccess: async () => {
      toast.success('Đã chuyển biểu mẫu sang trạng thái sẵn sàng.')
      await invalidate()
    },
    onError: (error: Error) => toast.error(getApiErrorMessage(error)),
  })

  const archiveMutation = useMutation({
    mutationFn: (templateId: string) =>
      formManagementApi.archiveTemplate(templateId),
    onSuccess: async () => {
      toast.success('Đã lưu trữ biểu mẫu.')
      await invalidate()
    },
    onError: (error: Error) => toast.error(getApiErrorMessage(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: (templateId: string) =>
      formManagementApi.deleteTemplate(templateId),
    onSuccess: async () => {
      toast.success('Đã xóa biểu mẫu.')
      await invalidate()
    },
    onError: (error: Error) => toast.error(getApiErrorMessage(error)),
  })

  const cloneMutation = useMutation({
    mutationFn: (template: FormTemplate) =>
      formManagementApi.copyTemplate(template.id, {
        name: `${template.name} - Bản sao`,
      }),
    onSuccess: async (copied) => {
      toast.success('Đã sao chép biểu mẫu.')
      await invalidate()
      if (copied?.id) {
        await navigate({
          to: '/form-management/details/$templateId',
          params: { templateId: copied.id },
        })
      }
    },
    onError: (error: Error) => toast.error(getApiErrorMessage(error)),
  })

  const openCreateModal = () => {
    setEditingTemplate(null)
    setFormState({
      ...defaultFormModalState,
      fieldCategoryId: categories[0]?.id ?? '',
    })
    setOpenFormModal(true)
  }

  const openEditModal = (template: FormTemplate) => {
    setEditingTemplate(template)
    setFormState({
      code: template.code,
      name: template.name,
      fieldCategoryId: template.fieldCategoryId,
      periodType: template.periodType ?? 'THANG',
      templateType: template.templateType ?? 'AGGREGATE',
      description: template.description,
    })
    setOpenFormModal(true)
  }

  const handleCloseModal = () => {
    setOpenFormModal(false)
    setEditingTemplate(null)
    setFormState(defaultFormModalState)
  }

  const submitFormModal = async () => {
    if (!formState.name.trim() || !formState.fieldCategoryId) {
      toast.error('Tên biểu mẫu và Lĩnh vực biểu mẫu là bắt buộc.')
      return
    }

    if (editingTemplate) {
      if (
        isSwitchingToUniqueTemplateType(
          formState.templateType,
          editingTemplate.templateType
        )
      ) {
        try {
          const full = await formManagementApi.getTemplate(editingTemplate.id)
          const uniqueCheck = validateUniqueScopes(
            'UNIQUE',
            full.templateScopes ?? [],
            full.indicators ?? []
          )
          if (!uniqueCheck.ok) {
            toast.error(
              `${uniqueCheck.message} Vui lòng chỉnh tab Phân bổ chỉ tiêu (gỡ chỉ tiêu trùng đơn vị) trước khi đổi sang Đơn nhất.`
            )
            return
          }
        } catch (error) {
          toast.error(getApiErrorMessage(error))
          return
        }
      }

      patchMutation.mutate({
        id: editingTemplate.id,
        payload: {
          name: formState.name.trim(),
          fieldCategoryId: formState.fieldCategoryId,
          periodType: formState.periodType,
          templateType: formState.templateType,
          description: formState.description.trim(),
          isActive: true,
        },
      })
      return
    }

    if (!formState.code.trim()) {
      toast.error('Mã biểu mẫu là bắt buộc khi tạo mới.')
      return
    }

    createMutation.mutate({
      code: formState.code.trim(),
      name: formState.name.trim(),
      fieldCategoryId: formState.fieldCategoryId,
      periodType: formState.periodType,
      templateType: formState.templateType,
      description: formState.description.trim(),
    })
  }

  return (
    <>
      <div className='flex w-full flex-col gap-4'>
        <PageBreadcrumb
          title='Danh sách biểu mẫu'
          subtitle='Quản lý danh sách biểu mẫu báo cáo'
        >
          <PermissionGuard permission='forms.create'>
            <Button onClick={openCreateModal}>
              <PlusCircle />
              Thêm mới
            </Button>
          </PermissionGuard>
        </PageBreadcrumb>

        <TemplateListFilter
          search={search}
          selectedPeriod={selectedPeriod}
          selectedCategory={selectedCategory}
          selectedStatus={selectedStatus}
          periodOptions={REPORT_PERIOD_OPTIONS}
          categories={categories}
          onSearchChange={(value) => {
            setSearch(value)
            setPage(1)
          }}
          onPeriodChange={(value) => {
            setSelectedPeriod(value)
            setPage(1)
          }}
          onCategoryChange={(value) => {
            setSelectedCategory(value)
            setPage(1)
          }}
          onStatusChange={(value) => {
            setSelectedStatus(value)
            setPage(1)
          }}
        />

        <TemplateListTable
          templates={templates}
          isLoading={templatesQuery.isLoading}
          onEditGeneral={openEditModal}
          onClone={(template) => cloneMutation.mutate(template)}
          onMarkReady={async (template) => {
            try {
              const full = await formManagementApi.getTemplate(template.id)
              const readiness = canMarkTemplateReady(full)
              if (!readiness.ok) {
                toast.error(
                  readiness.message ??
                    'Không thể chuyển trạng thái Sẵn sàng.'
                )
                return
              }
              markReadyMutation.mutate(template.id)
            } catch (error) {
              toast.error(getApiErrorMessage(error))
            }
          }}
          onArchive={(template) => archiveMutation.mutate(template.id)}
          onDelete={(template) => deleteMutation.mutate(template.id)}
        />

        <DataTablePagination
          total={total}
          page={page}
          pageSize={limit}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setLimit(size)
            setPage(1)
          }}
        />
      </div>

      <TemplateGeneralInfoDialog
        open={openFormModal}
        editing={Boolean(editingTemplate)}
        formState={formState}
        categories={categories}
        onOpenChange={(open) => {
          if (!open) handleCloseModal()
          else setOpenFormModal(true)
        }}
        onFormStateChange={setFormState}
        onSubmit={submitFormModal}
        submitting={createMutation.isPending || patchMutation.isPending}
      />
    </>
  )
}
