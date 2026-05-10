import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Eye, RefreshCcw, Settings2, Table2, Workflow } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useFieldCategoriesCatalogQuery } from '../api/catalog-queries'
import { formManagementApi } from '../api/template-management-api'
import type { PeriodType, TemplateType } from '../api/types'
import {
  type FormModalState,
  TemplateGeneralInfoDialog,
} from '../components/template-general-info-dialog'
import { TemplateActionBar } from '../components/shared/template-action-bar'
import { TemplateMetadataCard } from '../components/shared/template-metadata-card'
import { TemplateAttributesTab } from '../components/tabs/template-attributes-tab'
import { TemplateCellConfigsTab } from '../components/tabs/template-cell-configs-tab'
import { TemplateIndicatorsTab } from '../components/tabs/template-indicators-tab'
import { TemplatePreviewTab } from '../components/tabs/template-preview-tab'
import { TemplateScopesTab } from '../components/tabs/template-scopes-tab'

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

export function FormTemplateDetailsPage({ templateId }: FormTemplateDetailsPageProps) {
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
      toast.success('�� cập nhật thông tin chung biểu mẫu.')
      await refreshTemplate()
      setOpenUpdateModal(false)
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const totalInputIndicators = (template?.indicators ?? []).filter(i => i.type === 'INPUT').length
  const assignedInputIndicatorsCount = new Set(
    (template?.templateScopes ?? []).map(r => r.indicatorId).filter(id => {
      const ind = (template?.indicators ?? []).find(i => i.id === id)
      return ind && ind.type === 'INPUT'
    })
  ).size
  const isFullyAssigned = totalInputIndicators > 0 ? assignedInputIndicatorsCount === totalInputIndicators : true

  const markReadyMutation = useMutation({
    mutationFn: () => formManagementApi.markReadyTemplate(templateId),
    onSuccess: async () => {
      toast.success('Đã chuyển biểu mẫu sang trạng thái sẵn sàng.')
      await refreshTemplate()
    },
    onError: (error: Error) => {
      if (error.message?.includes('ALL_INPUT_INDICATORS_MUST_BE_ASSIGNED')) {
        toast.error('Vui lòng phân bổ 100% chỉ tiêu INPUT trước khi chuyển sẵn sàng.')
      } else {
        toast.error(error.message)
      }
    },
  })

  const handleMarkReady = () => {
    if (!isFullyAssigned) {
      toast.error('Vui lòng phân bổ 100% chỉ tiêu INPUT trước khi chuyển trạng thái Sẵn sàng.')
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
    mutationFn: () => formManagementApi.copyTemplate(templateId, { name: `${template?.name ?? 'Biểu mẫu'} - Bản sao` }),
    onSuccess: async (copied) => {
      toast.success('Đã sao chép biểu mẫu.')
      await refreshTemplate()
      if (copied?.id) {
        await navigate({ to: '/form-management/details/$templateId', params: { templateId: copied.id } })
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

  const canEdit = Boolean(template && ['DRAFT', 'READY'].includes(template.templateStatus ?? 'DRAFT'))

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
                Quản lý thông tin chung, cấu hình chỉ số, thuộc tính, phạm vi mẫu và xem trước cấu trúc biểu mẫu.
              </p>
            </div>
            <div className='flex flex-wrap gap-2'>
              <Button variant='outline' asChild>
                <Link to='/form-management'>
                  <ArrowLeft />
                  Quay lại
                </Link>
              </Button>
              <Button type='button' variant='outline' onClick={() => templateQuery.refetch()}>
                <RefreshCcw className='size-4' />
                Tải lại
              </Button>
            </div>
          </div>

          <div className='grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]'>
            <div className='space-y-4'>
              <TemplateMetadataCard template={template} />
              <TemplateActionBar
                template={template}
                onEditMetadata={openModal}
                onMarkReady={canEdit ? handleMarkReady : undefined}
                onArchive={['READY', 'IN_USE'].includes(template.templateStatus ?? 'DRAFT') ? () => archiveMutation.mutate() : undefined}
                onClone={['IN_USE', 'ARCHIVED'].includes(template.templateStatus ?? 'DRAFT') ? () => cloneMutation.mutate() : undefined}
                onDelete={template.templateStatus === 'DRAFT' ? () => deleteMutation.mutate() : undefined}
                disabled={markReadyMutation.isPending || archiveMutation.isPending || deleteMutation.isPending || cloneMutation.isPending}
              />
              <div className='rounded-3xl border bg-card p-4 text-sm text-muted-foreground'>
                <div className='font-medium text-foreground'>Mô tả</div>
                <div className='mt-2 whitespace-pre-wrap'>{template.description || 'Không có mô tả'}</div>
                <div className='mt-4 text-xs'>Kỳ báo cáo hiện tại: {periodLabel(template.periodType)}</div>
              </div>
            </div>

            <div className='rounded-3xl border bg-card p-2'>
              <Tabs defaultValue='indicators'>
                <TabsList className='grid h-auto w-full grid-cols-2 gap-1 rounded-2xl bg-muted p-1 lg:grid-cols-5'>
                  <TabsTrigger className='h-11 justify-center gap-2 rounded-xl' value='indicators'>
                    <Workflow className='size-4' />
                    Chỉ tiêu
                  </TabsTrigger>
                  <TabsTrigger className='h-11 justify-center gap-2 rounded-xl' value='attributes'>
                    <Table2 className='size-4' />
                    Thuộc tính
                  </TabsTrigger>
                  <TabsTrigger className='h-11 justify-center gap-2 rounded-xl' value='cell-configs'>
                    <Settings2 className='size-4' />
                    Cấu hình ô
                  </TabsTrigger>
                  <TabsTrigger className='h-11 justify-center gap-2 rounded-xl' value='scopes'>
                    <Eye className='size-4' />
                    Phân bổ chỉ tiêu
                  </TabsTrigger>
                  <TabsTrigger className='h-11 justify-center gap-2 rounded-xl' value='preview'>
                    <Eye className='size-4' />
                    Xem trước
                  </TabsTrigger>
                </TabsList>

                <TabsContent value='indicators' className='mt-2 flex-1 overflow-auto'>
                  <div className='px-4 pb-6 pt-4 lg:px-6'>
                    <TemplateIndicatorsTab templateId={templateId} />
                  </div>
                </TabsContent>

                <TabsContent value='attributes' className='mt-2 flex-1 overflow-auto'>
                  <div className='px-4 pb-6 pt-4 lg:px-6'>
                    <TemplateAttributesTab templateId={templateId} />
                  </div>
                </TabsContent>

                <TabsContent value='cell-configs' className='mt-2 flex-1 overflow-auto'>
                  <div className='px-4 pb-6 pt-4 lg:px-6'>
                    <TemplateCellConfigsTab templateId={templateId} lockTemplateSelection />
                  </div>
                </TabsContent>

                <TabsContent value='scopes' className='mt-2 flex-1 overflow-auto'>
                  <div className='px-4 pb-6 pt-4 lg:px-6'>
                    <TemplateScopesTab templateId={templateId} />
                  </div>
                </TabsContent>

                <TabsContent value='preview' className='mt-2 flex-1 overflow-auto'>
                  <div className='px-4 pb-6 pt-4 lg:px-6'>
                    <TemplatePreviewTab templateId={templateId} lockTemplateSelection />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
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
