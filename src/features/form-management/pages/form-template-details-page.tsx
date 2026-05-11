import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  Archive,
  ArrowLeft,
  Copy,
  Eye,
  FilePlus2,
  PencilLine,
  RefreshCcw,
  Settings2,
  Table2,
  Trash2,
  Workflow,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useFieldCategoriesCatalogQuery } from '../api/catalog-queries'
import { formManagementApi } from '../api/template-management-api'
import type { PeriodType, TemplateType } from '../api/types'
import { TemplateStatusBadge } from '../components/shared/template-status-badge'
import { TemplateAttributesTab } from '../components/tabs/template-attributes-tab'
import { TemplateCellConfigsTab } from '../components/tabs/template-cell-configs-tab'
import { TemplateIndicatorsTab } from '../components/tabs/template-indicators-tab'
import { TemplatePreviewTab } from '../components/tabs/template-preview-tab'
import { TemplateScopesTab } from '../components/tabs/template-scopes-tab'
import {
  type FormModalState,
  TemplateGeneralInfoDialog,
} from '../components/template-general-info-dialog'

type FormTemplateDetailsPageProps = {
  templateId: string
}

const emptyFormState: FormModalState = {
  code: '',
  name: '',
  fieldCategoryId: '',
  periodType: 'THANG',
  templateType: 'AGGREGATE',
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

export function FormTemplateDetailsPage({
  templateId,
}: FormTemplateDetailsPageProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const categoriesQuery = useFieldCategoriesCatalogQuery()
  const [openUpdateModal, setOpenUpdateModal] = useState(false)
  const [formState, setFormState] = useState<FormModalState>(emptyFormState)

  const templateQuery = useQuery({
    queryKey: ['form-management', 'template', templateId],
    queryFn: () => formManagementApi.getTemplate(templateId),
  })

  const template = templateQuery.data

  const refreshTemplate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['form-management'] })
  }

  const patchMutation = useMutation({
    mutationFn: (payload: {
      name: string
      fieldCategoryId: string
      periodType: PeriodType
      templateType: TemplateType
      description: string
      isActive: boolean
    }) => formManagementApi.updateTemplate(templateId, payload),
    onSuccess: async () => {
      toast.success('Đã cập nhật thông tin chung biểu mẫu.')
      await refreshTemplate()
      setOpenUpdateModal(false)
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const totalInputIndicators = (template?.indicators ?? []).filter(
    (i) => i.type === 'INPUT'
  ).length
  const assignedInputIndicatorsCount = new Set(
    (template?.templateScopes ?? [])
      .map((r) => r.indicatorId)
      .filter((id) => {
        const ind = (template?.indicators ?? []).find((i) => i.id === id)
        return ind && ind.type === 'INPUT'
      })
  ).size
  const isFullyAssigned =
    totalInputIndicators > 0
      ? assignedInputIndicatorsCount === totalInputIndicators
      : true

  const markReadyMutation = useMutation({
    mutationFn: () => formManagementApi.markReadyTemplate(templateId),
    onSuccess: async () => {
      toast.success('Đã chuyển biểu mẫu sang trạng thái sẵn sàng.')
      await refreshTemplate()
    },
    onError: (error: Error) => {
      if (error.message?.includes('ALL_INPUT_INDICATORS_MUST_BE_ASSIGNED')) {
        toast.error(
          'Vui lòng phân bổ 100% chỉ tiêu INPUT trước khi chuyển sẵn sàng.'
        )
      } else {
        toast.error(error.message)
      }
    },
  })

  const handleMarkReady = () => {
    if (!isFullyAssigned) {
      toast.error(
        'Vui lòng phân bổ 100% chỉ tiêu INPUT trước khi chuyển trạng thái Sẵn sàng.'
      )
      return
    }
    markReadyMutation.mutate()
  }

  const archiveMutation = useMutation({
    mutationFn: () => formManagementApi.archiveTemplate(templateId),
    onSuccess: async () => {
      toast.success('Đã lưu trữ biểu mẫu.')
      await refreshTemplate()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const deleteMutation = useMutation({
    mutationFn: () => formManagementApi.deleteTemplate(templateId),
    onSuccess: async () => {
      toast.success('Đã xóa biểu mẫu.')
      await refreshTemplate()
      await navigate({ to: '/form-management' })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const cloneMutation = useMutation({
    mutationFn: () =>
      formManagementApi.copyTemplate(templateId, {
        name: `${template?.name ?? 'Biểu mẫu'} - Bản sao`,
      }),
    onSuccess: async (copied) => {
      toast.success('Đã sao chép biểu mẫu.')
      await refreshTemplate()
      if (copied?.id) {
        await navigate({
          to: '/form-management/details/$templateId',
          params: { templateId: copied.id },
        })
      }
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
      templateType: template.templateType ?? 'AGGREGATE',
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
      templateType: formState.templateType,
      description: formState.description.trim(),
      isActive: formState.isActive,
    })
  }

  const canEdit = Boolean(
    template && ['DRAFT', 'READY'].includes(template.templateStatus ?? 'DRAFT')
  )

  return (
    <div className='flex w-full flex-col gap-6 p-6'>
      {templateQuery.isLoading ? (
        <div className='py-12 text-center text-sm text-muted-foreground'>
          Đang tải chi tiết biểu mẫu...
        </div>
      ) : templateQuery.isError || !template ? (
        <div className='rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive'>
          Không thể tải chi tiết biểu mẫu.
        </div>
      ) : (
        <>
          {/* Tầng 1: Header - Tiêu đề và nút điều hướng */}
          <div className='flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between'>
            <div className='min-w-0 space-y-2'>
              <h1 className='truncate text-3xl font-bold tracking-tight text-foreground'>
                {template.name}
              </h1>
              <p className='max-w-3xl text-sm text-muted-foreground'>
                Quản lý thông tin chung, cấu hình chỉ số, thuộc tính, phạm vi
                mẫu và xem trước cấu trúc biểu mẫu.
              </p>
            </div>
            <div className='flex flex-wrap gap-2'>
              <Button variant='outline' asChild>
                <Link to='/form-management'>
                  <ArrowLeft />
                  Quay lại
                </Link>
              </Button>
              <Button
                type='button'
                variant='outline'
                onClick={() => templateQuery.refetch()}
              >
                <RefreshCcw className='size-4' />
                Tải lại
              </Button>
            </div>
          </div>

          {/* Tầng 2: Info Bar - Thông tin chung và hành động */}
          <div className='rounded-2xl border bg-card shadow-sm p-4'>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5 xl:grid-cols-6 items-start w-full'>
              {/* Cột 1: Mã biểu mẫu & Trạng thái */}
              <div className='space-y-2'>
                <div>
                  <div className='text-[11px] font-bold tracking-widest text-muted-foreground uppercase'>
                    Mã biểu mẫu
                  </div>
                  <div className='mt-1 text-sm font-semibold truncate'>{template.code}</div>
                </div>
                <div>
                  <div className='text-[11px] font-bold tracking-widest text-muted-foreground uppercase'>
                    Trạng thái
                  </div>
                  <div className='mt-1'>
                    <TemplateStatusBadge
                      templateStatus={template.templateStatus}
                      isActive={template.isActive}
                    />
                  </div>
                </div>
              </div>

              {/* Cột 2: Tên biểu mẫu & Lĩnh vực */}
              <div className='space-y-2'>
                <div>
                  <div className='text-[11px] font-bold tracking-widest text-muted-foreground uppercase'>
                    Tên biểu mẫu
                  </div>
                  <div className='mt-1 text-sm font-semibold truncate'>{template.name}</div>
                </div>
                <div>
                  <div className='text-[11px] font-bold tracking-widest text-muted-foreground uppercase'>
                    Lĩnh vực
                  </div>
                  <div className='mt-1 text-sm font-semibold truncate'>
                    {template.fieldCategoryName ?? template.fieldCategoryId}
                  </div>
                </div>
              </div>

              {/* Cột 3: Kỳ báo cáo & Cập nhật lần cuối */}
              <div className='space-y-2'>
                <div>
                  <div className='text-[11px] font-bold tracking-widest text-muted-foreground uppercase'>
                    Kỳ báo cáo
                  </div>
                  <div className='mt-1 text-sm font-semibold'>{periodLabel(template.periodType)}</div>
                </div>
                <div>
                  <div className='text-[11px] font-bold tracking-widest text-muted-foreground uppercase'>
                    Cập nhật lần cuối
                  </div>
                  <div className='mt-1 text-sm font-semibold'>
                    {template.updatedAt
                      ? new Date(template.updatedAt).toLocaleString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '--'}
                  </div>
                </div>
              </div>

              {/* Cột 4: Loại biểu mẫu & Mô tả */}
              <div className='space-y-2'>
                <div>
                  <div className='text-[11px] font-bold tracking-widest text-muted-foreground uppercase'>
                    Loại biểu mẫu
                  </div>
                  <div className='mt-1 text-sm font-semibold'>
                    {template.templateType
                      ? (template.templateType === 'AGGREGATE' ? 'Tổng hợp' : 'Đơn nhất')
                      : '--'}
                  </div>
                </div>
                <div>
                  <div className='text-[11px] font-bold tracking-widest text-muted-foreground uppercase'>
                    Mô tả
                  </div>
                  <div className='mt-1 text-sm font-semibold truncate max-w-[200px]'>
                    {template.description || 'Không có mô tả'}
                  </div>
                </div>
              </div>

              {/* Cột 5: Nhóm nút hành động */}
              <div className='space-y-2 lg:col-span-2 xl:col-span-2'>
                <div className='text-[11px] font-bold tracking-widest text-muted-foreground uppercase'>
                  Hành động
                </div>
                <div className='flex flex-wrap gap-1 mt-1'>
                  <Button variant='outline' size='sm' onClick={openModal}>
                    <PencilLine className='size-3' />
                    <span className='hidden sm:inline ml-1'>Chỉnh sửa</span>
                  </Button>

                  {['READY', 'IN_USE'].includes(template.templateStatus ?? 'DRAFT') && (
                    <Button variant='outline' size='sm' onClick={() => archiveMutation.mutate()}>
                      <Archive className='size-3' />
                      <span className='hidden sm:inline ml-1'>Lưu trữ</span>
                    </Button>
                  )}

                  {template.templateStatus === 'DRAFT' && canEdit && (
                    <Button size='sm' onClick={handleMarkReady}>
                      <FilePlus2 className='size-3' />
                      <span className='hidden sm:inline ml-1'>Sẵn sàng</span>
                    </Button>
                  )}

                  {['IN_USE', 'ARCHIVED'].includes(template.templateStatus ?? 'DRAFT') && (
                    <Button variant='outline' size='sm' onClick={() => cloneMutation.mutate()}>
                      <Copy className='size-3' />
                      <span className='hidden sm:inline ml-1'>Sao chép</span>
                    </Button>
                  )}

                  {template.templateStatus === 'DRAFT' && (
                    <Button variant='destructive' size='sm' onClick={() => deleteMutation.mutate()}>
                      <Trash2 className='size-3' />
                      <span className='hidden sm:inline ml-1'>Xóa</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tầng 3: Main Content - Tabs nội dung chính */}
          <div className='rounded-3xl border bg-card p-2'>
            <Tabs defaultValue='indicators'>
              <TabsList className='grid h-auto w-full grid-cols-2 gap-1 rounded-2xl bg-muted p-1 lg:grid-cols-5'>
                <TabsTrigger
                  className='h-11 justify-center gap-2 rounded-xl'
                  value='indicators'
                >
                  <Workflow className='size-4' />
                  Chỉ tiêu
                </TabsTrigger>
                <TabsTrigger
                  className='h-11 justify-center gap-2 rounded-xl'
                  value='attributes'
                >
                  <Table2 className='size-4' />
                  Thuộc tính
                </TabsTrigger>
                <TabsTrigger
                  className='h-11 justify-center gap-2 rounded-xl'
                  value='cell-configs'
                >
                  <Settings2 className='size-4' />
                  Cấu hình ô
                </TabsTrigger>
                <TabsTrigger
                  className='h-11 justify-center gap-2 rounded-xl'
                  value='scopes'
                >
                  <Eye className='size-4' />
                  Phân bổ chỉ tiêu
                </TabsTrigger>
                <TabsTrigger
                  className='h-11 justify-center gap-2 rounded-xl'
                  value='preview'
                >
                  <Eye className='size-4' />
                  Xem trước
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value='indicators'
                className='mt-2 flex-1 overflow-auto'
              >
                <div className='px-4 pt-4 pb-6 lg:px-6'>
                  <TemplateIndicatorsTab templateId={templateId} />
                </div>
              </TabsContent>

              <TabsContent
                value='attributes'
                className='mt-2 flex-1 overflow-auto'
              >
                <div className='px-4 pt-4 pb-6 lg:px-6'>
                  <TemplateAttributesTab templateId={templateId} />
                </div>
              </TabsContent>

              <TabsContent
                value='cell-configs'
                className='mt-2 flex-1 overflow-auto'
              >
                <div className='px-4 pt-4 pb-6 lg:px-6'>
                  <TemplateCellConfigsTab
                    templateId={templateId}
                    lockTemplateSelection
                  />
                </div>
              </TabsContent>

              <TabsContent
                value='scopes'
                className='mt-2 flex-1 overflow-auto'
              >
                <div className='px-4 pt-4 pb-6 lg:px-6'>
                  <TemplateScopesTab templateId={templateId} />
                </div>
              </TabsContent>

              <TabsContent
                value='preview'
                className='mt-2 flex-1 overflow-auto'
              >
                <div className='px-4 pt-4 pb-6 lg:px-6'>
                  <TemplatePreviewTab
                    templateId={templateId}
                    lockTemplateSelection
                  />
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
