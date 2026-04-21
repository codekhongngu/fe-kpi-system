import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileUp, PlusCircle, Trash2, UserPen } from 'lucide-react'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { formManagementMockApi } from '../api/mock-form-management-api'
import {
  fieldDataTypeOptions,
  indicatorTypeOptions,
  type TemplateField,
  type TemplateIndicator,
  type FieldDataType,
  type FormTemplate,
  type IndicatorType,
} from '../api/types'

const EMPTY_TEMPLATES: FormTemplate[] = []

type FieldFormState = {
  key: string
  label: string
  dataType: FieldDataType
  required: boolean
  visible: boolean
  order: number
}

type IndicatorFormState = {
  code: string
  name: string
  unit: string
  type: IndicatorType
  group: string
  formula: string
}

const defaultFieldForm: FieldFormState = {
  key: '',
  label: '',
  dataType: 'text',
  required: false,
  visible: true,
  order: 1,
}

const defaultIndicatorForm: IndicatorFormState = {
  code: '',
  name: '',
  unit: '',
  type: 'input',
  group: '',
  formula: '',
}

export function TemplateStructureTab() {
  const queryClient = useQueryClient()
  const templatesQuery = useQuery({
    queryKey: ['form-management', 'templates'],
    queryFn: () => formManagementMockApi.listTemplates(),
  })

  const templates = templatesQuery.data ?? EMPTY_TEMPLATES
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false)
  const [editingField, setEditingField] = useState<TemplateField | null>(null)
  const [fieldForm, setFieldForm] = useState<FieldFormState>(defaultFieldForm)
  const [indicatorDialogOpen, setIndicatorDialogOpen] = useState(false)
  const [editingIndicator, setEditingIndicator] = useState<TemplateIndicator | null>(null)
  const [indicatorForm, setIndicatorForm] = useState<IndicatorFormState>(defaultIndicatorForm)

  const currentTemplateId = selectedTemplateId || templates[0]?.id || ''

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === currentTemplateId) ?? null,
    [currentTemplateId, templates]
  )

  const createFieldMutation = useMutation({
    mutationFn: ({
      templateId,
      payload,
    }: {
      templateId: string
      payload: FieldFormState
    }) => formManagementMockApi.createField(templateId, payload),
    onSuccess: () => {
      toast.success('Đã thêm thuộc tính mới.')
      queryClient.invalidateQueries({ queryKey: ['form-management'] })
      closeFieldDialog()
    },
    onError: (error) => toast.error(error.message),
  })

  const updateFieldMutation = useMutation({
    mutationFn: ({
      templateId,
      fieldId,
      payload,
    }: {
      templateId: string
      fieldId: string
      payload: FieldFormState
    }) => formManagementMockApi.updateField(templateId, fieldId, payload),
    onSuccess: () => {
      toast.success('Đã cập nhật thuộc tính.')
      queryClient.invalidateQueries({ queryKey: ['form-management'] })
      closeFieldDialog()
    },
    onError: (error) => toast.error(error.message),
  })

  const deleteFieldMutation = useMutation({
    mutationFn: ({ templateId, fieldId }: { templateId: string; fieldId: string }) =>
      formManagementMockApi.deleteField(templateId, fieldId),
    onSuccess: () => {
      toast.success('Đã xóa thuộc tính.')
      queryClient.invalidateQueries({ queryKey: ['form-management'] })
    },
    onError: (error) => toast.error(error.message),
  })

  const importFieldsMutation = useMutation({
    mutationFn: (templateId: string) => formManagementMockApi.importFieldsFromExcel(templateId),
    onSuccess: () => {
      toast.success('Đã import thuộc tính từ Excel (mock).')
      queryClient.invalidateQueries({ queryKey: ['form-management'] })
    },
    onError: (error) => toast.error(error.message),
  })

  const createIndicatorMutation = useMutation({
    mutationFn: ({
      templateId,
      payload,
    }: {
      templateId: string
      payload: IndicatorFormState
    }) =>
      formManagementMockApi.createIndicator(templateId, {
        ...payload,
        formula: payload.formula || null,
      }),
    onSuccess: () => {
      toast.success('Đã thêm chỉ tiêu mới.')
      queryClient.invalidateQueries({ queryKey: ['form-management'] })
      closeIndicatorDialog()
    },
    onError: (error) => toast.error(error.message),
  })

  const updateIndicatorMutation = useMutation({
    mutationFn: ({
      templateId,
      indicatorId,
      payload,
    }: {
      templateId: string
      indicatorId: string
      payload: IndicatorFormState
    }) =>
      formManagementMockApi.updateIndicator(templateId, indicatorId, {
        ...payload,
        formula: payload.formula || null,
      }),
    onSuccess: () => {
      toast.success('Đã cập nhật chỉ tiêu.')
      queryClient.invalidateQueries({ queryKey: ['form-management'] })
      closeIndicatorDialog()
    },
    onError: (error) => toast.error(error.message),
  })

  const deleteIndicatorMutation = useMutation({
    mutationFn: ({
      templateId,
      indicatorId,
    }: {
      templateId: string
      indicatorId: string
    }) => formManagementMockApi.deleteIndicator(templateId, indicatorId),
    onSuccess: () => {
      toast.success('Đã xóa chỉ tiêu.')
      queryClient.invalidateQueries({ queryKey: ['form-management'] })
    },
    onError: (error) => toast.error(error.message),
  })

  const importIndicatorsMutation = useMutation({
    mutationFn: (templateId: string) =>
      formManagementMockApi.importIndicatorsFromExcel(templateId),
    onSuccess: () => {
      toast.success('Đã import chỉ tiêu từ Excel (mock).')
      queryClient.invalidateQueries({ queryKey: ['form-management'] })
    },
    onError: (error) => toast.error(error.message),
  })

  const closeFieldDialog = () => {
    setFieldDialogOpen(false)
    setEditingField(null)
    setFieldForm(defaultFieldForm)
  }

  const openCreateFieldDialog = () => {
    setEditingField(null)
    setFieldForm({
      ...defaultFieldForm,
      order: (selectedTemplate?.fields.length ?? 0) + 1,
    })
    setFieldDialogOpen(true)
  }

  const openEditFieldDialog = (field: TemplateField) => {
    setEditingField(field)
    setFieldForm({
      key: field.key,
      label: field.label,
      dataType: field.dataType,
      required: field.required,
      visible: field.visible,
      order: field.order,
    })
    setFieldDialogOpen(true)
  }

  const submitFieldForm = () => {
    if (!currentTemplateId) {
      toast.error('Vui lòng chọn biểu mẫu.')
      return
    }
    if (!fieldForm.key.trim() || !fieldForm.label.trim()) {
      toast.error('Key và tên thuộc tính là bắt buộc.')
      return
    }
    if (editingField) {
      updateFieldMutation.mutate({
        templateId: currentTemplateId,
        fieldId: editingField.id,
        payload: fieldForm,
      })
      return
    }
    createFieldMutation.mutate({
      templateId: currentTemplateId,
      payload: fieldForm,
    })
  }

  const closeIndicatorDialog = () => {
    setIndicatorDialogOpen(false)
    setEditingIndicator(null)
    setIndicatorForm(defaultIndicatorForm)
  }

  const openCreateIndicatorDialog = () => {
    setEditingIndicator(null)
    setIndicatorForm(defaultIndicatorForm)
    setIndicatorDialogOpen(true)
  }

  const openEditIndicatorDialog = (indicator: TemplateIndicator) => {
    setEditingIndicator(indicator)
    setIndicatorForm({
      code: indicator.code,
      name: indicator.name,
      unit: indicator.unit,
      type: indicator.type,
      group: indicator.group,
      formula: indicator.formula ?? '',
    })
    setIndicatorDialogOpen(true)
  }

  const submitIndicatorForm = () => {
    if (!currentTemplateId) {
      toast.error('Vui lòng chọn biểu mẫu.')
      return
    }
    if (!indicatorForm.code.trim() || !indicatorForm.name.trim()) {
      toast.error('Mã và tên chỉ tiêu là bắt buộc.')
      return
    }
    if (indicatorForm.type === 'calculated' && !indicatorForm.formula.trim()) {
      toast.error('Chỉ tiêu tự động tính bắt buộc có công thức.')
      return
    }
    if (editingIndicator) {
      updateIndicatorMutation.mutate({
        templateId: currentTemplateId,
        indicatorId: editingIndicator.id,
        payload: indicatorForm,
      })
      return
    }
    createIndicatorMutation.mutate({
      templateId: currentTemplateId,
      payload: indicatorForm,
    })
  }

  return (
    <>
      <Card>
        <CardHeader className='gap-4'>
          <div>
            <CardTitle>Thuộc tính và chỉ tiêu biểu mẫu</CardTitle>
            <CardDescription>
              Quản lý dữ liệu trường nhập và chỉ tiêu, hỗ trợ import Excel (mock) theo nghiệp vụ
              FM-03.
            </CardDescription>
          </div>
          <Select value={currentTemplateId} onValueChange={setSelectedTemplateId}>
            <SelectTrigger className='w-full sm:w-[460px]'>
              <SelectValue placeholder='Chọn biểu mẫu để cấu hình cấu trúc' />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.code} - {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className='space-y-6'>
          {!selectedTemplate && (
            <div className='rounded-md border border-dashed p-6 text-sm text-muted-foreground'>
              Chưa có biểu mẫu để cấu hình.
            </div>
          )}

          {selectedTemplate && (
            <>
              <div className='rounded-md border p-3 text-sm'>
                <span className='font-medium'>{selectedTemplate.name}</span>
                <span className='text-muted-foreground'>
                  {' '}
                  - {selectedTemplate.domain} - cập nhật lần cuối{' '}
                  {new Date(selectedTemplate.updatedAt).toLocaleString('vi-VN')}
                </span>
              </div>

              <div className='grid gap-6 xl:grid-cols-2'>
                <div className='space-y-3'>
                  <div className='flex flex-wrap items-center justify-between gap-2'>
                    <h4 className='text-base font-semibold'>Thuộc tính biểu mẫu</h4>
                    <div className='flex gap-2'>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => importFieldsMutation.mutate(selectedTemplate.id)}
                      >
                        <FileUp />
                        Import Excel
                      </Button>
                      <Button size='sm' onClick={openCreateFieldDialog}>
                        <PlusCircle />
                        Thêm thuộc tính
                      </Button>
                    </div>
                  </div>

                  <div className='overflow-hidden rounded-md border'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Key</TableHead>
                          <TableHead>Tên hiển thị</TableHead>
                          <TableHead>Kiểu</TableHead>
                          <TableHead>Bắt buộc</TableHead>
                          <TableHead className='text-right'>Thao tác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedTemplate.fields.map((field) => (
                          <TableRow key={field.id}>
                            <TableCell>{field.key}</TableCell>
                            <TableCell>
                              <div>{field.label}</div>
                              {field.isSystemDefault && (
                                <Badge variant='outline'>System</Badge>
                              )}
                            </TableCell>
                            <TableCell>{field.dataType}</TableCell>
                            <TableCell>{field.required ? 'Có' : 'Không'}</TableCell>
                            <TableCell className='text-right'>
                              <div className='flex justify-end gap-1'>
                                <Button
                                  size='icon'
                                  variant='outline'
                                  onClick={() => openEditFieldDialog(field)}
                                >
                                  <UserPen />
                                </Button>
                                <Button
                                  size='icon'
                                  variant='destructive'
                                  onClick={() =>
                                    deleteFieldMutation.mutate({
                                      templateId: selectedTemplate.id,
                                      fieldId: field.id,
                                    })
                                  }
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
                </div>

                <div className='space-y-3'>
                  <div className='flex flex-wrap items-center justify-between gap-2'>
                    <h4 className='text-base font-semibold'>Chỉ tiêu biểu mẫu</h4>
                    <div className='flex gap-2'>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => importIndicatorsMutation.mutate(selectedTemplate.id)}
                      >
                        <FileUp />
                        Import Excel
                      </Button>
                      <Button size='sm' onClick={openCreateIndicatorDialog}>
                        <PlusCircle />
                        Thêm chỉ tiêu
                      </Button>
                    </div>
                  </div>

                  <div className='overflow-hidden rounded-md border'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mã</TableHead>
                          <TableHead>Tên chỉ tiêu</TableHead>
                          <TableHead>Loại</TableHead>
                          <TableHead>Nhóm</TableHead>
                          <TableHead className='text-right'>Thao tác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedTemplate.indicators.map((indicator) => (
                          <TableRow key={indicator.id}>
                            <TableCell>{indicator.code}</TableCell>
                            <TableCell>
                              <div>{indicator.name}</div>
                              <div className='text-xs text-muted-foreground'>
                                {indicator.unit}
                              </div>
                            </TableCell>
                            <TableCell>
                              {indicator.type === 'calculated'
                                ? 'Tự động tính'
                                : 'Nhập tay'}
                            </TableCell>
                            <TableCell>{indicator.group}</TableCell>
                            <TableCell className='text-right'>
                              <div className='flex justify-end gap-1'>
                                <Button
                                  size='icon'
                                  variant='outline'
                                  onClick={() => openEditIndicatorDialog(indicator)}
                                >
                                  <UserPen />
                                </Button>
                                <Button
                                  size='icon'
                                  variant='destructive'
                                  onClick={() =>
                                    deleteIndicatorMutation.mutate({
                                      templateId: selectedTemplate.id,
                                      indicatorId: indicator.id,
                                    })
                                  }
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
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={fieldDialogOpen} onOpenChange={setFieldDialogOpen}>
        <DialogContent className='sm:max-w-xl'>
          <DialogHeader className='text-start'>
            <DialogTitle>{editingField ? 'Sửa thuộc tính' : 'Thêm thuộc tính'}</DialogTitle>
            <DialogDescription>
              Thuộc tính mặc định hệ thống không được phép xóa theo nghiệp vụ.
            </DialogDescription>
          </DialogHeader>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label>Key thuộc tính</Label>
              <Input
                value={fieldForm.key}
                onChange={(event) =>
                  setFieldForm((prev) => ({ ...prev, key: event.target.value }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>Tên hiển thị</Label>
              <Input
                value={fieldForm.label}
                onChange={(event) =>
                  setFieldForm((prev) => ({ ...prev, label: event.target.value }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>Kiểu dữ liệu</Label>
              <Select
                value={fieldForm.dataType}
                onValueChange={(value: FieldDataType) =>
                  setFieldForm((prev) => ({ ...prev, dataType: value }))
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fieldDataTypeOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Thứ tự hiển thị</Label>
              <Input
                type='number'
                min={1}
                value={fieldForm.order}
                onChange={(event) =>
                  setFieldForm((prev) => ({
                    ...prev,
                    order: Number(event.target.value || 1),
                  }))
                }
              />
            </div>
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            <label className='inline-flex items-center gap-2 text-sm'>
              <input
                type='checkbox'
                checked={fieldForm.required}
                onChange={(event) =>
                  setFieldForm((prev) => ({ ...prev, required: event.target.checked }))
                }
              />
              Bắt buộc nhập liệu
            </label>
            <label className='inline-flex items-center gap-2 text-sm'>
              <input
                type='checkbox'
                checked={fieldForm.visible}
                onChange={(event) =>
                  setFieldForm((prev) => ({ ...prev, visible: event.target.checked }))
                }
              />
              Hiển thị trên form
            </label>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={closeFieldDialog}>
              Hủy
            </Button>
            <Button
              onClick={submitFieldForm}
              disabled={createFieldMutation.isPending || updateFieldMutation.isPending}
            >
              {editingField ? 'Lưu thay đổi' : 'Thêm thuộc tính'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={indicatorDialogOpen} onOpenChange={setIndicatorDialogOpen}>
        <DialogContent className='sm:max-w-2xl'>
          <DialogHeader className='text-start'>
            <DialogTitle>{editingIndicator ? 'Sửa chỉ tiêu' : 'Thêm chỉ tiêu'}</DialogTitle>
            <DialogDescription>
              `indicator_code` duy nhất trong biểu mẫu. Chỉ tiêu loại công thức bắt buộc có biểu
              thức.
            </DialogDescription>
          </DialogHeader>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label>Mã chỉ tiêu</Label>
              <Input
                value={indicatorForm.code}
                onChange={(event) =>
                  setIndicatorForm((prev) => ({ ...prev, code: event.target.value }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>Tên chỉ tiêu</Label>
              <Input
                value={indicatorForm.name}
                onChange={(event) =>
                  setIndicatorForm((prev) => ({ ...prev, name: event.target.value }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>Đơn vị tính</Label>
              <Input
                value={indicatorForm.unit}
                onChange={(event) =>
                  setIndicatorForm((prev) => ({ ...prev, unit: event.target.value }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>Nhóm chỉ tiêu</Label>
              <Input
                value={indicatorForm.group}
                onChange={(event) =>
                  setIndicatorForm((prev) => ({ ...prev, group: event.target.value }))
                }
              />
            </div>
            <div className='space-y-2 sm:col-span-2'>
              <Label>Loại chỉ tiêu</Label>
              <Select
                value={indicatorForm.type}
                onValueChange={(value: IndicatorType) =>
                  setIndicatorForm((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {indicatorTypeOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2 sm:col-span-2'>
              <Label>Công thức</Label>
              <Textarea
                rows={3}
                placeholder='Ví dụ: (VH001 / VH002) * 100'
                value={indicatorForm.formula}
                onChange={(event) =>
                  setIndicatorForm((prev) => ({ ...prev, formula: event.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={closeIndicatorDialog}>
              Hủy
            </Button>
            <Button
              onClick={submitIndicatorForm}
              disabled={createIndicatorMutation.isPending || updateIndicatorMutation.isPending}
            >
              {editingIndicator ? 'Lưu thay đổi' : 'Thêm chỉ tiêu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
