import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Eye } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formManagementMockApi } from '../api/mock-form-management-api'
import { templateCycleOptions, type FormTemplate, templateStatusOptions } from '../api/types'

const EMPTY_TEMPLATES: FormTemplate[] = []

export function TemplatesListTab() {
  const templatesQuery = useQuery({
    queryKey: ['form-management', 'templates'],
    queryFn: () => formManagementMockApi.listTemplates(),
  })
  const domainsQuery = useQuery({
    queryKey: ['form-management', 'domains'],
    queryFn: () => formManagementMockApi.listDomains(),
  })

  const templates = templatesQuery.data ?? EMPTY_TEMPLATES
  const domains = domainsQuery.data ?? []

  const [search, setSearch] = useState('')
  const [selectedDomain, setSelectedDomain] = useState('all')
  const [selectedCycle, setSelectedCycle] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [previewTemplate, setPreviewTemplate] = useState<FormTemplate | null>(null)

  const filteredTemplates = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return templates.filter((template) => {
      const matchesKeyword =
        !keyword ||
        [template.code, template.name, template.domain].some((value) =>
          value.toLowerCase().includes(keyword)
        )
      const matchesDomain = selectedDomain === 'all' || template.domain === selectedDomain
      const matchesCycle = selectedCycle === 'all' || template.cycle === selectedCycle
      const matchesStatus = selectedStatus === 'all' || template.status === selectedStatus
      return matchesKeyword && matchesDomain && matchesCycle && matchesStatus
    })
  }, [search, selectedDomain, selectedCycle, selectedStatus, templates])

  const cycleLabel = (cycle: string) =>
    templateCycleOptions.find((item) => item.value === cycle)?.label ?? cycle

  return (
    <>
      <Card>
        <CardHeader className='gap-4'>
          <div>
            <CardTitle>Danh sách biểu mẫu</CardTitle>
            <CardDescription>
              Lọc theo lĩnh vực, chu kỳ, trạng thái và preview nhanh cấu trúc nhập liệu.
            </CardDescription>
          </div>

          <div className='grid gap-2 sm:grid-cols-2 lg:grid-cols-4'>
            <Input
              placeholder='Tìm theo mã, tên biểu mẫu...'
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Select value={selectedDomain} onValueChange={setSelectedDomain}>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Lĩnh vực' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả lĩnh vực</SelectItem>
                {domains.map((domain) => (
                  <SelectItem key={domain} value={domain}>
                    {domain}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedCycle} onValueChange={setSelectedCycle}>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Chu kỳ' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả chu kỳ</SelectItem>
                {templateCycleOptions.map((cycle) => (
                  <SelectItem key={cycle.value} value={cycle.value}>
                    {cycle.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Trạng thái' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả trạng thái</SelectItem>
                {templateStatusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className='overflow-hidden rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã biểu mẫu</TableHead>
                  <TableHead>Tên biểu mẫu</TableHead>
                  <TableHead>Lĩnh vực</TableHead>
                  <TableHead>Chu kỳ</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Đơn vị đã giao</TableHead>
                  <TableHead>Tỷ lệ hoàn thành</TableHead>
                  <TableHead className='text-right'>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className='h-20 text-center'>
                      Không có biểu mẫu phù hợp điều kiện lọc.
                    </TableCell>
                  </TableRow>
                )}
                {filteredTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className='font-medium'>{template.code}</TableCell>
                    <TableCell>
                      <div>{template.name}</div>
                      <div className='text-xs text-muted-foreground'>{template.description}</div>
                    </TableCell>
                    <TableCell>{template.domain}</TableCell>
                    <TableCell>{cycleLabel(template.cycle)}</TableCell>
                    <TableCell>
                      <Badge variant={template.status === 'active' ? 'default' : 'secondary'}>
                        {template.status === 'active' ? 'Hoạt động' : 'Ngừng sử dụng'}
                      </Badge>
                    </TableCell>
                    <TableCell>{template.assignedUnits}</TableCell>
                    <TableCell>{template.completionRate}%</TableCell>
                    <TableCell className='text-right'>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => setPreviewTemplate(template)}
                      >
                        <Eye />
                        Preview
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

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
              Preview dữ liệu nhập liệu với danh sách thuộc tính và chỉ tiêu hiện có.
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
                        <TableHead>Key</TableHead>
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
