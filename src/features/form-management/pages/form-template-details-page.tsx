import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, Eye, Info, PencilLine, Settings2, Workflow } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useFieldCategoriesCatalogQuery } from '../api/catalog-queries'
import { formManagementApi } from '../api/mock-form-management-api'
import type { PeriodType } from '../api/types'
import {
  type FormModalState,
  TemplateGeneralInfoDialog,
} from '../components/template-general-info-dialog'
import { TemplatePreviewTab } from '../components/template-preview-tab'
import { TemplateStructureTab } from '../components/template-structure-tab'

type FormTemplateDetailsPageProps = {
  templateId: string
}

const emptyFormState: FormModalState = {
  code: '',
  name: '',
  fieldCategoryId: '',
  periodType: 'THANG',
  description: '',
  isActive: true,
}

function periodLabel(periodType?: PeriodType | null) {
  switch (periodType) {
    case 'TUAN':
      return 'Tuần'
    case 'THANG':
      return 'Tháng'
    case 'QUY':
      return 'Quý'
    case 'NAM':
      return 'Năm'
    default:
      return '--'
  }
}

export function FormTemplateDetailsPage({ templateId }: FormTemplateDetailsPageProps) {
  const queryClient = useQueryClient()
  const categoriesQuery = useFieldCategoriesCatalogQuery()
  const [openUpdateModal, setOpenUpdateModal] = useState(false)
  const [formState, setFormState] = useState<FormModalState>(emptyFormState)

  const templateQuery = useQuery({
    queryKey: ['form-management', 'template', templateId],
    queryFn: () => formManagementApi.getTemplate(templateId),
  })

  const template = templateQuery.data

  const patchMutation = useMutation({
    mutationFn: (payload: { name: string; fieldCategoryId: string; periodType: PeriodType; description: string; isActive: boolean }) =>
      formManagementApi.updateTemplate(templateId, payload),
    onSuccess: async () => {
      toast.success('Đã cập nhật thông tin chung biểu mẫu.')
      await queryClient.invalidateQueries({ queryKey: ['form-management'] })
      setOpenUpdateModal(false)
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const openModal = () => {
    if (!template) return
    setFormState({
      code: template.code,
      name: template.name,
      fieldCategoryId: template.fieldCategoryId,
      periodType: template.periodType ?? 'THANG',
      description: template.description,
      isActive: template.isActive,
    })
    setOpenUpdateModal(true)
  }

  const submitPatchForm = () => {
    if (!formState.name.trim() || !formState.fieldCategoryId) {
      toast.error('Tên biểu mẫu và Lĩnh vực biểu mẫu là bắt buộc.')
      return
    }
    patchMutation.mutate({
      name: formState.name.trim(),
      fieldCategoryId: formState.fieldCategoryId,
      periodType: formState.periodType,
      description: formState.description.trim(),
      isActive: formState.isActive,
    })
  }

  return (
    <div className='flex w-full flex-col gap-6 p-6'>
      {templateQuery.isLoading ? (
        <div className='py-12 text-center text-sm text-muted-foreground'>Đang tải chi tiết biểu mẫu...</div>
      ) : templateQuery.isError || !template ? (
        <div className='rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive'>
          Không thể tải chi tiết biểu mẫu.
        </div>
      ) : (
        <>
          <div className='flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between'>
            <div className='min-w-0 space-y-2'>
              <h1 className='truncate text-3xl font-bold tracking-tight text-foreground'>{template.name}</h1>
              <p className='max-w-3xl text-sm text-muted-foreground'>
                Theo dõi thông tin chung, cấu hình chỉ tiêu và xem trước cấu trúc biểu mẫu.
              </p>
            </div>
            <div className='flex flex-wrap gap-2'>
              <Button variant='outline' asChild>
                <Link to='/form-management'>
                  <ArrowLeft />
                  Quay lại
                </Link>
              </Button>
              <Button type='button' onClick={() => templateQuery.refetch()}>
                Tải lại
              </Button>
            </div>
          </div>

          <div className='rounded-3xl border bg-card p-2'>
            <Tabs defaultValue='general'>
              <TabsList className='grid h-auto w-full grid-cols-2 gap-1 rounded-2xl bg-muted p-1 lg:grid-cols-4'>
                <TabsTrigger className='h-11 justify-center gap-2 rounded-xl' value='general'>
                  <Info className='size-4' />
                  Thông tin chung
                </TabsTrigger>
                <TabsTrigger className='h-11 justify-center gap-2 rounded-xl' value='structure'>
                  <Settings2 className='size-4' />
                  Cấu hình biểu mẫu
                </TabsTrigger>
                <TabsTrigger className='h-11 justify-center gap-2 rounded-xl' value='permissions'>
                                  <Workflow className='size-4' />
                                  Phân quyền chỉ tiêu
                                </TabsTrigger>
                <TabsTrigger className='h-11 justify-center gap-2 rounded-xl' value='preview'>
                  <Eye className='size-4' />
                  Xem trước
                </TabsTrigger>
              </TabsList>

              <TabsContent value='general' className='mt-2 flex-1 overflow-auto'>
                <div className='space-y-6 px-4 pb-6 pt-4 lg:px-6'>
                  <div className='flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between'>
                    <div>
                      <div className='text-2xl font-bold tracking-tight text-primary'>Thông tin biểu mẫu</div>
                      <div className='mt-1 text-sm font-medium text-muted-foreground'>
                        Quản lý thông tin chung của biểu mẫu.
                      </div>
                    </div>
                    <div className='flex flex-wrap gap-2'>
                      <Button type='button' className='h-10 gap-2 font-semibold' onClick={openModal}>
                        <PencilLine className='size-4' />
                        Cập nhật
                      </Button>
                    </div>
                  </div>

                  <section className='grid gap-4 lg:grid-cols-3'>
                    <div className='lg:col-span-2'>
                      <Card className='relative overflow-hidden rounded-3xl border bg-card p-6'>
                        <div className='absolute -right-20 -top-20 size-64 rounded-full bg-primary/5' />
                        <div className='relative space-y-6'>
                          <div className='flex items-center gap-3'>
                            <div className='h-6 w-1.5 rounded-full bg-primary' />
                            <div className='text-xl font-semibold text-primary'>Thông tin chung</div>
                          </div>

                          <div className='grid grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2'>
                            <div>
                              <div className='text-[11px] font-bold uppercase tracking-widest text-muted-foreground'>Mã biểu mẫu</div>
                              <div className='mt-1 text-lg font-semibold leading-snug text-foreground'>{template.code}</div>
                            </div>
                            <div>
                              <div className='text-[11px] font-bold uppercase tracking-widest text-muted-foreground'>Tên biểu mẫu</div>
                              <div className='mt-1 text-lg font-semibold leading-snug text-foreground'>{template.name}</div>
                            </div>
                            <div>
                              <div className='text-[11px] font-bold uppercase tracking-widest text-muted-foreground'>Lĩnh vực biểu mẫu</div>
                              <div className='mt-1 text-sm font-semibold text-foreground'>{template.fieldCategoryName ?? template.fieldCategoryId}</div>
                            </div>
                            <div>
                              <div className='text-[11px] font-bold uppercase tracking-widest text-muted-foreground'>Kỳ báo cáo</div>
                              <div className='mt-1 text-sm font-semibold text-foreground'>{periodLabel(template.periodType)}</div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>

                    <Card className='relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground'>
                      <div className='relative space-y-4'>
                        <div className='text-sm font-medium text-primary-foreground/80'>Trạng thái biểu mẫu</div>
                        <div>
                          <Badge variant={template.isActive ? 'default' : 'secondary'}>
                            {template.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  </section>

                  <div className='rounded-xl border p-4 text-sm'>
                    <span className='text-muted-foreground'>Mô tả: </span>
                    {template.description || '-'}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value='structure' className='mt-2 flex-1 overflow-auto'>
                <div className='px-4 pb-6 pt-4 lg:px-6'>
                  <TemplateStructureTab initialTemplateId={templateId} lockTemplateSelection />
                </div>
              </TabsContent>

              <TabsContent value='preview' className='mt-2 flex-1 overflow-auto'>
                <div className='px-4 pb-6 pt-4 lg:px-6'>
                  <TemplatePreviewTab initialTemplateId={templateId} lockTemplateSelection />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </>
      )}

      <TemplateGeneralInfoDialog
        open={openUpdateModal}
        editing
        formState={formState}
        categories={categoriesQuery.data ?? []}
        onOpenChange={setOpenUpdateModal}
        onFormStateChange={setFormState}
        onSubmit={submitPatchForm}
        submitting={patchMutation.isPending}
        includeCodeField={false}
        title='Cập nhật thông tin biểu mẫu'
      />
    </div>
  )
}
