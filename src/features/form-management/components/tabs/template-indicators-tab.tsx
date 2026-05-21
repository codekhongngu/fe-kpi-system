import { useEffect, useMemo, useRef, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  ChevronDown,
  ChevronRight,
  Download,
  FileUp,
  GripVertical,
  PlusCircle,
  Save,
  Trash2,
  UserPen,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { triggerBrowserFileDownload } from '@/lib/utils'
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formManagementApi } from '../../api/template-management-api'
import {
  fieldDataTypeOptions,
  type TemplateIndicator,
} from '../../api/types'
import {
  FORM_IMPORT_TEMPLATE_DOWNLOAD_NAMES,
  FORM_IMPORT_TEMPLATE_URLS,
} from '../../constants/form-import-templates'
import { ExcelImportPreviewDialog } from '../shared/excel-import-preview-dialog'
import {
  buildTree,
  flattenTree,
  reorderSameLevelItems,
  type TreeNode,
} from '../shared/template-tree-utils'

type TemplateIndicatorsTabProps = {
  templateId: string
}

const indicatorSchema = z.object({
  code: z.string().min(1, 'Mã chỉ tiêu là bắt buộc').trim().toUpperCase(),
  name: z.string().min(1, 'Tên chỉ tiêu là bắt buộc').trim(),
  unit: z.string().default(''),
  dataType: z.enum(['text', 'number']),
  type: z.enum(['INPUT', 'TITLE']).default('INPUT'),
  parentId: z.string().nullable(),
})

type IndicatorFormValues = z.infer<typeof indicatorSchema>

const defaultIndicatorForm: IndicatorFormValues = {
  code: '',
  name: '',
  unit: '',
  dataType: 'number',
  type: 'INPUT',
  parentId: null,
}

function currentTreeItems(indicators: TemplateIndicator[]) {
  return flattenTree(buildTree(indicators))
}

type IndicatorTreeNodeProps = {
  node: TreeNode<TemplateIndicator>
  depth: number
  canEdit: boolean
  canDrag: boolean
  onAddChild: (parentId: string) => void
  onEdit: (item: TemplateIndicator) => void
  onDelete: (item: TemplateIndicator) => void
}

