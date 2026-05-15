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
import { type TemplateField } from '../../api/types'
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

type TemplateAttributesTabProps = {
  templateId: string
}

const fieldSchema = z.object({
  label: z.string().min(1, 'Vui lòng nhập tên thuộc tính').trim(),
  parentId: z.string().nullable(),
})

type FieldFormValues = z.infer<typeof fieldSchema>

const defaultFieldForm: FieldFormValues = {
  label: '',
  parentId: null,
}

function getFlatFields(fields: TemplateField[]) {
  return flattenTree(buildTree(fields))
}

function generateKeyFromLabel(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '_')
}

type FieldTreeNodeProps = {
  node: TreeNode<TemplateField>
  depth: number
  canEdit: boolean
  canDrag: boolean
  onAddChild: (parentId: string) => void
  onEdit: (item: TemplateField) => void
  onDelete: (item: TemplateField) => void
}

function FieldTreeNode({
  node,
  depth,
  canEdit,
  canDrag,
  onAddChild,
  onEdit,
  onDelete,
}: FieldTreeNodeProps) {
  const hasChildren = node.children.length > 0
  const locked = node.isSystemDefault
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
    disabled: locked || !canDrag,
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
              disabled={locked || !canDrag}
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
              <p className='text-xs text-muted-foreground'>{node.key}</p>
              <p className='text-sm font-medium'>{node.label}</p>
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
              <FieldTreeNode
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

export function TemplateAttributesTab({
  templateId,
}: TemplateAttributesTabProps) {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingField, setEditingField] = useState<TemplateField | null>(null)
  const [draftFields, setDraftFields] = useState<TemplateField[]>([])
  const [hasPendingReorder, setHasPendingReorder] = useState(false)
  const excelInputRef = useRef<HTMLInputElement>(null)
  const [excelImportOpen, setExcelImportOpen] = useState(false)
  const [excelImportFile, setExcelImportFile] = useState<File | null>(null)

  const templateQuery = useQuery({
    queryKey: ['form-management', 'template', templateId, 'attributes-tab'],
    queryFn: () => formManagementApi.getTemplate(templateId),
    enabled: Boolean(templateId),
  })

  const form = useForm<FieldFormValues>({
    resolver: zodResolver(fieldSchema),
    defaultValues: defaultFieldForm,
  })

  const template = templateQuery.data ?? null
  const canEdit = Boolean(
    template && ['DRAFT', 'READY'].includes(template.templateStatus ?? 'DRAFT')
  )
  const tree = useMemo(() => buildTree(draftFields), [draftFields])
  const flatFields = useMemo(() => getFlatFields(draftFields), [draftFields])
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  )

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setDraftFields(template?.fields ?? [])
    setHasPendingReorder(false)
  }, [template?.fields])
  /* eslint-enable react-hooks/set-state-in-effect */

  const parentOptions = useMemo(
    () =>
      flatFields
        .filter((item) => item.id !== editingField?.id)
        .map((item) => ({
          id: item.id,
          label: `${'  '.repeat(item.depth)}${item.key} - ${item.label}`,
        })),
    [editingField?.id, flatFields]
  )

  const refreshTemplate = async () => {
    await queryClient.invalidateQueries({
      queryKey: ['form-management', 'template', templateId],
    })
    await queryClient.invalidateQueries({
      queryKey: ['form-management', 'template', templateId, 'attributes-tab'],
    })
  }

  const createMutation = useMutation({
    mutationFn: async (payload: FieldFormValues) => {
      const autoKey = generateKeyFromLabel(payload.label)
      return formManagementApi.createField(templateId, {
        key: autoKey,
        label: payload.label,
        parentId: payload.parentId,
      })
    },
    onSuccess: async () => {
      toast.success('Đã thêm thuộc tính mới.')
      await refreshTemplate()
      closeDialog()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const updateMutation = useMutation({
    mutationFn: async ({
      fieldId,
      payload,
    }: {
      fieldId: string
      payload: FieldFormValues
    }) => {
      return formManagementApi.updateField(templateId, fieldId, {
        ...editingField!,
        label: payload.label,
        parentId: payload.parentId,
      })
    },
    onSuccess: async () => {
      toast.success('Đã cập nhật thuộc tính.')
      await refreshTemplate()
      closeDialog()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (fieldId: string) =>
      formManagementApi.deleteField(templateId, fieldId),
    onSuccess: async () => {
      toast.success('Đã xóa thuộc tính.')
      await refreshTemplate()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const saveOrderMutation = useMutation({
    mutationFn: () =>
      formManagementApi.reorderFields(
        templateId,
        flatFields
          .filter((item) => !item.isSystemDefault)
          .map((item) => ({ id: item.id, parentId: item.parentId ?? null }))
      ),
    onSuccess: async () => {
      await refreshTemplate()
      setHasPendingReorder(false)
      toast.success('Cập nhật vị trí thành công.')
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const importMutation = useMutation({
    mutationFn: (file: File) =>
      formManagementApi.importFieldsFromExcel(templateId, file),
    onSuccess: async () => {
      toast.success('Đã nhập thuộc tính từ Excel.')
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
    setEditingField(null)
    form.reset({ ...defaultFieldForm, parentId })
    setDialogOpen(true)
  }

  function openEditDialog(item: TemplateField) {
    setEditingField(item)
    form.reset({
      label: item.label,
      parentId: item.parentId ?? null,
    })
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
    setEditingField(null)
    form.reset(defaultFieldForm)
  }

  function handleDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id)
    const overId = event.over?.id ? String(event.over.id) : null
    if (!overId) return
    const active = draftFields.find((entry) => entry.id === activeId)
    const over = draftFields.find((entry) => entry.id === overId)
    if (!active || !over) return
    if (active.isSystemDefault || over.isSystemDefault) return
    if ((active.parentId ?? null) !== (over.parentId ?? null)) return
    const next = reorderSameLevelItems(draftFields, activeId, overId)
    if (next === draftFields) return
    setDraftFields(next)
    setHasPendingReorder(true)
  }

  function handleSaveOrder() {
    if (!hasPendingReorder || saveOrderMutation.isPending) return
    saveOrderMutation.mutate()
  }

  function onSubmit(values: FieldFormValues) {
    if (editingField) {
      updateMutation.mutate({ fieldId: editingField.id, payload: values })
    } else {
      createMutation.mutate(values)
    }
  }

  return (
    <Card className='rounded-3xl'>
      <CardHeader className='gap-4'>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div>
            <CardTitle>Thuộc tính</CardTitle>
            <CardDescription>
              Cấu hình cây thuộc tính theo cấp, lưu trữ thêm, sửa, xóa, nhập
              Excel và sắp xếp cùng cấp.
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
                  FORM_IMPORT_TEMPLATE_URLS.attributes,
                  FORM_IMPORT_TEMPLATE_DOWNLOAD_NAMES.attributes
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
              Thêm thuộc tính
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-3'>
        {!template ? (
          <div className='rounded-md border border-dashed p-6 text-sm text-muted-foreground'>
            Chưa có biểu mẫu để cấu hình thuộc tính.
          </div>
        ) : tree.length === 0 ? (
          <div className='rounded-md border border-dashed p-6 text-sm text-muted-foreground'>
            Chưa có thuộc tính nào.
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
                  <FieldTreeNode
                    key={node.id}
                    node={node}
                    depth={0}
                    canEdit={canEdit}
                    canDrag={canEdit}
                    onAddChild={(parentId) => openCreateDialog(parentId)}
                    onEdit={openEditDialog}
                    onDelete={(item) => {
                      const hasChildren = draftFields.some(
                        (entry) => entry.parentId === item.id
                      )
                      if (hasChildren) {
                        toast.error(
                          'Không thể xóa thuộc tính này vì đang có thuộc tính con.'
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
        open={dialogOpen}
        onOpenChange={(open) => (open ? setDialogOpen(true) : closeDialog())}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader className='text-start'>
            <DialogTitle>
              {editingField ? 'Sửa thuộc tính' : 'Thêm thuộc tính'}
            </DialogTitle>
            <DialogDescription>
              Chỉ định tên và nhóm của thuộc tính. Mã thuộc tính sẽ được tự tạo.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='grid gap-4'>
              <FormField
                control={form.control}
                name='label'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên thuộc tính</FormLabel>
                    <FormControl>
                      <Input placeholder='Nhập tên thuộc tính...' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='parentId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nút cha</FormLabel>
                    <Select
                      onValueChange={(val) =>
                        field.onChange(val === 'root' ? null : val)
                      }
                      value={field.value ?? 'root'}
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

              <DialogFooter className='mt-4'>
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
                  {editingField ? 'Lưu thay đổi' : 'Thêm thuộc tính'}
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
        title='Nhập thuộc tính từ Excel'
        isConfirming={importMutation.isPending}
        onConfirm={() => {
          if (excelImportFile) importMutation.mutate(excelImportFile)
        }}
      />
    </Card>
  )
}
