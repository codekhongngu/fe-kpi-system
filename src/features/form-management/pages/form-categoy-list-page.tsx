import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PlusCircle } from 'lucide-react'
import { toast } from 'sonner'
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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { DataTablePagination } from '@/components/data-table/data-table-pagination'
import { Main } from '@/components/layout/main'
import { PageBreadcrumb } from '@/components/page-breadcrumb'
import { PermissionGuard } from '@/components/permission-guard'
import { getApiErrorMessage } from '@/lib/get-api-error-message'
import { formManagementApi } from '../api/template-management-api'
import { type FieldCategory } from '../api/types'
import {
  defaultFieldCategoryFilters,
  FieldCategoryFilters,
  type FieldCategoryFiltersState,
} from '../components/field-category-filters'
import { FieldCategoriesTable } from '../components/field-categories-table'

const EMPTY_CATEGORIES: FieldCategory[] = []

type FieldCategoryFormState = {
  code: string
  name: string
  description: string
  sortOrder: string
  isActive: boolean
}

const defaultForm: FieldCategoryFormState = {
  code: '',
  name: '',
  description: '',
  sortOrder: '0',
  isActive: true,
}

function FormCategoryAccessDenied() {
  return (
    <div className='flex w-full flex-col gap-4'>
      <PageBreadcrumb
        title='Lĩnh vực biểu mẫu'
        subtitle='Quản lý danh mục lĩnh vực biểu mẫu để phân Lĩnh vực biểu mẫu.'
      />
      <p className='text-sm text-muted-foreground'>
        Bạn không có quyền xem lĩnh vực biểu mẫu.
      </p>
    </div>
  )
}

export function FormCategoryListPage() {
  return (
    <Main fixed>
      <div className='flex w-full flex-1 overflow-y-auto'>
        <PermissionGuard
          permission='field-categories.view'
          fallback={<FormCategoryAccessDenied />}
        >
          <FormCategoryListContent />
        </PermissionGuard>
      </div>
    </Main>
  )
}

