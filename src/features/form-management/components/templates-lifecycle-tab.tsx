import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function TemplatesLifecycleTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quản lý vòng đời biểu mẫu</CardTitle>
      </CardHeader>
      <CardContent className='text-sm text-muted-foreground'>
        Luồng thêm/sửa biểu mẫu đã được chuyển sang modal tại trang danh sách theo yêu cầu nghiệp vụ mới.
      </CardContent>
    </Card>
  )
}
