import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, PencilLine } from 'lucide-react'
import { toast } from 'sonner'
import { PageBreadcrumb } from '@/components/page-breadcrumb'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import type { PeriodType } from '../api/types'
import { TemplateStructureTab } from '../components/template-structure-tab'

type FormTemplateDetailsPageProps = {
  templateId: string
}

export function FormTemplateDetailsPage({ templateId }: FormTemplateDetailsPageProps) {
  const queryClient = useQueryClient()
  const categoriesQuery = useFieldCategoriesCatalogQuery()
  const [openUpdateModal, setOpenUpdateModal] = useState(false)

  const templateQuery = useQuery({
    queryKey: ['form-management', 'template', templateId],
    queryFn: () => formManagementApi.getTemplate(templateId),
  })

  const template = templateQuery.data

  const [name, setName] = useState('')
  const [fieldCategoryId, setFieldCategoryId] = useState('')
  const [periodType, setPeriodType] = useState<PeriodType>('THANG')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)

  const patchMutation = useMutation({
    mutationFn: (payload: { name: string; fieldCategoryId: string; periodType: PeriodType; description: string; isActive: boolean }) =>
      formManagementApi.updateTemplate(templateId, payload),
    onSuccess: () => {
      toast.success('Đã cập nhật thông tin chung biểu mẫu.')
      queryClient.invalidateQueries({ queryKey: ['form-management'] })
      setOpenUpdateModal(false)
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const openModal = () => {
    if (!template) return
    setName(template.name)
    setFieldCategoryId(template.fieldCategoryId)
    setPeriodType(template.periodType ?? 'THANG')
    setDescription(template.description)
    setIsActive(template.isActive)
    setOpenUpdateModal(true)
  }

  const submitPatchForm = () => {
    if (!name.trim() || !fieldCategoryId) {
      toast.error('Tên biểu mẫu và nhóm biểu mẫu là bắt buộc.')
      return
    }
    patchMutation.mutate({ name: name.trim(), fieldCategoryId, periodType, description: description.trim(), isActive })
  }

  return (
    <div className='flex w-full flex-col gap-4'>
      <PageBreadcrumb title='Cấu hình biểu mẫu' subtitle='Trang cấu hình riêng cho thuộc tính và chỉ tiêu. Thông tin chung được chỉnh sửa bằng modal.'>
        <Button variant='outline' asChild>
          <Link to='/form-management'>
            <ArrowLeft />
            Quay lại
          </Link>
        </Button>
      </PageBreadcrumb>

      <Card>
        <CardContent className='pt-6'>
          {templateQuery.isLoading && <p className='text-sm text-muted-foreground'>Đang tải thông tin biểu mẫu...</p>}
          {templateQuery.isError && <p className='text-sm text-destructive'>Không thể tải chi tiết biểu mẫu.</p>}

          {template && (
            <div className='space-y-4'>
              <div className='grid gap-3 rounded-md border p-3 text-sm sm:grid-cols-2 lg:grid-cols-5'>
                <div>
                  <span className='text-muted-foreground'>Mã: </span>
                  <span className='font-medium'>{template.code}</span>
                </div>
                <div>
                  <span className='text-muted-foreground'>Tên: </span>
                  {template.name}
                </div>
                <div>
                  <span className='text-muted-foreground'>Nhóm: </span>
                  {template.fieldCategoryName ?? template.fieldCategoryId}
                </div>
                <div>
                  <span className='text-muted-foreground'>Trạng thái: </span>
                  <Badge variant={template.isActive ? 'default' : 'secondary'}>
                    {template.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
                  </Badge>
                </div>
                <div className='text-right'>
                  <Button size='sm' variant='outline' onClick={openModal}>
                    <PencilLine />
                    Cập nhật
                  </Button>
                </div>
              </div>
              <div className='rounded-md border p-3 text-sm'>
                <span className='text-muted-foreground'>Mô tả: </span>
                {template.description || '-'}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <TemplateStructureTab initialTemplateId={templateId} lockTemplateSelection />

      <Dialog open={openUpdateModal} onOpenChange={setOpenUpdateModal}>
        <DialogContent className='sm:max-w-xl'>
          <DialogHeader className='text-start'>
            <DialogTitle>Cập nhật thông tin biểu mẫu</DialogTitle>
            <DialogDescription>Patch Form chỉ cập nhật: name, fieldCategoryId, description, isActive.</DialogDescription>
          </DialogHeader>
          <div className='grid gap-4'>
            <div className='space-y-2'>
              <Label>Tên biểu mẫu</Label>
              <Input value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className='space-y-2'>
              <Label>Nhóm biểu mẫu</Label>
              <Select value={fieldCategoryId} onValueChange={setFieldCategoryId}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Chọn nhóm biểu mẫu' />
                </SelectTrigger>
                <SelectContent>
                  {(categoriesQuery.data ?? []).map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name || category.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Trạng thái</Label>
              <Select value={isActive ? 'true' : 'false'} onValueChange={(value) => setIsActive(value === 'true')}>
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
              <Label>Kỳ báo cáo</Label>
              <Select value={periodType} onValueChange={(value: PeriodType) => setPeriodType(value)}>
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
              <Label>Mô tả</Label>
              <Textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setOpenUpdateModal(false)}>Hủy</Button>
            <Button onClick={submitPatchForm} disabled={patchMutation.isPending}>Lưu thay đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
