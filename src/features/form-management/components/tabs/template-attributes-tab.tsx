import { useEffect, useMemo, useState } from 'react'
import { closestCenter, DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, FileUp, GripVertical, PlusCircle, Save, Trash2, UserPen } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { formManagementApi } from '../../api/template-management-api'
import {
  fieldDataTypeOptions,
  type FieldDataType,
  type TemplateField,
} from '../../api/types'
import { buildTree, flattenTree, reorderSameLevelItems, type TreeNode } from '../shared/template-tree-utils'

type TemplateAttributesTabProps = {
  templateId: string
}

type FieldFormState = {
  key: string
  label: string
  dataType: FieldDataType
  required: boolean
  readonly: boolean
  visible: boolean
  parentId: string | null
  validationText: string
}

const defaultFieldForm: FieldFormState = {
  key: '',
  label: '',
  dataType: 'text',
  required: true,
  readonly: false,
  visible: true,
  parentId: null,
  validationText: '',
}

function getFlatFields(fields: TemplateField[]) {
  return flattenTree(buildTree(fields))
}

type FieldTreeNodeProps = {
  node: TreeNode<TemplateField>
  depth: number
  canEdit: boolean
  canDrag: boolean
  onAddChild: (parentId: string) => void
  onEdit: (item: TemplateField) => void
  onDelete: (item: TemplateField) => void
  onMoveUp: (item: TemplateField) => void
  onMoveDown: (item: TemplateField) => void
}

function FieldTreeNode({
  node,
  depth,
  canEdit,
  canDrag,
  onAddChild,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: FieldTreeNodeProps) {
  const hasChildren = node.children.length > 0
  const locked = node.isSystemDefault
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
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
            {depth > 0 && <span className='mt-3 h-px w-4 shrink-0 bg-border' aria-hidden='true' />}
            <button type='button' className='mt-0.5 rounded p-0.5 hover:bg-muted'>
              {hasChildren ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>

            <div className='min-w-0 border-s border-border/70 ps-3' style={{ marginInlineStart: `${depth * 10}px` }}>
              <p className='text-xs text-muted-foreground'>{node.key}</p>
              <p className='text-sm font-medium'>{node.label}</p>
              <p className='text-xs text-muted-foreground'>
                {node.dataType} - {node.required ? 'Bắt buộc' : 'Không bắt buộc'} {node.readonly ? 'Chỉ đọc' : 'Có thể sửa'}
              </p>
            </div>
          </div>

          <div className='flex flex-wrap gap-1'>
            <Button size='icon' variant='outline' onClick={() => onAddChild(node.id)} disabled={!canEdit} title='Thêm con'>
              <PlusCircle className='size-4' />
            </Button>
            <Button size='icon' variant='outline' onClick={() => onEdit(node)} disabled={!canEdit} title='Chỉnh sửa'>
              <UserPen className='size-4' />
            </Button>
            <Button size='icon' variant='outline' onClick={() => onMoveUp(node)} disabled={!canEdit} title='Lên trên'>
              <ArrowUp className='size-4' />
            </Button>
            <Button size='icon' variant='outline' onClick={() => onMoveDown(node)} disabled={!canEdit} title='Xuống dưới'>
              <ArrowDown className='size-4' />
            </Button>
            <Button size='icon' variant='destructive' onClick={() => onDelete(node)} disabled={!canEdit} title='Xóa'>
              <Trash2 className='size-4' />
            </Button>
          </div>
        </div>
      </div>

      {hasChildren && (
        <SortableContext items={node.children.map((child) => child.id)} strategy={verticalListSortingStrategy}>
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
                onMoveUp={onMoveUp}
                onMoveDown={onMoveDown}
              />
            ))}
          </div>
        </SortableContext>
      )}
    </div>
  )
}

