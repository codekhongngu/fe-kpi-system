import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PlusCircle } from 'lucide-react'
import { toast } from 'sonner'
import { PageBreadcrumb } from '@/components/page-breadcrumb'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useFieldCategoriesCatalogQuery } from '../api/catalog-queries'
import { formManagementApi } from '../api/mock-form-management-api'
import type { FormTemplate, PeriodType } from '../api/types'
import { TemplateListFilter } from '../components/template-list-filter'
import { TemplateListTable } from '../components/template-list-table'

type FormModalState = {
  code: string
  name: string
  fieldCategoryId: string
  periodType: PeriodType
  description: string
  isActive: boolean
}

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
  const [previewTemplate, setPreviewTemplate] = useState<FormTemplate | null>(null)
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
  const totalPages = Math.max(1, Math.ceil(total / limit))
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

  const categoryOptions = useMemo(() => categories, [categories])

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
      toast.error('Tên biểu mẫu và nhóm biểu mẫu là bắt buộc.')
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
        <PageBreadcrumb title='Danh sách biểu mẫu' subtitle='Quản lý thông tin chung bằng modal và mở trang cấu hình riêng cho form-builder.'>
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

        <TemplateListTable templates={templates} onPreview={setPreviewTemplate} onEditGeneral={openEditModal} />
        <div className='flex flex-wrap items-center justify-between gap-3 rounded-md border bg-card px-4 py-3 text-sm'>
          <div className='text-muted-foreground'>Total: {total}</div>
          <div className='flex items-center gap-2'>
            <Label className='text-sm'>Limit</Label>
            <Select value={String(limit)} onValueChange={(value) => { setLimit(Number(value)); setPage(1) }}>
              <SelectTrigger className='w-[90px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='10'>10</SelectItem>
                <SelectItem value='20'>20</SelectItem>
                <SelectItem value='50'>50</SelectItem>
                <SelectItem value='100'>100</SelectItem>
              </SelectContent>
            </Select>
            <Button variant='outline' size='sm' onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page <= 1}>
              Prev
            </Button>
            <Input className='h-9 w-16 text-center' value={String(page)} onChange={(event) => {
              const next = Number(event.target.value || 1)
              if (!Number.isNaN(next)) setPage(Math.min(Math.max(1, next), totalPages))
            }} />
            <span className='text-muted-foreground'>/ {totalPages}</span>
            <Button variant='outline' size='sm' onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} disabled={page >= totalPages}>
              Next
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={Boolean(previewTemplate)} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
        <DialogContent className='sm:max-w-2xl'>
          <DialogHeader className='text-start'>
            <DialogTitle>
              {previewTemplate?.code} - {previewTemplate?.name}
            </DialogTitle>
            <DialogDescription>Thông tin chung của biểu mẫu.</DialogDescription>
          </DialogHeader>
          {previewTemplate && (
            <div className='grid gap-2 rounded-md border p-3 text-sm sm:grid-cols-2'>
              <div>
                <span className='text-muted-foreground'>Nhóm biểu mẫu: </span>
                {previewTemplate.fieldCategoryName ?? previewTemplate.fieldCategoryId}
              </div>
              <div>
                <span className='text-muted-foreground'>Trạng thái: </span>
                {previewTemplate.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
              </div>
              <div className='sm:col-span-2'>
                <span className='text-muted-foreground'>Mô tả: </span>
                {previewTemplate.description || '-'}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={openFormModal} onOpenChange={setOpenFormModal}>
        <DialogContent className='sm:max-w-xl'>
          <DialogHeader className='text-start'>
            <DialogTitle>{editingTemplate ? 'Cập nhật biểu mẫu' : 'Tạo biểu mẫu mới'}</DialogTitle>
            <DialogDescription>
              {editingTemplate
                ? 'Patch Form chỉ cập nhật tên, nhóm biểu mẫu, mô tả, trạng thái. Mã biểu mẫu được giữ cố định.'
                : 'Create Form yêu cầu mã, tên, nhóm biểu mẫu, mô tả và trạng thái.'}
            </DialogDescription>
          </DialogHeader>

          <div className='grid gap-4'>
            <div className='space-y-2'>
              <Label>Mã biểu mẫu</Label>
              <Input
                value={formState.code}
                disabled={Boolean(editingTemplate)}
                onChange={(event) => setFormState((prev) => ({ ...prev, code: event.target.value }))}
              />
            </div>
            <div className='space-y-2'>
              <Label>Tên biểu mẫu</Label>
              <Input
                value={formState.name}
                onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
            <div className='space-y-2'>
              <Label>Nhóm biểu mẫu</Label>
              <Select
                value={formState.fieldCategoryId}
                onValueChange={(value) => setFormState((prev) => ({ ...prev, fieldCategoryId: value }))}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Chọn nhóm biểu mẫu' />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name || category.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Kỳ báo cáo</Label>
              <Select
                value={formState.periodType}
                onValueChange={(value: PeriodType) => setFormState((prev) => ({ ...prev, periodType: value }))}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='TUAN'>Tuần</SelectItem>
                  <SelectItem value='THANG'>Tháng</SelectItem>
                  <SelectItem value='QUY'>Quý</SelectItem>
                  <SelectItem value='NAM'>Năm</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Trạng thái</Label>
              <Select
                value={formState.isActive ? 'true' : 'false'}
                onValueChange={(value) => setFormState((prev) => ({ ...prev, isActive: value === 'true' }))}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='true'>Hoạt động</SelectItem>
                  <SelectItem value='false'>Ngừng hoạt động</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Mô tả</Label>
              <Textarea
                rows={3}
                value={formState.description}
                onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={handleCloseModal}>Hủy</Button>
            <Button onClick={submitFormModal} disabled={createMutation.isPending || patchMutation.isPending}>
              {editingTemplate ? 'Lưu thay đổi' : 'Tạo biểu mẫu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