function IndicatorTreeNode({
  node,
  depth,
  canEdit,
  canDrag,
  onAddChild,
  onEdit,
  onDelete,
}: IndicatorTreeNodeProps) {
  const hasChildren = node.children.length > 0
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: node.id,
    disabled: !canDrag,
  })

  return (
    <div className='space-y-2'>
      <div
        ref={setNodeRef}
        className={`rounded-md border bg-card p-3 shadow-xs transition-all duration-150 ${isDragging ? 'opacity-60 ring-2 ring-primary/40' : ''}`}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
        }}
      >
        <div className='flex items-start justify-between gap-3'>
          <div className='flex min-w-0 items-start gap-2'>
            <button
              ref={setActivatorNodeRef}
              type='button'
              className='mt-0.5 rounded p-0.5 text-muted-foreground hover:bg-muted disabled:cursor-not-allowed'
              disabled={!canDrag}
              aria-label='Drag handle'
              {...attributes}
              {...listeners}
            >
              <GripVertical size={14} />
            </button>
            {depth > 0 && (
              <span
                className='mt-3 h-px w-4 shrink-0 bg-border'
                aria-hidden='true'
              />
            )}
            <button
              type='button'
              className='mt-0.5 rounded p-0.5 hover:bg-muted'
              onClick={() => {}}
            >
              {hasChildren ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
            </button>

            <div
              className='min-w-0 border-s border-border/70 ps-3'
              style={{ marginInlineStart: `${depth * 10}px` }}
            >
              <p className='text-xs text-muted-foreground'>
                {node.code}
                {(node.order ?? 0) > 1 ? ` (STT: ${node.order})` : ''}
              </p>
              <p className='text-sm font-medium'>{node.name}</p>
              <p className='text-xs text-muted-foreground'>
                {node.unit || '---'}
              </p>
            </div>
          </div>

          <div className='flex flex-wrap gap-1'>
            <Button
              size='icon'
              variant='outline'
              onClick={() => onAddChild(node.id)}
              disabled={!canEdit}
              title='Thêm con'
            >
              <PlusCircle className='size-4' />
            </Button>
            <Button
              size='icon'
              variant='outline'
              onClick={() => onEdit(node)}
              disabled={!canEdit}
              title='Chỉnh sửa'
            >
              <UserPen className='size-4' />
            </Button>

            <Button
              size='icon'
              variant='destructive'
              onClick={() => onDelete(node)}
              disabled={!canEdit}
              title='Xóa'
            >
              <Trash2 className='size-4' />
            </Button>
          </div>
        </div>
      </div>

      {hasChildren && (
        <SortableContext
          items={node.children.map((child) => child.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className='space-y-2 border-s border-border/70 ps-3'>
            {node.children.map((child) => (
              <IndicatorTreeNode
                key={child.id}
                node={child}
                depth={depth + 1}
                canEdit={canEdit}
                canDrag={canDrag}
                onAddChild={onAddChild}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </SortableContext>
      )}
    </div>
  )
}

export function TemplateIndicatorsTab({
  templateId,
}: TemplateIndicatorsTabProps) {
  const queryClient = useQueryClient()
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false)
  const [editingIndicator, setEditingIndicator] =
    useState<TemplateIndicator | null>(null)
  const [draftIndicators, setDraftIndicators] = useState<TemplateIndicator[]>(
    []
  )
  const [hasPendingReorder, setHasPendingReorder] = useState(false)
  const excelInputRef = useRef<HTMLInputElement>(null)
  const [excelImportOpen, setExcelImportOpen] = useState(false)
  const [excelImportFile, setExcelImportFile] = useState<File | null>(null)

  const templateQuery = useQuery({
    queryKey: ['form-management', 'template', templateId, 'indicators-tab'],
    queryFn: () => formManagementApi.getTemplate(templateId),
    enabled: Boolean(templateId),
  })

  const form = useForm<IndicatorFormValues>({
    resolver: zodResolver(indicatorSchema) as any,
    defaultValues: defaultIndicatorForm,
  })

  const template = templateQuery.data ?? null
  const canEdit = Boolean(
    template && ['DRAFT', 'READY'].includes(template.templateStatus ?? 'DRAFT')
  )
  const tree = useMemo(() => buildTree(draftIndicators), [draftIndicators])
  const flatIndicators = useMemo(
    () => currentTreeItems(draftIndicators),
    [draftIndicators]
  )
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  )

  useEffect(() => {
    setDraftIndicators(template?.indicators ?? [])
    setHasPendingReorder(false)
  }, [template?.indicators])

  const parentOptions = useMemo(
    () =>
      flatIndicators
        .filter((item) => item.id !== editingIndicator?.id)
        .map((item) => ({
          id: item.id,
          label: `${'  '.repeat(item.depth)}${item.code} - ${item.name}`,
        })),
    [editingIndicator?.id, flatIndicators]
  )

  const refreshTemplate = async () => {
    await queryClient.invalidateQueries({
      queryKey: ['form-management', 'template', templateId],
    })
    await queryClient.invalidateQueries({
      queryKey: ['form-management', 'template', templateId, 'indicators-tab'],
    })
  }

  const createMutation = useMutation({
    mutationFn: (payload: IndicatorFormValues) =>
      formManagementApi.createIndicator(templateId, {
        ...payload,
        unit: payload.unit ?? '',
      }),
    onSuccess: async () => {
      toast.success('Đã thêm chỉ tiêu mới.')
      await refreshTemplate()
      closeDialog()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const updateMutation = useMutation({
    mutationFn: ({
      indicatorId,
      payload,
    }: {
      indicatorId: string
      payload: IndicatorFormValues
    }) =>
      formManagementApi.updateIndicator(templateId, indicatorId, {
        ...payload,
        unit: payload.unit ?? '',
      }),
    onSuccess: async () => {
      toast.success('Đã cập nhật chỉ tiêu.')
      await refreshTemplate()
      closeDialog()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (indicatorId: string) =>
      formManagementApi.deleteIndicator(templateId, indicatorId),
    onSuccess: async () => {
      toast.success('Đã xóa chỉ tiêu.')
      await refreshTemplate()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const saveOrderMutation = useMutation({
    mutationFn: () =>
      formManagementApi.reorderIndicators(
        templateId,
        flatIndicators.map((item) => ({
          id: item.id,
          parentId: item.parentId ?? null,
        }))
      ),
    onSuccess: async () => {
      await refreshTemplate()
      setHasPendingReorder(false)
      toast.success('Đã cập nhật vị trí.')
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const importMutation = useMutation({
    mutationFn: (file: File) =>
      formManagementApi.importIndicatorsFromExcel(templateId, file),
    onSuccess: async () => {
      toast.success('Đã nhập chỉ tiêu từ Excel.')
      setExcelImportOpen(false)
      setExcelImportFile(null)
      await refreshTemplate()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  function openExcelPicker() {
    excelInputRef.current?.click()
  }

  function onExcelFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0]
    event.target.value = ''
    if (!picked) return
    setExcelImportFile(picked)
    setExcelImportOpen(true)
  }

  function closeExcelImport() {
    setExcelImportOpen(false)
    setExcelImportFile(null)
  }

  function openCreateDialog(parentId: string | null = null) {
    setEditingIndicator(null)
    form.reset({ ...defaultIndicatorForm, parentId })
    setFieldDialogOpen(true)
  }

  function openEditDialog(item: TemplateIndicator) {
    setEditingIndicator(item)
    form.reset({
      code: item.code,
      name: item.name,
      unit: item.unit ?? '',
      dataType: (item.dataType ?? 'number') as 'text' | 'number',
      type: item.type ?? 'INPUT',
      parentId: item.parentId ?? null,
    })
    setFieldDialogOpen(true)
  }

  function closeDialog() {
    setFieldDialogOpen(false)
    setEditingIndicator(null)
    form.reset(defaultIndicatorForm)
  }

  function handleDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id)
    const overId = event.over?.id ? String(event.over.id) : null
    if (!overId) return
    const active = draftIndicators.find((entry) => entry.id === activeId)
    const over = draftIndicators.find((entry) => entry.id === overId)
    if (!active || !over) return
    if ((active.parentId ?? null) !== (over.parentId ?? null)) return
    const next = reorderSameLevelItems(draftIndicators, activeId, overId)
    if (next === draftIndicators) return
    setDraftIndicators(next)
    setHasPendingReorder(true)
  }

  function handleSaveOrder() {
    if (!hasPendingReorder || saveOrderMutation.isPending) return
    saveOrderMutation.mutate()
  }

  function onSubmit(values: IndicatorFormValues) {
    if (editingIndicator) {
      updateMutation.mutate({
        indicatorId: editingIndicator.id,
        payload: values,
      })
    } else {
      createMutation.mutate(values)
    }
  }

  return (
    <Card className='rounded-3xl'>
      <CardHeader className='gap-4'>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div>
            <CardTitle>Chỉ tiêu</CardTitle>
            <CardDescription>
              Cấu hình cây chỉ tiêu theo cấp, sắp xếp thứ tự hiển thị và loại dữ
              liệu.
            </CardDescription>
          </div>
          <div className='flex flex-wrap gap-2'>
            <Button
              size='sm'
              variant='outline'
              onClick={handleSaveOrder}
              disabled={
                !canEdit || !hasPendingReorder || saveOrderMutation.isPending
              }
            >
              <Save className='size-4' />
              Cập nhật vị trí
            </Button>
            <Button
              type='button'
              size='sm'
              variant='outline'
              onClick={() =>
                triggerBrowserFileDownload(
                  FORM_IMPORT_TEMPLATE_URLS.indicators,
                  FORM_IMPORT_TEMPLATE_DOWNLOAD_NAMES.indicators
                )
              }
            >
              <Download className='size-4' />
              Tải mẫu
            </Button>
            <input
              ref={excelInputRef}
              type='file'
              className='sr-only'
              accept='.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel'
              onChange={onExcelFileSelected}
            />
            <Button
              size='sm'
              variant='outline'
              onClick={openExcelPicker}
              disabled={!canEdit || importMutation.isPending}
            >
              <FileUp className='size-4' />
              Nhập Excel
            </Button>
            <Button
              size='sm'
              onClick={() => openCreateDialog(null)}
              disabled={!canEdit}
            >
              <PlusCircle className='size-4' />
              Thêm chỉ tiêu
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-3'>
        {!template ? (
          <div className='rounded-md border border-dashed p-6 text-sm text-muted-foreground'>
            Chưa có biểu mẫu để cấu hình chỉ tiêu.
          </div>
        ) : tree.length === 0 ? (
          <div className='rounded-md border border-dashed p-6 text-sm text-muted-foreground'>
            Chưa có chỉ tiêu nào.
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={tree.map((node) => node.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className='space-y-2'>
                {tree.map((node) => (
                  <IndicatorTreeNode
                    key={node.id}
                    node={node}
                    depth={0}
                    canEdit={canEdit}
                    canDrag={canEdit}
                    onAddChild={(parentId) => openCreateDialog(parentId)}
                    onEdit={openEditDialog}
                    onDelete={(item) => {
                      const hasChildren = draftIndicators.some(
                        (entry) => entry.parentId === item.id
                      )
                      if (hasChildren) {
                        toast.error(
                          'Không thể xóa chỉ tiêu này vì đang có chỉ tiêu con.'
                        )
                        return
                      }
                      deleteMutation.mutate(item.id)
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>

      <Dialog
        open={fieldDialogOpen}
        onOpenChange={(open) =>
          open ? setFieldDialogOpen(true) : closeDialog()
        }
      >
        <DialogContent className='sm:max-w-2xl'>
          <DialogHeader className='text-start'>
            <DialogTitle>
              {editingIndicator ? 'Sửa chỉ tiêu' : 'Thêm chỉ tiêu'}
            </DialogTitle>
            <DialogDescription>
              Nhập thông tin cơ bản của chỉ tiêu. Các thông tin nâng cao sẽ được
              tự động xử lý.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit as any)}
              className='space-y-4'
            >
              <div className='grid gap-4 sm:grid-cols-2'>
                <FormField
                  control={form.control as any}
                  name='code'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mã chỉ tiêu</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='...'
                          {...field}
                          value={(field.value as any) ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField<IndicatorFormValues>
                  control={form.control as any}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tên chỉ tiêu</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Nhập tên chỉ tiêu...'
                          {...field}
                          value={(field.value as string) ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField<IndicatorFormValues>
                  control={form.control as any}
                  name='unit'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Đơn vị tính</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Ví dụ: %, Người, VNĐ...'
                          {...field}
                          value={(field.value as string) ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField<IndicatorFormValues>
                  control={form.control as any}
                  name='dataType'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loại dữ liệu</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value as string}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Chọn loại dữ liệu' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {fieldDataTypeOptions.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField<IndicatorFormValues>
                  control={form.control as any}
                  name='parentId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nút cha</FormLabel>
                      <Select
                        onValueChange={(val) =>
                          field.onChange(val === 'root' ? null : val)
                        }
                        value={(field.value as any) ?? 'root'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Gốc' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='root'>Gốc</SelectItem>
                          {parentOptions.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField<IndicatorFormValues>
                  control={form.control as any}
                  name='type'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loại chỉ tiêu</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value as string}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Chọn loại chỉ tiêu' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='INPUT'>Nhập liệu</SelectItem>
                          <SelectItem value='TITLE'>
                            Chỉ hiển thị (Tiêu đề)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type='button' variant='outline' onClick={closeDialog}>
                  Hủy
                </Button>
                <Button
                  type='submit'
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  <Save className='mr-2 size-4' />
                  {editingIndicator ? 'Lưu thay đổi' : 'Thêm chỉ tiêu'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ExcelImportPreviewDialog
        open={excelImportOpen}
        onOpenChange={(next) => {
          if (!next) closeExcelImport()
          else setExcelImportOpen(true)
        }}
        file={excelImportFile}
        title='Nhập chỉ tiêu từ Excel'
        isConfirming={importMutation.isPending}
        onConfirm={() => {
          if (excelImportFile) importMutation.mutate(excelImportFile)
        }}
      />
    </Card>
  )
}
