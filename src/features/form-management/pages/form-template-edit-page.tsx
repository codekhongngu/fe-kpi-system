import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Eye, SlidersHorizontal } from 'lucide-react'
import { PageBreadcrumb } from '@/components/page-breadcrumb'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formManagementMockApi } from '../api/mock-form-management-api'
import { templateCycleOptions } from '../api/types'
import { TemplatePreviewTab } from '../components/template-preview-tab'
import { TemplateStructureTab } from '../components/template-structure-tab'
import { TemplatesLifecycleTab } from '../components/templates-lifecycle-tab'

type FormTemplateEditPageProps = {
  templateId: string
}

export function FormTemplateEditPage({ templateId }: FormTemplateEditPageProps) {
  const templateQuery = useQuery({
    queryKey: ['form-management', 'template', templateId],
    queryFn: () => formManagementMockApi.getTemplate(templateId),
  })

  const template = templateQuery.data

  const cycleLabel = (cycle: string) =>
    templateCycleOptions.find((item) => item.value === cycle)?.label ?? cycle

  return (
    <div className='flex w-full flex-col gap-4'>
      <PageBreadcrumb
        title='Chỉnh sửa biểu mẫu'
        subtitle='Điều chỉnh metadata, cấu trúc cây chỉ tiêu/thuộc tính và xác nhận lại bản xem trước trước khi phát hành.'
      >
        <Button variant='outline' asChild>
          <Link to='/form-management'>
            <ArrowLeft />
            Quay lại
          </Link>
        </Button>
        <Button variant='outline' asChild>
          <Link to='/form-management/details/$templateId' params={{ templateId }}>
            <Eye />
            Xem chi tiết
          </Link>
        </Button>
      </PageBreadcrumb>

      <Card>
        <CardContent className='pt-6'>
          {templateQuery.isLoading && (
            <p className='text-sm text-muted-foreground'>Đang tải thông tin biểu mẫu...</p>
          )}

          {templateQuery.isError && (
            <p className='text-sm text-destructive'>Không thể tải dữ liệu biểu mẫu.</p>
          )}

          {template && (
            <div className='grid gap-3 rounded-md border p-3 text-sm sm:grid-cols-2 lg:grid-cols-4'>
              <div>
                <span className='text-muted-foreground'>Mã biểu mẫu: </span>
                <span className='font-medium'>{template.code}</span>
              </div>
              <div>
                <span className='text-muted-foreground'>Chu kỳ: </span>
                {cycleLabel(template.cycle)}
              </div>
              <div>
                <span className='text-muted-foreground'>Lĩnh vực: </span>
                {template.domain}
              </div>
              <div>
                <span className='text-muted-foreground'>Trạng thái: </span>
                <Badge variant={template.status === 'active' ? 'default' : 'secondary'}>
                  {template.status === 'active' ? 'Hoạt động' : 'Ngừng sử dụng'}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue='builder' className='space-y-4'>
        <div className='w-full overflow-x-auto'>
          <TabsList>
            <TabsTrigger value='general'>Thông tin chung</TabsTrigger>
            <TabsTrigger value='builder'>
              <SlidersHorizontal />
              Cấu hình bảng
            </TabsTrigger>
            <TabsTrigger value='preview'>
              <Eye />
              Xem trước
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value='general'>
          <TemplatesLifecycleTab />
        </TabsContent>

        <TabsContent value='builder'>
          <TemplateStructureTab initialTemplateId={templateId} lockTemplateSelection />
        </TabsContent>

        <TabsContent value='preview'>
          <TemplatePreviewTab initialTemplateId={templateId} lockTemplateSelection />
        </TabsContent>
      </Tabs>
    </div>
  )
}
