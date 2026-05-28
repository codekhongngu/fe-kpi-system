import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  Archive,
  ArrowLeft,
  ChevronDown,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useFieldCategoriesCatalogQuery } from '../api/catalog-queries'
import { formManagementApi } from '../api/template-management-api'
import type { PeriodType, TemplateType } from '../api/types'
import { usePermission } from '@/hooks/use-permission'
import { getApiErrorMessage } from '@/lib/get-api-error-message'
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
import { PageBreadcrumb } from '@/components/page-breadcrumb'
import {
  canMarkTemplateReady,
  isSwitchingToUniqueTemplateType,
  validateUniqueScopes,
} from '../utils/template-scope-rules'

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
  const canUpdate = usePermission('forms.update')
  const canPublish = usePermission('forms.publish')
  const canCreate = usePermission('forms.create')
  const canDelete = usePermission('forms.delete')
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

  const patchMutation: any = useMutation({
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
    onError: (error: Error) => toast.error(getApiErrorMessage(error)),
  })

  const markReadyMutation = useMutation({
    mutationFn: () => formManagementApi.markReadyTemplate(templateId),
    onSuccess: async () => {
      toast.success('Đã chuyển biểu mẫu sang trạng thái sẵn sàng.')
      await refreshTemplate()
    },
    onError: (error: Error) => toast.error(getApiErrorMessage(error)),
  })

  const handleMarkReady = () => {
    if (!template) return
    const readiness = canMarkTemplateReady(template)
    if (!readiness.ok) {
      toast.error(readiness.message ?? 'Không thể chuyển trạng thái Sẵn sàng.')
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
    onError: (error: Error) => toast.error(getApiErrorMessage(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: () => formManagementApi.deleteTemplate(templateId),
    onSuccess: async () => {
      toast.success('Đã xóa biểu mẫu.')
      await refreshTemplate()
      await navigate({ to: '/form-management' })
    },
    onError: (error: Error) => toast.error(getApiErrorMessage(error)),
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
    onError: (error: Error) => toast.error(getApiErrorMessage(error)),
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

    if (
      template &&
      isSwitchingToUniqueTemplateType(
        formState.templateType,
        template.templateType
      )
    ) {
      const uniqueCheck = validateUniqueScopes(
        'UNIQUE',
        template.templateScopes ?? [],
        template.indicators ?? []
      )
      if (!uniqueCheck.ok) {
        toast.error(
          `${uniqueCheck.message} Vui lòng chỉnh tab Phân bổ chỉ tiêu (gỡ chỉ tiêu trùng đơn vị) trước khi đổi sang Đơn nhất.`
        )
        return
      }
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
    <div className='flex w-full flex-col gap-4'>
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
          {/* Tầng 1: Header - Tên và mã biểu mẫu */}
          <PageBreadcrumb
            title={template.name}
            subtitle={`Mã biểu mẫu: ${template.code}`}
          >
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
          </PageBreadcrumb>

          {/* Tầng 2: Info Bar - Thông tin và hành động */}
          <div className='rounded-2xl border bg-card shadow-sm p-4 space-y-3'>
            {/* Hàng 1: 4 field thông tin + hành động */}
            <div className='grid grid-cols-2 md:grid-cols-5 gap-4 items-start'>
              {/* Trạng thái */}
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

              {/* Lĩnh vực */}
              <div>
                <div className='text-[11px] font-bold tracking-widest text-muted-foreground uppercase'>
                  Lĩnh vực
                </div>
                <div className='mt-1 text-sm font-semibold'>
                  {template.fieldCategoryName ?? template.fieldCategoryId}
                </div>
              </div>

              {/* Kỳ báo cáo */}
              <div>
                <div className='text-[11px] font-bold tracking-widest text-muted-foreground uppercase'>
                  Kỳ báo cáo
                </div>
                <div className='mt-1 text-sm font-semibold'>
                  {periodLabel(template.periodType)}
                </div>
              </div>

              {/* Loại biểu mẫu */}
              <div>
                <div className='text-[11px] font-bold tracking-widest text-muted-foreground uppercase'>
                  Loại biểu mẫu
                </div>
                <div className='mt-1 text-sm font-semibold'>
                  {template.templateType === 'AGGREGATE' ? 'Tổng hợp' : 'Đơn nhất'}
                </div>
              </div>

              {/* Hành động */}
              <div>
                <div className='text-[11px] font-bold tracking-widest text-muted-foreground uppercase'>
                  Hành động
                </div>
                <div className='mt-1'>
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button variant='outline' size='sm'>
                        Thao tác
                        <ChevronDown className='ml-1 size-3' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='start' className='w-52'>
                      {canUpdate && (
                        <DropdownMenuItem className='cursor-pointer' onClick={openModal}>
                          <span className='flex items-center gap-2'>
                            <PencilLine className='size-4 shrink-0 text-blue-500' />
                            Chỉnh sửa thông tin
                          </span>
                        </DropdownMenuItem>
                      )}
                      {canPublish && template.templateStatus === 'DRAFT' && canEdit && (
                        <DropdownMenuItem className='cursor-pointer' onClick={handleMarkReady}>
                          <span className='flex items-center gap-2'>
                            <FilePlus2 className='size-4 shrink-0 text-emerald-500' />
                            Chuyển sẵn sàng
                          </span>
                        </DropdownMenuItem>
                      )}
                      {canPublish && ['READY', 'IN_USE'].includes(template.templateStatus ?? 'DRAFT') && (
                        <DropdownMenuItem className='cursor-pointer' onClick={() => archiveMutation.mutate()}>
                          <span className='flex items-center gap-2'>
                            <Archive className='size-4 shrink-0 text-amber-500' />
                            Lưu trữ
                          </span>
                        </DropdownMenuItem>
                      )}
                      {canCreate && ['IN_USE', 'ARCHIVED'].includes(template.templateStatus ?? 'DRAFT') && (
                        <DropdownMenuItem className='cursor-pointer' onClick={() => cloneMutation.mutate()}>
                          <span className='flex items-center gap-2'>
                            <Copy className='size-4 shrink-0 text-sky-500' />
                            Sao chép biểu mẫu
                          </span>
                        </DropdownMenuItem>
                      )}
                      {canDelete && template.templateStatus === 'DRAFT' && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className='cursor-pointer text-destructive focus:text-destructive'
                            onClick={() => deleteMutation.mutate()}
                          >
                            <span className='flex items-center gap-2'>
                              <Trash2 className='size-4 shrink-0 text-destructive' />
                              Xóa biểu mẫu
                            </span>
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Hàng 2: Mô tả full-width */}
            <div className='border-t pt-3'>
              <div className='text-[11px] font-bold tracking-widest text-muted-foreground uppercase'>
                Mô tả
              </div>
              {template.description ? (
                <p className='mt-1 text-sm text-foreground leading-relaxed'>
                  {template.description}
                </p>
              ) : (
                <p className='mt-1 text-sm italic text-muted-foreground'>Không có mô tả</p>
              )}
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
