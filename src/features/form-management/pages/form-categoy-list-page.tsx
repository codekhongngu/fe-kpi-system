import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PlusCircle, Trash2, UserPen } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { formManagementApi } from '../api/mock-form-management-api'
import { type FieldCategory } from '../api/types'

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

export function FormCategoryListPage() {
  const queryClient = useQueryClient()

  const categoriesQuery = useQuery({
    queryKey: ['form-management', 'field-categories'],
    queryFn: () => formManagementApi.listFieldCategories(),
  })

  const categories = categoriesQuery.data ?? EMPTY_CATEGORIES

  const [search, setSearch] = useState('')
  const [openForm, setOpenForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<FieldCategory | null>(null)
  const [form, setForm] = useState<FieldCategoryFormState>(defaultForm)
  const [deletingCategory, setDeletingCategory] = useState<FieldCategory | null>(null)

  const filteredCategories = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return categories
    return categories.filter((item) => {
      const parts = [item.code, item.name, item.description ?? '']
      return parts.some((value) => value.toLowerCase().includes(keyword))
    })
  }, [categories, search])

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
        description: form.description.trim().length > 0 ? form.description.trim() : null,
        sortOrder: Number.isFinite(Number(form.sortOrder)) ? Number(form.sortOrder) : 0,
        isActive: form.isActive,
      }),
    onSuccess: () => {
      toast.success('Đã tạo lĩnh vực biểu mẫu.')
      queryClient.invalidateQueries({ queryKey: ['form-management', 'field-categories'] })
      closeForm()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editingCategory) {
        throw new Error('Không tìm thấy lĩnh vực.')
      }
      return formManagementApi.updateFieldCategory(editingCategory.id, {
        code: form.code.trim(),
        name: form.name.trim(),
        description: form.description.trim().length > 0 ? form.description.trim() : null,
        sortOrder: Number.isFinite(Number(form.sortOrder)) ? Number(form.sortOrder) : 0,
        isActive: form.isActive,
      })
    },
    onSuccess: () => {
      toast.success('Đã cập nhật lĩnh vực biểu mẫu.')
      queryClient.invalidateQueries({ queryKey: ['form-management', 'field-categories'] })
      closeForm()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => formManagementApi.deleteFieldCategory(id),
    onSuccess: () => {
      toast.success('Đã xóa lĩnh vực biểu mẫu.')
      queryClient.invalidateQueries({ queryKey: ['form-management', 'field-categories'] })
      setDeletingCategory(null)
    },
    onError: (error: Error) => toast.error(error.message),
  })

  return (
    <Card>
      <CardHeader className='gap-4 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <CardTitle>Lĩnh vực biểu mẫu</CardTitle>
          <CardDescription>Quản lý danh mục lĩnh vực biểu mẫu để phân nhóm biểu mẫu.</CardDescription>
        </div>

        <div className='flex w-full flex-col gap-2 sm:w-auto sm:flex-row'>
          <Input
            className='sm:w-80'
            placeholder='Tìm theo mã, tên hoặc mô tả...'
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Button onClick={openCreateDialog}>
            <PlusCircle />
            Thêm lĩnh vực
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className='overflow-hidden rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã</TableHead>
                <TableHead>Tên lĩnh vực</TableHead>
                <TableHead className='w-[120px]'>Thứ tự</TableHead>
                <TableHead className='w-[140px]'>Trạng thái</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead className='w-[120px] text-right'>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoriesQuery.isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className='h-20 text-center text-sm text-muted-foreground'>
                    Đang tải danh sách lĩnh vực...
                  </TableCell>
                </TableRow>
              )}
              {categoriesQuery.isError && (
                <TableRow>
                  <TableCell colSpan={6} className='h-20 text-center text-sm text-destructive'>
                    Không tải được danh sách lĩnh vực.
                  </TableCell>
                </TableRow>
              )}
              {!categoriesQuery.isLoading && !categoriesQuery.isError && filteredCategories.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className='h-20 text-center'>
                    Chưa có lĩnh vực biểu mẫu.
                  </TableCell>
                </TableRow>
              )}
              {filteredCategories.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className='font-medium'>{item.code}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.sortOrder}</TableCell>
                  <TableCell>
                    <Badge variant={item.isActive ? 'default' : 'secondary'}>
                      {item.isActive ? 'Hoạt động' : 'Ngừng'}
                    </Badge>
                  </TableCell>
                  <TableCell className='max-w-[420px] truncate'>{item.description ?? '-'}</TableCell>
                  <TableCell className='text-right'>
                    <div className='flex justify-end gap-1'>
                      <Button
                        size='icon'
                        variant='outline'
                        onClick={() => openEditDialog(item)}
                        title='Sửa lĩnh vực'
                      >
                        <UserPen />
                      </Button>
                      <Button
                        size='icon'
                        variant='destructive'
                        onClick={() => setDeletingCategory(item)}
                        title='Xóa lĩnh vực'
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog
        open={openForm}
        onOpenChange={(open) => {
          setOpenForm(open)
          if (!open) closeForm()
        }}
      >
        <DialogContent className='sm:max-w-xl'>
          <DialogHeader className='text-start'>
            <DialogTitle>{editingCategory ? 'Cập nhật lĩnh vực' : 'Thêm lĩnh vực'}</DialogTitle>
            <DialogDescription>Quản lý danh mục lĩnh vực biểu mẫu.</DialogDescription>
          </DialogHeader>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label>Mã lĩnh vực</Label>
              <Input
                value={form.code}
                onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
                placeholder='vd: qldl'
              />
            </div>
            <div className='space-y-2'>
              <Label>Thứ tự hiển thị</Label>
              <Input
                inputMode='numeric'
                value={form.sortOrder}
                onChange={(event) => setForm((prev) => ({ ...prev, sortOrder: event.target.value }))}
                placeholder='0'
              />
            </div>
            <div className='space-y-2 sm:col-span-2'>
              <Label>Tên lĩnh vực</Label>
              <Input
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder='vd: Quản lý dữ liệu'
              />
            </div>
            <div className='space-y-2 sm:col-span-2'>
              <Label>Mô tả</Label>
              <Textarea
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
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
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isActive: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={closeForm}>
              Hủy
            </Button>
            <Button
              onClick={() => {
                const code = form.code.trim().toLowerCase()
                const name = form.name.trim()
                if (!code || !name) {
                  toast.error('Mã lĩnh vực và tên lĩnh vực là bắt buộc.')
                  return
                }
                setForm((prev) => ({ ...prev, code }))
                if (editingCategory) {
                  updateMutation.mutate()
                } else {
                  createMutation.mutate()
                }
              }}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              Lưu
            </Button>
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
    </Card>
  )
}
