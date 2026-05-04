import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { PlusCircle } from 'lucide-react'
import { PageBreadcrumb } from '@/components/page-breadcrumb'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useFieldCategoriesCatalogQuery,
} from '../api/catalog-queries'
import { formManagementApi } from '../api/mock-form-management-api'
import { templateCycleOptions, type FormTemplate } from '../api/types'
import { TemplateListFilter } from '../components/template-list-filter'
import { TemplateListTable } from '../components/template-list-table'

const EMPTY_TEMPLATES: FormTemplate[] = []
const REPORT_PERIOD_OPTIONS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'TUAN', label: 'Tuần' },
  { value: 'THANG', label: 'Tháng' },
  { value: 'QUY', label: 'Quý' },
  { value: 'NAM', label: 'Năm' },
]

export function FormTemplateListPage() {
  const [search, setSearch] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [previewTemplate, setPreviewTemplate] = useState<FormTemplate | null>(null)

  const templatesQuery = useQuery({
    queryKey: [
      'form-management',
      'templates',
      {
        search,
        page: 1,
        limit: 20,
        status: selectedStatus,
        period: selectedPeriod,
        category: selectedCategory,
      },
    ],
    queryFn: () =>
      formManagementApi.listTemplates({
        search,
        page: 1,
        limit: 20,
        status: selectedStatus as 'all' | 'true' | 'false',
        period: selectedPeriod === 'all' ? '' : selectedPeriod,
        category: selectedCategory === 'all' ? '' : selectedCategory,
      }),
  })

  const categoriesQuery = useFieldCategoriesCatalogQuery()

  const templates = templatesQuery.data ?? EMPTY_TEMPLATES
  const categories = categoriesQuery.data ?? []

  const cycleLabel = (cycle: string) =>
    templateCycleOptions.find((item) => item.value === cycle)?.label ?? cycle

  return (
    <>
      <div className='flex w-full flex-col gap-4'>
        <PageBreadcrumb
          title='Danh sách biểu mẫu'
          subtitle='Theo dõi biểu mẫu theo lĩnh vực, chu kỳ và trạng thái. Chọn thao tác để đi đến luồng tạo, chỉnh sửa hoặc xem chi tiết.'
        >
          <Button asChild>
            <Link to='/form-management/create'>
              <PlusCircle />
              Thêm mới
            </Link>
          </Button>
        </PageBreadcrumb>

        <TemplateListFilter
          search={search}
          selectedPeriod={selectedPeriod}
          selectedCategory={selectedCategory}
          selectedStatus={selectedStatus}
          periodOptions={REPORT_PERIOD_OPTIONS}
          categories={categories}
          onSearchChange={setSearch}
          onPeriodChange={setSelectedPeriod}
          onCategoryChange={setSelectedCategory}
          onStatusChange={setSelectedStatus}
        />

        <TemplateListTable
          templates={templates}
          cycleLabel={cycleLabel}
          onPreview={setPreviewTemplate}
        />
      </div>

      <Dialog
        open={Boolean(previewTemplate)}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewTemplate(null)
          }
        }}
      >
        <DialogContent className='sm:max-w-3xl'>
          <DialogHeader className='text-start'>
            <DialogTitle>
              {previewTemplate?.code} - {previewTemplate?.name}
            </DialogTitle>
            <DialogDescription>
              Xem nhanh dữ liệu nhập liệu với danh sách thuộc tính và chỉ tiêu hiện có.
            </DialogDescription>
          </DialogHeader>

          {previewTemplate && (
            <div className='space-y-4'>
              <div className='grid gap-2 rounded-md border p-3 text-sm sm:grid-cols-3'>
                <div>
                  <span className='text-muted-foreground'>Lĩnh vực: </span>
                  {previewTemplate.domain}
                </div>
                <div>
                  <span className='text-muted-foreground'>Chu kỳ: </span>
                  {cycleLabel(previewTemplate.cycle)}
                </div>
                <div>
                  <span className='text-muted-foreground'>Trạng thái: </span>
                  {previewTemplate.status === 'active' ? 'Hoạt động' : 'Ngừng sử dụng'}
                </div>
              </div>

              <div>
                <p className='mb-2 text-sm font-medium'>Thuộc tính biểu mẫu</p>
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
                      {previewTemplate.fields.map((field) => (
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
              </div>

              <div>
                <p className='mb-2 text-sm font-medium'>Chỉ tiêu chính</p>
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
                      {previewTemplate.indicators.map((indicator) => (
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
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
