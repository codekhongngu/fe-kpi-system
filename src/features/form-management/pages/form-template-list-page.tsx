import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PlusCircle } from 'lucide-react'
import { toast } from 'sonner'
import { PageBreadcrumb } from '@/components/page-breadcrumb'
import { Button } from '@/components/ui/button'
import { useFieldCategoriesCatalogQuery } from '../api/catalog-queries'
import { formManagementApi } from '../api/mock-form-management-api'
import type { FormTemplate, PeriodType } from '../api/types'
import { DataTablePagination } from '@/components/data-table/data-table-pagination'
import {
  type FormModalState,
  TemplateGeneralInfoDialog,
} from '../components/template-general-info-dialog'
import { TemplateListFilter } from '../components/template-list-filter'
import { TemplateListTable } from '../components/template-list-table'

const defaultFormModalState: FormModalState = {
  code: '',
  name: '',
  fieldCategoryId: '',
  periodType: 'THANG',
  description: '',
  isActive: true,
}

const REPORT_PERIOD_OPTIONS = [
  { value: 'all', label: 'Tất cả kỳ báo cáo' },
  { value: 'TUAN', label: 'Tuần' },
  { value: 'THANG', label: 'Tháng' },
  { value: 'QUY', label: 'Quý' },
  { value: 'NAM', label: 'Năm' },
]

export function FormTemplateListPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [editingTemplate, setEditingTemplate] = useState<FormTemplate | null>(null)
  const [openFormModal, setOpenFormModal] = useState(false)
  const [formState, setFormState] = useState<FormModalState>(defaultFormModalState)

  const templatesQuery = useQuery({
    queryKey: ['form-management', 'templates', { search, selectedPeriod, selectedCategory, selectedStatus, page, limit }],
    queryFn: () =>
      formManagementApi.listTemplates({
        search,
        page,
        limit,
        status: selectedStatus as 'all' | 'true' | 'false',
        period: selectedPeriod === 'all' ? '' : selectedPeriod,
        category: selectedCategory === 'all' ? '' : selectedCategory,
      }),
  })

  const categoriesQuery = useFieldCategoriesCatalogQuery()
  const templates = templatesQuery.data?.items ?? []
  const meta = templatesQuery.data?.meta
  const total = meta?.total ?? 0
  const categories = categoriesQuery.data ?? []

  const createMutation = useMutation({
    mutationFn: formManagementApi.createTemplate,
    onSuccess: async () => {
      toast.success('Đã tạo biểu mẫu thành công.')
      await queryClient.invalidateQueries({ queryKey: ['form-management'] })
      handleCloseModal()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const patchMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { name: string; fieldCategoryId: string; periodType: PeriodType; description: string; isActive: boolean } }) =>
      formManagementApi.updateTemplate(id, payload),
    onSuccess: async () => {
      toast.success('Đã cập nhật thông tin biểu mẫu.')
      await queryClient.invalidateQueries({ queryKey: ['form-management'] })
      handleCloseModal()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const categoryOptions = categories

  const openCreateModal = () => {
    setEditingTemplate(null)
    setFormState({ ...defaultFormModalState, fieldCategoryId: categoryOptions[0]?.id ?? '' })
    setOpenFormModal(true)
  }

  const openEditModal = (template: FormTemplate) => {
    setEditingTemplate(template)
    setFormState({
      code: template.code,
      name: template.name,
      fieldCategoryId: template.fieldCategoryId,
      periodType: template.periodType ?? 'THANG',
      description: template.description,
      isActive: template.isActive,
    })
    setOpenFormModal(true)
  }

  const handleCloseModal = () => {
    setOpenFormModal(false)
    setEditingTemplate(null)
    setFormState(defaultFormModalState)
  }

  const submitFormModal = () => {
    if (!formState.name.trim() || !formState.fieldCategoryId) {
      toast.error('Tên biểu mẫu và Lĩnh vực biểu mẫu là bắt buộc.')
      return
    }

    if (editingTemplate) {
      patchMutation.mutate({
        id: editingTemplate.id,
        payload: {
          name: formState.name.trim(),
          fieldCategoryId: formState.fieldCategoryId,
          periodType: formState.periodType,
          description: formState.description.trim(),
          isActive: formState.isActive,
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
      description: formState.description.trim(),
      isActive: formState.isActive,
    })
  }

  return (
    <>
      <div className='flex w-full flex-col gap-4'>
        <PageBreadcrumb title='Danh sách biểu mẫu' subtitle='Quản lý danh sách biểu mẫu báo cáo'>
          <Button onClick={openCreateModal}>
            <PlusCircle />
            Thêm mới
          </Button>
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

        <TemplateListTable templates={templates} onEditGeneral={openEditModal} />
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
        categories={categoryOptions}
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

