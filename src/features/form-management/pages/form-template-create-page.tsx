import { Link } from '@tanstack/react-router'
import { ArrowLeft, Eye, SlidersHorizontal } from 'lucide-react'
import { PageBreadcrumb } from '@/components/page-breadcrumb'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TemplatePreviewTab } from '../components/template-preview-tab'
import { TemplateStructureTab } from '../components/template-structure-tab'
import { TemplatesLifecycleTab } from '../components/templates-lifecycle-tab'

export function FormTemplateCreatePage() {
  return (
    <div className='flex w-full flex-col gap-4'>
      <PageBreadcrumb
        title='Tạo biểu mẫu mới'
        subtitle='Luồng chuẩn gồm 3 bước: khai báo thông tin chung, thiết kế cấu trúc và xem trước ma trận biểu mẫu.'
      >
        <Button variant='outline' asChild>
          <Link to='/form-management'>
            <ArrowLeft />
            Quay lại
          </Link>
        </Button>
      </PageBreadcrumb>

      <Card>
        <CardContent className='pt-6 text-sm text-muted-foreground'>
          Khuyến nghị thao tác theo thứ tự tab để đảm bảo dữ liệu metadata, cấu trúc chỉ tiêu/thuộc tính và
          preview luôn đồng bộ trước khi phát hành.
        </CardContent>
      </Card>

      <Tabs defaultValue='general' className='space-y-4'>
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
          <TemplateStructureTab />
        </TabsContent>

        <TabsContent value='preview'>
          <TemplatePreviewTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
