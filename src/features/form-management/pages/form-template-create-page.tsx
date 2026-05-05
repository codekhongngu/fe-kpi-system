import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { PageBreadcrumb } from '@/components/page-breadcrumb'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function FormTemplateCreatePage() {
  return (
    <div className='flex w-full flex-col gap-4'>
      <PageBreadcrumb title='Tạo biểu mẫu' subtitle='Tạo biểu mẫu được chuyển sang modal tại trang danh sách.'>
        <Button variant='outline' asChild>
          <Link to='/form-management'>
            <ArrowLeft />
            Quay lại danh sách
          </Link>
        </Button>
      </PageBreadcrumb>
      <Card>
        <CardContent className='pt-6 text-sm text-muted-foreground'>
          Vui lòng quay lại trang danh sách biểu mẫu và dùng nút "Thêm mới" để tạo biểu mẫu bằng modal.
        </CardContent>
      </Card>
    </div>
  )
}
