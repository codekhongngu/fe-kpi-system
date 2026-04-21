import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, PlusCircle, Trash2, UserPen } from 'lucide-react'
import { toast } from 'sonner'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formManagementMockApi } from '../api/mock-form-management-api'
import {
  type FormTemplate,
  templateCycleOptions,
  type TemplateCycle,
  templateStatusOptions,
  type TemplateStatus,
} from '../api/types'

const EMPTY_TEMPLATES: FormTemplate[] = []

type TemplateFormState = {
  code: string
  name: string
  description: string
  domain: string
  cycle: TemplateCycle
  status: TemplateStatus
  cloneFromTemplateId?: string
  referenceFiles: string[]
}

const defaultForm: TemplateFormState = {
  code: '',
  name: '',
  description: '',
  domain: '',
  cycle: 'month',
  status: 'active',
  cloneFromTemplateId: undefined,
  referenceFiles: [],
}

export function TemplatesLifecycleTab() {
  const queryClient = useQueryClient()
  const templatesQuery = useQuery({
    queryKey: ['form-management', 'templates'],
    queryFn: () => formManagementMockApi.listTemplates(),
  })

  const templates = templatesQuery.data ?? EMPTY_TEMPLATES

  const [search, setSearch] = useState('')
  const [openForm, setOpenForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<FormTemplate | null>(null)
  const [form, setForm] = useState<TemplateFormState>(defaultForm)
  const [referenceFileInput, setReferenceFileInput] = useState('')
  const [deleteDialog, setDeleteDialog] = useState<{
    template: FormTemplate
    mode: 'hard' | 'inactive'
  } | null>(null)

  const filteredTemplates = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) {
      return templates
    }
    return templates.filter((template) =>
      [template.code, template.name, template.domain].some((value) =>
        value.toLowerCase().includes(keyword)
      )
    )
  }, [search, templates])

  const createMutation = useMutation({
    mutationFn: formManagementMockApi.createTemplate,
    onSuccess: () => {
      toast.success('Đã tạo biểu mẫu mới.')
      queryClient.invalidateQueries({ queryKey: ['form-management'] })
      closeForm()
    },
    onError: (error) => toast.error(error.message),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Omit<TemplateFormState, 'code'> }) =>
      formManagementMockApi.updateTemplate(id, payload),
    onSuccess: () => {
      toast.success('Đã cập nhật metadata biểu mẫu.')
      queryClient.invalidateQueries({ queryKey: ['form-management'] })
      closeForm()
    },
    onError: (error) => toast.error(error.message),
  })

  const deleteMutation = useMutation({
    mutationFn: ({ id, mode }: { id: string; mode: 'hard' | 'inactive' }) =>
      formManagementMockApi.deleteTemplate(id, mode),
    onSuccess: (_, variables) => {
      toast.success(
        variables.mode === 'hard'
          ? 'Đã xóa cứng biểu mẫu.'
          : 'Đã chuyển biểu mẫu sang trạng thái ngừng sử dụng.'
      )
      queryClient.invalidateQueries({ queryKey: ['form-management'] })
      setDeleteDialog(null)
    },
    onError: (error) => toast.error(error.message),
  })

  const closeForm = () => {
    setOpenForm(false)
    setEditingTemplate(null)
    setForm(defaultForm)
    setReferenceFileInput('')
  }

  const openCreateDialog = (cloneFromTemplateId?: string) => {
    setEditingTemplate(null)
    setForm({ ...defaultForm, cloneFromTemplateId })
    setReferenceFileInput('')
    setOpenForm(true)
  }

  const openEditDialog = (template: FormTemplate) => {
    setEditingTemplate(template)
    setForm({
      code: template.code,
      name: template.name,
      description: template.description,
      domain: template.domain,
      cycle: template.cycle,
      status: template.status,
      cloneFromTemplateId: undefined,
      referenceFiles: [...template.referenceFiles],
    })
    setReferenceFileInput('')
    setOpenForm(true)
  }

  const addReferenceFileToForm = () => {
    const value = referenceFileInput.trim()
    if (!value) {
      return
    }
    if (
      form.referenceFiles.some(
        (item) => item.trim().toLowerCase() === value.trim().toLowerCase()
      )
    ) {
      toast.error('File tham chiếu đã tồn tại trong danh sách.')
      return
    }
    setForm((prev) => ({ ...prev, referenceFiles: [...prev.referenceFiles, value] }))
    setReferenceFileInput('')
  }

  const submitForm = () => {
    if (!form.name.trim() || !form.domain.trim()) {
      toast.error('Tên biểu mẫu và lĩnh vực là bắt buộc.')
      return
    }

    if (editingTemplate) {
      updateMutation.mutate({
        id: editingTemplate.id,
        payload: {
          name: form.name,
          description: form.description,
          domain: form.domain,
          cycle: form.cycle,
          status: form.status,
          referenceFiles: form.referenceFiles,
        },
      })
      return
    }

    if (!form.code.trim()) {
      toast.error('Mã biểu mẫu là bắt buộc khi tạo mới.')
      return
    }

    createMutation.mutate({
      code: form.code,
      name: form.name,
      description: form.description,
      domain: form.domain,
      cycle: form.cycle,
      status: form.status,
      cloneFromTemplateId: form.cloneFromTemplateId,
      referenceFiles: form.referenceFiles,
    })
  }

  const cycleLabel = (cycle: string) =>
    templateCycleOptions.find((item) => item.value === cycle)?.label ?? cycle

  return (
    <>
      <Card>
        <CardHeader className='gap-4 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <CardTitle>Thêm/Sửa/Xóa biểu mẫu</CardTitle>
            <CardDescription>
              Quản lý metadata biểu mẫu, sao chép cấu trúc và kiểm soát xóa cứng/inactive.
            </CardDescription>
          </div>
          <div className='flex w-full flex-col gap-2 sm:w-auto sm:flex-row'>
            <Input
              className='sm:w-80'
              placeholder='Tìm theo mã/tên/lĩnh vực...'
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Button onClick={() => openCreateDialog()}>
              <PlusCircle />
              Tạo biểu mẫu
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className='overflow-hidden rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã</TableHead>
                  <TableHead>Tên biểu mẫu</TableHead>
                  <TableHead>Lĩnh vực</TableHead>
                  <TableHead>Chu kỳ</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Dữ liệu phát sinh</TableHead>
                  <TableHead className='text-right'>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className='h-20 text-center'>
                      Không có biểu mẫu phù hợp.
                    </TableCell>
                  </TableRow>
                )}
                {filteredTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className='font-medium'>{template.code}</TableCell>
                    <TableCell>
                      <div>{template.name}</div>
                      <div className='text-xs text-muted-foreground'>
                        {template.referenceFiles.length} file tham chiếu
                      </div>
                    </TableCell>
                    <TableCell>{template.domain}</TableCell>
                    <TableCell>{cycleLabel(template.cycle)}</TableCell>
                    <TableCell>
                      <Badge variant={template.status === 'active' ? 'default' : 'secondary'}>
                        {template.status === 'active' ? 'Hoạt động' : 'Ngừng sử dụng'}
                      </Badge>
                    </TableCell>
                    <TableCell>{template.hasReportData ? 'Có' : 'Chưa có'}</TableCell>
                    <TableCell className='text-right'>
                      <div className='flex justify-end gap-1'>
                        <Button
                          size='icon'
                          variant='outline'
                          title='Sửa metadata'
                          onClick={() => openEditDialog(template)}
                        >
                          <UserPen />
                        </Button>
                        <Button
                          size='icon'
                          variant='outline'
                          title='Sao chép cấu trúc'
                          onClick={() => openCreateDialog(template.id)}
                        >
                          <Copy />
                        </Button>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => setDeleteDialog({ template, mode: 'inactive' })}
                        >
                          Inactive
                        </Button>
                        <Button
                          size='icon'
                          variant='destructive'
                          title='Xóa cứng'
                          onClick={() => setDeleteDialog({ template, mode: 'hard' })}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className='sm:max-w-3xl'>
          <DialogHeader className='text-start'>
            <DialogTitle>{editingTemplate ? 'Sửa biểu mẫu' : 'Tạo biểu mẫu mới'}</DialogTitle>
            <DialogDescription>
              Tên biểu mẫu không trùng trong cùng lĩnh vực và tối đa 255 ký tự.
            </DialogDescription>
          </DialogHeader>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label>Mã biểu mẫu</Label>
              <Input
                value={form.code}
                disabled={Boolean(editingTemplate)}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, code: event.target.value }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>Tên biểu mẫu</Label>
              <Input
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>Lĩnh vực</Label>
              <Input
                value={form.domain}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, domain: event.target.value }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>Chu kỳ</Label>
              <Select
                value={form.cycle}
                onValueChange={(value: TemplateCycle) =>
                  setForm((prev) => ({ ...prev, cycle: value }))
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {templateCycleOptions.map((cycle) => (
                    <SelectItem key={cycle.value} value={cycle.value}>
                      {cycle.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Trạng thái</Label>
              <Select
                value={form.status}
                onValueChange={(value: TemplateStatus) =>
                  setForm((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {templateStatusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!editingTemplate && (
              <div className='space-y-2'>
                <Label>Sao chép cấu trúc từ biểu mẫu</Label>
                <Select
                  value={form.cloneFromTemplateId ?? 'none'}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      cloneFromTemplateId: value === 'none' ? undefined : value,
                    }))
                  }
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Không sao chép' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='none'>Không sao chép</SelectItem>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.code} - {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className='space-y-2'>
            <Label>Mô tả</Label>
            <Textarea
              rows={3}
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, description: event.target.value }))
              }
            />
          </div>

          <div className='space-y-2'>
            <Label>File mẫu tham chiếu (Excel/PDF)</Label>
            <div className='flex gap-2'>
              <Input
                placeholder='Nhập tên file, ví dụ: mau-kpi-thang.xlsx'
                value={referenceFileInput}
                onChange={(event) => setReferenceFileInput(event.target.value)}
              />
              <Button type='button' variant='outline' onClick={addReferenceFileToForm}>
                Thêm
              </Button>
            </div>
            <div className='flex flex-wrap gap-2'>
              {form.referenceFiles.length === 0 && (
                <p className='text-sm text-muted-foreground'>Chưa có file tham chiếu.</p>
              )}
              {form.referenceFiles.map((fileName) => (
                <button
                  key={fileName}
                  type='button'
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      referenceFiles: prev.referenceFiles.filter((item) => item !== fileName),
                    }))
                  }
                  className='inline-flex items-center rounded-full border px-3 py-1 text-xs hover:bg-muted'
                >
                  {fileName} x
                </button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={closeForm}>
              Hủy
            </Button>
            <Button
              onClick={submitForm}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingTemplate ? 'Lưu thay đổi' : 'Tạo biểu mẫu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteDialog)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteDialog(null)
          }
        }}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader className='text-start'>
            <DialogTitle>
              {deleteDialog?.mode === 'hard' ? 'Xóa cứng biểu mẫu' : 'Chuyển inactive'}
            </DialogTitle>
            <DialogDescription>
              {deleteDialog?.mode === 'hard'
                ? 'Chỉ xóa cứng khi biểu mẫu chưa có report instance phát sinh.'
                : 'Biểu mẫu inactive vẫn giữ nguyên dữ liệu lịch sử theo nghiệp vụ.'}
            </DialogDescription>
          </DialogHeader>

          <p className='text-sm'>
            {deleteDialog
              ? `Biểu mẫu: ${deleteDialog.template.code} - ${deleteDialog.template.name}`
              : ''}
          </p>

          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteDialog(null)}>
              Hủy
            </Button>
            <Button
              variant={deleteDialog?.mode === 'hard' ? 'destructive' : 'default'}
              onClick={() =>
                deleteDialog &&
                deleteMutation.mutate({
                  id: deleteDialog.template.id,
                  mode: deleteDialog.mode,
                })
              }
              disabled={deleteMutation.isPending}
            >
              {deleteDialog?.mode === 'hard' ? 'Xóa cứng' : 'Chuyển inactive'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
