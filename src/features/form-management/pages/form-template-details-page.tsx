import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, PencilLine } from 'lucide-react'
import { PageBreadcrumb } from '@/components/page-breadcrumb'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formManagementMockApi } from '../api/mock-form-management-api'
import { templateCycleOptions } from '../api/types'

type FormTemplateDetailsPageProps = {
  templateId: string
}

export function FormTemplateDetailsPage({ templateId }: FormTemplateDetailsPageProps) {
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
        title='Chi tiết biểu mẫu'
        subtitle='Xem tổng quan metadata, thuộc tính và chỉ tiêu của biểu mẫu theo phiên bản hiện tại.'
      >
        <Button variant='outline' asChild>
          <Link to='/form-management'>
            <ArrowLeft />
            Quay lại
          </Link>
        </Button>
        <Button asChild>
          <Link to='/form-management/edit/$templateId' params={{ templateId }}>
            <PencilLine />
            Chỉnh sửa
          </Link>
        </Button>
      </PageBreadcrumb>

      <Card>
        <CardContent className='pt-6'>
          {templateQuery.isLoading && (
            <p className='text-sm text-muted-foreground'>Đang tải thông tin chi tiết...</p>
          )}

          {templateQuery.isError && (
            <p className='text-sm text-destructive'>Không tìm thấy biểu mẫu hoặc dữ liệu không khả dụng.</p>
          )}

          {template && (
            <div className='space-y-4'>
              <div className='grid gap-3 rounded-md border p-3 text-sm sm:grid-cols-2 lg:grid-cols-4'>
                <div>
                  <span className='text-muted-foreground'>Mã biểu mẫu: </span>
                  <span className='font-medium'>{template.code}</span>
                </div>
                <div>
                  <span className='text-muted-foreground'>Tên biểu mẫu: </span>
                  {template.name}
                </div>
                <div>
                  <span className='text-muted-foreground'>Chu kỳ: </span>
                  {cycleLabel(template.cycle)}
                </div>
                <div>
                  <span className='text-muted-foreground'>Trạng thái: </span>
                  <Badge variant={template.status === 'active' ? 'default' : 'secondary'}>
                    {template.status === 'active' ? 'Hoạt động' : 'Ngừng sử dụng'}
                  </Badge>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>Thuộc tính biểu mẫu</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='overflow-hidden rounded-md border'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Khóa</TableHead>
                          <TableHead>Tên hiển thị</TableHead>
                          <TableHead>Kiểu dữ liệu</TableHead>
                          <TableHead>Bắt buộc</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {template.fields.map((field) => (
                          <TableRow key={field.id}>
                            <TableCell>{field.key}</TableCell>
                            <TableCell>{field.label}</TableCell>
                            <TableCell>{field.dataType}</TableCell>
                            <TableCell>{field.required ? 'Có' : 'Không'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>Chỉ tiêu biểu mẫu</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='overflow-hidden rounded-md border'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mã</TableHead>
                          <TableHead>Tên chỉ tiêu</TableHead>
                          <TableHead>Đơn vị</TableHead>
                          <TableHead>Loại</TableHead>
                          <TableHead>Nhóm</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {template.indicators.map((indicator) => (
                          <TableRow key={indicator.id}>
                            <TableCell>{indicator.code}</TableCell>
                            <TableCell>{indicator.name}</TableCell>
                            <TableCell>{indicator.unit}</TableCell>
                            <TableCell>
                              {indicator.type === 'calculated' ? 'Tự động tính' : 'Nhập tay'}
                            </TableCell>
                            <TableCell>{indicator.group}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