export function TemplateAttributesTab({ templateId }: TemplateAttributesTabProps) {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingField, setEditingField] = useState<TemplateField | null>(null)
  const [fieldForm, setFieldForm] = useState<FieldFormState>(defaultFieldForm)
  const [draftFields, setDraftFields] = useState<TemplateField[]>([])
  const [hasPendingReorder, setHasPendingReorder] = useState(false)

  const templateQuery = useQuery({
    queryKey: ['form-management', 'template', templateId, 'attributes-tab'],
    queryFn: () => formManagementApi.getTemplate(templateId),
    enabled: Boolean(templateId),
  })

  const template = templateQuery.data ?? null
  const canEdit = Boolean(template && ['DRAFT', 'READY'].includes(template.templateStatus ?? 'DRAFT'))
  const tree = useMemo(() => buildTree(draftFields), [draftFields])
  const flatFields = useMemo(() => getFlatFields(draftFields), [draftFields])
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

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
    [editingField?.id, flatFields],
  )

  const refreshTemplate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['form-management', 'template', templateId] })
    await queryClient.invalidateQueries({ queryKey: ['form-management', 'template', templateId, 'attributes-tab'] })
  }

  const createMutation = useMutation({
    mutationFn: async (payload: FieldFormState) => {
      let validationRule: Record<string, unknown> | null = null
      if (payload.validationText.trim()) {
        try {
          validationRule = JSON.parse(payload.validationText)
        } catch {
          throw new Error('JSON kiểm tra dữ liệu không hợp lệ.')
        }
      }

      return formManagementApi.createField(templateId, {
        key: payload.key.trim(),
        label: payload.label.trim(),
        dataType: payload.dataType,
        required: payload.required,
        readonly: payload.readonly,
        visible: payload.visible,
        parentId: payload.parentId,
        validationRule,
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
    mutationFn: async ({ fieldId, payload }: { fieldId: string; payload: FieldFormState }) => {
      let validationRule: Record<string, unknown> | null = null
      if (payload.validationText.trim()) {
        try {
          validationRule = JSON.parse(payload.validationText)
        } catch {
          throw new Error('JSON kiểm tra dữ liệu không hợp lệ.')
        }
      }

      return formManagementApi.updateField(templateId, fieldId, {
        key: payload.key.trim(),
        label: payload.label.trim(),
        dataType: payload.dataType,
        required: payload.required,
        readonly: payload.readonly,
        visible: payload.visible,
        parentId: payload.parentId,
        validationRule,
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
    mutationFn: (fieldId: string) => formManagementApi.deleteField(templateId, fieldId),
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
          .map((item) => ({ id: item.id, parentId: item.parentId ?? null })),
      ),
    onSuccess: async () => {
      await refreshTemplate()
      setHasPendingReorder(false)
      toast.success('Order saved.')
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const importMutation = useMutation({
    mutationFn: () => formManagementApi.importFieldsFromExcel(templateId),
    onSuccess: async () => {
      toast.success('Đã nhập thuộc tính từ Excel.')
      await refreshTemplate()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  function openCreateDialog(parentId: string | null = null) {
    setEditingField(null)
    setFieldForm({ ...defaultFieldForm, parentId })
    setDialogOpen(true)
  }

  function openEditDialog(item: TemplateField) {
    setEditingField(item)
    setFieldForm({
      key: item.key,
      label: item.label,
      dataType: (item.dataType ?? 'text') as FieldDataType,
      required: item.required ?? true,
      readonly: item.readonly ?? false,
      visible: item.visible ?? true,
      parentId: item.parentId ?? null,
      validationText: item.validationRule ? JSON.stringify(item.validationRule, null, 2) : '',
    })
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
    setEditingField(null)
    setFieldForm(defaultFieldForm)
  }

  function handleMoveUp(item: TemplateField) {
    const current = draftFields.find((entry) => entry.id === item.id)
    if (!current || current.isSystemDefault) return
    const siblings = flatFields.filter(
      (entry) => (entry.parentId ?? null) === (current.parentId ?? null) && !entry.isSystemDefault,
    )
    const index = siblings.findIndex((entry) => entry.id === item.id)
    if (index <= 0) return
    const target = siblings[index - 1]
    const next = reorderSameLevelItems(draftFields, item.id, target.id)
    if (next === draftFields) return
    setDraftFields(next)
    setHasPendingReorder(true)
  }

  function handleMoveDown(item: TemplateField) {
    const current = draftFields.find((entry) => entry.id === item.id)
    if (!current || current.isSystemDefault) return
    const siblings = flatFields.filter(
      (entry) => (entry.parentId ?? null) === (current.parentId ?? null) && !entry.isSystemDefault,
    )
    const index = siblings.findIndex((entry) => entry.id === item.id)
    if (index === -1 || index >= siblings.length - 1) return
    const target = siblings[index + 1]
    const next = reorderSameLevelItems(draftFields, item.id, target.id)
    if (next === draftFields) return
    setDraftFields(next)
    setHasPendingReorder(true)
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

  function submitFieldForm() {
    if (!fieldForm.key.trim() || !fieldForm.label.trim()) {
      toast.error('Mã thuộc tính và tên thuộc tính là bắt buộc.')
      return
    }

    if (editingField) {
      updateMutation.mutate({ fieldId: editingField.id, payload: fieldForm })
    } else {
      createMutation.mutate(fieldForm)
    }
  }

  return (
    <Card className='rounded-3xl'>
      <CardHeader className='gap-4'>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div>
            <CardTitle>Thuộc tính</CardTitle>
            <CardDescription>Cấu hình cây thuộc tính theo cấp, lưu trữ thêm, sửa, xóa, nhập Excel và sắp xếp cùng cấp.</CardDescription>
          </div>
          <div className='flex flex-wrap gap-2'>
            <Button
              size='sm'
              variant='outline'
              onClick={handleSaveOrder}
              disabled={!canEdit || !hasPendingReorder || saveOrderMutation.isPending}
            >
              <Save className='size-4' />
              Save order
            </Button>
            <Button
              size='sm'
              variant='outline'
              onClick={() => importMutation.mutate()}
              disabled={!canEdit || importMutation.isPending}
            >
              <FileUp className='size-4' />
              Nhập Excel
            </Button>
            <Button size='sm' onClick={() => openCreateDialog(null)} disabled={!canEdit}>
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
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={tree.map((node) => node.id)} strategy={verticalListSortingStrategy}>
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
                    onDelete={(item) => deleteMutation.mutate(item.id)}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={(open) => (open ? setDialogOpen(true) : closeDialog())}>
        <DialogContent className='sm:max-w-2xl'>
          <DialogHeader className='text-start'>
            <DialogTitle>{editingField ? 'Sửa thuộc tính' : 'Thêm thuộc tính'}</DialogTitle>
            <DialogDescription>Quản lý cây thuộc tính theo mã, nhãn, kiểu dữ liệu và quy tắc kiểm tra.</DialogDescription>
          </DialogHeader>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label>Mã thuộc tính</Label>
              <Input
                value={fieldForm.key}
                onChange={(event) => setFieldForm((prev) => ({ ...prev, key: event.target.value }))}
              />
            </div>
            <div className='space-y-2'>
              <Label>Tên thuộc tính</Label>
              <Input
                value={fieldForm.label}
                onChange={(event) => setFieldForm((prev) => ({ ...prev, label: event.target.value }))}
              />
            </div>
            <div className='space-y-2'>
              <Label>Kiểu dữ liệu</Label>
              <Select
                value={fieldForm.dataType}
                onValueChange={(value) => setFieldForm((prev) => ({ ...prev, dataType: value as FieldDataType }))}
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
              <Label>Thuộc cha</Label>
              <Select
                value={fieldForm.parentId ?? 'root'}
                onValueChange={(value) => setFieldForm((prev) => ({ ...prev, parentId: value === 'root' ? null : value }))}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Gốc' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='root'>Gốc</SelectItem>
                  {parentOptions.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='grid gap-4 sm:col-span-2 sm:grid-cols-3'>
              <label className='inline-flex items-center gap-2 text-sm'>
                <input
                  type='checkbox'
                  checked={fieldForm.required}
                  onChange={(event) => setFieldForm((prev) => ({ ...prev, required: event.target.checked }))}
                />
                Bắt buộc
              </label>
              <label className='inline-flex items-center gap-2 text-sm'>
                <input
                  type='checkbox'
                  checked={fieldForm.readonly}
                  onChange={(event) => setFieldForm((prev) => ({ ...prev, readonly: event.target.checked }))}
                />
                Chỉ đọc
              </label>
              <label className='inline-flex items-center gap-2 text-sm'>
                <input
                  type='checkbox'
                  checked={fieldForm.visible}
                  onChange={(event) => setFieldForm((prev) => ({ ...prev, visible: event.target.checked }))}
                />
                Hiển thị
              </label>
            </div>
            <div className='space-y-2 sm:col-span-2'>
              <Label>JSON kiểm tra dữ liệu</Label>
              <Textarea
                rows={3}
                value={fieldForm.validationText}
                onChange={(event) => setFieldForm((prev) => ({ ...prev, validationText: event.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={closeDialog}>
              Hủy
            </Button>
            <Button onClick={submitFieldForm} disabled={createMutation.isPending || updateMutation.isPending}>
              <Save className='size-4' />
              {editingField ? 'Lưu thay đổi' : 'Thêm thuộc tính'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