function FormCategoryListContent() {
  const queryClient = useQueryClient()

  const categoriesQuery = useQuery({
    queryKey: ['form-management', 'field-categories'],
    queryFn: () => formManagementApi.listFieldCategories(),
  })

  const categories = categoriesQuery.data ?? EMPTY_CATEGORIES

  const [filters, setFilters] = useState<FieldCategoryFiltersState>(
    defaultFieldCategoryFilters
  )
  const [openForm, setOpenForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<FieldCategory | null>(
    null
  )
  const [form, setForm] = useState<FieldCategoryFormState>(defaultForm)
  const [deletingCategory, setDeletingCategory] =
    useState<FieldCategory | null>(null)

  const filteredCategories = useMemo(() => {
    const keyword = filters.keyword.trim().toLowerCase()
    return categories.filter((item) => {
      const matchKeyword =
        !keyword ||
        [item.code, item.name, item.description ?? ''].some((value) =>
          value.toLowerCase().includes(keyword)
        )
      const matchStatus =
        filters.status === 'all' ||
        (filters.status === 'active' && item.isActive) ||
        (filters.status === 'inactive' && !item.isActive)
      return matchKeyword && matchStatus
    })
  }, [categories, filters.keyword, filters.status])

  const paginatedCategories = useMemo(() => {
    const start = (filters.page - 1) * filters.pageSize
    return filteredCategories.slice(start, start + filters.pageSize)
  }, [filteredCategories, filters.page, filters.pageSize])

  const closeForm = () => {
    setOpenForm(false)
    setEditingCategory(null)
    setForm(defaultForm)
  }

  const openCreateDialog = () => {
    setEditingCategory(null)
    setForm(defaultForm)
    setOpenForm(true)
  }

  const openEditDialog = (category: FieldCategory) => {
    setEditingCategory(category)
    setForm({
      code: category.code,
      name: category.name,
      description: category.description ?? '',
      sortOrder: String(category.sortOrder ?? 0),
      isActive: category.isActive,
    })
    setOpenForm(true)
  }

  const createMutation = useMutation({
    mutationFn: () =>
      formManagementApi.createFieldCategory({
        code: form.code.trim(),
        name: form.name.trim(),
        description:
          form.description.trim().length > 0 ? form.description.trim() : null,
        sortOrder: Number.isFinite(Number(form.sortOrder))
          ? Number(form.sortOrder)
          : 0,
        isActive: form.isActive,
      }),
    onSuccess: () => {
      toast.success('Đã tạo lĩnh vực biểu mẫu.')
      queryClient.invalidateQueries({
        queryKey: ['form-management', 'field-categories'],
      })
      closeForm()
    },
    onError: (error: Error) => toast.error(getApiErrorMessage(error)),
  })

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editingCategory) {
        throw new Error('Không tìm thấy lĩnh vực.')
      }
      return formManagementApi.updateFieldCategory(editingCategory.id, {
        code: editingCategory.code,
        name: form.name.trim(),
        description:
          form.description.trim().length > 0 ? form.description.trim() : null,
        sortOrder: Number.isFinite(Number(form.sortOrder))
          ? Number(form.sortOrder)
          : 0,
        isActive: form.isActive,
      })
    },
    onSuccess: () => {
      toast.success('Đã cập nhật lĩnh vực biểu mẫu.')
      queryClient.invalidateQueries({
        queryKey: ['form-management', 'field-categories'],
      })
      closeForm()
    },
    onError: (error: Error) => toast.error(getApiErrorMessage(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => formManagementApi.deleteFieldCategory(id),
    onSuccess: () => {
      toast.success('Đã xóa lĩnh vực biểu mẫu.')
      queryClient.invalidateQueries({
        queryKey: ['form-management', 'field-categories'],
      })
      setDeletingCategory(null)
    },
    onError: (error: Error) => toast.error(getApiErrorMessage(error)),
  })

  return (
    <>
      <div className='flex w-full flex-col gap-4'>
        <PageBreadcrumb
          title='Lĩnh vực biểu mẫu'
          subtitle='Quản lý danh mục lĩnh vực biểu mẫu để phân Lĩnh vực biểu mẫu.'
        >
          <PermissionGuard permission='field-categories.create'>
            <Button onClick={openCreateDialog}>
              <PlusCircle />
              Thêm lĩnh vực
            </Button>
          </PermissionGuard>
        </PageBreadcrumb>

        <FieldCategoryFilters filters={filters} onChange={setFilters} />

        {categoriesQuery.isError ? (
          <div className='rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive'>
            {getApiErrorMessage(categoriesQuery.error)}
          </div>
        ) : (
          <FieldCategoriesTable
            data={paginatedCategories}
            isLoading={categoriesQuery.isLoading}
            onEdit={openEditDialog}
            onDelete={setDeletingCategory}
          />
        )}

        <DataTablePagination
          total={filteredCategories.length}
          page={filters.page}
          pageSize={filters.pageSize}
          onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
          onPageSizeChange={(pageSize) =>
            setFilters((prev) => ({ ...prev, pageSize, page: 1 }))
          }
        />
      </div>

      <Dialog
        open={openForm}
        onOpenChange={(open) => {
          setOpenForm(open)
          if (!open) closeForm()
        }}
      >
        <DialogContent className='sm:max-w-xl'>
          <DialogHeader className='text-start'>
            <DialogTitle>
              {editingCategory ? 'Cập nhật lĩnh vực' : 'Thêm lĩnh vực'}
            </DialogTitle>
            <DialogDescription>
              Quản lý danh mục lĩnh vực biểu mẫu.
            </DialogDescription>
          </DialogHeader>

          <div className='grid gap-4 sm:grid-cols-2'>
            {editingCategory ? (
              <div className='space-y-2'>
                <Label>Mã lĩnh vực</Label>
                <div className='flex h-9 items-center rounded-md border bg-muted/30 px-3 text-sm'>
                  {editingCategory.code}
                </div>
              </div>
            ) : (
              <div className='space-y-2'>
                <Label>Mã lĩnh vực</Label>
                <Input
                  value={form.code}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, code: event.target.value }))
                  }
                  placeholder='vd: qldl'
                />
              </div>
            )}
            <div className='space-y-2'>
              <Label>Thứ tự hiển thị</Label>
              <Input
                inputMode='numeric'
                value={form.sortOrder}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    sortOrder: event.target.value,
                  }))
                }
                placeholder='0'
              />
            </div>
            <div className='space-y-2 sm:col-span-2'>
              <Label>Tên lĩnh vực</Label>
              <Input
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder='vd: Quản lý dữ liệu'
              />
            </div>
            <div className='space-y-2 sm:col-span-2'>
              <Label>Mô tả</Label>
              <Textarea
                value={form.description}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                placeholder='Mô tả ngắn...'
              />
            </div>
            <div className='flex items-center justify-between gap-2 rounded-md border p-3 sm:col-span-2'>
              <div className='space-y-0.5'>
                <div className='text-sm font-medium'>Trạng thái</div>
                <div className='text-xs text-muted-foreground'>
                  {form.isActive ? 'Hoạt động' : 'Ngừng sử dụng'}
                </div>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({ ...prev, isActive: checked }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={closeForm}>
              Hủy
            </Button>
            <PermissionGuard
              permission={
                editingCategory
                  ? 'field-categories.update'
                  : 'field-categories.create'
              }
            >
              <Button
                onClick={() => {
                  const name = form.name.trim()
                  if (editingCategory) {
                    if (!name) {
                      toast.error('Tên lĩnh vực là bắt buộc.')
                      return
                    }
                    updateMutation.mutate()
                  } else {
                    const code = form.code.trim().toLowerCase()
                    if (!code || !name) {
                      toast.error('Mã lĩnh vực và tên lĩnh vực là bắt buộc.')
                      return
                    }
                    setForm((prev) => ({ ...prev, code }))
                    createMutation.mutate()
                  }
                }}
                disabled={
                  createMutation.isPending || updateMutation.isPending
                }
              >
                Lưu
              </Button>
            </PermissionGuard>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deletingCategory)}
        onOpenChange={(open) => {
          if (!open) setDeletingCategory(null)
        }}
        title='Xóa lĩnh vực biểu mẫu'
        desc='Bạn chắc chắn muốn xóa lĩnh vực này?'
        confirmText='Xóa'
        cancelBtnText='Hủy'
        destructive
        isLoading={deleteMutation.isPending}
        disabled={deleteMutation.isPending}
        handleConfirm={() => {
          if (!deletingCategory) return
          deleteMutation.mutate(deletingCategory.id)
        }}
      />
    </>
  )
}
